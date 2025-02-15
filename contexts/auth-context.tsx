'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@/types/auth';
import jwt from 'jsonwebtoken';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check for auth token in cookies
    const cookies = document.cookie.split(';');
    const authToken = cookies
      .find(cookie => cookie.trim().startsWith('auth_token='))
      ?.split('=')[1];

    if (authToken) {
      try {
        // Decode token to get user info
        const decoded = jwt.decode(authToken) as User;
        setUser(decoded);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Failed to decode token:', error);
        setUser(null);
        setIsAuthenticated(false);
      }
    }
  }, []);

  const logout = async () => {
    try {
      console.log('logging out');
      
      Cookies.remove('logged_in');
      
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      
      setUser(null);
      setIsAuthenticated(false);
      
      router.push('/');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
