// app/(dashboard)/admin/trainings/new/page.tsx
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
  FaChevronUp
} from 'react-icons/fa';
import Link from 'next/link';

const colors = [
  { value: 'blue', label: 'Bleu', class: 'bg-blue-500' },
  { value: 'orange', label: 'Orange', class: 'bg-orange-500' },
  { value: 'green', label: 'Vert', class: 'bg-green-500' },
  { value: 'purple', label: 'Violet', class: 'bg-purple-500' },
  { value: 'red', label: 'Rouge', class: 'bg-red-500' },
  { value: 'teal', label: 'Sarcelle', class: 'bg-teal-500' },
  { value: 'yellow', label: 'Jaune', class: 'bg-yellow-500' },
  { value: 'indigo', label: 'Indigo', class: 'bg-indigo-500' },
];

const levels = [
  { value: 'Débutant', label: 'Débutant' },
  { value: 'Intermédiaire', label: 'Intermédiaire' },
  { value: 'Avancé', label: 'Avancé' },
  { value: 'Expert', label: 'Expert' },
  { value: 'Tous niveaux', label: 'Tous niveaux' },
];

const durations = [
  { value: '3 mois', label: '3 mois' },
  { value: '4 mois', label: '4 mois' },
  { value: '6 mois', label: '6 mois' },
  { value: '9 mois', label: '9 mois' },
  { value: '12 mois', label: '12 mois' },
];

const icons = [
  '📚', '🎓', '💻', '🤖', '📱', '🌐', '⚡', '🔧', 
  '🎯', '📊', '🧪', '🔬', '🎨', '📈', '🚀', '💡'
];

export default function NewTrainingPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [moduleInput, setModuleInput] = useState('');
  const [showIconPicker, setShowIconPicker] = useState(false);

  const [expandedSections, setExpandedSections] = useState({
    general: true,
    details: true,
    modules: true
  });

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    icon: '📚',
    duration: '6 mois',
    level: 'Débutant',
    schedule: '',
    price: '',
    modules: [] as string[],
    color: 'blue',
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const generateSlug = () => {
    if (formData.title) {
      const slug = formData.title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setFormData(prev => ({ ...prev, slug }));
    }
  };

  const addModule = () => {
    if (moduleInput.trim() && !formData.modules.includes(moduleInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        modules: [...prev.modules, moduleInput.trim()],
      }));
      setModuleInput('');
    }
  };

  const removeModule = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      modules: prev.modules.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (!formData.title.trim()) {
        toast.error('Le titre est requis');
        setSaving(false);
        return;
      }

      if (!formData.slug.trim()) {
        toast.error('Le slug est requis');
        setSaving(false);
        return;
      }

      const { error } = await supabase
        .from('trainings')
        .insert({
          title: formData.title.trim(),
          slug: formData.slug.trim(),
          description: formData.description || null,
          icon: formData.icon,
          duration: formData.duration || null,
          level: formData.level || null,
          schedule: formData.schedule || null,
          price: formData.price || null,
          modules: formData.modules.length > 0 ? formData.modules : null,
          color: formData.color,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.error('❌ Erreur:', error);
        if (error.code === '23505') {
          toast.error('Un slug identique existe déjà');
        } else {
          toast.error(error.message || 'Erreur lors de la création');
        }
        setSaving(false);
        return;
      }

      toast.success('✅ Formation créée avec succès !');
      setTimeout(() => {
        router.push('/admin/trainings');
      }, 1000);
    } catch (error: any) {
      console.error('❌ Erreur:', error);
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
            href="/admin/trainings"
            className="inline-flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-slate-500 hover:text-[#1E3A8A] transition"
          >
            <FaArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline">Retour aux formations</span>
            <span className="xs:hidden">Retour</span>
          </Link>
          <span className="text-xs sm:text-sm text-slate-300">|</span>
          <span className="text-xs sm:text-sm text-slate-500 truncate">
            Nouvelle formation
          </span>
        </div>

        <Card className="border-0 sm:border shadow-sm sm:shadow-md">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-xl md:text-2xl font-bold text-[#1E3A8A] flex items-center gap-2">
              <span className="text-xl sm:text-2xl">➕</span>
              <span className="truncate">Nouvelle formation</span>
            </CardTitle>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Créez une nouvelle formation pour UNITECH
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
                      <Label htmlFor="title" className="text-xs sm:text-sm">
                        Titre <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                        onBlur={generateSlug}
                        required
                        className="mt-1 text-sm"
                        placeholder="Ex: Développement Web Full Stack"
                      />
                    </div>

                    <div>
                      <Label htmlFor="slug" className="text-xs sm:text-sm">
                        Slug <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="slug"
                        name="slug"
                        value={formData.slug}
                        onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                        required
                        className="mt-1 text-sm"
                        placeholder="Ex: developpement-web-full-stack"
                      />
                      <p className="mt-1 text-[10px] sm:text-xs text-slate-400">
                        Identifiant unique pour l'URL
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="description" className="text-xs sm:text-sm">Description</Label>
                      <Textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                        rows={3}
                        className="mt-1 text-sm"
                        placeholder="Description de la formation..."
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="icon" className="text-xs sm:text-sm">Icône</Label>
                        <div className="relative mt-1">
                          <button
                            type="button"
                            onClick={() => setShowIconPicker(!showIconPicker)}
                            className="w-full flex items-center justify-between px-3 py-2 border border-slate-200 rounded-lg bg-white hover:border-slate-300 transition"
                          >
                            <span className="text-2xl">{formData.icon}</span>
                            <span className="text-xs text-slate-400">▼</span>
                          </button>
                          {showIconPicker && (
                            <div className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg p-2 max-h-48 overflow-y-auto">
                              <div className="grid grid-cols-6 gap-1">
                                {icons.map((icon) => (
                                  <button
                                    key={icon}
                                    type="button"
                                    onClick={() => {
                                      setFormData((prev) => ({ ...prev, icon }));
                                      setShowIconPicker(false);
                                    }}
                                    className={`p-2 rounded-lg hover:bg-slate-100 transition text-2xl ${
                                      formData.icon === icon ? 'bg-slate-100 ring-2 ring-[#F97316]' : ''
                                    }`}
                                  >
                                    {icon}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="color" className="text-xs sm:text-sm">Couleur</Label>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {colors.map((color) => (
                            <button
                              key={color.value}
                              type="button"
                              onClick={() => setFormData((prev) => ({ ...prev, color: color.value }))}
                              className={`h-8 w-8 rounded-full border-2 transition ${
                                formData.color === color.value
                                  ? 'border-[#1E3A8A] ring-2 ring-[#1E3A8A]/30'
                                  : 'border-transparent hover:scale-110'
                              } ${color.class}`}
                              title={color.label}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Détails */}
              <div className="border-b border-slate-200 pb-4 sm:pb-6">
                <button
                  type="button"
                  onClick={() => toggleSection('details')}
                  className="flex w-full items-center justify-between text-left"
                >
                  <h3 className="text-base sm:text-lg font-semibold text-[#1E3A8A]">Détails</h3>
                  <span className="text-slate-400">
                    {expandedSections.details ? <FaChevronUp /> : <FaChevronDown />}
                  </span>
                </button>
                
                {expandedSections.details && (
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="duration" className="text-xs sm:text-sm">Durée</Label>
                      <select
                        id="duration"
                        value={formData.duration}
                        onChange={(e) => setFormData((prev) => ({ ...prev, duration: e.target.value }))}
                        className="w-full mt-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                      >
                        {durations.map((d) => (
                          <option key={d.value} value={d.value}>{d.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="level" className="text-xs sm:text-sm">Niveau</Label>
                      <select
                        id="level"
                        value={formData.level}
                        onChange={(e) => setFormData((prev) => ({ ...prev, level: e.target.value }))}
                        className="w-full mt-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                      >
                        {levels.map((l) => (
                          <option key={l.value} value={l.value}>{l.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="schedule" className="text-xs sm:text-sm">Planning</Label>
                      <Input
                        id="schedule"
                        value={formData.schedule}
                        onChange={(e) => setFormData((prev) => ({ ...prev, schedule: e.target.value }))}
                        className="mt-1 text-sm"
                        placeholder="Ex: 2 sessions par semaine"
                      />
                    </div>
                    <div>
                      <Label htmlFor="price" className="text-xs sm:text-sm">Prix</Label>
                      <Input
                        id="price"
                        value={formData.price}
                        onChange={(e) => setFormData((prev) => ({ ...prev, price: e.target.value }))}
                        className="mt-1 text-sm"
                        placeholder="Ex: 1 500 000 FCFA"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Modules */}
              <div>
                <button
                  type="button"
                  onClick={() => toggleSection('modules')}
                  className="flex w-full items-center justify-between text-left"
                >
                  <h3 className="text-base sm:text-lg font-semibold text-[#1E3A8A]">Modules</h3>
                  <span className="text-slate-400">
                    {expandedSections.modules ? <FaChevronUp /> : <FaChevronDown />}
                  </span>
                </button>
                
                {expandedSections.modules && (
                  <div className="mt-4">
                    <div className="flex gap-2">
                      <Input
                        value={moduleInput}
                        onChange={(e) => setModuleInput(e.target.value)}
                        placeholder="Ajouter un module"
                        className="text-sm"
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addModule())}
                      />
                      <Button type="button" onClick={addModule} variant="outline" size="sm">
                        <FaPlus className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="hidden xs:inline ml-1">Ajouter</span>
                      </Button>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {formData.modules.map((module, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1 rounded-full bg-blue-50 text-blue-700 px-2 py-1 text-xs sm:text-sm border border-blue-200"
                        >
                          {module}
                          <button
                            type="button"
                            onClick={() => removeModule(index)}
                            className="text-slate-400 hover:text-red-500 transition"
                          >
                            <FaTimes className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                      {formData.modules.length === 0 && (
                        <p className="text-xs sm:text-sm text-slate-400">Aucun module ajouté</p>
                      )}
                    </div>
                  </div>
                )}
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
                      <span className="hidden xs:inline">Créer la formation</span>
                      <span className="xs:hidden">Créer</span>
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/admin/trainings')}
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