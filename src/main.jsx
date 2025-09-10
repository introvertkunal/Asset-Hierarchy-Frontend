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
      }
    };

    dispatch(setLoading(true));
    fetchCurrentUser();
  }, [dispatch]);

  const handleLogin = async (username, password) => {
    try {
      const response = await fetch('https://localhost:7036/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();
      dispatch(setUser({ userName: data.userName, roles: data.roles }));
      window.location.href = '/';
    } catch (err) {
      console.error('Login error:', err);
      throw err;
    }
  };

  const handleLogout = async () => {
    try {
      const response = await fetch('https://localhost:7036/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      console.log('Logout response:', response.json());
      dispatch(clearUser());
      window.location.href = '/login';
    } catch (err) {
      console.error('Logout error:', err);
      dispatch(clearUser());
      window.location.href = '/login';
    }
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
root.render(
  <Provider store={store}>
    <Root />
  </Provider>
);
