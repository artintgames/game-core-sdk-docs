# Frontend Integration Guide

This guide shows how to integrate the Game Core SDK into your React frontend application with full authentication support.

## Installation

```bash
cd game-core-sdk-frontend
npm install ../game-core-sdk
```

## Architecture Overview

```
Frontend App
├── AuthContext (manages authentication state)
├── SDKContext (provides SDK instance)
├── AuthPage (login/register forms)
├── ProtectedRoute (guards authenticated routes)
└── App Components (use SDK clients)
```

## Basic Integration

### 1. Create Auth Context

Create `src/context/AuthContext.js`:

```jsx
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useSDK } from './SDKContext';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const sdk = useSDK();
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check for existing token on mount
  useEffect(() => {
    const token = localStorage.getItem('coreSDK_token');
    if (token) {
      // Verify token by getting user profile
      sdk.auth.getMe()
        .then(userData => {
          setUser(userData);
          setIsAuthenticated(true);
        })
        .catch(() => {
          // Token invalid, clear it
          localStorage.removeItem('coreSDK_token');
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, [sdk]);

  const login = useCallback(async (credentials) => {
    try {
      setError(null);
      setIsLoading(true);
      const response = await coreSDK.login(credentials);
      setUser(response.user);
      setIsAuthenticated(true);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [sdk]);

  const register = useCallback(async (data) => {
    try {
      setError(null);
      setIsLoading(true);
      const user = await coreSDK.register(data);
      return user;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [sdk]);

  const logout = useCallback(async () => {
    try {
      await coreSDK.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
    }
  }, [sdk]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoading,
      error,
      login,
      register,
      logout,
      clearError
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

### 2. Create SDK Context

Create `src/context/SDKContext.js`:

```jsx
import React, { createContext, useContext, useEffect, useState } from 'react';

// SDK loaded via <script> tag in index.html
const coreSDK = window.coreSDK?.coreSDK || window.coreSDK;

const SDKContext = createContext(null);

export const SDKProvider = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initSDK = async () => {
      try {
        setLoading(true);
        await coreSDK.init({
          app: 'ai-games-platform',
          version: '1.0.0',
          baseUrl: process.env.REACT_APP_BACKEND_URL || 'https://configs.artintgames.com',
          authUrl: process.env.REACT_APP_BACKEND_URL_AUTH || ' https://auth.artintgames.com',
          skipAuth: true // Skip guest auth - we handle auth manually
        });

        setIsInitialized(true);
        console.log('SDK initialized successfully');
      } catch (err) {
        console.error('SDK initialization failed:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    initSDK();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Initializing SDK...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', color: 'red' }}>
        <h2>SDK Error</h2>
        <p>{error.message}</p>
      </div>
    );
  }

  return (
    <SDKContext.Provider value={{ sdk: coreSDK, isInitialized }}>
      {children}
    </SDKContext.Provider>
  );
};

export const useSDK = () => {
  const context = useContext(SDKContext);
  if (!context) {
    throw new Error('useSDK must be used within SDKProvider');
  }
  return context.sdk;
};
```

### 3. Create Authentication Components

#### LoginForm.js

```jsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export const LoginForm = ({ onSwitchToRegister }) => {
  const { login, error, isLoading, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login({ email, password });
    } catch (err) {
      // Error is handled by AuthContext
    }
  };

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      <h2>Login</h2>

      {error && (
        <div className="error-message">
          {error}
          <button type="button" onClick={clearError}>×</button>
        </div>
      )}

      <div className="form-group">
        <label htmlFor="email">Email</label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isLoading}
        />
      </div>

      <div className="form-group">
        <label htmlFor="password">Password</label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={isLoading}
        />
      </div>

      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Logging in...' : 'Login'}
      </button>

      <p className="switch-form">
        Don't have an account?{' '}
        <button type="button" onClick={onSwitchToRegister}>
          Register
        </button>
      </p>
    </form>
  );
};
```

#### RegisterForm.js

```jsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export const RegisterForm = ({ onSwitchToLogin, onSuccess }) => {
  const { register, error, isLoading, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    if (password !== confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }

    try {
      await register({ email, username, password });
      onSuccess?.();
    } catch (err) {
      // Error is handled by AuthContext
    }
  };

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      <h2>Register</h2>

      {(error || localError) && (
        <div className="error-message">
          {localError || error}
          <button type="button" onClick={() => { clearError(); setLocalError(''); }}>×</button>
        </div>
      )}

      <div className="form-group">
        <label htmlFor="email">Email</label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isLoading}
        />
      </div>

      <div className="form-group">
        <label htmlFor="username">Username</label>
        <input
          type="text"
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          minLength={3}
          disabled={isLoading}
        />
      </div>

      <div className="form-group">
        <label htmlFor="password">Password</label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          disabled={isLoading}
        />
      </div>

      <div className="form-group">
        <label htmlFor="confirmPassword">Confirm Password</label>
        <input
          type="password"
          id="confirmPassword"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          disabled={isLoading}
        />
      </div>

      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Registering...' : 'Register'}
      </button>

      <p className="switch-form">
        Already have an account?{' '}
        <button type="button" onClick={onSwitchToLogin}>
          Login
        </button>
      </p>
    </form>
  );
};
```

#### ProtectedRoute.js

```jsx
import React from 'react';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = ({ children, fallback }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return fallback || <div>Please login to access this content</div>;
  }

  return children;
};
```

### 4. Wrap Your App

Update `src/index.js`:

```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { SDKProvider } from './context/SDKContext';
import { AuthProvider } from './context/AuthContext';
import './styles.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <SDKProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </SDKProvider>
  </React.StrictMode>
);
```

### 5. Main App Component

```jsx
import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { LoginForm } from './components/LoginForm';
import { RegisterForm } from './components/RegisterForm';
import { ConfigsDemo } from './components/ConfigsDemo';
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
  const { isAuthenticated, user, logout } = useAuth();
  const [showRegister, setShowRegister] = useState(false);

  if (!isAuthenticated) {
    return (
      <div className="auth-container">
        {showRegister ? (
          <RegisterForm
            onSwitchToLogin={() => setShowRegister(false)}
            onSuccess={() => setShowRegister(false)}
          />
        ) : (
          <LoginForm onSwitchToRegister={() => setShowRegister(true)} />
        )}
      </div>
    );
  }

  return (
    <div className="app">
      <header>
        <h1>AI Games Platform</h1>
        <div className="user-info">
          <span>Welcome, {user?.username}</span>
          <button onClick={logout}>Logout</button>
        </div>
      </header>

      <main>
        <ProtectedRoute>
          <ConfigsDemo />
        </ProtectedRoute>
      </main>
    </div>
  );
}

export default App;
```

## Using SDK Clients in Components

### ConfigsDemo.js

```jsx
import React, { useEffect, useState } from 'react';
import { useSDK } from '../context/SDKContext';

export const ConfigsDemo = () => {
  const sdk = useSDK();
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        setLoading(true);
        const result = await coreSDK.configs.init({
          v: '1.0.0',
          scopes: ['gameplay', 'ui'],
          segment: 'default'
        });
        setConfig(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, [sdk]);

  if (loading) return <div>Loading configuration...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Game Configuration</h2>
      <pre>{JSON.stringify(config, null, 2)}</pre>
    </div>
  );
};
```

## Custom Hooks

### useConfigs.js

```jsx
import { useState, useEffect } from 'react';
import { useSDK } from '../context/SDKContext';

export const useConfigs = (version, scopes, segment) => {
  const sdk = useSDK();
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        setLoading(true);
        const result = await coreSDK.configs.init({ v: version, scopes, segment });
        setConfig(result);
        setError(null);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, [sdk, version, scopes, segment]);

  return { config, loading, error };
};
```

### useAbTests.js

```jsx
import { useState, useEffect } from 'react';
import { useSDK } from '../context/SDKContext';

export const useAbTests = (activeOnly = true) => {
  const sdk = useSDK();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadTests = async () => {
      try {
        setLoading(true);
        const result = activeOnly
          ? await coreSDK.abTests.getActive()
          : await coreSDK.abTests.getAll();
        setTests(result.items || []);
        setError(null);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    loadTests();
  }, [sdk, activeOnly]);

  return { tests, loading, error };
};
```

## CSS Styles

Add to `src/styles.css`:

```css
.auth-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: #f5f5f5;
}

.auth-form {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
}

.auth-form h2 {
  margin-bottom: 1.5rem;
  text-align: center;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.form-group input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.auth-form button[type="submit"] {
  width: 100%;
  padding: 0.75rem;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
}

.auth-form button[type="submit"]:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.error-message {
  background: #fee;
  color: #c00;
  padding: 0.75rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.switch-form {
  text-align: center;
  margin-top: 1rem;
}

.switch-form button {
  background: none;
  border: none;
  color: #007bff;
  cursor: pointer;
  text-decoration: underline;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}
```

## Environment Configuration

Create `.env` file:

```env
REACT_APP_BACKEND_URL=https://configs.artintgames.com
REACT_APP_BACKEND_URL_AUTH= https://auth.artintgames.com
```

## TypeScript Support

For TypeScript projects, create `src/context/SDKContext.tsx`:

```typescript
import React, { createContext, useContext, useEffect, useState } from 'react';
import { CoreSDK, coreSDK } from 'game-sdk';

interface SDKContextType {
  sdk: CoreSDK;
  isInitialized: boolean;
}

const SDKContext = createContext<SDKContextType | null>(null);

export const SDKProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const initSDK = async () => {
      try {
        await coreSDK.init({
          app: 'ai-games-platform',
          version: '1.0.0',
          baseUrl: process.env.REACT_APP_BACKEND_URL || 'https://configs.artintgames.com',
          authUrl: process.env.REACT_APP_BACKEND_URL_AUTH || ' https://auth.artintgames.com',
          skipAuth: true
        });
        setIsInitialized(true);
      } catch (err) {
        setError(err as Error);
      }
    };

    initSDK();
  }, []);

  if (error) {
    return <div>SDK Error: {error.message}</div>;
  }

  if (!isInitialized) {
    return <div>Initializing SDK...</div>;
  }

  return (
    <SDKContext.Provider value={{ sdk: coreSDK, isInitialized }}>
      {children}
    </SDKContext.Provider>
  );
};

export const useSDK = (): CoreSDK => {
  const context = useContext(SDKContext);
  if (!context) {
    throw new Error('useSDK must be used within SDKProvider');
  }
  return context.sdk;
};
```

## Complete Working Example

See the implementation in:
- `game-core-sdk` - SDK source
- `game-core-sdk-frontend` - Frontend application
- `ai-games-platform` - Backend services

---

**Last Updated**: December 2025
**Version**: 1.0.1
