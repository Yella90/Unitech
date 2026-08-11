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
  FaChevronUp
} from 'react-icons/fa';
import Link from 'next/link';

interface EditTrainingPageProps {
  params: Promise<{
    id: string;
  }>;
}

const colors = [
  { value: 'blue', label: 'Bleu', class: 'bg-blue-500' },
  { value: 'orange', label: 'Orange', class: 'bg-orange-500' },
  { value: 'green', label: 'Vert', class: 'bg-green-500' },
  { value: 'purple', label: 'Violet', class: 'bg-purple-500' },
  { value: 'yellow', label: 'Jaune', class: 'bg-yellow-500' },
  { value: 'red', label: 'Rouge', class: 'bg-red-500' },
  { value: 'teal', label: 'Sarcelle', class: 'bg-teal-500' },
];

const levels = ['Débutant', 'Intermédiaire', 'Intermédiaire à Avancé', 'Avancé'];
const durations = ['3 mois', '4 mois', '6 mois', '9 mois', '12 mois'];

const icons = [
  '📚', '🎓', '💻', '🤖', '📱', '🌐', '⚡', '🔧', 
  '🎯', '📊', '🧪', '🔬', '🎨', '📈', '🚀', '💡'
];

export default function EditTrainingPage({ params }: EditTrainingPageProps) {
  const router = useRouter();
  const { id: trainingId } = use(params);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modules, setModules] = useState<string[]>([]);
  const [moduleInput, setModuleInput] = useState('');
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    general: true,
    details: true,
    modules: true
  });
  
  const [formData, setFormData] = useState({
    slug: '',
    title: '',
    description: '',
    icon: '📚',
    duration: '6 mois',
    level: 'Débutant',
    schedule: '',
    price: '',
    color: 'blue',
  });

  useEffect(() => {
    const fetchTraining = async () => {
      if (!trainingId) {
        console.error('❌ ID de formation manquant');
        toast.error('ID de formation invalide');
        router.push('/admin/trainings');
        return;
      }

      try {
        setLoading(true);
        console.log('🔍 Chargement de la formation ID:', trainingId);

        const { data, error } = await supabase
          .from('trainings')
          .select('*')
          .eq('id', trainingId)
          .single();

        if (error) {
          console.error('❌ Erreur Supabase:', error);
          toast.error(error.message || 'Erreur lors du chargement de la formation');
          router.push('/admin/trainings');
          return;
        }

        if (!data) {
          console.warn('⚠️ Formation introuvable pour ID:', trainingId);
          toast.error('Formation introuvable');
          router.push('/admin/trainings');
          return;
        }

        setFormData({
          slug: data.slug || '',
          title: data.title || '',
          description: data.description || '',
          icon: data.icon || '📚',
          duration: data.duration || '6 mois',
          level: data.level || 'Débutant',
          schedule: data.schedule || '',
          price: data.price || '',
          color: data.color || 'blue',
        });
        setModules(Array.isArray(data.modules) ? data.modules : []);
      } catch (error: any) {
        console.error('❌ Erreur fetchTraining:', error);
        toast.error(error?.message || 'Erreur lors du chargement de la formation');
        router.push('/admin/trainings');
      } finally {
        setLoading(false);
      }
    };

    fetchTraining();
  }, [trainingId, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const addModule = () => {
    if (moduleInput.trim() && !modules.includes(moduleInput.trim())) {
      setModules([...modules, moduleInput.trim()]);
      setModuleInput('');
    }
  };

  const removeModule = (index: number) => {
    setModules(modules.filter((_, i) => i !== index));
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trainingId) {
      toast.error('ID de formation invalide');
      return;
    }
    
    setSaving(true);

    try {
      const { error } = await supabase
        .from('trainings')
        .update({
          ...formData,
          modules: modules.length > 0 ? modules : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', trainingId);

      if (error) throw error;

      toast.success('✅ Formation mise à jour avec succès !');
      setTimeout(() => {
        router.push('/admin/trainings');
      }, 1000);
    } catch (error: any) {
      console.error('❌ Erreur:', error);
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

  return (
    <main className="min-h-screen bg-[#F5F7FB] p-3 sm:p-4 md:p-6">
      <Toaster position="top-right" richColors />
      
      <div className="mx-auto max-w-3xl">
        {/* En-tête responsive */}
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
            Modification: {formData.title || 'Formation'}
          </span>
        </div>

        <Card className="border-0 sm:border shadow-sm sm:shadow-md">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-xl md:text-2xl font-bold text-[#1E3A8A] flex items-center gap-2">
              <span className="text-xl sm:text-2xl">✏️</span>
              <span className="truncate">Modifier la formation</span>
            </CardTitle>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Modifiez les informations de la formation "{formData.title}"
            </p>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              {/* ============================================ */}
              {/* INFORMATIONS GÉNÉRALES */}
              {/* ============================================ */}
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
                        Titre de la formation <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        onBlur={generateSlug}
                        required
                        className="mt-1 text-sm"
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
                        onChange={handleChange}
                        required
                        className="mt-1 text-sm"
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
                        onChange={handleChange}
                        rows={3}
                        className="mt-1 text-sm"
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
                                      setFormData(prev => ({ ...prev, icon }));
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
                              onClick={() => setFormData(prev => ({ ...prev, color: color.value }))}
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

              {/* ============================================ */}
              {/* DÉTAILS DE LA FORMATION */}
              {/* ============================================ */}
              <div className="border-b border-slate-200 pb-4 sm:pb-6">
                <button
                  type="button"
                  onClick={() => toggleSection('details')}
                  className="flex w-full items-center justify-between text-left"
                >
                  <h3 className="text-base sm:text-lg font-semibold text-[#1E3A8A]">Détails de la formation</h3>
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
                        onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                        className="w-full mt-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                      >
                        {durations.map((duration) => (
                          <option key={duration} value={duration}>{duration}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="level" className="text-xs sm:text-sm">Niveau</Label>
                      <select
                        id="level"
                        value={formData.level}
                        onChange={(e) => setFormData(prev => ({ ...prev, level: e.target.value }))}
                        className="w-full mt-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                      >
                        {levels.map((level) => (
                          <option key={level} value={level}>{level}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="schedule" className="text-xs sm:text-sm">Planning</Label>
                      <Input
                        id="schedule"
                        name="schedule"
                        value={formData.schedule}
                        onChange={handleChange}
                        placeholder="Ex: 2 fois par semaine, 3h"
                        className="mt-1 text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="price" className="text-xs sm:text-sm">Prix</Label>
                      <Input
                        id="price"
                        name="price"
                        value={formData.price}
                        onChange={handleChange}
                        placeholder="Ex: 1500€"
                        className="mt-1 text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* ============================================ */}
              {/* MODULES */}
              {/* ============================================ */}
              <div className="pb-4 sm:pb-6">
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
                      {modules.map((module, index) => (
                        <span key={index} className="inline-flex items-center gap-1 rounded-full bg-blue-50 text-blue-700 px-2 py-1 text-xs sm:text-sm">
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
                      {modules.length === 0 && (
                        <p className="text-xs sm:text-sm text-slate-400">Aucun module ajouté</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Boutons - responsive */}
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