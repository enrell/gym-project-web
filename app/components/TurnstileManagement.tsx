'use client'

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Modal from './Modal';
import QRCode from 'react-qr-code';

interface Turnstile {
  id: string;
  gymId: string;
  qrCode: string;
}

interface Gym {
  id: string;
  title: string;
}

export default function TurnstileManagement() {
  const { data: session } = useSession();
  const [turnstiles, setTurnstiles] = useState<Turnstile[]>([]);
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedTurnstile, setSelectedTurnstile] = useState<Turnstile | null>(null);
  const [selectedGymId, setSelectedGymId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session?.accessToken) {
      fetchGyms();
    }
  }, [session]);

  useEffect(() => {
    if (selectedGymId) {
      fetchTurnstiles(selectedGymId);
    }
  }, [selectedGymId]);

  const fetchTurnstiles = async (gymId: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/gyms/${gymId}/turnstiles`, {
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
    }
  };

  const fetchGyms = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/gyms`, {
        headers: {
          'Authorization': `Bearer ${session?.accessToken}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch gyms');
      }
      const data = await response.json();
      setGyms(data.gyms);
      if (data.gyms.length > 0) {
        setSelectedGymId(data.gyms[0].id);
      }
    } catch (error) {
      console.error('Error fetching gyms:', error);
      setError('Failed to fetch gyms. Please try again.');
    }
  };

  const addTurnstile = async () => {
    if (!selectedGymId) {
      setError('Please select a gym');
      return;
    }
    try {
      console.log('Adding turnstile for gym:', selectedGymId);
      console.log('Access token:', session?.accessToken);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/gyms/${selectedGymId}/turnstiles`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({}), // Enviando um objeto JSON vazio
      });

      const responseData = await response.text();
      console.log('Raw response:', responseData);

      let data;
      try {
        data = JSON.parse(responseData);
      } catch (parseError) {
        console.error('Error parsing JSON:', parseError);
        throw new Error(`Invalid response from server: ${responseData}`);
      }

      if (!response.ok) {
        throw new Error(data.message || `Failed to add turnstile. Status: ${response.status}`);
      }

      console.log('Turnstile added successfully:', data);
      fetchTurnstiles(selectedGymId);
      setIsAddModalOpen(false);
      setError(null);
    } catch (error) {
      console.error('Error adding turnstile:', error);
      if (error instanceof Error) {
        setError(`Failed to add turnstile: ${error.message}`);
      } else {
        setError('An unexpected error occurred while adding the turnstile. Please try again.');
      }
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

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-4 text-black">Turnstile Management</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      
      <select
        value={selectedGymId}
        onChange={(e) => setSelectedGymId(e.target.value)}
        className="w-full px-3 py-2 border rounded text-black mb-4"
      >
        <option value="">Select a gym</option>
        {gyms.map((gym) => (
          <option key={gym.id} value={gym.id}>
            {gym.title}
          </option>
        ))}
      </select>

      <table className="min-w-full bg-white">
        <thead>
          <tr>
            <th className="px-6 py-3 border-b-2 border-gray-300 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
              ID
            </th>
            <th className="px-6 py-3 border-b-2 border-gray-300 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
              QR Code
            </th>
            <th className="px-6 py-3 border-b-2 border-gray-300 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {turnstiles.map((turnstile) => (
            <tr key={turnstile.id}>
              <td className="px-6 py-4 whitespace-no-wrap border-b border-gray-500">
                {turnstile.id}
              </td>
              <td className="px-6 py-4 whitespace-no-wrap border-b border-gray-500">
                {turnstile.qrCode}
              </td>
              <td className="px-6 py-4 whitespace-no-wrap border-b border-gray-500">
                <button
                  onClick={() => showQRCode(turnstile)}
                  className="px-4 py-2 font-bold text-white bg-blue-500 rounded hover:bg-blue-700 mr-2"
                >
                  View QR Code
                </button>
                <button
                  onClick={() => deleteTurnstile(turnstile.id)}
                  className="px-4 py-2 font-bold text-white bg-red-500 rounded hover:bg-red-700"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <button
        onClick={() => setIsAddModalOpen(true)}
        className="mt-4 px-4 py-2 font-bold text-white bg-green-500 rounded hover:bg-green-700"
      >
        Add New Turnstile
      </button>

      <Modal isOpen={isQRModalOpen} onClose={() => setIsQRModalOpen(false)}>
        {selectedTurnstile && (
          <div className="text-center">
            <h3 className="text-lg font-bold mb-4">Turnstile QR Code</h3>
            <p className="mb-4">Turnstile ID: {selectedTurnstile.id}</p>
            <div className="flex justify-center mb-4">
              <QRCode id="qr-code" value={selectedTurnstile.qrCode} size={200} />
            </div>
            <p className="mb-4">Scan this QR code with the gym app to check in.</p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => setIsQRModalOpen(false)}
                className="px-4 py-2 font-bold text-white bg-gray-500 rounded hover:bg-gray-700"
              >
                Close
              </button>
              <button
                onClick={downloadQRCode}
                className="px-4 py-2 font-bold text-white bg-blue-500 rounded hover:bg-blue-700"
              >
                Download QR Code
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)}>
        <div className="text-center">
          <h3 className="text-lg font-bold mb-4">Add New Turnstile</h3>
          <select
            value={selectedGymId}
            onChange={(e) => setSelectedGymId(e.target.value)}
            className="w-full px-3 py-2 border rounded text-black mb-4"
          >
            <option value="">Select a gym</option>
            {gyms.map((gym) => (
              <option key={gym.id} value={gym.id}>
                {gym.title}
              </option>
            ))}
          </select>
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 font-bold text-white bg-gray-500 rounded hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={addTurnstile}
              className="px-4 py-2 font-bold text-white bg-green-500 rounded hover:bg-green-700"
            >
              Add Turnstile
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}