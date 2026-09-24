import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';

export default function Signup() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            return setError("Passwords do not match.");
        }
        setLoading(true);
        setError(null);
        try {
            const res = await api.post('/api/auth/signup/', { name, email, password });
            localStorage.setItem('access_token', res.data.access);
            localStorage.setItem('refresh_token', res.data.refresh);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            navigate('/');
        } catch (err) {
            // Flatten error messages if it's an object (like validation errors from DRF)
            let errMessage = 'Signup failed.';
            if (err.response?.data) {
                if (typeof err.response.data === 'object') {
                    errMessage = Object.values(err.response.data).join(' ');
                } else {
                    errMessage = err.response.data;
                }
            }
            setError(errMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <form className="form-card auth-card" onSubmit={handleSubmit}>
                <h2>Create Account</h2>
                <p className="subtitle">Sign up for ELD Trip Planner</p>
                {error && <div className="error-box">{error}</div>}
                <div className="form-group">
                    <label>Full Name</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} required />
                </div>
                <div className="form-group">
                    <label>Email</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
                <div className="form-group">
                    <label>Password</label>
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
                </div>
                <div className="form-group">
                    <label>Confirm Password</label>
                    <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
                </div>
                <button type="submit" className="primary" disabled={loading}>
                    {loading ? 'Creating account...' : 'Sign Up'}
                </button>
                <p className="auth-link">
                    Already have an account? <Link to="/login">Login</Link>
                </p>
            </form>
        </div>
    );
}
