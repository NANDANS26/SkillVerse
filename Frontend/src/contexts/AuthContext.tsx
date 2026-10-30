// Frontend/src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserRole, normalizeRole } from '../types/roles';
import { api, ApiResponse, ApiError } from '../services/api';
import { DEMO_USERS } from '../data/mockFixtures';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  title?: string;
  organization?: string;
  isDemo?: boolean;
}

interface LoginResult {
  success: boolean;
  user?: User;
  message?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isDemoMode: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  signup: (name: string, email: string, password: string, role: UserRole) => Promise<LoginResult>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  startDemoMode: (role?: UserRole) => void;
  switchDemoRole: (role: UserRole) => void;
  exitDemoMode: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_ACTIVE_KEY = 'skillverse_demo_active';
const DEMO_ROLE_KEY = 'skillverse_demo_role';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(DEMO_ACTIVE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const loadDemoUser = useCallback((targetRole: UserRole = 'student'): User => {
    const demoProfile = DEMO_USERS[targetRole] || DEMO_USERS.student;
    return {
      id: demoProfile.id,
      name: demoProfile.name,
      email: demoProfile.email,
      role: demoProfile.role,
      title: demoProfile.title,
      organization: demoProfile.organization,
      isDemo: true
    };
  }, []);

  const refreshUser = useCallback(async () => {
    // Check if user previously engaged demo mode in this browser session
    try {
      const demoActive = sessionStorage.getItem(DEMO_ACTIVE_KEY) === 'true';
      if (demoActive) {
        const storedRole = (sessionStorage.getItem(DEMO_ROLE_KEY) as UserRole) || 'student';
        setUser(loadDemoUser(storedRole));
        setIsDemoMode(true);
        setIsLoading(false);
        return;
      }
    } catch {
      // sessionStorage might not be accessible
    }

    try {
      const data = await api.get<ApiResponse>('/auth/me');
      if (data && data.success && data.user) {
        const verifiedUser: User = {
          id: String(data.user.id),
          name: data.user.name,
          email: data.user.email,
          role: normalizeRole(data.user.role),
          isDemo: false
        };
        setUser(verifiedUser);
        setIsDemoMode(false);
      } else {
        setUser(null);
      }
    } catch {
      // If /auth/me fails (no session/cookie), clear user
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [loadDemoUser]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const startDemoMode = (role: UserRole = 'student') => {
    try {
      sessionStorage.setItem(DEMO_ACTIVE_KEY, 'true');
      sessionStorage.setItem(DEMO_ROLE_KEY, role);
    } catch {
      // ignore
    }
    setIsDemoMode(true);
    setUser(loadDemoUser(role));
  };

  const switchDemoRole = (role: UserRole) => {
    try {
      sessionStorage.setItem(DEMO_ACTIVE_KEY, 'true');
      sessionStorage.setItem(DEMO_ROLE_KEY, role);
    } catch {
      // ignore
    }
    setIsDemoMode(true);
    setUser(loadDemoUser(role));
  };

  const exitDemoMode = () => {
    try {
      sessionStorage.removeItem(DEMO_ACTIVE_KEY);
      sessionStorage.removeItem(DEMO_ROLE_KEY);
    } catch {
      // ignore
    }
    setIsDemoMode(false);
    setUser(null);
  };

  const login = async (email: string, password: string): Promise<LoginResult> => {
    try {
      setIsLoading(true);
      // Clean demo storage on actual login attempt
      try {
        sessionStorage.removeItem(DEMO_ACTIVE_KEY);
        sessionStorage.removeItem(DEMO_ROLE_KEY);
      } catch {
        // ignore
      }
      setIsDemoMode(false);

      const data = await api.post<ApiResponse>('/auth/login', { email, password });

      if (data && data.success && data.user) {
        const loggedInUser: User = {
          id: String(data.user.id),
          name: data.user.name,
          email: data.user.email,
          role: normalizeRole(data.user.role),
          isDemo: false
        };

        setUser(loggedInUser);
        setIsLoading(false);
        return { success: true, user: loggedInUser };
      }

      setIsLoading(false);
      return { success: false, message: data.message || 'Login failed' };
    } catch (err: any) {
      setIsLoading(false);
      const message = err instanceof ApiError ? err.message : 'Invalid email or password';
      return { success: false, message };
    }
  };

  const signup = async (
    name: string,
    email: string,
    password: string,
    role: UserRole
  ): Promise<LoginResult> => {
    try {
      setIsLoading(true);
      try {
        sessionStorage.removeItem(DEMO_ACTIVE_KEY);
        sessionStorage.removeItem(DEMO_ROLE_KEY);
      } catch {
        // ignore
      }
      setIsDemoMode(false);

      const data = await api.post<ApiResponse>('/auth/signup', {
        name,
        email,
        password,
        role: normalizeRole(role)
      });

      if (data && data.success && data.user) {
        const newUser: User = {
          id: String(data.user.id),
          name: data.user.name,
          email: data.user.email,
          role: normalizeRole(data.user.role),
          isDemo: false
        };

        setUser(newUser);
        setIsLoading(false);
        return { success: true, user: newUser };
      }

      setIsLoading(false);
      return { success: false, message: data.message || 'Signup failed' };
    } catch (err: any) {
      setIsLoading(false);
      const message = err instanceof ApiError ? err.message : 'Signup failed. Please try again.';
      return { success: false, message };
    }
  };

  const logout = async (): Promise<void> => {
    if (isDemoMode) {
      exitDemoMode();
      return;
    }
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore network errors on logout
    } finally {
      setUser(null);
      setIsDemoMode(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isDemoMode,
        login,
        signup,
        logout,
        refreshUser,
        startDemoMode,
        switchDemoRole,
        exitDemoMode
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
