'use client'

import { useState } from 'react';
import Modal from './Modal';
import { NumericFormat, PatternFormat } from 'react-number-format';
import { useSession } from 'next-auth/react';

interface CreateGymModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGymCreated: () => void;
}

export default function CreateGymModal({ isOpen, onClose, onGymCreated }: CreateGymModalProps) {
  const { data: session } = useSession();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);

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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/gyms`, {
        method: 'POST',
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
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create gym');
      }

      const data = await response.json();
      console.log('Gym created:', data);
      onGymCreated();
      onClose();
    } catch (error) {
      console.error('Error creating gym:', error);
      if (error instanceof Error) {
        if (error.message === 'Unauthorized') {
          setError('Your session has expired. Please log in again.');
          // Aqui você pode adicionar lógica para redirecionar o usuário para a página de login
        } else {
          setError(`Failed to create gym: ${error.message}`);
        }
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    }
  };

  const nextStep = () => {
    if (step < 3) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <h2 className="text-2xl font-bold mb-4 text-black">Create New Gym</h2>
        {error && <p className="text-red-500">{error}</p>}
        
        {step === 1 && (
          <>
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
                placeholder="e.g., Fitness Plus"
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
                placeholder="Describe your gym's features and services"
              />
              <p className="text-sm text-gray-500 mt-1">{description.length}/2000 characters</p>
            </div>
          </>
        )}

        {step === 2 && (
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
              placeholder="(00) 00000-0000"
            />
            <p className="text-sm text-gray-500 mt-1">Enter a valid contact number including DDD</p>
          </div>
        )}

        {step === 3 && (
          <>
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
                placeholder="-90.000000 to 90.000000"
              />
              <p className="text-sm text-gray-500 mt-1">Enter a valid latitude between -90 and 90 degrees</p>
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
                placeholder="-180.000000 to 180.000000"
              />
              <p className="text-sm text-gray-500 mt-1">Enter a valid longitude between -180 and 180 degrees</p>
            </div>
          </>
        )}

        <div className="flex justify-between mt-6">
          {step > 1 && (
            <button type="button" onClick={prevStep} className="px-4 py-2 text-gray-600 bg-gray-200 rounded hover:bg-gray-300">
              Previous
            </button>
          )}
          {step < 3 ? (
            <button type="button" onClick={nextStep} className="px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600">
              Next
            </button>
          ) : (
            <button type="submit" className="px-4 py-2 text-white bg-green-500 rounded hover:bg-green-600">
              Create Gym
            </button>
          )}
        </div>
      </form>
    </Modal>
  );
}