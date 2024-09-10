'use client'

import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Modal from './components/Modal';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';

export default function Home() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const { data: session, status } = useSession();
  console.log("Home session:", session, "Status:", status);
  const router = useRouter();

  const handleDashboardClick = () => {
    router.push('/dashboard');
  };

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <h1 className="text-4xl font-bold mb-8 text-black">Welcome</h1>
      <div className="space-x-4">
        {session ? (
          <>
            <button
              onClick={handleDashboardClick}
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
            >
              Go to Dashboard
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setIsLoginOpen(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Login
            </button>
            <button
              onClick={() => setIsRegisterOpen(true)}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Register
            </button>
          </>
        )}
      </div>

      <Modal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)}>
        <LoginForm onClose={() => setIsLoginOpen(false)} />
      </Modal>

      <Modal isOpen={isRegisterOpen} onClose={() => setIsRegisterOpen(false)}>
        <RegisterForm onClose={() => setIsRegisterOpen(false)} />
      </Modal>
    </div>
  );
}
