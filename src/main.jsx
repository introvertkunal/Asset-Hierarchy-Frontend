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

// Create an Axios instance for API requests
const api = axios.create({
  baseURL: 'https://localhost:7036/api',
  withCredentials: true, // Include cookies in requests
});

const Root = () => {
  const dispatch = useDispatch();
  const isRefreshing = useRef(false); // Track ongoing refresh attempts
  const retryQueue = useRef([]); // Queue for requests waiting on refresh

  useEffect(() => {
    // Set up Axios interceptor for handling 401 errors
    const interceptor = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // Only handle 401 errors and ensure no infinite retry
        if (error.response?.status === 401 && !originalRequest._retry) {
          if (isRefreshing.current) {
            // Queue the request if a refresh is already in progress
            return new Promise((resolve, reject) => {
              retryQueue.current.push({ resolve, reject, originalRequest });
            });
          }

          originalRequest._retry = true; // Mark as retried
          isRefreshing.current = true; // Start refresh

          try {
            // Attempt to refresh token
            const refreshResponse = await api.post('/auth/refresh');
            if (refreshResponse.status === 200) {
              // Update Redux store with new user data
              const userResponse = await api.get('/auth/me');
              dispatch(setUser({
                userName: userResponse.data.userName,
                roles: userResponse.data.roles,
              }));

              // Resolve all queued requests
              retryQueue.current.forEach(({ resolve, originalRequest }) => {
                resolve(api(originalRequest));
              });
              retryQueue.current = [];

              // Retry the original request
              return api(originalRequest);
            }
          } catch (refreshError) {
            // Refresh token invalid or expired, clear auth and redirect
            dispatch(clearUser());
            retryQueue.current.forEach(({ reject }) => reject(refreshError));
            retryQueue.current = [];
            window.location.href = '/auth';
            return Promise.reject(refreshError);
          } finally {
            isRefreshing.current = false; // End refresh
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

    // Cleanup interceptor on component unmount
    return () => api.interceptors.response.eject(interceptor);
  }, [dispatch]);

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
      dispatch(clearUser());
      window.location.href = '/auth';
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