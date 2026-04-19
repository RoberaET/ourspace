import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { Home, MessageCircle, Image as ImageIcon, Calendar, Settings as SettingsIcon, Heart } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';

import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Messages from './pages/Messages';
import Gallery from './pages/Gallery';
import Settings from './pages/Settings';
import Dates from './pages/Dates';
import Tasks from './pages/Tasks';
import Setup from './pages/Setup';
import Disagreements from './pages/Disagreements';

const AuthWrapper = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" />;
  return <Auth />;
};

const ProtectedRoute = ({ children, requireOnboarded = true }) => {
  const { user, profile, loading } = useAuth();
  
  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'var(--color-primary)' }}>Loading our space...</div>;
  if (!user) return <Navigate to="/auth" />;

  // If we have a user but profile failed to load completely, trap them in the setup error state instead of spinning forever.
  if (user && !profile) return <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: 16 }}>
       <div style={{ color: 'var(--color-primary)' }}>Failed to load profile.</div>
       <button onClick={() => window.location.reload()} className="btn btn-primary" style={{ width: 'auto' }}>Retry</button>
  </div>;

  if (requireOnboarded && profile && !profile.onboarded) {
    return <Navigate to="/setup" />;
  }

  if (!requireOnboarded && profile && profile.onboarded) {
    return <Navigate to="/" />;
  }
  
  return children;
};

const Layout = ({ children }) => {
  const location = useLocation();
  const path = location.pathname;

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo-box">
            <Heart size={18} color="white" fill="white" />
          </div>
          <span className="logo-text">H & K</span>
        </div>

        <nav className="nav-links">
          <Link to="/" className={`nav-item ${path === '/' ? 'active' : ''}`}>
            <Home size={18} />
            <span>Home</span>
          </Link>
          <Link to="/messages" className={`nav-item ${path === '/messages' ? 'active' : ''}`}>
            <MessageCircle size={18} />
            <span>Chat</span>
          </Link>
          <Link to="/gallery" className={`nav-item ${path === '/gallery' ? 'active' : ''}`}>
            <ImageIcon size={18} />
            <span>Photos</span>
          </Link>
          <Link to="/dates" className={`nav-item ${path === '/dates' ? 'active' : ''}`}>
            <Calendar size={18} />
            <span>Dates</span>
          </Link>
          <Link to="/disagreements" className={`nav-item ${path === '/disagreements' ? 'active' : ''}`}>
            <MessageCircle size={18} />
            <span>Reflections</span>
          </Link>
          <Link to="/settings" className={`nav-item ${path === '/settings' ? 'active' : ''}`}>
             <SettingsIcon size={18} />
             <span>Settings</span>
          </Link>
        </nav>
      </aside>
      
      {/* Main Content Area */}
      <main className="main-content">
        {/* Top bar avatars can go here, but we will let pages dictate if they need a top bar */}
        {children}
      </main>

    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={
            <AuthWrapper />
          } />
          <Route path="/setup" element={
            <ProtectedRoute requireOnboarded={false}>
              <Setup />
            </ProtectedRoute>
          } />
          <Route path="/*" element={
            <ProtectedRoute requireOnboarded={true}>
              <Layout>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/messages" element={<Messages />} />
                  <Route path="/gallery" element={<Gallery />} />
                  <Route path="/dates" element={<Dates />} />
                  <Route path="/disagreements" element={<Disagreements />} />
                  <Route path="/tasks" element={<Tasks />} />
                  <Route path="/settings" element={<Settings />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
