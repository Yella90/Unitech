// app/(dashboard)/admin/collaborations/[id]/edit/page.tsx
'use client';

import { useState, useEffect, use } from 'react';
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
  FaPhone
} from 'react-icons/fa';
import Link from 'next/link';

interface EditCollaborationPageProps {
  params: Promise<{
    id: string;
  }>;
}

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

export default function EditCollaborationPage({ params }: EditCollaborationPageProps) {
  const router = useRouter();
  const { id: collaborationId } = use(params);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contributionInput, setContributionInput] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    type: 'partner',
    status: 'active',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
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

  useEffect(() => {
    const fetchCollaboration = async () => {
      if (!collaborationId) {
        toast.error('ID de collaboration invalide');
        router.push('/admin/collaborations');
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const { data, error } = await supabase
          .from('collaborations')
          .select('*')
          .eq('id', collaborationId)
          .single();

        if (error) {
          console.error('❌ Erreur chargement:', error);
          if (error.code === 'PGRST116') {
            toast.error('Collaboration non trouvée');
            router.push('/admin/collaborations');
            return;
          }
          throw error;
        }

        if (!data) {
          toast.error('Collaboration non trouvée');
          router.push('/admin/collaborations');
          return;
        }

        setFormData({
          name: data.name || '',
          type: data.type || 'partner',
          status: data.status || 'active',
          contact_name: data.contact?.name || '',
          contact_email: data.contact?.email || '',
          contact_phone: data.contact?.phone || '',
          contributions: data.contributions || [],
          notes: data.notes || '',
        });
      } catch (error: any) {
        console.error('❌ Erreur:', error);
        setError(error.message);
        toast.error(error.message || 'Erreur lors du chargement');
      } finally {
        setLoading(false);
      }
    };

    fetchCollaboration();
  }, [collaborationId, router]);

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
    setError(null);

    try {
      // Validation
      if (!formData.name.trim()) {
        toast.error('Le nom est requis');
        setSaving(false);
        return;
      }

      const contact = {
        name: formData.contact_name || undefined,
        email: formData.contact_email || undefined,
        phone: formData.contact_phone || undefined,
      };

      const { error } = await supabase
        .from('collaborations')
        .update({
          name: formData.name.trim(),
          type: formData.type,
          status: formData.status,
          contact: contact.name || contact.email || contact.phone ? contact : null,
          contributions: formData.contributions.length > 0 ? formData.contributions : null,
          notes: formData.notes || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', collaborationId);

      if (error) {
        console.error('❌ Erreur mise à jour:', error);
        if (error.code === '42501') {
          toast.error('Vous n\'avez pas les droits pour modifier cette collaboration');
        } else {
          toast.error(error.message || 'Erreur lors de la mise à jour');
        }
        setSaving(false);
        return;
      }

      toast.success('✅ Collaboration mise à jour avec succès !');
      setTimeout(() => {
        router.push('/admin/collaborations');
      }, 1000);
    } catch (error: any) {
      console.error('❌ Erreur:', error);
      setError(error.message);
      toast.error(error.message || 'Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F7FB] p-4">
        <div className="h-10 w-10 sm:h-12 sm:w-12 animate-spin rounded-full border-4 border-[#1E3A8A] border-t-transparent"></div>
      </div>
    );
  }

  if (error && !formData.name) {
    return (
      <main className="min-h-screen bg-[#F5F7FB] p-6">
        <div className="mx-auto max-w-3xl">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6 text-center">
              <p className="text-red-600">❌ {error}</p>
              <Button 
                onClick={() => router.push('/admin/collaborations')}
                className="mt-4"
              >
                Retour aux collaborations
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

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
            Modification: {formData.name || 'Collaboration'}
          </span>
        </div>

        <Card className="border-0 sm:border shadow-sm sm:shadow-md">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-xl md:text-2xl font-bold text-[#1E3A8A] flex items-center gap-2">
              <span className="text-xl sm:text-2xl">✏️</span>
              <span className="truncate">Modifier la collaboration</span>
            </CardTitle>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Modifiez les informations de la collaboration "{formData.name}"
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
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <FaSave className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="hidden xs:inline">Enregistrer</span>
                      <span className="xs:hidden">💾</span>
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