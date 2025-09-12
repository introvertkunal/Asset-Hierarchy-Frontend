import React, { useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider, useDispatch } from 'react-redux';
import { store } from './store';
import { setUser, clearUser, setLoading } from './store/authSlice';
import ProtectedRoute from './ProtectedRoute.jsx';
import AuthPage from './AuthPage.jsx';
import App from './App.jsx';
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://localhost:7036/api',
  withCredentials: true,
});

const Root = () => {
  const dispatch = useDispatch();
  const isRefreshing = useRef(false);
  const retryQueue = useRef([]);
  const tokenExpirationTimeout = useRef(null);

  // Function to schedule token refresh
  const scheduleTokenRefresh = (expiresIn = 10 * 60 * 1000) => { 
    if (tokenExpirationTimeout.current) {
      clearTimeout(tokenExpirationTimeout.current);
    }
    
    // Schedule refresh 30 seconds before expiration
    const refreshTime = expiresIn - 30 * 1000;
    tokenExpirationTimeout.current = setTimeout(async () => {
      try {
        isRefreshing.current = true;
        const refreshResponse = await api.post('/auth/refresh');
        if (refreshResponse.status === 200) {
          const userResponse = await api.get('/auth/me');
          dispatch(setUser({
            userName: userResponse.data.userName,
            roles: userResponse.data.roles,
          }));
          // Schedule next refresh
          scheduleTokenRefresh();
        }
      } catch (error) {
        console.error('Token refresh error:', error);
        dispatch(clearUser());
        window.location.href = '/auth';
      } finally {
        isRefreshing.current = false;
      }
    }, refreshTime);
  };

  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          if (isRefreshing.current) {
            return new Promise((resolve, reject) => {
              retryQueue.current.push({ resolve, reject, originalRequest });
            });
          }

          originalRequest._retry = true;
          isRefreshing.current = true;

          try {
            const refreshResponse = await api.post('/auth/refresh');
            if (refreshResponse.status === 200) {
              const userResponse = await api.get('/auth/me');
              dispatch(setUser({
                userName: userResponse.data.userName,
                roles: userResponse.data.roles,
              }));

              retryQueue.current.forEach(({ resolve, originalRequest }) => {
                resolve(api(originalRequest));
              });
              retryQueue.current = [];

              // Schedule next refresh after successful refresh
              scheduleTokenRefresh();

              return api(originalRequest);
            }
          } catch (refreshError) {
            dispatch(clearUser());
            retryQueue.current.forEach(({ reject }) => reject(refreshError));
            retryQueue.current = [];
            window.location.href = '/auth';
            return Promise.reject(refreshError);
          } finally {
            isRefreshing.current = false;
          }
        }
        return Promise.reject(error);
      }
    );

    const fetchCurrentUser = async () => {
      try {
        dispatch(setLoading(true));
        const response = await api.get('/auth/me');
        if (response.status === 200) {
          dispatch(setUser({
            userName: response.data.userName,
            roles: response.data.roles,
          }));
          // Start token refresh cycle after successful login
          scheduleTokenRefresh();
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

    fetchCurrentUser();

    // Cleanup interceptor and timeout on unmount
    return () => {
      api.interceptors.response.eject(interceptor);
      if (tokenExpirationTimeout.current) {
        clearTimeout(tokenExpirationTimeout.current);
      }
    };
  }, [dispatch]);

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
      dispatch(clearUser());
      if (tokenExpirationTimeout.current) {
        clearTimeout(tokenExpirationTimeout.current);
      }
      window.location.href = '/auth';
    } catch (err) {
      console.error('Logout error:', err);
      dispatch(clearUser());
      if (tokenExpirationTimeout.current) {
        clearTimeout(tokenExpirationTimeout.current);
      }
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