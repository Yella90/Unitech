// components/public/forms/ServiceRequestForm.tsx
'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { 
  FaSpinner, 
  FaCheckCircle, 
  FaExclamationCircle,
  FaUpload,
  FaTimes
} from 'react-icons/fa';
import { toast, Toaster } from 'sonner';

type Service = {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
};

interface ServiceRequestFormProps {
  services: Service[];
}

export default function ServiceRequestForm({ services }: ServiceRequestFormProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ État du formulaire
  const [formData, setFormData] = useState({
    service_id: '',
    name: '',
    email: '',
    phone: '',
    company: '',
    description: '',
    budget: '',
    deadline: '',
    attachments: [] as File[],
  });

  // ✅ Validation
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.service_id) {
      newErrors.service_id = 'Veuillez sélectionner un service';
    }
    if (!formData.name.trim()) {
      newErrors.name = 'Veuillez entrer votre nom';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Veuillez entrer votre email';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email invalide';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Veuillez décrire votre besoin';
    } else if (formData.description.trim().length < 20) {
      newErrors.description = 'Veuillez fournir plus de détails (minimum 20 caractères)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validate()) {
      toast.error('Veuillez corriger les erreurs du formulaire');
      return;
    }

    setLoading(true);

    try {
      // ✅ Upload des pièces jointes
      let attachmentUrls: string[] = [];
      
      if (formData.attachments.length > 0) {
        for (const file of formData.attachments) {
          const fileName = `${Date.now()}-${file.name}`;
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('service-requests')
            .upload(fileName, file);

          if (uploadError) {
            console.error('❌ Erreur upload:', uploadError);
            continue;
          }

          const { data: urlData } = supabase.storage
            .from('service-requests')
            .getPublicUrl(fileName);

          attachmentUrls.push(urlData.publicUrl);
        }
      }

      // ✅ Créer la demande
      const { data, error: insertError } = await supabase
        .from('service_requests')
        .insert({
          service_id: formData.service_id,
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim() || null,
          company: formData.company.trim() || null,
          description: formData.description.trim(),
          budget: formData.budget || null,
          deadline: formData.deadline || null,
          attachments: attachmentUrls,
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError) {
        console.error('❌ Erreur insertion:', insertError);
        throw new Error(insertError.message);
      }

      // ✅ Envoyer une notification email (optionnel)
      try {
        await fetch('/api/service-request/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ requestId: data.id }),
        });
      } catch (notifyError) {
        console.warn('⚠️ Erreur notification:', notifyError);
      }

      setSuccess(true);
      toast.success('✅ Votre demande a été envoyée avec succès !');
      
      // Réinitialiser le formulaire après 5 secondes
      setTimeout(() => {
        setFormData({
          service_id: '',
          name: '',
          email: '',
          phone: '',
          company: '',
          description: '',
          budget: '',
          deadline: '',
          attachments: [],
        });
        setSuccess(false);
      }, 5000);

    } catch (err: any) {
      console.error('❌ Erreur:', err);
      setError(err.message || 'Une erreur est survenue');
      toast.error('Erreur lors de l\'envoi');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setFormData(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...files],
    }));
  };

  const removeFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index),
    }));
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-8 sm:py-12 text-center">
        <div className="rounded-full bg-green-100 p-4 mb-4">
          <FaCheckCircle className="h-12 w-12 text-green-600" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-800">Demande envoyée !</h2>
        <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-md">
          Merci pour votre demande. Nous vous répondrons dans les plus brefs délais.
        </p>
        <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
          <FaSpinner className="h-4 w-4 animate-spin" />
          Redirection automatique...
        </div>
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-right" richColors />
      
      <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
        {/* Sélection du service */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Service souhaité <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.service_id}
            onChange={(e) => setFormData(prev => ({ ...prev, service_id: e.target.value }))}
            className={`w-full rounded-lg border ${errors.service_id ? 'border-red-500' : 'border-slate-200'} bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] focus:border-transparent`}
          >
            <option value="">-- Sélectionnez un service --</option>
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name}
              </option>
            ))}
          </select>
          {errors.service_id && (
            <p className="mt-1 text-xs text-red-500">{errors.service_id}</p>
          )}
        </div>

        {/* Informations personnelles */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Nom complet <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className={`w-full rounded-lg border ${errors.name ? 'border-red-500' : 'border-slate-200'} bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] focus:border-transparent`}
              placeholder="Jean Dupont"
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-500">{errors.name}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className={`w-full rounded-lg border ${errors.email ? 'border-red-500' : 'border-slate-200'} bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] focus:border-transparent`}
              placeholder="jean@email.com"
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-500">{errors.email}</p>
            )}
          </div>
        </div>

        {/* Téléphone et Entreprise */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Téléphone
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] focus:border-transparent"
              placeholder="+33 6 12 34 56 78"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Entreprise / Organisation
            </label>
            <input
              type="text"
              value={formData.company}
              onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] focus:border-transparent"
              placeholder="Nom de votre entreprise"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Description du besoin <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            rows={5}
            className={`w-full rounded-lg border ${errors.description ? 'border-red-500' : 'border-slate-200'} bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] focus:border-transparent resize-y`}
            placeholder="Décrivez votre projet, vos besoins et vos attentes..."
          />
          {errors.description && (
            <p className="mt-1 text-xs text-red-500">{errors.description}</p>
          )}
          <p className="mt-1 text-xs text-slate-400">
            Minimum 20 caractères. Plus de détails nous aideront à mieux vous répondre.
          </p>
        </div>

        {/* Budget et Délai */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Budget estimé
            </label>
            <select
              value={formData.budget}
              onChange={(e) => setFormData(prev => ({ ...prev, budget: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] focus:border-transparent"
            >
              <option value="">-- À définir --</option>
              <option value="moins-500">Moins de 500€</option>
              <option value="500-1000">500€ - 1 000€</option>
              <option value="1000-2500">1 000€ - 2 500€</option>
              <option value="2500-5000">2 500€ - 5 000€</option>
              <option value="5000-10000">5 000€ - 10 000€</option>
              <option value="plus-10000">Plus de 10 000€</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Délai souhaité
            </label>
            <select
              value={formData.deadline}
              onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] focus:border-transparent"
            >
              <option value="">-- À définir --</option>
              <option value="urgent">Urgent (moins d'une semaine)</option>
              <option value="1-2-semaines">1 à 2 semaines</option>
              <option value="1-mois">1 mois</option>
              <option value="2-3-mois">2 à 3 mois</option>
              <option value="plus-3-mois">Plus de 3 mois</option>
            </select>
          </div>
        </div>

        {/* Pièces jointes */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Pièces jointes
          </label>
          <div className="relative">
            <input
              type="file"
              multiple
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.zip"
            />
            <div className="flex items-center justify-center border-2 border-dashed border-slate-300 rounded-lg p-4 sm:p-6 hover:border-[#1E3A8A] transition">
              <div className="text-center">
                <FaUpload className="mx-auto h-8 w-8 text-slate-400" />
                <p className="mt-2 text-sm text-slate-500">
                  Cliquez ou glissez-déposez vos fichiers
                </p>
                <p className="text-xs text-slate-400">
                  PDF, DOC, DOCX, JPG, PNG, ZIP (max 5MB)
                </p>
              </div>
            </div>
          </div>
          
          {/* Liste des fichiers */}
          {formData.attachments.length > 0 && (
            <div className="mt-3 space-y-2">
              {formData.attachments.map((file, index) => (
                <div key={index} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2 text-sm">
                  <span className="truncate">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <FaTimes className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Erreur */}
        {error && (
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <FaExclamationCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-700">Erreur</p>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
        )}

        {/* Bouton d'envoi */}
        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-[#1E3A8A] hover:bg-[#1A2F6A] text-white py-3 text-base font-semibold rounded-xl"
        >
          {loading ? (
            <>
              <FaSpinner className="mr-2 h-4 w-4 animate-spin" />
              Envoi en cours...
            </>
          ) : (
            'Envoyer ma demande'
          )}
        </Button>

        <p className="text-center text-xs text-slate-400">
          En soumettant ce formulaire, vous acceptez que UNITECH utilise vos données pour traiter votre demande.
        </p>
      </form>
    </>
  );
}