import { createContext, useContext, useState, ReactNode } from 'react';

type UserType = 'teacher' | 'student' | null;

interface AuthContextType {
  userType: UserType;
  isAuthenticated: boolean;
  login: (username: string, password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [userType, setUserType] = useState<UserType>(null);

  const login = (username: string, password: string): boolean => {
    if (username === 'teacher' && password === 'teacher') {
      setUserType('teacher');
      return true;
    }
    if (username === 'student' && password === 'student') {
      setUserType('student');
      return true;
    }
    return false;
  };

  const logout = () => {
    setUserType(null);
  };

  return (
    <AuthContext.Provider
      value={{
        userType,
        isAuthenticated: userType !== null,
        login,
        logout,
      }}
    >
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