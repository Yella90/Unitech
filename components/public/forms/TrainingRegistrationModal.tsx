// components/public/forms/TrainingRegistrationModal.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast, Toaster } from 'sonner';
import { FaSpinner, FaCheckCircle, FaTimes, FaGraduationCap } from 'react-icons/fa';

interface TrainingRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  trainingId: string;
  trainingTitle: string;
  trainingSlug: string;
}

const levels = [
  { value: 'Débutant', label: 'Débutant' },
  { value: 'Intermédiaire', label: 'Intermédiaire' },
  { value: 'Avancé', label: 'Avancé' },
  { value: 'Expert', label: 'Expert' },
];

export default function TrainingRegistrationModal({
  isOpen,
  onClose,
  trainingId,
  trainingTitle,
  trainingSlug,
}: TrainingRegistrationModalProps) {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    profession: '',
    company: '',
    level: '',
    motivation: '',
  });

  // Fermer avec Echap
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Empêcher le scroll du body
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

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
      toast.success('✅ Inscription réussie !');
      
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

  const handleClose = () => {
    setSubmitted(false);
    setFormData({
      full_name: '',
      email: '',
      phone: '',
      profession: '',
      company: '',
      level: '',
      motivation: '',
    });
    onClose();
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={handleOverlayClick}
        >
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl"
          >
            {/* Glow effect */}
            <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-[#1E3A8A]/5 blur-2xl" />
            <div className="absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-[#F97316]/5 blur-2xl" />

            {/* En-tête */}
            <div className="sticky top-0 z-10 bg-gradient-to-r from-[#1E3A8A] to-[#1E40AF] px-6 py-5 text-white rounded-t-2xl">
              <button
                onClick={handleClose}
                className="absolute right-4 top-4 p-1.5 rounded-lg hover:bg-white/10 transition-colors text-white/80 hover:text-white"
              >
                <FaTimes className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                  <FaGraduationCap className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Inscription à la formation</h2>
                  <p className="text-sm text-white/80">{trainingTitle}</p>
                </div>
              </div>
            </div>

            {/* Corps */}
            <div className="p-6">
              <Toaster position="top-right" richColors />

              {submitted ? (
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-4">
                    <FaCheckCircle className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800">Inscription réussie !</h3>
                  <p className="mt-2 text-slate-600">
                    Vous êtes maintenant inscrit à la formation.<br />
                    Vous recevrez un email de confirmation avec tous les détails.
                  </p>
                  <Button
                    onClick={handleClose}
                    className="mt-4 bg-[#F97316] hover:bg-[#ea580c] text-white"
                  >
                    Fermer
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="modal_full_name" className="text-sm font-medium">
                      Nom complet <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="modal_full_name"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleChange}
                      placeholder="Votre nom et prénom"
                      required
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="modal_email" className="text-sm font-medium">
                      Email <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="modal_email"
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
                    <Label htmlFor="modal_phone" className="text-sm font-medium">
                      Téléphone
                    </Label>
                    <Input
                      id="modal_phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+223 90 69 23 63"
                      className="mt-1"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="modal_profession" className="text-sm font-medium">
                        Profession
                      </Label>
                      <Input
                        id="modal_profession"
                        name="profession"
                        value={formData.profession}
                        onChange={handleChange}
                        placeholder="Développeur, Étudiant..."
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="modal_company" className="text-sm font-medium">
                        Entreprise / Institution
                      </Label>
                      <Input
                        id="modal_company"
                        name="company"
                        value={formData.company}
                        onChange={handleChange}
                        placeholder="Nom de votre entreprise"
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="modal_level" className="text-sm font-medium">
                      Niveau
                    </Label>
                    <select
                      id="modal_level"
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
                    <Label htmlFor="modal_motivation" className="text-sm font-medium">
                      Motivation
                    </Label>
                    <Textarea
                      id="modal_motivation"
                      name="motivation"
                      value={formData.motivation}
                      onChange={handleChange}
                      placeholder="Pourquoi souhaitez-vous suivre cette formation ?"
                      rows={3}
                      className="mt-1"
                    />
                  </div>

                  {/* Boutons */}
                  <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t border-slate-200">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleClose}
                      className="w-full sm:w-auto"
                    >
                      Annuler
                    </Button>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full sm:w-auto bg-[#F97316] hover:bg-[#ea580c] text-white font-semibold"
                    >
                      {loading ? (
                        <>
                          <FaSpinner className="mr-2 h-4 w-4 animate-spin" />
                          Inscription...
                        </>
                      ) : (
                        "S'inscrire"
                      )}
                    </Button>
                  </div>

                  {/* Information */}
                  <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                    <p className="text-xs text-blue-700 flex items-start gap-2">
                      <span className="text-lg">ℹ️</span>
                      <span>Une confirmation vous sera envoyée par email après votre inscription.</span>
                    </p>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}