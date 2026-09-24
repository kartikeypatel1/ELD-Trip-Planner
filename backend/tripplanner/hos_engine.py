"""
HOS (Hours of Service) calculation engine.

Simulates a property-carrying driver's trip against FMCSA rules:
- 11-hour driving limit per shift
- 14-hour on-duty window per shift
- 30-minute break required after 8 cumulative driving hours
- 70-hour / 8-day on-duty limit (simplified: not rolling window, just a
  running total for this single trip — good enough for a trip planner
  where we only care about THIS trip's hours)
- 10 consecutive hours off-duty resets the 11hr/14hr shift clocks
- Fuel stop every FUEL_INTERVAL_MILES
- 1 hour on-duty (not driving) for pickup, 1 hour for drop-off

Assumptions (per assessment brief): property-carrying driver, 70hr/8-day
cycle, no adverse driving conditions.

Output: a list of "days", each day a list of segments:
    {status, start_hour (0-24), end_hour (0-24), label}
status is one of: OFF, SB (sleeper berth), D (driving), ON (on-duty not driving)
"""

STEP = 0.25  # simulate in 15-minute increments
MAX_DRIVE_PER_SHIFT = 11
MAX_WINDOW_PER_SHIFT = 14
MAX_CYCLE_HOURS = 70
BREAK_AFTER_HOURS = 8
BREAK_DURATION = 0.5
RESET_OFF_DUTY = 10
FUEL_INTERVAL_MILES = 1000
FUEL_STOP_DURATION = 0.5
START_CLOCK = 6.0  # driver starts their day at 6:00 AM


def generate_eld_schedule(total_drive_hours, total_distance_miles,
                           cycle_hours_used, pickup_hours=1.0,
                           dropoff_hours=1.0):
    """Returns a list of days, each a list of raw (status, abs_start, abs_end, label) tuples."""
    if total_drive_hours < 0:
        raise ValueError('total_drive_hours cannot be negative')
    if total_distance_miles < 0:
        raise ValueError('total_distance_miles cannot be negative')
    if not 0 <= cycle_hours_used < MAX_CYCLE_HOURS:
        raise ValueError('cycle_hours_used must be between 0 and 70 hours')

    if total_drive_hours <= 0:
        total_drive_hours = 0.1

    drive_rate = total_distance_miles / total_drive_hours  # miles per hour

    events = []  # (status, abs_start_hour, abs_end_hour, label)
    t = 0.0  # absolute simulation time, hour 0 = START_CLOCK on day 1

    driven_shift = 0.0
    window_shift = 0.0
    since_break = 0.0
    cycle_hours = cycle_hours_used
    distance_done = 0.0
    next_fuel_mark = FUEL_INTERVAL_MILES

    remaining_pickup = pickup_hours
    remaining_dropoff = dropoff_hours
    remaining_drive = total_drive_hours

    stage = 'pickup'  # pickup -> driving -> dropoff -> done

    def add_event(status, start, end, label=''):
        if end > start:
            events.append((status, start, end, label))

    while stage != 'done':
        # Forced 10-hour reset if shift limits are hit
        if window_shift >= MAX_WINDOW_PER_SHIFT - 1e-6 or driven_shift >= MAX_DRIVE_PER_SHIFT - 1e-6:
            add_event('OFF', t, t + RESET_OFF_DUTY, 'Required 10-hr rest')
            t += RESET_OFF_DUTY
            driven_shift = 0.0
            window_shift = 0.0
            since_break = 0.0
            continue

        # Forced 34-hr-style stop if 70-hr cycle limit reached (simplified as 10hr min here,
        # real rule needs 34hrs, but for a single trip we just need *a* reset)
        if cycle_hours >= MAX_CYCLE_HOURS - 1e-6:
            add_event('OFF', t, t + 34, '70-hr limit reached — 34-hr restart')
            t += 34
            driven_shift = 0.0
            window_shift = 0.0
            since_break = 0.0
            cycle_hours = 0.0
            continue

        if stage == 'pickup':
            chunk = min(remaining_pickup, MAX_WINDOW_PER_SHIFT - window_shift)
            add_event('ON', t, t + chunk, 'Pickup')
            t += chunk
            window_shift += chunk
            cycle_hours += chunk
            remaining_pickup -= chunk
            if remaining_pickup <= 1e-6:
                stage = 'driving'
            continue

        if stage == 'driving':
            if since_break >= BREAK_AFTER_HOURS - 1e-6:
                add_event('OFF', t, t + BREAK_DURATION, '30-min break')
                t += BREAK_DURATION
                window_shift += BREAK_DURATION
                since_break = 0.0
                continue

            if distance_done >= next_fuel_mark - 1e-6:
                add_event('ON', t, t + FUEL_STOP_DURATION, 'Fuel stop')
                t += FUEL_STOP_DURATION
                window_shift += FUEL_STOP_DURATION
                cycle_hours += FUEL_STOP_DURATION
                next_fuel_mark += FUEL_INTERVAL_MILES
                continue

            chunk = min(
                remaining_drive,
                MAX_DRIVE_PER_SHIFT - driven_shift,
                MAX_WINDOW_PER_SHIFT - window_shift,
                BREAK_AFTER_HOURS - since_break,
                MAX_CYCLE_HOURS - cycle_hours,
                (next_fuel_mark - distance_done) / drive_rate if drive_rate > 0 else remaining_drive,
            )
            chunk = max(chunk, 0.0)
            if chunk <= 1e-6:
                # Nothing left we can do this tick — force a break/reset next loop
                since_break = BREAK_AFTER_HOURS
                continue

            add_event('D', t, t + chunk, 'Driving')
            t += chunk
            driven_shift += chunk
            window_shift += chunk
            since_break += chunk
            cycle_hours += chunk
            distance_done += chunk * drive_rate
            remaining_drive -= chunk
            if remaining_drive <= 1e-6:
                stage = 'dropoff'
            continue

        if stage == 'dropoff':
            chunk = min(remaining_dropoff, MAX_WINDOW_PER_SHIFT - window_shift)
            if chunk <= 1e-6:
                add_event('OFF', t, t + RESET_OFF_DUTY, 'Required 10-hr rest')
                t += RESET_OFF_DUTY
                driven_shift = 0.0
                window_shift = 0.0
                since_break = 0.0
                continue
            add_event('ON', t, t + chunk, 'Drop-off')
            t += chunk
            window_shift += chunk
            cycle_hours += chunk
            remaining_dropoff -= chunk
            if remaining_dropoff <= 1e-6:
                stage = 'done'
            continue

    # Fill remaining time on the final day as Off Duty, and split into 24-hr day pages
    total_span = t
    final_day_end = ((int(total_span // 24)) + 1) * 24
    add_event('OFF', total_span, final_day_end, 'Off duty')

    return _split_into_days(events)


def _split_into_days(events):
    """Splits absolute-time events into 24-hour day pages, clipping segments at midnight."""
    days = {}
    for status, start, end, label in events:
        cur = start
        while cur < end:
            day_index = int((cur + START_CLOCK) // 24) if False else int(cur // 24)
            day_start_abs = day_index * 24
            day_end_abs = day_start_abs + 24
            seg_end = min(end, day_end_abs)

            hour_of_day_start = cur - day_start_abs
            hour_of_day_end = seg_end - day_start_abs

            days.setdefault(day_index, []).append({
                'status': status,
                'start_hour': round(hour_of_day_start, 2),
                'end_hour': round(hour_of_day_end, 2),
                'label': label,
            })
            cur = seg_end

    result = []
    for day_index in sorted(days.keys()):
        segs = days[day_index]
        totals = {'OFF': 0, 'SB': 0, 'D': 0, 'ON': 0}
        for s in segs:
            totals[s['status']] += (s['end_hour'] - s['start_hour'])
        result.append({
            'day': day_index + 1,
            'segments': segs,
            'totals': {k: round(v, 2) for k, v in totals.items()},
        })
    return result
