import React, { useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Provider, useDispatch } from 'react-redux';
import { store } from './store';
import { setUser, clearUser, setLoading } from './store/authSlice';
import ProtectedRoute from './ProtectedRoute.jsx';
import AuthPage from './AuthPage.jsx';
import App from './App.jsx';
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://localhost:7204/api',
  withCredentials: true,
});

const Root = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isRefreshing = useRef(false);
  const retryQueue = useRef([]);
  const tokenExpirationTimeout = useRef(null);
  const isInitializing = useRef(true);

  const scheduleTokenRefresh = (expiresIn = 10 * 60 * 1000) => {
    if (tokenExpirationTimeout.current) {
      clearTimeout(tokenExpirationTimeout.current);
    }
    
    const refreshTime = Math.max(expiresIn - 30 * 1000, 1000);
    
    tokenExpirationTimeout.current = setTimeout(async () => {
      if (isRefreshing.current) return;
      
      try {
        isRefreshing.current = true;
        const refreshResponse = await api.post('/auth/refresh');
        
        if (refreshResponse.status === 200) {
          const userResponse = await api.get('/auth/me');
          dispatch(
            setUser({
              userName: userResponse.data.userName,
              roles: userResponse.data.roles,
            })
          );
          scheduleTokenRefresh();
        }
      } catch (error) {
        console.error('Scheduled token refresh error:', error);
        dispatch(clearUser());
        navigate('/auth', { replace: true });
      } finally {
        isRefreshing.current = false;
      }
    }, refreshTime);
  };

  const processRetryQueue = (error = null) => {
    retryQueue.current.forEach(({ resolve, reject, originalRequest }) => {
      if (error) {
        reject(error);
      } else {
        resolve(api(originalRequest));
      }
    });
    retryQueue.current = [];
  };

  const attemptTokenRefresh = async () => {
    try {
      const refreshResponse = await api.post('/auth/refresh');
      
      if (refreshResponse.status === 200) {
        const userResponse = await api.get('/auth/me');
        dispatch(
          setUser({
            userName: userResponse.data.userName,
            roles: userResponse.data.roles,
          })
        );
        scheduleTokenRefresh();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  };

  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // Don't intercept if this is during initial app load
        if (isInitializing.current) {
          return Promise.reject(error);
        }

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          // If already refreshing, queue this request
          if (isRefreshing.current) {
            return new Promise((resolve, reject) => {
              retryQueue.current.push({ resolve, reject, originalRequest });
            });
          }

          isRefreshing.current = true;

          try {
            const success = await attemptTokenRefresh();
            
            if (success) {
              processRetryQueue();
              return api(originalRequest);
            } else {
              throw new Error('Refresh failed');
            }
          } catch (refreshError) {
            processRetryQueue(refreshError);
            dispatch(clearUser());
            navigate('/auth', { replace: true });
            return Promise.reject(refreshError);
          } finally {
            isRefreshing.current = false;
          }
        }
        
        return Promise.reject(error);
      }
    );

    const initializeAuth = async () => {
      dispatch(setLoading(true));
      isInitializing.current = true;

      try {
        // First, try to get current user
        const response = await api.get('/auth/me');
        
        if (response.status === 200) {
          dispatch(
            setUser({
              userName: response.data.userName,
              roles: response.data.roles,
            })
          );
          scheduleTokenRefresh();
        } else {
          dispatch(clearUser());
        }
      } catch (err) {
        // If /auth/me fails, try refresh once
        if (err.response?.status === 401) {
          try {
            const refreshResponse = await api.post('/auth/refresh');
            
            if (refreshResponse.status === 200) {
              const userResponse = await api.get('/auth/me');
              dispatch(
                setUser({
                  userName: userResponse.data.userName,
                  roles: userResponse.data.roles,
                })
              );
              scheduleTokenRefresh();
            } else {
              dispatch(clearUser());
            }
          } catch (refreshErr) {
            console.error('Initial refresh failed:', refreshErr);
            dispatch(clearUser());
          }
        } else {
          console.error('Error fetching current user:', err);
          dispatch(clearUser());
        }
      } finally {
        dispatch(setLoading(false));
        isInitializing.current = false;
      }
    };

    initializeAuth();

    return () => {
      api.interceptors.response.eject(interceptor);
      if (tokenExpirationTimeout.current) {
        clearTimeout(tokenExpirationTimeout.current);
      }
      isInitializing.current = false;
      isRefreshing.current = false;
      retryQueue.current = [];
    };
  }, [dispatch, navigate]);

  const handleLogout = async () => {
    dispatch(setLoading(true));
    
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      if (tokenExpirationTimeout.current) {
        clearTimeout(tokenExpirationTimeout.current);
      }
      isRefreshing.current = false;
      retryQueue.current = [];
      dispatch(clearUser());
      dispatch(setLoading(false));
      navigate('/auth', { replace: true });
    }
  };

  return (
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
      <Route
        path="*"
        element={
          <ProtectedRoute>
            <Navigate to="/" />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

const root = createRoot(document.getElementById('root'));
root.render(
  <Provider store={store}>
    <BrowserRouter>
      <Root />
    </BrowserRouter>
  </Provider>
);