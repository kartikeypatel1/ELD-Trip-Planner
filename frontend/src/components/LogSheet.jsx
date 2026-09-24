import React from 'react';

// ─── Chart constants ─────────────────────────────────────────────────────────
const ROWS = [
  { key: 'OFF', label: '1: OFF\nDUTY' },
  { key: 'SB',  label: '2: SLEEPER\nBERTH' },
  { key: 'D',   label: '3: DRIVING' },
  { key: 'ON',  label: '4: ON DUTY\n(NOT DRIVING)' },
];

const W           = 940;   // total SVG width
const L           = 148;   // left margin (row labels)
const R           = 66;    // right margin (total hours)
const ROW_H       = 34;    // height of each status row
const TOP         = 46;    // height of black header bar
const CW          = W - L - R; // chart drawable width
const CHART_BOT   = TOP + ROWS.length * ROW_H; // bottom of status grid
const RMK_AREA    = 28;    // space for the chart footer and remark ticks
const SVG_H       = CHART_BOT + RMK_AREA + 8;

function xAt(hour) { return L + (hour / 24) * CW; }
function yAt(key)  { return TOP + ROWS.findIndex(r => r.key === key) * ROW_H + ROW_H / 2; }

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmt2(n) { return String(n).padStart(2, '0'); }
function formatHour(hour) {
  const value = Number(hour) || 0;
  const h = Math.floor(value) % 24;
  const minutes = Math.round((value - Math.floor(value)) * 60);
  return `${String(h).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}
function logDate(dayNumber, baseDate) {
  const d = new Date(baseDate || Date.now());
  if (Number.isNaN(d.getTime())) return { m: '--', d: '--', y: '--' };
  d.setDate(d.getDate() + Math.max(0, Number(dayNumber || 1) - 1));
  return { m: fmt2(d.getMonth() + 1), d: fmt2(d.getDate()), y: String(d.getFullYear()).slice(-2) };
}

function remarkLocation(segment, index, tripInfo) {
  if (segment.location) return segment.location;

  const label = String(segment.label || '').toLowerCase();
  if (label.includes('pickup')) return tripInfo.pickup_location || tripInfo.from || 'Pickup location';
  if (label.includes('drop')) return tripInfo.dropoff_location || tripInfo.to || 'Drop-off location';
  if (index === 0) return tripInfo.from || tripInfo.current_location || 'Trip origin';
  if (label.includes('rest') || label.includes('break') || label.includes('fuel')) {
    return tripInfo.to ? `En route to ${tripInfo.to}` : 'En route';
  }
  if (label.includes('off duty')) return tripInfo.to || 'Trip destination';
  return tripInfo.to ? `En route to ${tripInfo.to}` : 'En route';
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function LogSheet({ day, driverInfo = {}, tripInfo = {} }) {
  const segs  = [...day.segments].sort((a, b) => a.start_hour - b.start_hour);
  const date  = logDate(day.day, tripInfo.created_at || tripInfo.start_date);
  const totals = day.totals || { OFF: 0, SB: 0, D: 0, ON: 0 };

  // Build the step-line path
  let path = '';
  segs.forEach((seg, i) => {
    const x1 = xAt(seg.start_hour);
    const x2 = xAt(seg.end_hour);
    const y  = yAt(seg.status);
    if (i === 0) {
      path += `M ${x1} ${y} L ${x2} ${y}`;
    } else {
      const py = yAt(segs[i - 1].status);
      path += ` L ${x1} ${py} L ${x1} ${y} L ${x2} ${y}`;
    }
  });

  // Build remarks list (one per segment, deduped by start_hour)
  const seen = new Set();
  const remarks = [];
  segs.forEach(seg => {
    const key = seg.start_hour.toFixed(2);
    if (!seen.has(key)) {
      seen.add(key);
      remarks.push({
        hour: seg.start_hour,
        label: seg.label || seg.status,
        location: remarkLocation(seg, segs.indexOf(seg), tripInfo),
      });
    }
  });

  const drivingMiles = totals.D > 0
    ? ((totals.D / (totals.D + totals.ON + totals.OFF + totals.SB)) * (tripInfo.distance_miles || 0)).toFixed(0)
    : '0';

  return (
    <div className="el-log-wrap">

      {/* ═══ HEADER ════════════════════════════════════════════════════════ */}
      <div className="el-header">

        {/* LEFT: driver info */}
        <div className="el-hd-left">
          <div className="el-hd-row">
            <span className="el-hd-lbl">Driver Number</span>
            <div className="el-hd-box el-hd-data">{driverInfo.driver_number || '—'}</div>
          </div>
          <div className="el-hd-row">
            <span className="el-hd-lbl">Driver's Initials</span>
            <div className="el-hd-box el-hd-data">{driverInfo.initials || '—'}</div>
          </div>
          <div className="el-hd-row el-sig-row">
            <span className="el-hd-lbl-sub">(DRIVER'S SIGNATURE IN FULL) I certify these entries are true and correct:</span>
            <div className="el-sig-line">{driverInfo.full_name || ''}</div>
          </div>
          <div className="el-hd-row">
            <span className="el-hd-lbl-sub">(NAME OF CO-DRIVER)</span>
            <div className="el-hd-underline">{driverInfo.co_driver_name || '—'}</div>
          </div>
          <div className="el-hd-row">
            <div className="el-hd-place">{driverInfo.home_terminal_address || '—'}</div>
            <span className="el-hd-lbl-sub">(HOME OPERATING CENTER AND ADDRESS)</span>
          </div>
        </div>

        {/* CENTER: title + vehicle + from/to */}
        <div className="el-hd-center">
          <div className="el-log-title">
            <strong>DRIVER'S DAILY LOG</strong>
            <div className="el-log-sub">ONE CALENDAR DAY – 24 HOURS</div>
            <div className="el-log-sub">CN only: Cycle: 70 hr. / 7day</div>
          </div>
          <div className="el-hd-veh">
            <span>P</span>
            <div className="el-hd-underline el-veh-no">{tripInfo.vehicle_number || driverInfo.vehicle_number || '—'}</div>
            <span>/T</span>
            <div className="el-hd-underline el-veh-no">{tripInfo.trailer_number || driverInfo.trailer_number || '—'}</div>
            <span className="el-hd-lbl-sub ml-4">VEHICLE NUMBERS – (SHOW EACH UNIT)</span>
          </div>
          <div className="el-hd-fromto">
            <span>From:</span>
            <div className="el-hd-underline">{tripInfo.from || '—'}</div>
            <span>To:</span>
            <div className="el-hd-underline">{tripInfo.to || '—'}</div>
          </div>
        </div>

        {/* RIGHT: date, miles, carrier */}
        <div className="el-hd-right">
          <div className="el-orig-dup">
            <div>ORIGINAL – Submit to carrier</div>
            <div>DUPLICATE – Driver retain</div>
          </div>
          <div className="el-date-row">
            <div className="el-date-cell">
              <div className="el-date-val">{date.m}</div>
              <div className="el-date-cap">(MONTH)</div>
            </div>
            <div className="el-date-sep">/</div>
            <div className="el-date-cell">
              <div className="el-date-val">{date.d}</div>
              <div className="el-date-cap">(DAY)</div>
            </div>
            <div className="el-date-sep">/</div>
            <div className="el-date-cell">
              <div className="el-date-val">{date.y}</div>
              <div className="el-date-cap">(YEAR)</div>
            </div>
          </div>
          <div className="el-miles-grid">
            <div className="el-miles-cell">
              <div className="el-miles-val">{drivingMiles}</div>
              <div className="el-miles-cap">TOTAL DRIVING MILES TODAY</div>
            </div>
            <div className="el-check-box">
              <input type="checkbox" id={`multiday-${day.day}`} />
              <label htmlFor={`multiday-${day.day}`}>CHECK IF MULTIDAY LOG</label>
            </div>
          </div>
          <div className="el-miles-grid">
            <div className="el-miles-cell">
              <div className="el-miles-val">{drivingMiles}</div>
              <div className="el-miles-cap">TOTAL TRUCK MILEAGE TODAY</div>
            </div>
            <div className="el-date-cell el-enddate">
              <div className="el-date-cap">(END DATE)</div>
              <div className="el-hd-underline">&nbsp;</div>
            </div>
          </div>
          <div className="el-carrier-block">
            <div className="el-carrier-name">{driverInfo.carrier_name || '—'}</div>
            <div className="el-hd-lbl-sub">Name of Carrier</div>
            <div className="el-carrier-addr">{driverInfo.main_office_address || '—'}</div>
            <div className="el-hd-lbl-sub">Safety Records Maintained</div>
          </div>
        </div>
      </div>

      {/* ═══ SVG CHART + REMARKS ══════════════════════════════════════════ */}
      <div className="el-chart-outer">
        <svg
          width="100%"
          viewBox={`0 0 ${W} ${SVG_H}`}
          style={{ display: 'block', maxWidth: '100%' }}
        >
          {/* ─── Black top bar ─────────────────────────────────────────── */}
          <rect x={0} y={0} width={W} height={TOP} fill="#12203a" />

          {/* Hour labels in bar */}
          {Array.from({ length: 25 }, (_, h) => {
            const x = xAt(h);
            let label = h === 0 ? '12' : h === 12 ? 'Noon' : h === 24 ? '12' : String(h % 12 || 12);
            let anchor = 'middle', xPos = x;
            if (h === 0)  { anchor = 'end';   xPos = L - 4; }
            if (h === 24) { anchor = 'start'; xPos = W - R + 4; }
            return (
              <text key={h} x={xPos} y={TOP - 8} fill="#e8eef8" fontSize="10" fontWeight="bold" textAnchor={anchor} fontFamily="Arial, sans-serif">
                {label}
              </text>
            );
          })}

          {/* "Minutes to be 00, 15, 30, 45" label in top-right of bar */}
          <text x={W - R / 2} y={TOP - 20} fill="#e8eef8" fontSize="8" textAnchor="middle" fontFamily="Arial, sans-serif">MINUTES</text>
          <text x={W - R / 2} y={TOP - 11} fill="#e8eef8" fontSize="8" textAnchor="middle" fontFamily="Arial, sans-serif">TO BE</text>
          <text x={W - R / 2} y={TOP - 3}  fill="#e8eef8" fontSize="8" textAnchor="middle" fontFamily="Arial, sans-serif">00,15,30,45</text>
          <text x={W - R / 2} y={CHART_BOT - 4} fill="#12203a" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="Arial, sans-serif">TOTAL</text>

          {/* ─── Row stripes + row labels ───────────────────────────────── */}
          {ROWS.map((row, i) => {
            const y    = TOP + i * ROW_H;
            const midY = y + ROW_H / 2;
            const lines = row.label.split('\n');
            return (
              <g key={row.key}>
                {/* stripe */}
                <rect x={L} y={y} width={CW} height={ROW_H} fill={i % 2 === 0 ? '#ddeeff' : '#cce8ff'} />
                {/* row label */}
                {lines.map((ln, li) => (
                  <text
                    key={li}
                    x={4}
                    y={y + ((ROW_H) / (lines.length + 1)) * (li + 1) + 4}
                    fontSize="10.5"
                    fontWeight="bold"
                    fill="#12203a"
                    fontFamily="Arial, sans-serif"
                  >
                    {ln}
                  </text>
                ))}
                {/* total hours value */}
                <text
                  x={W - R / 2}
                  y={midY + 5}
                  fontSize="13"
                  fontWeight="bold"
                  fill="#12203a"
                  textAnchor="middle"
                  fontFamily="Arial, sans-serif"
                >
                  {totals[row.key] > 0 ? totals[row.key].toFixed(1) : ''}
                </text>
                {/* row bottom line */}
                <line x1={0} y1={y + ROW_H} x2={W} y2={y + ROW_H} stroke="#7799bb" strokeWidth="0.8" />
                {/* vertical separator before HOURS column */}
                <line x1={W - R} y1={y} x2={W - R} y2={y + ROW_H} stroke="#7799bb" strokeWidth="0.8" />
              </g>
            );
          })}

          {/* ─── 15-minute tick marks ───────────────────────────────────── */}
          {Array.from({ length: 24 * 4 + 1 }, (_, i) => {
            if (i === 0 || i === 96) return null;
            const h  = i / 4;
            const x  = xAt(h);
            const isH  = i % 4 === 0;
            const isHH = i % 2 === 0;
            const tkH  = isH ? ROWS.length * ROW_H : isHH ? 15 : 7;
            return ROWS.map((_, ri) => (
              <line
                key={`${i}-${ri}`}
                x1={x} y1={TOP + ri * ROW_H}
                x2={x} y2={TOP + ri * ROW_H + tkH}
                stroke={isH ? '#7799bb' : '#aabbd0'}
                strokeWidth={isH ? 1.1 : 0.6}
              />
            ));
          })}

          {/* ─── Border lines ───────────────────────────────────────────── */}
          {/* Left margin */}
          <line x1={L} y1={TOP} x2={L} y2={CHART_BOT} stroke="#12203a" strokeWidth="1.5" />
          {/* Right separator */}
          <line x1={W - R} y1={0} x2={W - R} y2={CHART_BOT} stroke="#12203a" strokeWidth="1.5" />
          {/* Bottom of grid */}
          <line x1={0} y1={CHART_BOT} x2={W} y2={CHART_BOT} stroke="#12203a" strokeWidth="1.8" />

          {/* ─── Status line (step graph) ───────────────────────────────── */}
          <path d={path} fill="none" stroke="#1d3fbf" strokeWidth="3.5" strokeLinejoin="miter" />

          {/* Dots at every transition point */}
          {segs.map((seg, i) => (
            <circle key={`d-${i}`} cx={xAt(seg.start_hour)} cy={yAt(seg.status)} r={4.5} fill="#e03030" stroke="#fff" strokeWidth="1" />
          ))}

          {/* ─── Transition ticks; full remarks are rendered below the grid ─ */}
          {remarks.map(({ hour }, i) => {
            const x = xAt(hour);
            if (x < L - 2 || x > W - R + 2) return null;
            return (
              <g key={`rmk-${i}`}>
                <line x1={x} y1={CHART_BOT} x2={x} y2={CHART_BOT + 12} stroke="#12203a" strokeWidth="1.1" />
              </g>
            );
          })}

          {/* TOTAL HOURS label below total column */}
          <text x={W - R / 2} y={CHART_BOT + 18} fontSize="8.5" fontWeight="bold" fill="#12203a" textAnchor="middle" fontFamily="Arial, sans-serif">HOURS</text>
          <line x1={W - R} y1={CHART_BOT + 4} x2={W} y2={CHART_BOT + 4} stroke="#12203a" strokeWidth="1" />
        </svg>
        <div className="el-chart-remarks" aria-label="Duty change remarks">
          <strong>REMARKS</strong>
          <div className="el-chart-remarks-list">
            {remarks.map(({ hour, label, location }, index) => (
              <div className="el-chart-remark" key={`remark-${index}`}>
                <span className="el-chart-remark-time">{formatHour(hour)}</span>
                <span className="el-chart-remark-text"><b>{label}</b> — {location}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ SHIPPER / COMMODITY / LOAD ═══════════════════════════════════ */}
      <div className="el-shipper-row">
        <span className="el-ship-label">SHIPPER:</span>
        <div className="el-ship-val">{tripInfo.shipper || '—'}</div>
        <span className="el-ship-label">COMMODITY:</span>
        <div className="el-ship-val">{tripInfo.commodity || '—'}</div>
        <span className="el-ship-label">LOAD NO.:</span>
        <div className="el-ship-val">{tripInfo.load_number || '—'}</div>
      </div>

      <div className="el-remark-note">
        Each change of duty status must have a location in the "remarks" section. Use local time standard at home operating center.
      </div>

      {/* ═══ POST TRIP INSPECTION ═════════════════════════════════════════ */}
      <div className="el-inspection">
        <div className="el-insp-top">
          <div className="el-insp-date">
            <div className="el-insp-date-grid">
              <div><div className="el-insp-date-val">&nbsp;</div><div className="el-insp-date-cap">(MONTH)</div></div>
              <div className="el-insp-date-sep">/</div>
              <div><div className="el-insp-date-val">&nbsp;</div><div className="el-insp-date-cap">(DAY)</div></div>
              <div className="el-insp-date-sep">/</div>
              <div><div className="el-insp-date-val">&nbsp;</div><div className="el-insp-date-cap">(YEAR)</div></div>
            </div>
          </div>
          <div className="el-insp-title">
            <strong>POST TRIP INSPECTION REPORT</strong>
            <div className="el-insp-sub">(Equipment is checked in accordance with Schedule 1 of the National Safety Code Standard 13)</div>
          </div>
        </div>
        <div className="el-insp-body">
          <div className="el-insp-line">TRACTOR/TRAILER NO. AND LIC. PLATE NO.: <span className="el-insp-underline">{tripInfo.vehicle_number || driverInfo.vehicle_number || '—'} / {tripInfo.trailer_number || driverInfo.trailer_number || '—'} / {driverInfo.license_plate_number || '—'} {driverInfo.license_state || ''}</span></div>
          <div className="el-insp-check">
            <input type="checkbox" id={`nd-${day.day}`} />
            <label htmlFor={`nd-${day.day}`}>I detect no defect in this motor vehicle likely to affect safe operation or result in mechanical breakdown.</label>
          </div>
          <div className="el-insp-check">
            <input type="checkbox" id={`wd-${day.day}`} />
            <label htmlFor={`wd-${day.day}`}>I detect the following such defects – Describe in detail.</label>
          </div>
          <div className="el-insp-defect-line"></div>
          <div className="el-insp-sig-row">
            <div>DRIVER'S NAME (PRINT): <span className="el-insp-underline">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></div>
            <div>DRIVER'S SIGNATURE: <span className="el-insp-underline">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></div>
          </div>
          <div className="el-insp-check">
            <input type="checkbox" id={`ac-${day.day}`} />
            <label htmlFor={`ac-${day.day}`}>Above defects corrected</label>
          </div>
          <div className="el-insp-check">
            <input type="checkbox" id={`anc-${day.day}`} />
            <label htmlFor={`anc-${day.day}`}>Above defects need not be corrected</label>
          </div>
          <div className="el-insp-sig-row el-mech-row">
            <div>MECHANIC'S SIGNATURE: <span className="el-insp-underline">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></div>
            <div>DRIVER'S SIGNATURE: <span className="el-insp-underline">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></div>
            <div>DATE: <span className="el-insp-underline">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></div>
          </div>
        </div>
        <div className="el-insp-footer">Printed &amp; Published by J. J. Keller &amp; Associates, Inc.</div>
      </div>

    </div>
  );
}
