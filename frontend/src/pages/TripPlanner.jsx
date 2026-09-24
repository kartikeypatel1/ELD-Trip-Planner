import { useState, useEffect } from 'react'
import api from '../api/axios'
import RouteMap from '../components/RouteMap.jsx'
import LogSheet from '../components/LogSheet.jsx'

function previewDate(dayNumber) {
  const date = new Date()
  date.setDate(date.getDate() + Math.max(0, dayNumber - 1))
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function TripPlanner() {
  const [form, setForm] = useState({
    current_location: '',
    pickup_location: '',
    dropoff_location: '',
    cycle_hours_used: '',
    shipper: '',
    commodity: '',
    load_number: '',
  })
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState(null)
  const [result,     setResult]     = useState(null)
  const [driverInfo, setDriverInfo] = useState({})

  // Fetch driver profile once on mount
  useEffect(() => {
    api.get('/api/auth/profile/')
      .then(r => setDriverInfo(r.data))
      .catch(() => {}) // fail silently if not logged in yet
  }, [])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const openLogSheet = (dayNumber) => {
    const sheet = document.getElementById(`dashboard-log-day-${dayNumber}`)
    if (!sheet) return
    sheet.open = true
    sheet.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await api.post('/api/plan-trip/', form)
      setResult(res.data)
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong while planning your trip. Please check the locations and try again.')
    } finally {
      setLoading(false)
    }
  }

  // Build tripInfo object to pass to each LogSheet
  const tripInfo = result ? {
    from:           form.current_location,
    current_location: form.current_location,
    to:             form.dropoff_location,
    pickup_location: form.pickup_location,
    dropoff_location: form.dropoff_location,
    distance_miles: result.route.distance_miles,
    shipper: form.shipper,
    commodity: form.commodity,
    load_number: form.load_number,
    vehicle_number: driverInfo.vehicle_number,
    trailer_number: driverInfo.trailer_number,
    license_plate_number: driverInfo.license_plate_number,
  } : {}

  const restStops = result
    ? (() => {
      let driven = 0
      return result.schedule.flatMap((day) => day.segments).map((segment) => {
        const progress = Math.min(1, driven / Math.max(result.route.duration_hours, 0.1))
        if (segment.status === 'D') driven += segment.end_hour - segment.start_hour
        return { segment, progress }
      }).filter(({ segment }) => /rest|break|fuel/i.test(segment.label || ''))
        .map(({ segment, progress }) => ({ label: segment.label, progress }))
    })()
    : []
  return (
    <div className="trip-planner-page">
      <div className="page-header">
        <div className="planner-title">
          <span className="planner-title-icon">⌘</span>
          <h1>Plan Your Trip</h1>
        </div>
        <p className="subtitle">
          Enter your trip details to get an optimized route and auto-generated Daily Log Sheets.
        </p>
      </div>

      <form className="form-card" onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="form-group">
            <label>Current Location</label>
            <input
              name="current_location"
              value={form.current_location}
              onChange={handleChange}
              placeholder="e.g. Dallas, TX"
              required
            />
          </div>
          <div className="form-group">
            <label>Shipper <span className="optional-label">(optional)</span></label>
            <input name="shipper" value={form.shipper} onChange={handleChange} placeholder="e.g. Don's Paper Co." />
          </div>
          <div className="form-group">
            <label>Commodity <span className="optional-label">(optional)</span></label>
            <input name="commodity" value={form.commodity} onChange={handleChange} placeholder="e.g. Paper products" />
          </div>
          <div className="form-group">
            <label>Load Number <span className="optional-label">(optional)</span></label>
            <input name="load_number" value={form.load_number} onChange={handleChange} placeholder="e.g. ST13241564114" />
          </div>
          <div className="form-group">
            <label>Pickup Location</label>
            <input
              name="pickup_location"
              value={form.pickup_location}
              onChange={handleChange}
              placeholder="e.g. Oklahoma City, OK"
              required
            />
          </div>
          <div className="form-group">
            <label>Dropoff Location</label>
            <input
              name="dropoff_location"
              value={form.dropoff_location}
              onChange={handleChange}
              placeholder="e.g. Kansas City, MO"
              required
            />
          </div>
          <div className="form-group">
            <label>Current Cycle Used (Hrs)</label>
            <input
              name="cycle_hours_used"
              type="number"
              step="0.1"
              min="0"
              max="70"
              value={form.cycle_hours_used}
              onChange={handleChange}
              placeholder="e.g. 12"
              required
            />
          </div>
        </div>
        <button className="primary" type="submit" disabled={loading}>
          {loading ? 'Planning trip...' : 'Plan Trip'}
        </button>
      </form>

      {error && (
        <div className="error-box friendly-error">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}

      {loading && (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Calculating optimized route and HOS schedules...</p>
          <div className="skeleton-card"></div>
        </div>
      )}

      {!loading && !result && !error && (
        <div className="empty-state">
          <div className="empty-icon">🚚</div>
          <h3>Ready to Hit the Road?</h3>
          <p>Fill out the form above to generate your HOS compliant route plan.</p>
        </div>
      )}

      {result && (
        <div className="results-section dashboard-results">
          <div className="summary-row">
            <div className="summary-pill">
              <span className="summary-icon">▰</span>
              <span className="pill-label">Distance</span>
              <b>{result.route.distance_miles.toFixed(1)} mi</b>
            </div>
            <div className="summary-pill">
              <span className="summary-icon">◷</span>
              <span className="pill-label">Driving Time</span>
              <b>{result.route.duration_hours.toFixed(1)} hrs</b>
            </div>
            <div className="summary-pill">
              <span className="summary-icon">▤</span>
              <span className="pill-label">Log Sheets</span>
              <b>{result.schedule.length} Days</b>
            </div>
          </div>

          <div className="dashboard-grid">
            <section className="dashboard-card route-dashboard-card">
              <div className="dashboard-card-header">
                <h2>⌁ &nbsp;Trip Route</h2>
                <div className="route-card-meta">
                  <span>▣ Load: {form.load_number || '—'}</span>
                  <span>◇ Commodity: {form.commodity || '—'}</span>
                  <span>◷ Cycle Used: {form.cycle_hours_used || '—'} hrs</span>
                </div>
              </div>
              <div className="route-dashboard-content">
                <div className="map-card">
                  <RouteMap
                    geometry={result.route.geometry}
                    stops={result.route.stops}
                    restStops={restStops}
                  />
                </div>
                <div className="route-dashboard-summary">
                  <div className="route-stop pickup-stop"><span>●</span><b>{form.pickup_location}</b><small>(Pickup)</small></div>
                  <div className="route-direction">↓</div>
                  <div className="route-stop dropoff-stop"><span>●</span><b>{form.dropoff_location}</b><small>(Dropoff)</small></div>
                  <div className="route-stat-list">
                    <span>⌁ <b>Distance<strong>{result.route.distance_miles.toFixed(1)} mi</strong></b></span>
                    <span>◷ <b>Driving Time<strong>{result.route.duration_hours.toFixed(1)} hrs</strong></b></span>
                    <span>▣ <b>Log Sheets<strong>{result.schedule.length} Days</strong></b></span>
                  </div>
                </div>
              </div>
            </section>

            <section className="dashboard-card daily-logs-card">
              <div className="dashboard-card-header">
                <h2>▣ &nbsp;Daily Log Sheets</h2>
                <button type="button" className="view-all-link" onClick={() => openLogSheet(1)}>View All →</button>
              </div>
              <div className="daily-log-previews">
                {result.schedule.slice(0, 3).map((day) => (
                  <div className="daily-log-preview" key={day.day}>
                    <strong>▣ &nbsp;Day {day.day}</strong>
                    <span>▦ &nbsp; Date <b>{previewDate(day.day)}</b></span>
                    <span>◷ &nbsp; Driving Hours <b>{Number(day.totals?.D || 0).toFixed(1)}</b></span>
                    <span>▣ &nbsp; Status <em>On Time</em></span>
                    <button type="button" onClick={() => openLogSheet(day.day)}>▤ &nbsp; View Details →</button>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <section className="dashboard-log-sheets">
            <div className="dashboard-log-sheets-header">
              <div>
                <span className="log-sheets-eyebrow">Generated ELD records</span>
                <h2>Daily Log Sheets</h2>
                <p>Each 24-hour sheet is filled from the HOS schedule and ready for review.</p>
              </div>
              <span className="log-sheet-count">{result.schedule.length} {result.schedule.length === 1 ? 'sheet' : 'sheets'}</span>
            </div>
            <div className="dashboard-log-sheets-list">
              {result.schedule.map((day) => (
                <details className="dashboard-log-day" id={`dashboard-log-day-${day.day}`} key={day.day} open={day.day === 1}>
                  <summary><span>▣ Day {day.day}</span><small>{day.segments.length} duty changes · {Number(day.totals?.D || 0).toFixed(1)} driving hrs</small><b>⌄</b></summary>
                  <LogSheet day={day} driverInfo={driverInfo} tripInfo={tripInfo} />
                </details>
              ))}
            </div>
          </section>

          {result.route.instructions?.length > 0 && (
            <section className="route-instructions-card">
              <div className="dashboard-card-header">
                <h2>⌁ &nbsp;Route Instructions</h2>
                <span className="instructions-count"><span className="instruction-route-dot">●</span>{result.route.instructions.length} steps</span>
              </div>
              <ol className="route-instructions-list">
                {result.route.instructions.map((step, index) => (
                  <li key={`${step.instruction}-${index}`}>
                    <div className="instruction-node">
                      <span className="instruction-number">{index + 1}</span>
                    </div>
                    <div className="instruction-content">
                      <div className="instruction-step-label">STEP {String(index + 1).padStart(2, '0')}</div>
                      <strong>{step.instruction}</strong>
                      <small><span>⌁ {step.name || 'Road segment'}</span><span>↗ {step.distance_miles.toFixed(1)} mi</span><span>◷ {step.duration_minutes.toFixed(0)} min</span></small>
                    </div>
                    <span className="instruction-arrow">→</span>
                  </li>
                ))}
              </ol>
            </section>
          )}

        </div>
      )}
    </div>
  )
}
