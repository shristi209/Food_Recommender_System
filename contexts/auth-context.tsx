'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User, UserRole } from '@/types/auth';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  logout: () => void;
  userId: string | null;
  userRole: UserRole | null;
  userName: string | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  logout: () => {},
  userId: null,
  userRole: null,
  userName: null,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  const userId = user?.id || null;
  const userRole = user?.role || null;
  const userName = user?.name || null;

  useEffect(() => {
    // Check for logged_in cookie
    const isLoggedIn = Cookies.get('logged_in') === 'true';
    console.log("Is logged in:", isLoggedIn);
    
    if (isLoggedIn) {
      // Fetch user data from the /api/auth/me endpoint
      fetch('/api/auth/me', {
        credentials: 'include' // Important: this ensures cookies are sent
      })
        .then(res => res.json())
        .then(data => {
          if (data.authenticated && data.user) {
            console.log("User data:", data.user);
            setUser(data.user);
            setIsAuthenticated(true);
          } else {
            console.log("Not authenticated:", data.message);
            setUser(null);
            setIsAuthenticated(false);
            Cookies.remove('logged_in');
          }
        })
        .catch(error => {
          console.error('Failed to fetch user data:', error);
          setUser(null);
          setIsAuthenticated(false);
          Cookies.remove('logged_in');
        });
    } else {
      console.log("Not logged in");
      setUser(null);
      setIsAuthenticated(false);
    }
  }, []);

  const logout = async () => {
    try {
      // console.log('logging out');
      
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
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      logout,
      userId,
      userRole,
      userName
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useIsRole(role: UserRole): boolean {
  const { userRole } = useAuth();
  return userRole === role;
}

export function useUserId(): string | null {
  const { userId } = useAuth();
  return userId;
}

export function useUserRole(): UserRole | null {
  const { userRole } = useAuth();
  return userRole;
}

export function useUserName(): string | null {
  const { userName } = useAuth();
  return userName;
}

export const useAuth = () => useContext(AuthContext);
