// app/(dashboard)/admin/projects/new/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast, Toaster } from 'sonner';
import { FaArrowLeft, FaSave, FaSpinner } from 'react-icons/fa';
import Link from 'next/link';

const colors = [
  { value: 'blue', label: 'Bleu', class: 'bg-blue-500' },
  { value: 'orange', label: 'Orange', class: 'bg-orange-500' },
  { value: 'green', label: 'Vert', class: 'bg-green-500' },
  { value: 'purple', label: 'Violet', class: 'bg-purple-500' },
  { value: 'red', label: 'Rouge', class: 'bg-red-500' },
  { value: 'teal', label: 'Sarcelle', class: 'bg-teal-500' },
];

const statuses = [
  { value: 'planning', label: 'Planification' },
  { value: 'in-progress', label: 'En cours' },
  { value: 'testing', label: 'En test' },
  { value: 'pending', label: 'En attente' },
  { value: 'completed', label: 'Terminé' },
  { value: 'on-hold', label: 'En pause' },
];

const icons = [
  '📁', '🏫', '🛒', '⚡', '🏗️', '📱', '💻', '🌐', '🤖', '🎯', 
  '🚀', '💡', '🔧', '📊', '🎨', '📈', '🔬', '🧪', '⚙️', '📋'
];

export default function NewProjectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    icon: '📁',
    color: 'blue',
    progress: 0,
    status: 'planning',
    next_milestone: '',
    problem: '',
    solution: '',
    benefits: [] as string[],
  });
  const [benefitInput, setBenefitInput] = useState('');
  const [showIconPicker, setShowIconPicker] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = parseInt(value) || 0;
    setFormData(prev => ({ ...prev, [name]: Math.min(Math.max(numValue, 0), 100) }));
  };

  const addBenefit = () => {
    if (benefitInput.trim()) {
      setFormData(prev => ({
        ...prev,
        benefits: [...prev.benefits, benefitInput.trim()]
      }));
      setBenefitInput('');
    }
  };

  const removeBenefit = (index: number) => {
    setFormData(prev => ({
      ...prev,
      benefits: prev.benefits.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('projects')
        .insert([{
          ...formData,
          benefits: formData.benefits.length > 0 ? formData.benefits : null,
        }])
        .select()
        .single();

      if (error) throw error;

      toast.success('✅ Projet créé avec succès !');
      setTimeout(() => {
        router.push('/admin/projects');
      }, 1000);
    } catch (error: any) {
      console.error('Erreur:', error);
      toast.error(error.message || 'Erreur lors de la création du projet');
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = () => {
    if (formData.name) {
      const slug = formData.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setFormData(prev => ({ ...prev, slug }));
    }
  };

  return (
    <main className="min-h-screen bg-[#F5F7FB] p-3 sm:p-4 md:p-6">
      <Toaster position="top-right" richColors />
      
      <div className="mx-auto max-w-3xl">
        <Link 
          href="/admin/projects" 
          className="inline-flex items-center gap-2 text-xs sm:text-sm text-slate-500 hover:text-[#1E3A8A] transition mb-3 sm:mb-4"
        >
          <FaArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
          <span className="hidden xs:inline">Retour aux projets</span>
          <span className="xs:hidden">Retour</span>
        </Link>

        <Card className="border-0 sm:border shadow-sm sm:shadow-md">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-xl md:text-2xl font-bold text-[#1E3A8A] flex items-center gap-2">
              <span className="text-2xl sm:text-3xl">➕</span>
              <span>Nouveau projet</span>
            </CardTitle>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Remplissez les informations ci-dessous pour créer un nouveau projet.
            </p>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              {/* Nom et Slug - responsive */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name" className="text-xs sm:text-sm">
                    Nom du projet <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      onBlur={generateSlug}
                      placeholder="Ex: SaaS Gestion Scolaire"
                      required
                      className="text-sm"
                    />
                  </div>
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
                    placeholder="Ex: school-saas"
                    required
                    className="text-sm mt-1"
                  />
                  <p className="mt-1 text-[10px] sm:text-xs text-slate-400">
                    Identifiant unique pour l'URL
                  </p>
                </div>
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description" className="text-xs sm:text-sm">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Description du projet..."
                  rows={3}
                  className="mt-1 text-sm"
                />
              </div>

              {/* Icône et Couleur - responsive */}
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
                  <Select
                    value={formData.color}
                    onValueChange={(value) => handleSelectChange('color', value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Choisir une couleur" />
                    </SelectTrigger>
                    <SelectContent>
                      {colors.map((color) => (
                        <SelectItem key={color.value} value={color.value}>
                          <div className="flex items-center gap-2">
                            <span className={`inline-block h-4 w-4 rounded-full ${color.class}`} />
                            <span className="text-sm">{color.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Progression et Statut - responsive */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="progress" className="text-xs sm:text-sm">Progression (%)</Label>
                  <div className="flex items-center gap-3 mt-1">
                    <Input
                      id="progress"
                      name="progress"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.progress}
                      onChange={handleNumberChange}
                      className="w-24 text-sm"
                    />
                    <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#F97316] transition-all duration-300"
                        style={{ width: `${formData.progress}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-[#1E3A8A] min-w-[40px]">
                      {formData.progress}%
                    </span>
                  </div>
                </div>
                <div>
                  <Label htmlFor="status" className="text-xs sm:text-sm">Statut</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => handleSelectChange('status', value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Choisir un statut" />
                    </SelectTrigger>
                    <SelectContent>
                      {statuses.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Jalon */}
              <div>
                <Label htmlFor="next_milestone" className="text-xs sm:text-sm">Prochain jalon</Label>
                <Input
                  id="next_milestone"
                  name="next_milestone"
                  value={formData.next_milestone}
                  onChange={handleChange}
                  placeholder="Ex: Beta interne - Septembre 2026"
                  className="mt-1 text-sm"
                />
              </div>

              {/* Problème et Solution - responsive */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="problem" className="text-xs sm:text-sm">Problème résolu</Label>
                  <Textarea
                    id="problem"
                    name="problem"
                    value={formData.problem}
                    onChange={handleChange}
                    placeholder="Quel problème ce projet résout-il ?"
                    rows={2}
                    className="mt-1 text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="solution" className="text-xs sm:text-sm">Solution</Label>
                  <Textarea
                    id="solution"
                    name="solution"
                    value={formData.solution}
                    onChange={handleChange}
                    placeholder="Quelle est votre solution ?"
                    rows={2}
                    className="mt-1 text-sm"
                  />
                </div>
              </div>

              {/* Bénéfices */}
              <div>
                <Label className="text-xs sm:text-sm">Bénéfices</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={benefitInput}
                    onChange={(e) => setBenefitInput(e.target.value)}
                    placeholder="Ajouter un bénéfice..."
                    className="text-sm"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addBenefit();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addBenefit}
                    className="flex-shrink-0 text-xs sm:text-sm"
                  >
                    Ajouter
                  </Button>
                </div>
                {formData.benefits.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {formData.benefits.map((benefit, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs"
                      >
                        {benefit}
                        <button
                          type="button"
                          onClick={() => removeBenefit(index)}
                          className="hover:text-red-500 transition"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Boutons - responsive */}
              <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-200">
                <Button
                  type="submit"
                  className="bg-[#F97316] hover:bg-[#ea580c] text-white font-semibold text-xs sm:text-sm flex-1 sm:flex-none"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <FaSpinner className="mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                      Création...
                    </>
                  ) : (
                    <>
                      <FaSave className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="hidden xs:inline">Créer le projet</span>
                      <span className="xs:hidden">Créer</span>
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/admin/projects')}
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