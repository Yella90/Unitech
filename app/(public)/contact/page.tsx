// app/(public)/contact/page.tsx
'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FaEnvelope, FaPhone, FaMapMarkerAlt } from "react-icons/fa";
import { toast, Toaster } from 'sonner';

export default function ContactPage() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // ✅ Validation
      if (!formData.name || !formData.email || !formData.message) {
        toast.error('Veuillez remplir tous les champs obligatoires');
        setLoading(false);
        return;
      }

      if (!formData.email.includes('@') || !formData.email.includes('.')) {
        toast.error('Veuillez entrer un email valide');
        setLoading(false);
        return;
      }

      // ✅ Envoi vers Supabase (table contacts)
      const { error } = await supabase
        .from('contacts')
        .insert([{
          name: formData.name,
          email: formData.email,
          subject: formData.subject || 'Sans sujet',
          message: formData.message,
          status: 'pending',
        }]);

      if (error) {
        console.error('❌ Erreur Supabase:', error);
        
        // Si la table n'existe pas, afficher un message d'erreur
        if (error.code === '42P01') {
          toast.error('Service temporairement indisponible. Veuillez réessayer plus tard.');
        } else {
          toast.error('Erreur lors de l\'envoi du message');
        }
        setLoading(false);
        return;
      }

      // ✅ Succès
      toast.success('✅ Votre message a été envoyé avec succès !');
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
      });

      // ✅ Envoyer un email de notification (via une fonction Edge ou API)
      // await fetch('/api/contact/notify', { ... });

    } catch (err) {
      console.error('❌ Erreur:', err);
      toast.error('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-16">
      <Toaster position="top-right" richColors />
      
      <div className="text-center">
        <h1 className="text-4xl font-black text-[#1E3A8A]">Contactez-nous</h1>
        <p className="mt-2 text-slate-600 max-w-2xl mx-auto">
          Une question, un projet ? N'hésitez pas à nous contacter.
        </p>
      </div>

      <div className="mt-10 grid gap-8 md:grid-cols-2">
        {/* Formulaire */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-[#1E3A8A]">
              Envoyez un message
            </CardTitle>
            <CardDescription>
              Nous vous répondrons dans les plus brefs délais.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nom complet *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Votre nom"
                  className="mt-1"
                  required
                  disabled={loading}
                />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="votre@email.com"
                  className="mt-1"
                  required
                  disabled={loading}
                />
              </div>
              <div>
                <Label htmlFor="subject">Sujet</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="Sujet de votre message"
                  className="mt-1"
                  disabled={loading}
                />
              </div>
              <div>
                <Label htmlFor="message">Message *</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={5}
                  placeholder="Votre message..."
                  className="mt-1"
                  required
                  disabled={loading}
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-[#F97316] hover:bg-[#ea580c] text-white font-semibold"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Envoi en cours...
                  </span>
                ) : (
                  'Envoyer le message'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Informations */}
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1E3A8A]/10 text-[#1E3A8A]">
                  <FaEnvelope className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-700">Email</h3>
                  <p className="text-sm text-slate-500">doumbialayesoma@gmail.com</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1E3A8A]/10 text-[#1E3A8A]">
                  <FaPhone className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-700">Téléphone</h3>
                  <p className="text-sm text-slate-500">+223 90692363</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1E3A8A]/10 text-[#1E3A8A]">
                  <FaMapMarkerAlt className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-700">Adresse</h3>
                  <p className="text-sm text-slate-500">Bamako, Mali</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-[#1E3A8A] to-[#1E40AF] text-white">
            <CardContent className="p-6 text-center">
              <h3 className="text-xl font-bold">Prêt à collaborer ?</h3>
              <p className="mt-2 text-white/80 text-sm">
                Discutons de vos projets et voyons comment nous pouvons vous aider.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}