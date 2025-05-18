import { createContext, useContext, useState, ReactNode } from 'react';

type UserType = 'teacher' | 'student' | null;

interface User {
  user_id: number;
  name: string;
  role: UserType;
}

interface AuthContextType {
  userType: UserType;
  currentUser: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [userType, setUserType] = useState<UserType>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const login = (username: string, password: string): boolean => {
    if (username === 'teacher' && password === 'teacher') {
      setUserType('teacher');
      setCurrentUser({
        user_id: 1,
        name: 'Преподаватель',
        role: 'teacher'
      });
      return true;
    }
    if (username === 'student' && password === 'student') {
      setUserType('student');
      setCurrentUser({
        user_id: 2,
        name: 'Студент',
        role: 'student'
      });
      return true;
    }
    return false;
  };

  const logout = () => {
    setUserType(null);
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        userType,
        currentUser,
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