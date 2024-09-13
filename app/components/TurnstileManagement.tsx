'use client'

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Modal from './Modal';
import QRCode from 'react-qr-code';
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Spinner } from "@/app/components/ui/spinner"

interface Turnstile {
  id: string;
  gymId: string;
  qrCode: string;
  createdAt: string;
}

interface TurnstileManagementProps {
  gymId: string;
}

export default function TurnstileManagement({ gymId }: TurnstileManagementProps) {
  const { data: session } = useSession();
  const [turnstiles, setTurnstiles] = useState<Turnstile[]>([]);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedTurnstile, setSelectedTurnstile] = useState<Turnstile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState<'recent' | 'oldest'>('recent');
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (session?.accessToken) {
      fetchTurnstiles();
    }
  }, [session, gymId, sortOrder]);

  const fetchTurnstiles = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/gyms/${gymId}/turnstiles?sort=${sortOrder}`, {
        headers: {
          'Authorization': `Bearer ${session?.accessToken}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch turnstiles');
      }
      const data = await response.json();
      setTurnstiles(data.turnstiles);
    } catch (error) {
      console.error('Error fetching turnstiles:', error);
      setError('Failed to fetch turnstiles. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const addTurnstile = async () => {
    setIsAdding(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/gyms/${gymId}/turnstiles`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to add turnstile. Status: ${response.status}`);
      }

      await fetchTurnstiles();
      setIsAddModalOpen(false);
      setError(null);
    } catch (error) {
      console.error('Error adding turnstile:', error);
      if (error instanceof Error) {
        setError(`Failed to add turnstile: ${error.message}`);
      } else {
        setError('An unexpected error occurred while adding the turnstile. Please try again.');
      }
    } finally {
      setIsAdding(false);
    }
  };

  const deleteTurnstile = async (turnstileId: string) => {
    if (!confirm('Are you sure you want to delete this turnstile?')) {
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/turnstiles/${turnstileId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session?.accessToken}`,
          'Content-Type': 'application/json'
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete turnstile');
      }

      // Se a exclusão for bem-sucedida, atualize a lista de catracas
      setTurnstiles(turnstiles.filter(t => t.id !== turnstileId));
      setError(null);
    } catch (error) {
      console.error('Error deleting turnstile:', error);
      if (error instanceof Error) {
        setError(`Failed to delete turnstile: ${error.message}`);
      } else {
        setError('An unexpected error occurred while deleting the turnstile. Please try again.');
      }
    }
  };

  const showQRCode = (turnstile: Turnstile) => {
    setSelectedTurnstile(turnstile);
    setIsQRModalOpen(true);
  };

  const downloadQRCode = () => {
    if (selectedTurnstile) {
      const svg = document.getElementById("qr-code");
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        const pngFile = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.download = `turnstile-${selectedTurnstile.id}.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      };
      img.src = "data:image/svg+xml;base64," + btoa(svgData);
    }
  };

  const filteredTurnstiles = turnstiles.filter(turnstile => 
    turnstile.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedTurnstiles = [...filteredTurnstiles].sort((a, b) => {
    if (sortOrder === 'recent') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
  });

  return (
    <Card className="mt-8">
      <CardHeader className="flex flex-row items-center justify-between pb-6">
        <CardTitle className="text-2xl font-bold">Gerenciamento de Catracas</CardTitle>
        <Button onClick={() => setIsAddModalOpen(true)} size="sm">
          Adicionar Nova Catraca
        </Button>
      </CardHeader>
      <CardContent className="pt-2 pb-6">
        {error && <p className="text-destructive mb-6">{error}</p>}
        
        <div className="flex justify-between mb-6">
          <Input
            placeholder="Pesquisar catracas..."
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

        <div className="overflow-x-auto">
          <ScrollArea className="h-[50vh] w-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-1/3 py-4">ID</TableHead>
                  <TableHead className="w-1/3 hidden sm:table-cell py-4">Código QR</TableHead>
                  <TableHead className="w-1/3 py-4">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center">
                      <Spinner className="h-8 w-8" />
                    </TableCell>
                  </TableRow>
                ) : sortedTurnstiles.map((turnstile, index) => (
                  <TableRow key={turnstile.id} className={index % 2 === 0 ? 'bg-muted/50' : ''}>
                    <TableCell className="font-medium py-4">{turnstile.id}</TableCell>
                    <TableCell className="hidden sm:table-cell py-4">{turnstile.qrCode}</TableCell>
                    <TableCell className="py-4">
                      <div className="flex flex-col space-y-2 sm:flex-row sm:space-x-4 sm:space-y-0">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => showQRCode(turnstile)}
                                className="w-full sm:w-auto"
                              >
                                Ver QR
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Visualizar e baixar código QR</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              className="w-full sm:w-auto"
                            >
                              Excluir
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                              <DialogTitle>Confirmar Exclusão</DialogTitle>
                            </DialogHeader>
                            <p>Tem certeza que deseja excluir esta catraca? Esta ação não pode ser desfeita.</p>
                            <div className="flex justify-end space-x-2 mt-4">
                              <Button variant="outline" onClick={() => {}}>Cancelar</Button>
                              <Button variant="destructive" onClick={() => deleteTurnstile(turnstile.id)}>Excluir</Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>

        <Modal isOpen={isQRModalOpen} onClose={() => setIsQRModalOpen(false)}>
          {selectedTurnstile && (
            <div className="text-center p-4">
              <h3 className="text-lg font-bold mb-4">Código QR da Catraca</h3>
              <p className="mb-4">ID da Catraca: {selectedTurnstile.id}</p>
              <div className="flex justify-center mb-4">
                <QRCode id="qr-code" value={selectedTurnstile.qrCode} size={200} />
              </div>
              <p className="mb-4">Escaneie este código QR com o aplicativo da academia para fazer check-in.</p>
              <div className="flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-4">
                <Button
                  onClick={() => setIsQRModalOpen(false)}
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  Fechar
                </Button>
                <Button
                  onClick={downloadQRCode}
                  className="w-full sm:w-auto"
                >
                  Baixar Código QR
                </Button>
              </div>
            </div>
          )}
        </Modal>

        <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)}>
          <div className="text-center p-4">
            <h3 className="text-lg font-bold mb-4">Adicionar Nova Catraca</h3>
            <div className="flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-4">
              <Button
                onClick={() => setIsAddModalOpen(false)}
                variant="outline"
                className="w-full sm:w-auto"
                disabled={isAdding}
              >
                Cancelar
              </Button>
              <Button
                onClick={addTurnstile}
                className="w-full sm:w-auto"
                disabled={isAdding}
              >
                {isAdding ? <Spinner className="mr-2" /> : null}
                {isAdding ? "Adicionando..." : "Adicionar Catraca"}
              </Button>
            </div>
          </div>
        </Modal>
      </CardContent>
    </Card>
  );
}