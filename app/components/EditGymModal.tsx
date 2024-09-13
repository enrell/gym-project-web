'use client'

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { PatternFormat } from 'react-number-format';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Textarea } from "@/components/ui/textarea"
import { Spinner } from "@/app/components/ui/spinner"
import dynamic from 'next/dynamic';
import MapSelector from './MapSelector';

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

const formSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title must be 200 characters or less"),
  description: z.string().min(1, "Description is required").max(2000, "Description must be 2000 characters or less"),
  phone: z.string().refine((value) => {
    const digitsOnly = value.replace(/\D/g, '');
    return digitsOnly.length === 11;
  }, "Phone number must have 11 digits including DDD"),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
})

export default function EditGymModal({ isOpen, onClose, onGymUpdated, gym }: EditGymModalProps) {
  const { data: session } = useSession();
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: gym.title,
      description: gym.description,
      phone: gym.phone,
      latitude: gym.latitude || undefined,
      longitude: gym.longitude || undefined,
    },
  })

  useEffect(() => {
    if (isOpen && gym) {
      form.reset({
        title: gym.title,
        description: gym.description,
        phone: gym.phone,
        latitude: gym.latitude,
        longitude: gym.longitude,
      });
    }
  }, [isOpen, gym, form]);

  const handleLocationSelect = (lat: number, lng: number) => {
    form.setValue('latitude', lat, { shouldValidate: true });
    form.setValue('longitude', lng, { shouldValidate: true });
  }

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setError('');
    setIsSubmitting(true);
    try {
      const phoneDigitsOnly = values.phone.replace(/\D/g, '');
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/gyms/${gym.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.accessToken}`
        },
        body: JSON.stringify({
          ...values,
          phone: phoneDigitsOnly
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
        setError(`Failed to update gym: ${error.message}`);
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Editar Academia</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {error && <p className="text-destructive">{error}</p>}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Academia</FormLabel>
                  <FormControl>
                    <Input {...field} maxLength={200} placeholder="Digite o nome da academia" />
                  </FormControl>
                  <FormMessage />
                  <p className="text-sm text-muted-foreground mt-1">
                    {field.value.length}/200 caracteres
                  </p>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      maxLength={2000}
                      rows={4}
                      className="resize-none"
                      placeholder="Descreva as características, serviços e diferenciais da sua academia..."
                    />
                  </FormControl>
                  <FormMessage />
                  <p className="text-sm text-muted-foreground mt-1">
                    {field.value.length}/2000 caracteres
                  </p>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número de Telefone</FormLabel>
                  <FormControl>
                    <PatternFormat
                      format="(##) #####-####"
                      mask="_"
                      customInput={Input}
                      onValueChange={(values) => {
                        field.onChange(values.value);
                      }}
                      value={field.value}
                      placeholder="(00) 00000-0000"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="latitude"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Localização</FormLabel>
                  <FormControl>
                    {isOpen && (
                      <MapSelector
                        key={isOpen ? 'open' : 'closed'} // Force re-render when modal opens
                        initialLat={field.value !== undefined ? Number(field.value) : undefined}
                        initialLng={form.getValues('longitude') !== undefined ? Number(form.getValues('longitude')) : undefined}
                        onLocationSelect={handleLocationSelect}
                      />
                    )}
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Hidden fields for latitude and longitude */}
            <input type="hidden" {...form.register('latitude', { valueAsNumber: true })} />
            <input type="hidden" {...form.register('longitude', { valueAsNumber: true })} />

            <div className="flex justify-end space-x-2 mt-6">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Cancelar</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Spinner className="mr-2" /> : null}
                {isSubmitting ? "Atualizando..." : "Atualizar Academia"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}