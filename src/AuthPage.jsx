import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setUser } from './store/authSlice';
import { FcGoogle } from 'react-icons/fc';
import { FaGithub } from 'react-icons/fa';
import settingsIcon from './settings.png';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();

  // Handle OAuth callback
useEffect(() => {
  const handleOAuthCallback = async () => {
    if (location.pathname === '/auth/callback') {
      try {
        // Call /me to get current user (cookie is already set by backend)
        const response = await fetch('https://localhost:7036/api/auth/me', {
          method: 'GET',
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          dispatch(setUser({ userName: data.userName, roles: data.roles }));
          navigate('/'); // ✅ Redirect home
        } else {
          navigate('/auth?error=external');
        }
      } catch (error) {
        console.error('OAuth callback error:', error);
        navigate('/auth?error=external');
      }
    }
  };

  handleOAuthCallback();
}, [location, dispatch, navigate]);


  const validateForm = () => {
    const newErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(formData.username)) {
      newErrors.username = 'Username must start with a letter and contain only letters, numbers, and underscores';
    } else if (formData.username.length > 30) {
      newErrors.username = 'Username must be 30 characters or less';
    }

    if (!isLogin) {
      if (!formData.email.trim()) {
        newErrors.email = 'Email is required';
      } else if (!/^[a-zA-Z][^\s@]*@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Email must start with a letter and be a valid email address';
      }
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    setMessage('');
    setErrors({});

    try {
      const endpoint = isLogin ? 'login' : 'register';
      const payload = isLogin
        ? { userName: formData.username, password: formData.password }
        : { userName: formData.username, email: formData.email, password: formData.password };

      const response = await fetch(`https://localhost:7036/api/auth/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        credentials: 'include',
      });

      const contentType = response.headers.get('content-type');
      let data;

      if (response.ok) {
        if (endpoint === 'login') {
          data = await response.json();
          dispatch(setUser({ userName: data.userName, roles: data.roles }));
          setMessage('Login successful!');
          navigate('/');
        } else {
          setMessage('Registration successful! Please login.');
          setIsLogin(true);
          setFormData({ username: '', email: '', password: '' });
        }
      } else {
        if (contentType && contentType.includes('application/json')) {
          data = await response.json();
          if (Array.isArray(data)) {
            const newErrors = {};
            data.forEach((error) => {
              if (error.code === 'DuplicateUserName') {
                newErrors.username = `${formData.username} is already taken.`;
              }
              if (error.code === 'DuplicateEmail') {
                newErrors.email = `${formData.email} is already taken.`;
              }
            });
            setErrors(newErrors);
          } else if (data.message) {
            setMessage(data.message);
          }
        } else {
          data = await response.text();
          const newErrors = {};
          if (data === 'Invalid Username.') {
            newErrors.username = 'Invalid Username.';
          } else if (data === 'Invalid Password.') {
            newErrors.password = 'Invalid Password.';
          } else {
            setMessage(data);
          }
          setErrors(newErrors);
        }
      }
    } catch (error) {
      setMessage('Network error. Please try again.');
      console.error('Auth error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExternalLogin = (provider) => {
    const redirectUrl = `${window.location.origin}/auth/callback`;
    window.location.href = `https://localhost:7036/api/auth/externallogin?provider=${provider}&returnUrl=${encodeURIComponent(redirectUrl)}`;
  };

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setFormData({ username: '', email: '', password: '' });
    setErrors({});
    setMessage('');
  };

  return (
    <div
      style={{
        height: '100vh',
        width: '100vw',
        margin: 0,
        padding: 0,
        background: 'linear-gradient(135deg, #0f3d3e 0%, #2a1a4a 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        position: 'fixed',
        top: 0,
        left: 0,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          background: 'rgba(40, 44, 52, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          padding: '30px',
          width: '100%',
          maxWidth: '400px',
          minHeight: '520px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
          <div
            style={{
              width: '60px',
              height: '60px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            <img src={settingsIcon} alt="icon" style={{ width: '60%', height: '60%', objectFit: 'contain' }} />
          </div>
        </div>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h1
            style={{
              color: 'white',
              fontSize: '28px',
              fontWeight: '600',
              margin: '0 0 10px 0',
            }}
          >
            {isLogin ? 'Welcome back' : 'Create account'}
          </h1>
          <p
            style={{
              color: 'rgba(255, 255, 255, 0.7)',
              margin: 0,
              fontSize: '16px',
            }}
          >
            {isLogin ? 'Sign in to your account to continue' : 'Get started with your new account'}
          </p>
        </div>
        <div
          style={{
            display: 'flex',
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '12px',
            padding: '4px',
            marginBottom: '20px',
          }}
        >
          <button
            type="button"
            onClick={() => isLogin || toggleAuthMode()}
            style={{
              flex: 1,
              padding: '12px',
              border: 'none',
              borderRadius: '8px',
              background: isLogin ? '#10b981' : 'transparent',
              color: 'white',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => !isLogin || toggleAuthMode()}
            style={{
              flex: 1,
              padding: '12px',
              border: 'none',
              borderRadius: '8px',
              background: !isLogin ? '#10b981' : 'transparent',
              color: 'white',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            Register
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label
              style={{
                display: 'block',
                color: 'white',
                fontSize: '14px',
                fontWeight: '500',
                marginBottom: '8px',
              }}
            >
              Username
            </label>
            <div style={{ position: 'relative' }}>
              <svg
                style={{
                  position: 'absolute',
                  left: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'rgba(255, 255, 255, 0.5)',
                  pointerEvents: 'none',
                }}
                width="18"
                height="18"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM19 20V18C19 15.8 17.2 14 15 14H9C6.8 14 5 15.8 5 18V20H19Z" />
              </svg>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                placeholder={isLogin ? 'Enter your username' : 'Choose a username'}
                maxLength={30}
                style={{
                  width: '100%',
                  padding: '16px 16px 16px 50px',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: errors.username ? '2px solid #ef4444' : '2px solid transparent',
                  borderRadius: '12px',
                  color: 'white',
                  fontSize: '16px',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#667eea')}
                onBlur={(e) => !errors.username && (e.target.style.borderColor = 'transparent')}
              />
            </div>
            {errors.username && (
              <p style={{ color: '#ef4444', fontSize: '12px', margin: '6px 0 0 0' }}>{errors.username}</p>
            )}
          </div>
          {!isLogin && (
            <div style={{ marginBottom: '20px' }}>
              <label
                style={{
                  display: 'block',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '500',
                  marginBottom: '8px',
                }}
              >
                Email
              </label>
              <div style={{ position: 'relative' }}>
                <svg
                  style={{
                    position: 'absolute',
                    left: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'rgba(255, 255, 255, 0.5)',
                    pointerEvents: 'none',
                  }}
                  width="18"
                  height="18"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M20 4H4C2.9 4 2.01 4.9 2.01 6L2 18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4ZM20 8L12 13L4 8V6L12 11L20 6V8Z" />
                </svg>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your email"
                  style={{
                    width: '100%',
                    padding: '16px 16px 16px 50px',
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: errors.email ? '2px solid #ef4444' : '2px solid transparent',
                    borderRadius: '12px',
                    color: 'white',
                    fontSize: '16px',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#667eea')}
                  onBlur={(e) => !errors.email && (e.target.style.borderColor = 'transparent')}
                />
              </div>
              {errors.email && (
                <p style={{ color: '#ef4444', fontSize: '12px', margin: '6px 0 0 0' }}>{errors.email}</p>
              )}
            </div>
          )}
          <div style={{ marginBottom: '20px' }}>
            <label
              style={{
                display: 'block',
                color: 'white',
                fontSize: '14px',
                fontWeight: '500',
                marginBottom: '8px',
              }}
            >
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <svg
                style={{
                  position: 'absolute',
                  left: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'rgba(255, 255, 255, 0.5)',
                  pointerEvents: 'none',
                }}
                width="18"
                height="18"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M18 8H17V6C17 3.24 14.76 1 12 1S7 3.24 7 6V8H6C4.9 8 4 8.9 4 10V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V10C20 8.9 19.1 8 18 8ZM9 6C9 4.34 10.34 3 12 3S15 4.34 15 6V8H9V6Z" />
              </svg>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder={isLogin ? 'Enter your password' : 'Create a strong password'}
                style={{
                  width: '100%',
                  padding: '16px 50px 16px 50px',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: errors.password ? '2px solid #ef4444' : '2px solid transparent',
                  borderRadius: '12px',
                  color: 'white',
                  fontSize: '16px',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#667eea')}
                onBlur={(e) => !errors.password && (e.target.style.borderColor = 'transparent')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg width="18" height="18" fill="rgba(255, 255, 255, 0.5)" viewBox="0 0 24 24">
                  {showPassword ? (
                    <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                  ) : (
                    <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-4 .7l2.17 2.17C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3-.17 0-.33.02-.48.04z" />
                  )}
                </svg>
              </button>
            </div>
            {errors.password && (
              <p style={{ color: '#ef4444', fontSize: '12px', margin: '6px 0 0 0' }}>{errors.password}</p>
            )}
          </div>
          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '16px',
              background: isLoading ? 'rgba(102, 126, 234, 0.5)' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              borderRadius: '12px',
              color: 'white',
              fontSize: '16px',
              fontWeight: '600',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              marginBottom: '20px',
            }}
          >
            {isLoading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <span style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px' }}>
            Or {isLogin ? 'sign in' : 'sign up'} with
          </span>
        </div>
        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginBottom: '20px' }}>
          <button
            onClick={() => handleExternalLogin('Google')}
            disabled={isLoading}
            style={{
              flex: 1,
              padding: '12px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <FcGoogle size={24} style={{ marginRight: '8px' }} />
            <span style={{ color: 'white', fontSize: '14px', fontWeight: '500' }}>Google</span>
          </button>
          <button
            onClick={() => handleExternalLogin('GitHub')}
            disabled={isLoading}
            style={{
              flex: 1,
              padding: '12px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <FaGithub size={24} style={{ marginRight: '8px', color: 'white' }} />
            <span style={{ color: 'white', fontSize: '14px', fontWeight: '500' }}>GitHub</span>
          </button>
        </div>
        {message && (
          <div
            style={{
              padding: '12px',
              borderRadius: '8px',
              background: message.includes('successful') ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
              color: message.includes('successful') ? '#10b981' : '#ef4444',
              fontSize: '14px',
              textAlign: 'center',
              marginBottom: '20px',
              border: `1px solid ${message.includes('successful') ? '#10b981' : '#ef4444'}`,
            }}
          >
            {message}
          </div>
        )}
        <div style={{ textAlign: 'center' }}>
          <span style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px' }}>
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
          </span>
          <button
            type="button"
            onClick={toggleAuthMode}
            style={{
              background: 'none',
              border: 'none',
              color: '#10b981',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            {isLogin ? 'Sign up' : 'Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;