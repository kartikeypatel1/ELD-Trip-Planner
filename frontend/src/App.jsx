import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import TripPlanner from './pages/TripPlanner';
import Login from './pages/Login';
import Signup from './pages/Signup';
import MyTrips from './pages/MyTrips';
import DriverProfile from './pages/DriverProfile';

function ProtectedRoute({ children }) {
    const token = localStorage.getItem('access_token');
    if (!token) {
        return <Navigate to="/login" replace />;
    }
    return children;
}

export default function App() {
    return (
        <Router>
            <div className="app-container">
                <Navbar />
                <main className="main-content">
                    <Routes>
                        <Route path="/login"  element={<Login />} />
                        <Route path="/signup" element={<Signup />} />
                        <Route
                            path="/"
                            element={<ProtectedRoute><TripPlanner /></ProtectedRoute>}
                        />
                        <Route
                            path="/my-trips"
                            element={<ProtectedRoute><MyTrips /></ProtectedRoute>}
                        />
                        <Route
                            path="/profile"
                            element={<ProtectedRoute><DriverProfile /></ProtectedRoute>}
                        />
                    </Routes>
                </main>
            </div>
        </Router>
    );
}
