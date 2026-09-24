import { useMemo, useState, useEffect, useRef } from 'react';
import api from '../api/axios';
import LogSheet from '../components/LogSheet.jsx';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const fallbackTrips = [
    {
        id: 1,
        pickup_location: 'ghaziabad',
        current_location: 'ST2356697841',
        dropoff_location: 'tamilnadu',
        shipper: "Don's Paper Co",
        commodity: 'Paper products',
        load_number: 'ST2356697841',
        cycle_hours_used: 8,
        distance_miles: 1547.0,
        duration_hours: 28.9,
        created_at: '2026-09-24T00:00:00Z'
    }
];

const formatTripDate = (value) => {
    const date = new Date(value);
    return {
        month: date.toLocaleString('en-US', { month: 'short' }).toUpperCase(),
        day: date.getDate(),
        year: date.getFullYear()
    };
};

const toLogTripInfo = (trip) => ({
    ...trip,
    from: trip.from || trip.current_location || '',
    to: trip.to || trip.dropoff_location || '',
    current_location: trip.current_location || trip.from || '',
    pickup_location: trip.pickup_location || '',
    dropoff_location: trip.dropoff_location || trip.to || '',
});

export default function MyTrips() {
    const [trips, setTrips] = useState(fallbackTrips);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [query, setQuery] = useState('');
    const [filter, setFilter] = useState('all');
    const [filterOpen, setFilterOpen] = useState(false);
    const [selectedTrip, setSelectedTrip] = useState(null);
    const [pdfTrip, setPdfTrip] = useState(null);
    const [pdfBusy, setPdfBusy] = useState(false);
    const [driverInfo, setDriverInfo] = useState({});
    const pdfRenderRef = useRef(null);

    useEffect(() => {
        api.get('/api/auth/profile/')
            .then((res) => setDriverInfo(res.data || {}))
            .catch(() => setDriverInfo({}));
    }, []);

    useEffect(() => {
        if (!pdfTrip || !pdfRenderRef.current) return undefined;

        let cancelled = false;
        const renderPdf = async () => {
            setPdfBusy(true);
            try {
                await new Promise((resolve) => requestAnimationFrame(resolve));
                const sheets = [...pdfRenderRef.current.querySelectorAll('.el-log-wrap')];
                const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
                const pageWidth = pdf.internal.pageSize.getWidth();
                const pageHeight = pdf.internal.pageSize.getHeight();

                if (!sheets.length) {
                    pdf.setFontSize(16);
                    pdf.text('ELD daily log sheets are not available for this trip.', 18, 24);
                    pdf.setFontSize(10);
                    pdf.text('Reconnect to the backend and refresh trip history to generate saved logs.', 18, 33);
                } else {
                    for (let index = 0; index < sheets.length; index += 1) {
                        const canvas = await html2canvas(sheets[index], {
                            backgroundColor: '#ffffff',
                            scale: 2,
                            useCORS: true,
                            logging: false,
                        });
                        if (index > 0) pdf.addPage();
                        const ratio = Math.min((pageWidth - 12) / canvas.width, (pageHeight - 12) / canvas.height);
                        const width = canvas.width * ratio;
                        const height = canvas.height * ratio;
                        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', (pageWidth - width) / 2, (pageHeight - height) / 2, width, height);
                    }
                }
                if (!cancelled) {
                    pdf.save(`eld-trip-${String(pdfTrip.id).padStart(3, '0')}-log-sheets.pdf`);
                }
            } catch (err) {
                if (!cancelled) setError('The PDF could not be generated. Please try again.');
            } finally {
                if (!cancelled) {
                    setPdfBusy(false);
                    setPdfTrip(null);
                }
            }
        };
        renderPdf();
        return () => { cancelled = true; };
    }, [pdfTrip, driverInfo]);

    const downloadTripLogs = (trip) => {
        if (pdfBusy) return;
        setPdfTrip(toLogTripInfo(trip));
    };

    useEffect(() => {
        const fetchTrips = async () => {
            try {
                const res = await api.get('/api/my-trips/');
                if (Array.isArray(res.data) && res.data.length > 0) {
                    setTrips(res.data);
                } else {
                    setTrips(fallbackTrips);
                }
            } catch (err) {
                setTrips(fallbackTrips);
                setError('We could not reach your trip history. Showing the latest saved preview.');
            } finally {
                setLoading(false);
            }
        };

        fetchTrips();
    }, []);

    const totalMiles = trips.reduce((sum, trip) => sum + Number(trip.distance_miles || 0), 0);
    const totalHours = trips.reduce((sum, trip) => sum + Number(trip.duration_hours || 0), 0);
    const filteredTrips = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();
        return trips.filter((trip) => {
            const tripId = `tp-${String(trip.id).padStart(3, '0')}`;
            const searchable = [
                trip.current_location,
                trip.pickup_location,
                trip.dropoff_location,
                trip.shipper,
                trip.commodity,
                trip.load_number,
                tripId,
                new Date(trip.created_at).toLocaleDateString()
            ].filter(Boolean).join(' ').toLowerCase();
            const matchesQuery = !normalizedQuery || searchable.includes(normalizedQuery);
            const matchesFilter = filter === 'all'
                || (filter === 'recent' && Date.now() - new Date(trip.created_at).getTime() < 30 * 24 * 60 * 60 * 1000)
                || filter === 'completed';
            return matchesQuery && matchesFilter;
        });
    }, [filter, query, trips]);

    const filterLabel = filter === 'recent' ? 'Recent Trips' : filter === 'completed' ? 'Completed' : 'All Trips';

    if (loading) return <div className="loading-container"><div className="spinner"></div><p>Loading your trips...</p></div>;

    return (
        <div className="my-trips-page">
            <div className="history-heading">
                <div className="history-title-wrap">
                    <div className="history-title">
                        <span className="history-badge">🛻</span>
                        <h1>My Trips History</h1>
                    </div>
                    <p>View and manage your previously planned trips.</p>
                </div>
                <div className="history-tools">
                    <div className="search-box">
                        <span className="search-icon">⌕</span>
                        <input
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="Search by location, date or trip ID..."
                            aria-label="Search trips"
                        />
                    </div>
                    <div className="filter-menu-wrap">
                        <button
                            className="filter-button"
                            onClick={() => setFilterOpen((open) => !open)}
                            aria-expanded={filterOpen}
                            aria-haspopup="menu"
                        >
                            <span className="filter-icon">▣</span>{filterLabel} <span className="caret">⌄</span>
                        </button>
                        {filterOpen && (
                            <div className="filter-menu" role="menu">
                                {[
                                    ['all', 'All Trips'],
                                    ['completed', 'Completed'],
                                    ['recent', 'Recent Trips']
                                ].map(([value, label]) => (
                                    <button
                                        key={value}
                                        className={filter === value ? 'active' : ''}
                                        onClick={() => { setFilter(value); setFilterOpen(false); }}
                                        role="menuitem"
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="history-stats">
                <div>
                    <span className="stat-icon">▣</span>
                    <label>Total Trips<strong>{trips.length}</strong></label>
                </div>
                <div>
                    <span className="stat-icon">⌖</span>
                    <label>Total Miles<strong>{totalMiles.toFixed(1)} mi</strong></label>
                </div>
                <div>
                    <span className="stat-icon">◷</span>
                    <label>Total Driving Time<strong>{totalHours.toFixed(1)} hrs</strong></label>
                </div>
            </div>

            {error && <div className="error-box history-error">{error}</div>}

            {filteredTrips.length === 0 ? (
                <div className="empty-state history-empty-state">
                    <div className="empty-icon">⌕</div>
                    <h3>No matching trips</h3>
                    <p>Try another location, date, trip ID, or filter.</p>
                    <button type="button" className="clear-history-btn" onClick={() => { setQuery(''); setFilter('all'); }}>Clear filters</button>
                </div>
            ) : (
            <div className="trips-list">
                {filteredTrips.map((trip) => {
                    const date = formatTripDate(trip.created_at);

                    return (
                        <div key={trip.id} className="trip-card">
                            <div className="trip-date-box">
                                <b>{date.month}</b>
                                <strong>{date.day}</strong>
                                <b>{date.year}</b>
                                <em>Completed</em>
                            </div>

                            <div className="trip-card-body">
                                <div className="trip-card-top">
                                    <div className="trip-route-meta">
                                        <h3>{trip.pickup_location} → {trip.current_location} → {trip.dropoff_location}</h3>
                                        <small>Trip ID: #TP-{String(trip.id).padStart(3, '0')}</small>
                                    </div>

                                    <div className="trip-card-metrics">
                                        <span className="metric-item"><span className="metric-mark">⌖</span><b>Distance<strong>{Number(trip.distance_miles).toFixed(1)} mi</strong></b></span>
                                        <span className="metric-item"><span className="metric-mark">◷</span><b>Driving Time<strong>{Number(trip.duration_hours).toFixed(1)} hrs</strong></b></span>
                                        <span className="metric-item"><span className="metric-mark">▣</span><b>Log Sheets<strong>{trip.schedule?.length || 0} Days</strong></b></span>
                                        <button className="view-details-btn" onClick={() => setSelectedTrip(trip)}>◉ &nbsp; View Details</button>
                                        <button className="download-logs-btn" onClick={() => downloadTripLogs(trip)} disabled={pdfBusy}>⇩ &nbsp; {pdfBusy ? 'Preparing PDF…' : 'Download PDF'}</button>
                                    </div>
                                </div>

                                <div className="route-line">
                                    <div className="route-point start-point">
                                        <i>●</i>
                                        <small>Pickup Location</small>
                                        <b>{trip.pickup_location}</b>
                                    </div>
                                    <div className="route-point current-point">
                                        <i>●</i>
                                        <small>Current Location</small>
                                        <b>{trip.current_location}</b>
                                    </div>
                                    <div className="route-point end-point">
                                        <i>●</i>
                                        <small>Dropoff Location</small>
                                        <b>{trip.dropoff_location}</b>
                                    </div>
                                </div>

                                <div className="trip-details">
                                    <span><span className="detail-icon">▱</span> <b>Shipper<small>{trip.shipper || '—'}</small></b></span>
                                    <span><span className="detail-icon">◇</span> <b>Commodity<small>{trip.commodity || '—'}</small></b></span>
                                    <span><span className="detail-icon">⌖</span> <b>Load Number<small>{trip.load_number || '—'}</small></b></span>
                                    <span><span className="detail-icon">◷</span> <b>Current Cycle Used (Hrs)<small>{trip.cycle_hours_used}</small></b></span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
            )}

            {pdfTrip && (
                <div className="pdf-render-target" ref={pdfRenderRef} aria-hidden="true">
                    {(Array.isArray(pdfTrip.schedule) ? pdfTrip.schedule : []).map((day) => (
                        <LogSheet key={day.day} day={day} driverInfo={driverInfo} tripInfo={pdfTrip} />
                    ))}
                </div>
            )}

            {selectedTrip && (
                <div className="trip-modal-backdrop" role="presentation" onClick={() => setSelectedTrip(null)}>
                    <section className="trip-modal" role="dialog" aria-modal="true" aria-labelledby="trip-details-title" onClick={(event) => event.stopPropagation()}>
                        <div className="trip-modal-header">
                            <div>
                                <span className="modal-eyebrow">Trip details</span>
                                <h2 id="trip-details-title">{selectedTrip.pickup_location} → {selectedTrip.dropoff_location}</h2>
                                <p>Trip ID: #TP-{String(selectedTrip.id).padStart(3, '0')}</p>
                            </div>
                            <button type="button" className="modal-close" onClick={() => setSelectedTrip(null)} aria-label="Close trip details">×</button>
                        </div>
                        <div className="trip-modal-grid">
                            <div><span>Current location</span><strong>{selectedTrip.current_location}</strong></div>
                            <div><span>Distance</span><strong>{Number(selectedTrip.distance_miles).toFixed(1)} mi</strong></div>
                            <div><span>Driving time</span><strong>{Number(selectedTrip.duration_hours).toFixed(1)} hrs</strong></div>
                            <div><span>Cycle used</span><strong>{selectedTrip.cycle_hours_used || '—'} hrs</strong></div>
                            <div><span>Shipper</span><strong>{selectedTrip.shipper || '—'}</strong></div>
                            <div><span>Commodity</span><strong>{selectedTrip.commodity || '—'}</strong></div>
                            <div><span>Load number</span><strong>{selectedTrip.load_number || '—'}</strong></div>
                            <div><span>Planned on</span><strong>{new Date(selectedTrip.created_at).toLocaleDateString()}</strong></div>
                        </div>
                        {selectedTrip.schedule?.length ? (
                            <div className="history-log-sheets">
                                <div className="history-log-header">
                                    <h3>Saved daily log sheets</h3>
                                    <button type="button" className="download-modal-btn" onClick={() => downloadTripLogs(selectedTrip)} disabled={pdfBusy}>⇩ {pdfBusy ? 'Preparing…' : 'Download PDF'}</button>
                                </div>
                                {selectedTrip.schedule.map((day) => (
                                    <details className="history-log-day" key={day.day}>
                                        <summary>Day {day.day} <span>{Number(day.totals?.D || 0).toFixed(1)} driving hrs</span></summary>
                                        <LogSheet day={day} driverInfo={driverInfo} tripInfo={toLogTripInfo(selectedTrip)} />
                                    </details>
                                ))}
                            </div>
                        ) : <p className="no-saved-logs">No saved log sheets are available for this older trip.</p>}
                        <button type="button" className="modal-done-btn" onClick={() => setSelectedTrip(null)}>Done</button>
                    </section>
                </div>
            )}
        </div>
    );
}
