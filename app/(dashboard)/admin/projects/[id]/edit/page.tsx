// app/(dashboard)/admin/projects/[id]/edit/page.tsx
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
  FaImage, 
  FaUpload, 
  FaTrash,
  FaEye,
  FaSpinner,
  FaChevronDown,
  FaChevronUp
} from 'react-icons/fa';
import Link from 'next/link';

interface EditProjectPageProps {
  params: Promise<{
    id: string;
  }>;
}

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

export default function EditProjectPage({ params }: EditProjectPageProps) {
  const router = useRouter();
  const { id: projectId } = use(params);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [benefitInput, setBenefitInput] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    general: true,
    tracking: true,
    problem: true,
    benefits: true,
    gallery: true
  });
  
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
    gallery: [] as string[],
  });

  useEffect(() => {
    const fetchProject = async () => {
      if (!projectId) return;

      try {
        setLoading(true);

        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('id', projectId)
          .single();

        if (error) throw error;

        if (data) {
          setFormData({
            name: data.name || '',
            slug: data.slug || '',
            description: data.description || '',
            icon: data.icon || '📁',
            color: data.color || 'blue',
            progress: data.progress || 0,
            status: data.status || 'planning',
            next_milestone: data.next_milestone || '',
            problem: data.problem || '',
            solution: data.solution || '',
            benefits: data.benefits || [],
            gallery: data.gallery || [],
          });
        }
      } catch (error) {
        console.error('Erreur:', error);
        toast.error('Erreur lors du chargement du projet');
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [projectId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = parseInt(value) || 0;
    setFormData((prev) => ({ ...prev, [name]: Math.min(Math.max(numValue, 0), 100) }));
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Gestion des bénéfices
  const addBenefit = () => {
    if (benefitInput.trim() && !formData.benefits.includes(benefitInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        benefits: [...prev.benefits, benefitInput.trim()],
      }));
      setBenefitInput('');
    }
  };

  const removeBenefit = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      benefits: prev.benefits.filter((_, i) => i !== index),
    }));
  };

  // Upload d'image vers Supabase Storage
  const uploadImage = async (file: File) => {
    try {
      setUploading(true);
      
      if (!file.type.startsWith('image/')) {
        toast.error('Veuillez sélectionner une image');
        setUploading(false);
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error('L\'image ne doit pas dépasser 5MB');
        setUploading(false);
        return;
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${projectId}_${Date.now()}.${fileExt}`;
      const filePath = `projects/${fileName}`;

      const { data, error } = await supabase.storage
        .from('project-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        console.error('Erreur upload:', error);
        toast.error('Erreur lors de l\'upload de l\'image');
        setUploading(false);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from('project-images')
        .getPublicUrl(filePath);

      const imageUrl = publicUrlData.publicUrl;

      setFormData((prev) => ({
        ...prev,
        gallery: [...prev.gallery, imageUrl],
      }));

      toast.success('✅ Image uploadée avec succès');
      setUploading(false);

    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de l\'upload');
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (formData.gallery.length >= 3) {
      toast.error('Maximum 3 images par projet');
      return;
    }

    uploadImage(file);
  };

  const removeImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      gallery: prev.gallery.filter((_, i) => i !== index),
    }));
    toast.info('Image supprimée');
  };

  const previewImageUrl = (url: string) => {
    setPreviewImage(url);
  };

  const closePreview = () => {
    setPreviewImage(null);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { error } = await supabase
        .from('projects')
        .update({
          name: formData.name,
          slug: formData.slug,
          description: formData.description,
          icon: formData.icon,
          color: formData.color,
          progress: parseInt(formData.progress.toString()) || 0,
          status: formData.status,
          next_milestone: formData.next_milestone,
          problem: formData.problem,
          solution: formData.solution,
          benefits: formData.benefits.length > 0 ? formData.benefits : null,
          gallery: formData.gallery.length > 0 ? formData.gallery : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', projectId);

      if (error) throw error;

      toast.success('✅ Projet mis à jour avec succès !');
      setTimeout(() => {
        router.push('/admin/projects');
      }, 1000);
    } catch (error: any) {
      console.error('Erreur:', error);
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
            href="/admin/projects"
            className="inline-flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-slate-500 hover:text-[#1E3A8A] transition"
          >
            <FaArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline">Retour aux projets</span>
            <span className="xs:hidden">Retour</span>
          </Link>
          <span className="text-xs sm:text-sm text-slate-300">|</span>
          <span className="text-xs sm:text-sm text-slate-500 truncate">
            Modification: {formData.name || 'Projet'}
          </span>
        </div>

        <Card className="border-0 sm:border shadow-sm sm:shadow-md">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-xl md:text-2xl font-bold text-[#1E3A8A] flex items-center gap-2">
              <span className="text-xl sm:text-2xl">✏️</span>
              <span className="truncate">Modifier le projet</span>
            </CardTitle>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Modifiez les informations du projet "{formData.name}"
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name" className="text-xs sm:text-sm">
                          Nom du projet <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
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
                          onChange={handleInputChange}
                          required
                          className="mt-1 text-sm"
                        />
                        <p className="mt-1 text-[10px] sm:text-xs text-slate-400">
                          Identifiant unique pour l'URL
                        </p>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="description" className="text-xs sm:text-sm">Description</Label>
                      <Textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
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

              {/* ============================================ */}
              {/* SUIVI DU PROJET */}
              {/* ============================================ */}
              <div className="border-b border-slate-200 pb-4 sm:pb-6">
                <button
                  type="button"
                  onClick={() => toggleSection('tracking')}
                  className="flex w-full items-center justify-between text-left"
                >
                  <h3 className="text-base sm:text-lg font-semibold text-[#1E3A8A]">Suivi du projet</h3>
                  <span className="text-slate-400">
                    {expandedSections.tracking ? <FaChevronUp /> : <FaChevronDown />}
                  </span>
                </button>
                
                {expandedSections.tracking && (
                  <div className="mt-4 space-y-4">
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
                        <select
                          id="status"
                          name="status"
                          value={formData.status}
                          onChange={handleSelectChange}
                          className="w-full mt-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                        >
                          {statuses.map((status) => (
                            <option key={status.value} value={status.value}>
                              {status.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="next_milestone" className="text-xs sm:text-sm">Prochain jalon</Label>
                      <Input
                        id="next_milestone"
                        name="next_milestone"
                        value={formData.next_milestone}
                        onChange={handleInputChange}
                        placeholder="Ex: Beta interne - Septembre 2026"
                        className="mt-1 text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* ============================================ */}
              {/* PROBLÈME ET SOLUTION */}
              {/* ============================================ */}
              <div className="border-b border-slate-200 pb-4 sm:pb-6">
                <button
                  type="button"
                  onClick={() => toggleSection('problem')}
                  className="flex w-full items-center justify-between text-left"
                >
                  <h3 className="text-base sm:text-lg font-semibold text-[#1E3A8A]">Problème et solution</h3>
                  <span className="text-slate-400">
                    {expandedSections.problem ? <FaChevronUp /> : <FaChevronDown />}
                  </span>
                </button>
                
                {expandedSections.problem && (
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="problem" className="text-xs sm:text-sm">Problème résolu</Label>
                      <Textarea
                        id="problem"
                        name="problem"
                        value={formData.problem}
                        onChange={handleInputChange}
                        rows={2}
                        className="mt-1 text-sm"
                        placeholder="Quel problème ce projet résout-il ?"
                      />
                    </div>
                    <div>
                      <Label htmlFor="solution" className="text-xs sm:text-sm">Solution</Label>
                      <Textarea
                        id="solution"
                        name="solution"
                        value={formData.solution}
                        onChange={handleInputChange}
                        rows={2}
                        className="mt-1 text-sm"
                        placeholder="Quelle est votre solution ?"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* ============================================ */}
              {/* BÉNÉFICES */}
              {/* ============================================ */}
              <div className="border-b border-slate-200 pb-4 sm:pb-6">
                <button
                  type="button"
                  onClick={() => toggleSection('benefits')}
                  className="flex w-full items-center justify-between text-left"
                >
                  <h3 className="text-base sm:text-lg font-semibold text-[#1E3A8A]">Bénéfices</h3>
                  <span className="text-slate-400">
                    {expandedSections.benefits ? <FaChevronUp /> : <FaChevronDown />}
                  </span>
                </button>
                
                {expandedSections.benefits && (
                  <div className="mt-4">
                    <div className="flex gap-2">
                      <Input
                        value={benefitInput}
                        onChange={(e) => setBenefitInput(e.target.value)}
                        placeholder="Ajouter un bénéfice"
                        className="text-sm"
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addBenefit())}
                      />
                      <Button type="button" onClick={addBenefit} variant="outline" size="sm">
                        <FaPlus className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="hidden xs:inline ml-1">Ajouter</span>
                      </Button>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {formData.benefits.map((benefit, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1 rounded-full bg-blue-50 text-blue-700 px-2 py-1 text-xs sm:text-sm"
                        >
                          {benefit}
                          <button
                            type="button"
                            onClick={() => removeBenefit(index)}
                            className="text-slate-400 hover:text-red-500 transition"
                          >
                            <FaTimes className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                      {formData.benefits.length === 0 && (
                        <p className="text-xs sm:text-sm text-slate-400">Aucun bénéfice ajouté</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* ============================================ */}
              {/* GALERIE D'IMAGES */}
              {/* ============================================ */}
              <div className="border-2 border-dashed border-[#F97316] rounded-lg p-3 sm:p-4 bg-orange-50/30">
                <button
                  type="button"
                  onClick={() => toggleSection('gallery')}
                  className="flex w-full items-center justify-between text-left"
                >
                  <div className="flex items-center gap-2">
                    <FaImage className="h-5 w-5 sm:h-6 sm:w-6 text-[#F97316]" />
                    <h3 className="text-base sm:text-lg font-semibold text-[#1E3A8A]">Galerie d'images</h3>
                    <span className="text-xs sm:text-sm text-slate-500">
                      ({formData.gallery.length} / 3)
                    </span>
                  </div>
                  <span className="text-slate-400">
                    {expandedSections.gallery ? <FaChevronUp /> : <FaChevronDown />}
                  </span>
                </button>
                
                {expandedSections.gallery && (
                  <div className="mt-3 sm:mt-4">
                    <p className="text-xs sm:text-sm text-slate-500 mb-3 sm:mb-4">
                      Upload des images (max 3, format JPG/PNG, max 5MB)
                    </p>

                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-4">
                        <Label
                          htmlFor="imageUpload"
                          className={`flex-1 cursor-pointer rounded-lg border-2 border-dashed border-slate-300 p-4 sm:p-6 text-center transition hover:border-[#F97316] hover:bg-orange-50/50 ${
                            formData.gallery.length >= 3 ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          <div className="flex flex-col items-center gap-2">
                            <FaUpload className="h-6 w-6 sm:h-8 sm:w-8 text-slate-400" />
                            <span className="text-xs sm:text-sm text-slate-500">
                              {uploading ? 'Upload en cours...' : 'Cliquez ou glissez une image'}
                            </span>
                            <span className="text-[10px] sm:text-xs text-slate-400">JPG, PNG, GIF (max 5MB)</span>
                          </div>
                          <Input
                            id="imageUpload"
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            disabled={formData.gallery.length >= 3 || uploading}
                            className="hidden"
                          />
                        </Label>
                        {uploading && (
                          <div className="flex items-center gap-2">
                            <FaSpinner className="h-4 w-4 sm:h-5 sm:w-5 animate-spin text-[#F97316]" />
                            <span className="text-xs sm:text-sm text-slate-500">Upload...</span>
                          </div>
                        )}
                      </div>

                      {/* Liste des images */}
                      {formData.gallery.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 mt-2">
                          {formData.gallery.map((image, index) => (
                            <div
                              key={index}
                              className="group relative aspect-video overflow-hidden rounded-lg border border-slate-200 bg-slate-50"
                            >
                              <img
                                src={image}
                                alt={`Image ${index + 1}`}
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src =
                                    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="150" viewBox="0 0 200 150"%3E%3Crect width="200" height="150" fill="%23f1f5f9"/%3E%3Ctext x="100" y="75" text-anchor="middle" fill="%2394a3b8" font-size="14" font-family="sans-serif"%3EImage non disponible%3C/text%3E%3C/svg%3E';
                                }}
                              />
                              <div className="absolute inset-0 flex items-center justify-center gap-1 sm:gap-2 bg-black/50 opacity-0 transition group-hover:opacity-100">
                                <button
                                  type="button"
                                  onClick={() => previewImageUrl(image)}
                                  className="rounded-full bg-white/20 p-1.5 text-white hover:bg-white/40 transition"
                                >
                                  <FaEye className="h-3 w-3 sm:h-4 sm:w-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removeImage(index)}
                                  className="rounded-full bg-red-500/80 p-1.5 text-white hover:bg-red-600 transition"
                                >
                                  <FaTrash className="h-3 w-3 sm:h-4 sm:w-4" />
                                </button>
                              </div>
                              <span className="absolute bottom-1 right-1 rounded bg-black/50 px-1.5 py-0.5 text-[8px] sm:text-xs text-white">
                                {index + 1}/3
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {formData.gallery.length >= 3 && (
                        <p className="mt-2 text-xs text-orange-500 flex items-center gap-1">
                          <FaTimes className="h-3 w-3" />
                          Maximum 3 images atteint
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal de prévisualisation */}
              {previewImage && (
                <div
                  className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
                  onClick={closePreview}
                >
                  <div
                    className="relative max-h-[90vh] max-w-[90vw]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={closePreview}
                      className="absolute -right-2 -top-2 sm:-right-4 sm:-top-4 rounded-full bg-red-500 p-1.5 sm:p-2 text-white hover:bg-red-600 transition"
                    >
                      <FaTimes className="h-4 w-4 sm:h-6 sm:w-6" />
                    </button>
                    <img
                      src={previewImage}
                      alt="Prévisualisation"
                      className="max-h-[80vh] sm:max-h-[85vh] max-w-[80vw] sm:max-w-[85vw] rounded-lg object-contain"
                    />
                  </div>
                </div>
              )}

              {/* Boutons - responsive */}
              <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-200">
                <Button
                  type="submit"
                  className="bg-[#F97316] hover:bg-[#ea580c] text-white font-semibold text-xs sm:text-sm flex-1 sm:flex-none"
                  disabled={saving || uploading}
                >
                  <FaSave className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                  {saving ? (
                    <>
                      <FaSpinner className="mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    <span className="hidden xs:inline">Enregistrer</span>
                  )}
                  <span className="xs:hidden">💾</span>
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