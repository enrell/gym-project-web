'use client'

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function LoginForm({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      console.log("Attempting to sign in with:", email);
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      console.log("Sign in result:", result);

      if (result?.error) {
        console.error("Login error:", result.error);
        setError(result.error);
      } else if (result?.ok) {
        console.log("Login successful");
        onClose();
        router.push('/dashboard');
      } else {
        console.error("Unexpected login result:", result);
        setError('An unexpected error occurred');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-2xl font-bold mb-4 text-black">Log In</h2>
      {error && <p className="text-red-500">{error}</p>}
      <div>
        <label htmlFor="email" className="block text-black">Email</label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-3 py-2 border rounded text-black"
          disabled={isLoading}
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-black">Password</label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full px-3 py-2 border rounded text-black"
          disabled={isLoading}
        />
      </div>
      <button 
        type="submit" 
        className="w-full px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600 disabled:bg-blue-300"
        disabled={isLoading}
      >
        {isLoading ? 'Logging in...' : 'Log In'}
      </button>
    </form>
  );
}