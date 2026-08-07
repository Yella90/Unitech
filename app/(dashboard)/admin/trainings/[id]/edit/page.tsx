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
import { FaArrowLeft, FaSave, FaPlus, FaTimes } from 'react-icons/fa';
import Link from 'next/link';

// ✅ Interface pour les props avec params Promise (correct pour Next.js 15)
interface EditTrainingPageProps {
  params: Promise<{
    id: string;
  }>;
}

const colors = ['blue', 'orange', 'green', 'purple', 'yellow', 'red'];
const levels = ['Débutant', 'Intermédiaire', 'Intermédiaire à Avancé', 'Avancé'];
const durations = ['3 mois', '4 mois', '6 mois', '9 mois', '12 mois'];

export default function EditTrainingPage({ params }: EditTrainingPageProps) {
  const router = useRouter();
  // ✅ Utiliser React.use() pour déballer la Promise
  const { id: trainingId } = use(params);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modules, setModules] = useState<string[]>([]);
  const [moduleInput, setModuleInput] = useState('');
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

  // ✅ Charger les données de la formation
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

  const addModule = () => {
    if (moduleInput.trim() && !modules.includes(moduleInput.trim())) {
      setModules([...modules, moduleInput.trim()]);
      setModuleInput('');
    }
  };

  const removeModule = (index: number) => {
    setModules(modules.filter((_, i) => i !== index));
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
      <div className="min-h-screen flex items-center justify-center bg-[#F5F7FB]">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#1E3A8A] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#F5F7FB] p-6">
      <Toaster position="top-right" richColors />
      
      <div className="mx-auto max-w-3xl">
        <Link href="/admin/trainings" className="inline-flex items-center gap-2 text-slate-500 hover:text-[#1E3A8A] transition mb-4">
          <FaArrowLeft className="h-4 w-4" />
          Retour aux formations
        </Link>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-[#1E3A8A]">Modifier la formation</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Titre */}
              <div>
                <Label htmlFor="title">Titre de la formation *</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Slug */}
              <div>
                <Label htmlFor="slug">Slug *</Label>
                <Input
                  id="slug"
                  name="slug"
                  value={formData.slug}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                />
              </div>

              {/* Icône et Couleur */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="icon">Icône</Label>
                  <Input
                    id="icon"
                    name="icon"
                    value={formData.icon}
                    onChange={handleChange}
                    maxLength={2}
                  />
                </div>
                <div>
                  <Label htmlFor="color">Couleur</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {colors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, color }))}
                        className={`h-8 w-8 rounded-full border-2 ${
                          formData.color === color ? 'border-[#1E3A8A]' : 'border-transparent'
                        } bg-${color}-500`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Durée et Niveau */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="duration">Durée</Label>
                  <select
                    id="duration"
                    value={formData.duration}
                    onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                  >
                    {durations.map((duration) => (
                      <option key={duration} value={duration}>{duration}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="level">Niveau</Label>
                  <select
                    id="level"
                    value={formData.level}
                    onChange={(e) => setFormData(prev => ({ ...prev, level: e.target.value }))}
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                  >
                    {levels.map((level) => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Planning et Prix */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="schedule">Planning</Label>
                  <Input
                    id="schedule"
                    name="schedule"
                    value={formData.schedule}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <Label htmlFor="price">Prix</Label>
                  <Input
                    id="price"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Modules */}
              <div>
                <Label>Modules</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={moduleInput}
                    onChange={(e) => setModuleInput(e.target.value)}
                    placeholder="Ajouter un module"
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addModule())}
                  />
                  <Button type="button" onClick={addModule} variant="outline" size="sm">
                    <FaPlus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {modules.map((module, index) => (
                    <span key={index} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-sm">
                      {module}
                      <button
                        type="button"
                        onClick={() => removeModule(index)}
                        className="text-slate-400 hover:text-red-500"
                      >
                        <FaTimes className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                  {modules.length === 0 && (
                    <p className="text-sm text-slate-400">Aucun module ajouté</p>
                  )}
                </div>
              </div>

              {/* Boutons */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  className="bg-[#F97316] hover:bg-[#ea580c] text-white font-semibold"
                  disabled={saving}
                >
                  <FaSave className="mr-2 h-4 w-4" />
                  {saving ? 'Enregistrement...' : 'Enregistrer'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/admin/trainings')}
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