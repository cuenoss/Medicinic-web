import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../services/api';

interface User {
  id: number;
  fullName: string;
  email: string;
  is_admin?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
    confirmPassword: string;
  }) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check for existing token on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('access_token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      try {
        // Decode JWT and check expiry without a network call
        const payload = JSON.parse(atob(storedToken.split('.')[1]));
        const isExpired = payload.exp * 1000 < Date.now();

        if (isExpired) {
          // Token expired — clear and redirect to login
          localStorage.removeItem('access_token');
          localStorage.removeItem('user');
        } else {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          setToken(storedToken);
        }
      } catch (error) {
        // Invalid token format — clear it
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
      }
    }

    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await api.login(email, password) as {
        access_token: string;
        token_type: string;
        doctor: User;
      };
      
      // Store token and user data
      localStorage.setItem('access_token', response.access_token);
      localStorage.setItem('user', JSON.stringify(response.doctor));
      
      setToken(response.access_token);
      setUser(response.doctor);
    } catch (error: any) {
      setError(error.message || 'Login failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
    confirmPassword: string;
  }) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await api.register(userData);
      // Registration successful, but user needs to login
      setError(null);
    } catch (error: any) {
      setError(error.message || 'Registration failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    setUser(null);
    setToken(null);
    setError(null);
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    register,
    logout,
    isLoading,
    error,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
