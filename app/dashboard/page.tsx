'use client'

import { useState, useEffect, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Header from "../components/Header";
import CreateGymModal from "../components/CreateGymModal";
import EditGymModal from "../components/EditGymModal";
import TurnstileManagement from "../components/TurnstileManagement";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlusCircle, Edit, Trash2, ChevronDown, ChevronUp, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Spinner } from "@/app/components/ui/spinner"
import dynamic from 'next/dynamic'

const MapView = dynamic(() => import('../components/MapView'), { ssr: false })

interface Gym {
  id: string;
  title: string;
  description: string;
  phone: string;
  latitude: number;
  longitude: number;
  createdAt: string;
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
  const [turnstileKey, setTurnstileKey] = useState(0);
  const { data: session, status } = useSession();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedGymId, setExpandedGymId] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'recent' | 'oldest'>('recent');

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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/gyms?page=${currentPage}&sort=${sortOrder}`, {
        headers: {
          'Authorization': `Bearer ${session.accessToken}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch gyms');
      }

      const data = await response.json();
      const newGyms = data.gyms.map(gym => ({
        ...gym,
        latitude: Number(gym.latitude),
        longitude: Number(gym.longitude)
      }));
      
      // Substituir os ginásios existentes em vez de adicionar a eles
      setGyms(newGyms);
      setHasMorePages(newGyms.length === 20); // Assumindo 20 itens por página
    } catch (error) {
      console.error('Error fetching gyms:', error);
      setError('Failed to fetch your gyms. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [session, currentPage, status, sortOrder]);

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

  const handleGymCreated = useCallback(() => {
    setCurrentPage(1);
    setGyms([]);
    fetchUserGyms();
    setTurnstileKey(prevKey => prevKey + 1);
  }, [fetchUserGyms]);

  const toggleGymExpansion = (gymId: string) => {
    setExpandedGymId(expandedGymId === gymId ? null : gymId);
  };

  const filteredGyms = gyms.filter(gym => 
    gym.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    gym.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedGyms = [...filteredGyms].sort((a, b) => {
    if (sortOrder === 'recent') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
  });

  if (status === "loading") {
    return <p className="text-black">Carregando...</p>;
  }

  if (status === "unauthenticated") {
    return null; // O useEffect irá redirecionar, então não precisamos renderizar nada aqui
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-x border-gray-200 min-h-screen">
          <Header user={session?.user} />
          <main className="py-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-2xl font-bold">Suas Academias</CardTitle>
                <Button onClick={() => setIsCreateGymModalOpen(true)} className="flex items-center">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Criar Nova Academia
                </Button>
              </CardHeader>
              <CardContent>
                {error && <p className="text-destructive mb-4">{error}</p>}
                <div className="flex justify-between mb-4">
                  <Input
                    placeholder="Pesquisar academias..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-1/2"
                  />
                  <Select value={sortOrder} onValueChange={(value: 'recent' | 'oldest') => setSortOrder(value)}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Ordenar por" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recent">Mais Recentes</SelectItem>
                      <SelectItem value="oldest">Mais Antigas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {loading ? (
                  <div className="flex justify-center items-center h-64">
                    <Spinner className="h-8 w-8" />
                  </div>
                ) : sortedGyms.length > 0 ? (
                  <div className="space-y-4">
                    {sortedGyms.map((gym) => (
                      <Card 
                        key={gym.id} 
                        className="mb-4 cursor-pointer transition-all duration-200 hover:shadow-md"
                        onClick={() => toggleGymExpansion(gym.id)}
                      >
                        <CardHeader>
                          <CardTitle className="flex justify-between items-center">
                            <span>{gym.title}</span>
                            <div className="flex items-center space-x-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditGym(gym);
                                }}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Editar
                              </Button>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button 
                                    variant="destructive" 
                                    size="sm"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Excluir
                                  </Button>
                                </DialogTrigger>
                                <DialogContent onClick={(e) => e.stopPropagation()}>
                                  <DialogHeader>
                                    <DialogTitle>Tem certeza que deseja excluir esta academia?</DialogTitle>
                                  </DialogHeader>
                                  <p>Esta ação não pode ser desfeita.</p>
                                  <div className="flex justify-end space-x-2">
                                    <Button variant="outline" onClick={() => {}}>Cancelar</Button>
                                    <Button variant="destructive" onClick={() => handleDeleteGym(gym.id)}>Excluir</Button>
                                  </div>
                                </DialogContent>
                              </Dialog>
                              {expandedGymId === gym.id ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </div>
                          </CardTitle>
                        </CardHeader>
                        {expandedGymId === gym.id && (
                          <CardContent onClick={(e) => e.stopPropagation()}>
                            <p className="text-sm text-muted-foreground mb-2">{gym.description}</p>
                            <p className="text-sm mb-2"><strong>Telefone:</strong> {gym.phone}</p>
                            <div className="mb-2">
                              <strong className="text-sm">Localização:</strong>
                              <div className="mt-2 h-[300px] rounded-md overflow-hidden">
                                <MapView latitude={gym.latitude} longitude={gym.longitude} />
                              </div>
                            </div>
                            <div className="mt-4">
                              <TurnstileManagement gymId={gym.id} />
                            </div>
                          </CardContent>
                        )}
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">Você ainda não tem nenhuma academia.</p>
                    <Button onClick={() => setIsCreateGymModalOpen(true)}>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Criar Sua Primeira Academia
                    </Button>
                  </div>
                )}
                {hasMorePages && (
                  <div className="flex justify-center mt-4">
                    <Button onClick={handleLoadMore} variant="outline">
                      Carregar Mais
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <CreateGymModal
              isOpen={isCreateGymModalOpen}
              onClose={() => setIsCreateGymModalOpen(false)}
              onGymCreated={handleGymCreated}
            />

            {selectedGym && (
              <EditGymModal
                isOpen={isEditGymModalOpen}
                onClose={() => setIsEditGymModalOpen(false)}
                onGymUpdated={handleGymCreated}
                gym={selectedGym}
              />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
