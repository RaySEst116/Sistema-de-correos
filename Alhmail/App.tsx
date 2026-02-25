
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import InboxView from './views/InboxView';
import Login from './components/Login';
import AdminPage from './pages/AdminPage';
import ToastNotification from './components/ToastNotification';
import { db } from './services/db';
import { User } from './types';

const App: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [authLoading, setAuthLoading] = useState(true);

    useEffect(() => {
        const checkSession = async () => {
            const currentUser = await db.getCurrentUser();
            if (currentUser) {
                setUser(currentUser);
            }
            setAuthLoading(false);
        };
        checkSession();
    }, []);

    const handleLogin = (loggedInUser: User) => {
        setUser(loggedInUser);
    };

    const handleLogout = async () => {
        await db.logout();
        setUser(null);
    };

    if (authLoading) return (
        <div style={{
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'var(--bg-main, #F5F7FA)',
            color: 'var(--primary-red, #D50032)'
        }}>
            <i className="fas fa-circle-notch fa-spin" style={{ fontSize: '3rem' }}></i>
        </div>
    );

    return (
        <Router>
            <Routes>
                <Route 
                    path="/login" 
                    element={!user ? <Login onLogin={handleLogin} /> : <Navigate to="/inbox" replace />} 
                />
                <Route 
                    path="/inbox" 
                    element={user ? <InboxView user={user} onLogout={handleLogout} /> : <Navigate to="/login" replace />} 
                />
                <Route 
                    path="/admin" 
                    element={user && user.role === 'admin' ? <AdminPage /> : <Navigate to="/login" replace />} 
                />
                <Route 
                    path="/" 
                    element={<Navigate to={user ? "/inbox" : "/login"} replace />} 
                />
            </Routes>
            {user && <ToastNotification currentUserEmail={user.email} />}
        </Router>
    );
};

export default App;
