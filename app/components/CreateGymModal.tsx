'use client'

import { useState } from 'react';
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
import { useEffect } from 'react';

const MapSelector = dynamic(() => import('./MapSelector'), { ssr: false })

interface CreateGymModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGymCreated: () => void;
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

export default function CreateGymModal({ isOpen, onClose, onGymCreated }: CreateGymModalProps) {
  const { data: session } = useSession();
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      phone: "",
      latitude: undefined,
      longitude: undefined,
    },
  })

  useEffect(() => {
    if (!isOpen) {
      form.reset();
    }
  }, [isOpen, form]);

  const handleLocationSelect = (lat: number, lng: number) => {
    form.setValue('latitude', lat, { shouldValidate: true });
    form.setValue('longitude', lng, { shouldValidate: true });
  }

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setError('');
    setIsSubmitting(true);
    try {
      // Remove non-digit characters from phone before sending to API
      const phoneDigitsOnly = values.phone.replace(/\D/g, '');
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/gyms`, {
        method: 'POST',
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
        throw new Error(errorData.message || 'Failed to create gym');
      }

      const data = await response.json();
      console.log('Gym created:', data);
      onGymCreated();
      onClose();
    } catch (error) {
      console.error('Error creating gym:', error);
      if (error instanceof Error) {
        setError(`Failed to create gym: ${error.message}`);
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
          <DialogTitle>Criar Nova Academia</DialogTitle>
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
                        initialLat={field.value}
                        initialLng={form.getValues('longitude')}
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
                {isSubmitting ? "Criando..." : "Criar Academia"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}