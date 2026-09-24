import { useState, useEffect } from 'react';
import api from '../api/axios';

const FIELDS = [
  { name: 'driver_number',       label: 'Driver Number',             placeholder: 'e.g. 1224213' },
  { name: 'initials',            label: "Driver's Initials",         placeholder: 'e.g. YS' },
  { name: 'full_name',           label: 'Full Name (for signature)', placeholder: 'e.g. Your Name' },
  { name: 'carrier_name',        label: 'Carrier / Company Name',    placeholder: 'e.g. Schneider National Carriers, Inc.' },
  { name: 'main_office_address', label: 'Main Office Address',        placeholder: 'e.g. Green Bay, WI' },
  { name: 'home_terminal_address', label: 'Home Terminal Address',   placeholder: 'e.g. Green Bay, WI' },
  { name: 'co_driver_name',      label: 'Co-driver Name',             placeholder: 'Optional' },
  { name: 'vehicle_number',      label: 'Tractor / Vehicle Number',   placeholder: 'e.g. P 48872' },
  { name: 'trailer_number',      label: 'Trailer Number',             placeholder: 'e.g. T TA939200' },
  { name: 'license_plate_number', label: 'License Plate Number',       placeholder: 'e.g. ABC 1234' },
  { name: 'license_state',       label: 'License Plate State',         placeholder: 'e.g. WI' },
];

export default function DriverProfile() {
  const [form,    setForm]    = useState({
    driver_number: '', initials: '', full_name: '',
    carrier_name: '', main_office_address: '', home_terminal_address: '',
    co_driver_name: '', vehicle_number: '', trailer_number: '',
    license_plate_number: '', license_state: '',
  });
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [success,  setSuccess]  = useState(false);
  const [error,    setError]    = useState(null);

  useEffect(() => {
    api.get('/api/auth/profile/')
      .then(r => { setForm(r.data); setLoading(false); })
      .catch(() => {
        setError('Failed to load profile. Please try again.');
        setLoading(false);
      });
  }, []);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setSaving(true); setSuccess(false); setError(null);
    try {
      await api.put('/api/auth/profile/', form);
      setSuccess(true);
    } catch {
      setError('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="profile-page">
      <div className="loading-state"><div className="spinner"></div><p>Loading profile…</p></div>
    </div>
  );

  return (
    <div className="profile-page">
      <div className="page-header">
        <h1>Driver Profile</h1>
        <p className="subtitle">Fill in your driver, carrier, and equipment details. They appear automatically on every Daily Log Sheet.</p>
      </div>

      <form className="form-card profile-form" onSubmit={handleSubmit}>
        <div className="profile-grid">
          {FIELDS.map(f => (
            <div key={f.name} className="form-group">
              <label>{f.label}</label>
              <input
                name={f.name}
                value={form[f.name] || ''}
                onChange={handleChange}
                placeholder={f.placeholder}
              />
            </div>
          ))}
        </div>

        {success && (
          <div className="success-box">
            <span>✅</span> Profile saved successfully! Your log sheets will now be pre-filled.
          </div>
        )}
        {error && (
          <div className="error-box">
            <span className="error-icon">⚠️</span> {error}
          </div>
        )}

        <button className="primary" type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Save Profile'}
        </button>
      </form>

      {/* Live preview of the log header */}
      <div className="profile-preview-card">
        <h3>Log Sheet Preview</h3>
        <div className="profile-preview-grid">
          <div className="pp-cell"><span>Driver #</span><strong>{form.driver_number || '—'}</strong></div>
          <div className="pp-cell"><span>Initials</span><strong>{form.initials || '—'}</strong></div>
          <div className="pp-cell pp-wide"><span>Signature</span><strong className="pp-sig">{form.full_name || '—'}</strong></div>
          <div className="pp-cell pp-wide"><span>Carrier</span><strong>{form.carrier_name || '—'}</strong></div>
          <div className="pp-cell pp-wide"><span>Main Office</span><strong>{form.main_office_address || '—'}</strong></div>
          <div className="pp-cell pp-wide"><span>Home Terminal</span><strong>{form.home_terminal_address || '—'}</strong></div>
          <div className="pp-cell"><span>Vehicle</span><strong>{form.vehicle_number || '—'}</strong></div>
          <div className="pp-cell"><span>Trailer</span><strong>{form.trailer_number || '—'}</strong></div>
          <div className="pp-cell"><span>License Plate</span><strong>{form.license_plate_number ? `${form.license_plate_number} ${form.license_state || ''}` : '—'}</strong></div>
        </div>
      </div>
    </div>
  );
}
