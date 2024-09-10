'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterForm({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          password,
          role: 'GYM_OWNER'
        }),
      });

      const responseText = await response.text();
      console.log('Raw response:', responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Error parsing JSON:', parseError);
        throw new Error('Invalid response from server');
      }

      if (!response.ok) {
        throw new Error(data.message || `Registration failed with status ${response.status}`);
      }

      console.log('Registration response:', data);
      setSuccess('Sua conta foi criada com sucesso, entre para começar');
      setTimeout(() => {
        onClose();
        router.push('/');
      }, 3000);
    } catch (error) {
      console.error('Registration error:', error);
      setError(`Registration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-2xl font-bold mb-4 text-black">Register</h2>
      {error && <p className="text-red-500">{error}</p>}
      {success && <p className="text-green-500">{success}</p>}
      <div>
        <label htmlFor="name" className="block text-black">Name</label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full px-3 py-2 border rounded text-black"
        />
      </div>
      <div>
        <label htmlFor="email" className="block text-black">Email</label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-3 py-2 border rounded text-black"
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
        />
      </div>
      <button 
        type="submit" 
        className="w-full px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600"
      >
        Register
      </button>
    </form>
  );
}