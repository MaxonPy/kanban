import { useState } from 'react';
import { useAuth } from '../lib/auth/AuthContext';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';

export function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const success = login(username, password);
    if (!success) setError('Неверный логин или пароль');
  };

  return (
    <div className="min-h-screen bg-[#f5f5dc] flex items-center justify-center">
      <div className="bg-white p-8 rounded-xl shadow border border-black w-[400px]">
        <h1 className="text-3xl font-extrabold mb-4 text-center">Вход в систему</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="text"
            placeholder="Логин"
            value={username}
            onChange={e => setUsername(e.target.value)}
            className="w-full border-black"
          />
          <Input
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full border-black"
          />
          {error && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}
          <Button
            type="submit"
            className="w-full bg-black text-white hover:bg-gray-800"
          >
            Войти
          </Button>
        </form>
      </div>
    </div>
  );
} 