import React, { createContext, useContext, useState, useEffect } from 'react';
import cognitoAuth from '../services/cognitoAuth';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize auth state
    const initAuth = () => {
      const currentUser = cognitoAuth.getCurrentUser();
      const isAuth = cognitoAuth.isUserAuthenticated();
      
      setUser(currentUser);
      setIsAuthenticated(isAuth);
      setLoading(false);
    };

    // Handle callback if we're on the callback route
    const handleCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      const error = urlParams.get('error');

      if (error) {
        console.error('Auth error:', error);
        setLoading(false);
        return;
      }

      if (code && state) {
        console.log('Handling callback with code:', code);
        const result = await cognitoAuth.handleCallback(code, state);
        
        if (result.success) {
          setUser(result.userInfo);
          setIsAuthenticated(true);
          
          // Redirect to home page, removing callback params
          window.history.replaceState({}, document.title, '/');
        } else {
          console.error('Callback failed:', result.error);
        }
      }
      
      setLoading(false);
    };

    // Check if this is a callback
    if (window.location.pathname === '/callback' || window.location.search.includes('code=')) {
      handleCallback();
    } else {
      initAuth();
    }
  }, []);

  const login = () => {
    cognitoAuth.login();
  };

  const logout = () => {
    cognitoAuth.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
    getAccessToken: () => cognitoAuth.getAccessToken()
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};