// ProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Loading from './components/Loading'; 

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, error } = useSelector((state) => state.auth);

  if (loading) {
    return <Loading />;
  }

  if (error) {
    // Display error message for unauthorized access
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <h2>{error}</h2>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" />;
  }

  return children;
};

export default ProtectedRoute;