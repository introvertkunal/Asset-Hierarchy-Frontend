import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider, useDispatch } from 'react-redux';
import { store } from './store';
import { setUser, clearUser, setLoading } from './store/authSlice';
import ProtectedRoute from './ProtectedRoute.jsx';
import AuthPage from './AuthPage.jsx';
import App from './App.jsx';

const Root = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await fetch('https://localhost:7036/api/auth/me', {
          method: 'GET',
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          dispatch(setUser({ userName: data.userName, roles: data.roles }));
        } else {
          dispatch(clearUser());
        }
      } catch (err) {
        console.error('Error fetching current user:', err);
        dispatch(clearUser());
      } finally {
        dispatch(setLoading(false));
      }
    };

    dispatch(setLoading(true));
    fetchCurrentUser();
  }, [dispatch]);

  const handleLogout = async () => {
    try {
      const response = await fetch('https://localhost:7036/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        dispatch(clearUser());
        window.location.href = '/auth'; 
      } else {
        throw new Error('Logout failed');
      }
    } catch (err) {
      console.error('Logout error:', err);
      dispatch(clearUser());
      window.location.href = '/auth';
    }
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/auth/callback" element={<AuthPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <App onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/auth" />} />
      </Routes>
    </BrowserRouter>
  );
};

const root = createRoot(document.getElementById('root'));
root.render(
  <Provider store={store}>
    <Root />
  </Provider>
);