'use client'

import { useState, useEffect, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import CreateGymModal from "../components/CreateGymModal";
import EditGymModal from "../components/EditGymModal";
import TurnstileManagement from "../components/TurnstileManagement";

interface Gym {
  id: string;
  title: string;
  description: string;
  phone: string;
  latitude: number;
  longitude: number;
}

export default function DashboardPage() {
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateGymModalOpen, setIsCreateGymModalOpen] = useState(false);
  const [isEditGymModalOpen, setIsEditGymModalOpen] = useState(false);
  const [selectedGym, setSelectedGym] = useState<Gym | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMorePages, setHasMorePages] = useState(true);
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push('/');
    }
  }, [status, router]);

  const fetchUserGyms = useCallback(async () => {
    if (status !== "authenticated" || !session?.accessToken) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/gyms?page=${currentPage}`, {
        headers: {
          'Authorization': `Bearer ${session.accessToken}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch gyms');
      }

      const data = await response.json();
      const newGyms = data.gyms;
      
      // Substituir os ginásios existentes em vez de adicionar a eles
      setGyms(newGyms);
      setHasMorePages(newGyms.length === 20); // Assumindo 20 itens por página
    } catch (error) {
      console.error('Error fetching gyms:', error);
      setError('Failed to fetch your gyms. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [session, currentPage, status]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchUserGyms();
    }
  }, [status, fetchUserGyms]);

  const handleLogout = async () => {
    try {
      await signOut({ redirect: false });
      router.push('/');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const handleEditGym = (gym: Gym) => {
    setSelectedGym(gym);
    setIsEditGymModalOpen(true);
  };

  const handleLoadMore = () => {
    setCurrentPage(prevPage => prevPage + 1);
  };

  const handleDeleteGym = async (gymId: string) => {
    if (window.confirm('Are you sure you want to delete this gym? This action cannot be undone.')) {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/gyms/${gymId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${session?.accessToken}`
          }
        });

        if (response.status === 204) {
          // Sucesso - a academia foi deletada
          setGyms(gyms.filter(gym => gym.id !== gymId));
          setError(null);
        } else {
          // Trata outros códigos de status
          const errorData = await response.json();
          throw new Error(errorData.message || `Failed to delete gym. Status: ${response.status}`);
        }
      } catch (error) {
        console.error('Error deleting gym:', error);
        if (error instanceof Error) {
          setError(`Failed to delete gym: ${error.message}`);
        } else {
          setError('An unexpected error occurred while deleting the gym. Please try again.');
        }
      }
    }
  };

  if (status === "loading") {
    return <p className="text-black">Loading...</p>;
  }

  if (status === "unauthenticated") {
    return null; // O useEffect irá redirecionar, então não precisamos renderizar nada aqui
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold mb-4 text-black">Dashboard</h1>
      <p className="text-black">Welcome, {session?.user?.email}!</p>
      
      <button
        onClick={() => setIsCreateGymModalOpen(true)}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Create New Gym
      </button>
      
      <button
        onClick={handleLogout}
        className="mt-4 ml-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
      >
        Logout
      </button>

      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4 text-black">Your Gyms</h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        {loading ? (
          <p className="text-black">Loading gyms...</p>
        ) : gyms.length > 0 ? (
          <>
            <ul className="space-y-4">
              {gyms.map((gym) => (
                <li key={gym.id} className="bg-white p-4 rounded shadow">
                  <h3 className="text-xl font-semibold text-black">{gym.title}</h3>
                  <p className="text-gray-600">{gym.description}</p>
                  <p className="text-gray-600">Phone: {gym.phone}</p>
                  <p className="text-gray-600">Latitude: {gym.latitude}</p>
                  <p className="text-gray-600">Longitude: {gym.longitude}</p>
                  <div className="mt-2">
                    <button
                      onClick={() => handleEditGym(gym)}
                      className="mr-2 px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteGym(gym.id)}
                      className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            {hasMorePages && (
              <button
                onClick={handleLoadMore}
                className="mt-4 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Load More
              </button>
            )}
          </>
        ) : (
          <p className="text-black">You dont have any gyms yet. Click Create New Gym to add one!</p>
        )}
      </div>

      <TurnstileManagement />

      <CreateGymModal
        isOpen={isCreateGymModalOpen}
        onClose={() => setIsCreateGymModalOpen(false)}
        onGymCreated={() => {
          setCurrentPage(1);
          setGyms([]);
          fetchUserGyms();
        }}
      />

      {selectedGym && (
        <EditGymModal
          isOpen={isEditGymModalOpen}
          onClose={() => setIsEditGymModalOpen(false)}
          onGymUpdated={() => {
            setCurrentPage(1);
            setGyms([]);
            fetchUserGyms();
          }}
          gym={selectedGym}
        />
      )}
    </div>
  );
}
