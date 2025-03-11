import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Components
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import Home from './components/pages/Home';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import GameRoom from './components/game/GameRoom';
import AIGame from './components/game/AIGame';
import Dashboard from './components/dashboard/Dashboard';
import Leaderboard from './components/pages/Leaderboard';
import Profile from './components/profile/Profile';
import Settings from './components/profile/Settings';
import NotFound from './components/pages/NotFound';

// Context
import AuthState from './context/auth/AuthState';
import GameState from './context/game/GameState';
import setAuthToken from './utils/setAuthToken';

// Check for token
if (localStorage.token) {
  setAuthToken(localStorage.token);
}

const App = () => {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Any initialization logic can go here
    setIsInitialized(true);
  }, []);

  if (!isInitialized) {
    return <div className="loading-screen">Loading...</div>;
  }

  return (
    <AuthState>
      <GameState>
        <Router>
          <div className="app">
            <Navbar />
            <div className="container">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/game/:id" element={<GameRoom />} />
                <Route path="/play-ai" element={<AIGame />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/404" element={<NotFound />} />
                <Route path="*" element={<Navigate to="/404" replace />} />
              </Routes>
            </div>
            <Footer />
            <ToastContainer position="bottom-right" autoClose={5000} />
          </div>
        </Router>
      </GameState>
    </AuthState>
  );
};

export default App;