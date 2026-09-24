import { Link, useLocation, useNavigate } from 'react-router-dom';

export default function Navbar() {
    const navigate = useNavigate();
    const location = useLocation();
    const token = localStorage.getItem('access_token');
    const user  = JSON.parse(localStorage.getItem('user') || '{}');

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const isPlanner = location.pathname === '/';

    return (
        <>
        <nav className={`navbar ${isPlanner ? 'planner-navbar' : ''}`}>
            <div className="nav-brand">
                <Link to="/" className="nav-brand-link"><span className="brand-icon">🚚</span>ELD Trip Planner</Link>
            </div>
            <div className="nav-links">
                {token ? (
                    <>
                        <span className="user-email"><span className="mail-icon">✉</span>{user.email}</span>
                        <Link to="/">⚯ &nbsp; Plan Trip</Link>
                        <Link to="/my-trips">▣ &nbsp; My Trips</Link>
                        <Link to="/profile" className="nav-profile-link">👤 Profile</Link>
                        <button className="logout-btn" onClick={handleLogout}>Logout</button>
                    </>
                ) : (
                    <>
                        <Link to="/login">Login</Link>
                        <Link to="/signup" className="btn-primary-small">Sign Up</Link>
                    </>
                )}
            </div>
        </nav>
        {isPlanner && token && (
            <aside className="planner-sidebar">
                <Link className="sidebar-brand" to="/">🚚 <span>ELD <b>Trip Planner</b></span></Link>
                <div className="sidebar-links">
                    <Link className="sidebar-active" to="/">⚯ <span>Plan Trip</span></Link>
                    <Link to="/my-trips">▣ <span>My Trips</span></Link>
                </div>
                <div className="sidebar-message">🚚<br /><b>Smarter Trips.</b><br />Higher Efficiency.<i /></div>
                <div className="sidebar-user">● &nbsp; {user.email} &nbsp;›</div>
            </aside>
        )}
        </>
    );
}
