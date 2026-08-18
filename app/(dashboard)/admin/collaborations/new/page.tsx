// app/(dashboard)/admin/collaborations/new/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast, Toaster } from 'sonner';
import { 
  FaArrowLeft, 
  FaSave, 
  FaPlus, 
  FaTimes, 
  FaSpinner,
  FaChevronDown,
  FaChevronUp,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaGlobe
} from 'react-icons/fa';
import Link from 'next/link';

const types = [
  { value: 'partner', label: 'Partenaire' },
  { value: 'association', label: 'Association' },
  { value: 'supplier', label: 'Fournisseur' },
  { value: 'consultant', label: 'Consultant' },
  { value: 'investor', label: 'Investisseur' },
];

const statuses = [
  { value: 'active', label: 'Actif' },
  { value: 'pending', label: 'En attente' },
  { value: 'inactive', label: 'Inactif' },
  { value: 'ended', label: 'Terminé' },
];

export default function NewCollaborationPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [contributionInput, setContributionInput] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    type: 'partner',
    status: 'active',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    contact_website: '',
    contributions: [] as string[],
    notes: '',
  });

  const [expandedSections, setExpandedSections] = useState({
    general: true,
    contact: true,
    contributions: true
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const addContribution = () => {
    if (contributionInput.trim() && !formData.contributions.includes(contributionInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        contributions: [...prev.contributions, contributionInput.trim()],
      }));
      setContributionInput('');
    }
  };

  const removeContribution = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      contributions: prev.contributions.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const contact = {
        name: formData.contact_name || undefined,
        email: formData.contact_email || undefined,
        phone: formData.contact_phone || undefined,
        site: formData.contact_website || undefined,
      };

      const { error } = await supabase
        .from('collaborations')
        .insert({
          name: formData.name,
          type: formData.type,
          status: formData.status,
          contact: contact.name || contact.email || contact.phone ? contact : null,
          contributions: formData.contributions.length > 0 ? formData.contributions : null,
          notes: formData.notes || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast.success('✅ Collaboration créée avec succès !');
      setTimeout(() => {
        router.push('/admin/collaborations');
      }, 1000);
    } catch (error: any) {
      console.error('Erreur:', error);
      toast.error(error.message || 'Erreur lors de la création');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F5F7FB] p-3 sm:p-4 md:p-6">
      <Toaster position="top-right" richColors />

      <div className="mx-auto max-w-3xl">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
          <Link
            href="/admin/collaborations"
            className="inline-flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-slate-500 hover:text-[#1E3A8A] transition"
          >
            <FaArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline">Retour aux collaborations</span>
            <span className="xs:hidden">Retour</span>
          </Link>
          <span className="text-xs sm:text-sm text-slate-300">|</span>
          <span className="text-xs sm:text-sm text-slate-500 truncate">
            Nouvelle collaboration
          </span>
        </div>

        <Card className="border-0 sm:border shadow-sm sm:shadow-md">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-xl md:text-2xl font-bold text-[#1E3A8A] flex items-center gap-2">
              <span className="text-xl sm:text-2xl">➕</span>
              <span className="truncate">Nouvelle collaboration</span>
            </CardTitle>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Créez une nouvelle collaboration (partenaire, fournisseur, consultant, etc.)
            </p>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              {/* Informations générales */}
              <div className="border-b border-slate-200 pb-4 sm:pb-6">
                <button
                  type="button"
                  onClick={() => toggleSection('general')}
                  className="flex w-full items-center justify-between text-left"
                >
                  <h3 className="text-base sm:text-lg font-semibold text-[#1E3A8A]">Informations générales</h3>
                  <span className="text-slate-400">
                    {expandedSections.general ? <FaChevronUp /> : <FaChevronDown />}
                  </span>
                </button>
                
                {expandedSections.general && (
                  <div className="mt-4 space-y-4">
                    <div>
                      <Label htmlFor="name" className="text-xs sm:text-sm">
                        Nom <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                        required
                        className="mt-1 text-sm"
                        placeholder="Ex: Solaire Plus Mali"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="type" className="text-xs sm:text-sm">Type</Label>
                        <select
                          id="type"
                          value={formData.type}
                          onChange={(e) => setFormData((prev) => ({ ...prev, type: e.target.value }))}
                          className="w-full mt-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                        >
                          {types.map((type) => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="status" className="text-xs sm:text-sm">Statut</Label>
                        <select
                          id="status"
                          value={formData.status}
                          onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))}
                          className="w-full mt-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                        >
                          {statuses.map((status) => (
                            <option key={status.value} value={status.value}>
                              {status.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Contact */}
              <div className="border-b border-slate-200 pb-4 sm:pb-6">
                <button
                  type="button"
                  onClick={() => toggleSection('contact')}
                  className="flex w-full items-center justify-between text-left"
                >
                  <div className="flex items-center gap-2">
                    <FaUser className="h-5 w-5 text-[#F97316]" />
                    <h3 className="text-base sm:text-lg font-semibold text-[#1E3A8A]">Contact</h3>
                  </div>
                  <span className="text-slate-400">
                    {expandedSections.contact ? <FaChevronUp /> : <FaChevronDown />}
                  </span>
                </button>
                
                {expandedSections.contact && (
                  <div className="mt-4 space-y-4">
                    <div>
                      <Label htmlFor="contact_name" className="text-xs sm:text-sm">Nom du contact</Label>
                      <div className="relative mt-1">
                        <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                        <Input
                          id="contact_name"
                          value={formData.contact_name}
                          onChange={(e) => setFormData((prev) => ({ ...prev, contact_name: e.target.value }))}
                          className="pl-10 text-sm"
                          placeholder="Ex: Mamadou Diallo"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="contact_email" className="text-xs sm:text-sm">Email</Label>
                      <div className="relative mt-1">
                        <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                        <Input
                          id="contact_email"
                          type="email"
                          value={formData.contact_email}
                          onChange={(e) => setFormData((prev) => ({ ...prev, contact_email: e.target.value }))}
                          className="pl-10 text-sm"
                          placeholder="contact@email.com"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="contact_website" className="text-xs sm:text-sm">Site Web</Label>
                      <div className="relative mt-1">
                        <FaGlobe className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                        <Input
                          id="contact_website"
                          type="url"
                          value={formData.contact_website}
                          onChange={(e) => setFormData((prev) => ({ ...prev, contact_website: e.target.value }))}
                          className="pl-10 text-sm"
                          placeholder="https://www.contact@email.com"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="contact_phone" className="text-xs sm:text-sm">Téléphone</Label>
                      <div className="relative mt-1">
                        <FaPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                        <Input
                          id="contact_phone"
                          value={formData.contact_phone}
                          onChange={(e) => setFormData((prev) => ({ ...prev, contact_phone: e.target.value }))}
                          className="pl-10 text-sm"
                          placeholder="+223 76 12 34 56"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Contributions */}
              <div className="border-b border-slate-200 pb-4 sm:pb-6">
                <button
                  type="button"
                  onClick={() => toggleSection('contributions')}
                  className="flex w-full items-center justify-between text-left"
                >
                  <h3 className="text-base sm:text-lg font-semibold text-[#1E3A8A]">Contributions</h3>
                  <span className="text-slate-400">
                    {expandedSections.contributions ? <FaChevronUp /> : <FaChevronDown />}
                  </span>
                </button>
                
                {expandedSections.contributions && (
                  <div className="mt-4">
                    <div className="flex gap-2">
                      <Input
                        value={contributionInput}
                        onChange={(e) => setContributionInput(e.target.value)}
                        placeholder="Ajouter une contribution"
                        className="text-sm"
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addContribution())}
                      />
                      <Button type="button" onClick={addContribution} variant="outline" size="sm">
                        <FaPlus className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="hidden xs:inline ml-1">Ajouter</span>
                      </Button>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {formData.contributions.map((contribution, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1 rounded-full bg-blue-50 text-blue-700 px-2 py-1 text-xs sm:text-sm"
                        >
                          {contribution}
                          <button
                            type="button"
                            onClick={() => removeContribution(index)}
                            className="text-slate-400 hover:text-red-500 transition"
                          >
                            <FaTimes className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                      {formData.contributions.length === 0 && (
                        <p className="text-xs sm:text-sm text-slate-400">Aucune contribution ajoutée</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <Label htmlFor="notes" className="text-xs sm:text-sm">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="mt-1 text-sm"
                  placeholder="Informations supplémentaires sur la collaboration..."
                />
              </div>

              {/* Boutons */}
              <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-200">
                <Button
                  type="submit"
                  className="bg-[#F97316] hover:bg-[#ea580c] text-white font-semibold text-xs sm:text-sm flex-1 sm:flex-none"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <FaSpinner className="mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                      Création...
                    </>
                  ) : (
                    <>
                      <FaSave className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="hidden xs:inline">Créer la collaboration</span>
                      <span className="xs:hidden">Créer</span>
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/admin/collaborations')}
                  className="text-xs sm:text-sm flex-1 sm:flex-none"
                >
                  Annuler
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}