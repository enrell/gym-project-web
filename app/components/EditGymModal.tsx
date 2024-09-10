'use client'

import { useState, useEffect } from 'react';
import Modal from './Modal';
import { NumericFormat, PatternFormat } from 'react-number-format';
import { useSession } from 'next-auth/react';

interface Gym {
  id: string;
  title: string;
  description: string;
  phone: string;
  latitude: number;
  longitude: number;
}

interface EditGymModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGymUpdated: () => void;
  gym: Gym;
}

export default function EditGymModal({ isOpen, onClose, onGymUpdated, gym }: EditGymModalProps) {
  const { data: session } = useSession();
  const [title, setTitle] = useState(gym.title);
  const [description, setDescription] = useState(gym.description);
  const [phone, setPhone] = useState(gym.phone);
  const [latitude, setLatitude] = useState(gym.latitude.toString());
  const [longitude, setLongitude] = useState(gym.longitude.toString());
  const [error, setError] = useState('');

  useEffect(() => {
    setTitle(gym.title);
    setDescription(gym.description);
    setPhone(gym.phone);
    setLatitude(gym.latitude.toString());
    setLongitude(gym.longitude.toString());
  }, [gym]);

  const validateInputs = () => {
    if (!title.trim()) return "Title is required";
    if (title.length > 200) return "Title must be 200 characters or less";
    if (!description.trim()) return "Description is required";
    if (description.length > 2000) return "Description must be 2000 characters or less";
    if (phone.replace(/\D/g, '').length !== 11) return "Phone number must have 11 digits including DDD";
    if (!latitude || isNaN(Number(latitude)) || Math.abs(Number(latitude)) > 90) return "Valid latitude is required (between -90 and 90)";
    if (!longitude || isNaN(Number(longitude)) || Math.abs(Number(longitude)) > 180) return "Valid longitude is required (between -180 and 180)";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validationError = validateInputs();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/gyms/${gym.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.accessToken}`
        },
        body: JSON.stringify({
          title,
          description,
          phone: phone.replace(/\D/g, ''),
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude)
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update gym');
      }

      const data = await response.json();
      console.log('Gym updated:', data);
      onGymUpdated();
      onClose();
    } catch (error) {
      console.error('Error updating gym:', error);
      if (error instanceof Error) {
        if (error.message === 'Unauthorized') {
          setError('Your session has expired. Please log in again.');
        } else {
          setError(`Failed to update gym: ${error.message}`);
        }
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <h2 className="text-2xl font-bold mb-4 text-black">Edit Gym</h2>
        {error && <p className="text-red-500">{error}</p>}
        
        <div>
          <label htmlFor="title" className="block text-black">Gym Name</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={200}
            className="w-full px-3 py-2 border rounded text-black"
          />
          <p className="text-sm text-gray-500 mt-1">{title.length}/200 characters</p>
        </div>

        <div>
          <label htmlFor="description" className="block text-black">Description</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            maxLength={2000}
            rows={4}
            className="w-full px-3 py-2 border rounded text-black"
          />
          <p className="text-sm text-gray-500 mt-1">{description.length}/2000 characters</p>
        </div>

        <div>
          <label htmlFor="phone" className="block text-black">Phone Number</label>
          <PatternFormat
            format="(##) #####-####"
            mask="_"
            id="phone"
            value={phone}
            onValueChange={(values) => setPhone(values.value)}
            required
            className="w-full px-3 py-2 border rounded text-black"
          />
        </div>

        <div>
          <label htmlFor="latitude" className="block text-black">Latitude</label>
          <NumericFormat
            id="latitude"
            value={latitude}
            onValueChange={(values) => setLatitude(values.value)}
            decimalScale={6}
            allowNegative
            isAllowed={(values) => {
              const { floatValue } = values;
              return floatValue === undefined || Math.abs(floatValue) <= 90;
            }}
            className="w-full px-3 py-2 border rounded text-black"
          />
        </div>

        <div>
          <label htmlFor="longitude" className="block text-black">Longitude</label>
          <NumericFormat
            id="longitude"
            value={longitude}
            onValueChange={(values) => setLongitude(values.value)}
            decimalScale={6}
            allowNegative
            isAllowed={(values) => {
              const { floatValue } = values;
              return floatValue === undefined || Math.abs(floatValue) <= 180;
            }}
            className="w-full px-3 py-2 border rounded text-black"
          />
        </div>

        <button type="submit" className="w-full px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600">
          Update Gym
        </button>
      </form>
    </Modal>
  );
}