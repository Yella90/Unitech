// components/public/forms/TrainingRegistrationForm.tsx
'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast, Toaster } from 'sonner';
import { FaSpinner, FaCheckCircle } from 'react-icons/fa';

interface TrainingRegistrationFormProps {
  trainingId: string;
  trainingTitle: string;
}

const levels = [
  { value: 'Débutant', label: 'Débutant' },
  { value: 'Intermédiaire', label: 'Intermédiaire' },
  { value: 'Avancé', label: 'Avancé' },
  { value: 'Expert', label: 'Expert' },
];

export default function TrainingRegistrationForm({ trainingId, trainingTitle }: TrainingRegistrationFormProps) {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    profession: '',
    company: '',
    level: '',
    motivation: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.full_name.trim()) {
        toast.error('Le nom complet est requis');
        setLoading(false);
        return;
      }

      if (!formData.email.trim()) {
        toast.error('L\'email est requis');
        setLoading(false);
        return;
      }

      const { error } = await supabase
        .from('training_registrations')
        .insert({
          training_id: trainingId,
          full_name: formData.full_name.trim(),
          email: formData.email.trim(),
          phone: formData.phone || null,
          profession: formData.profession || null,
          company: formData.company || null,
          level: formData.level || null,
          motivation: formData.motivation || null,
          status: 'pending',
          payment_status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (error) {
        if (error.code === '23505') {
          toast.error('Vous êtes déjà inscrit à cette formation');
        } else {
          toast.error(error.message || 'Erreur lors de l\'inscription');
        }
        setLoading(false);
        return;
      }

      setSubmitted(true);
      toast.success('✅ Inscription réussie ! Vous recevrez un email de confirmation.');
      
      setFormData({
        full_name: '',
        email: '',
        phone: '',
        profession: '',
        company: '',
        level: '',
        motivation: '',
      });
    } catch (error: any) {
      console.error('Erreur:', error);
      toast.error(error.message || 'Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-4">
          <FaCheckCircle className="h-8 w-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-800">Inscription réussie !</h3>
        <p className="mt-2 text-slate-600">
          Vous êtes maintenant inscrit à la formation "{trainingTitle}".<br />
          Vous recevrez un email de confirmation avec tous les détails.
        </p>
        <Button
          onClick={() => setSubmitted(false)}
          variant="outline"
          className="mt-4"
        >
          S'inscrire à une autre formation
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Toaster position="top-right" richColors />
      
      <div>
        <Label htmlFor="full_name" className="text-sm font-medium">
          Nom complet <span className="text-red-500">*</span>
        </Label>
        <Input
          id="full_name"
          name="full_name"
          value={formData.full_name}
          onChange={handleChange}
          placeholder="Votre nom et prénom"
          required
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="email" className="text-sm font-medium">
          Email <span className="text-red-500">*</span>
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="votre@email.com"
          required
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="phone" className="text-sm font-medium">
          Téléphone
        </Label>
        <Input
          id="phone"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          placeholder="+223 90 69 23 63"
          className="mt-1"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="profession" className="text-sm font-medium">
            Profession
          </Label>
          <Input
            id="profession"
            name="profession"
            value={formData.profession}
            onChange={handleChange}
            placeholder="Développeur, Étudiant..."
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="company" className="text-sm font-medium">
            Entreprise / Institution
          </Label>
          <Input
            id="company"
            name="company"
            value={formData.company}
            onChange={handleChange}
            placeholder="Nom de votre entreprise"
            className="mt-1"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="level" className="text-sm font-medium">
          Niveau
        </Label>
        <select
          id="level"
          name="level"
          value={formData.level}
          onChange={handleChange}
          className="w-full mt-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] focus:border-transparent"
        >
          <option value="">Sélectionnez votre niveau</option>
          {levels.map((level) => (
            <option key={level.value} value={level.value}>
              {level.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <Label htmlFor="motivation" className="text-sm font-medium">
          Motivation
        </Label>
        <Textarea
          id="motivation"
          name="motivation"
          value={formData.motivation}
          onChange={handleChange}
          placeholder="Pourquoi souhaitez-vous suivre cette formation ?"
          rows={3}
          className="mt-1"
        />
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-[#F97316] hover:bg-[#ea580c] text-white font-semibold"
      >
        {loading ? (
          <>
            <FaSpinner className="mr-2 h-4 w-4 animate-spin" />
            Inscription en cours...
          </>
        ) : (
          "S'inscrire à la formation"
        )}
      </Button>
    </form>
  );
}