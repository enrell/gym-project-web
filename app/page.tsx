'use client'

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Modal from './components/Modal';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function Home() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const { data: session, status } = useSession();
  console.log("Home session:", session, "Status:", status);
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.push('/dashboard');
    }
  }, [status, router]);

  const handleDashboardClick = () => {
    router.push('/dashboard');
  };

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Welcome</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {session ? (
              <>
                <Button
                  onClick={handleDashboardClick}
                  className="w-full"
                  variant="default"
                >
                  Go to Dashboard
                </Button>
                <Button
                  onClick={handleLogout}
                  className="w-full"
                  variant="destructive"
                >
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={() => setIsLoginOpen(true)}
                  className="w-full"
                  variant="default"
                >
                  Login
                </Button>
                <Button
                  onClick={() => setIsRegisterOpen(true)}
                  className="w-full"
                  variant="outline"
                >
                  Register
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Modal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)}>
        <LoginForm onClose={() => setIsLoginOpen(false)} />
      </Modal>

      <Modal isOpen={isRegisterOpen} onClose={() => setIsRegisterOpen(false)}>
        <RegisterForm onClose={() => setIsRegisterOpen(false)} />
      </Modal>
    </div>
  );
}
