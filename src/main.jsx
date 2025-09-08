import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AuthPage from './AuthPage.jsx';
import App from './App.jsx';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
};

const Root = () => {
  const handleLogin = (token, username, role) => {
    localStorage.setItem('token', token);
 
    // After login → redirect to "/"
    window.location.href = "/";
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    window.location.href = "/login";
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<AuthPage onLogin={handleLogin} />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <App onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
};


const root = createRoot(document.getElementById('root'));
root.render(<Root />);
