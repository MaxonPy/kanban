import { useAuth } from './lib/auth/AuthContext';
import { LoginForm } from './components/LoginForm';
import { Desktop } from './screens/Desktop/Desktop';

export function App() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  return <Desktop />;
} 