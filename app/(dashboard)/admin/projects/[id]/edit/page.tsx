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
  FaSpinner
} from 'react-icons/fa';
import Link from 'next/link';

interface EditProjectPageProps {
  params: Promise<{
    id: string;
  }>;
}

const colors = ['blue', 'orange', 'green'];
const statuses = ['planning', 'in-progress', 'testing', 'pending', 'completed', 'on-hold'];

export default function EditProjectPage({ params }: EditProjectPageProps) {
  const router = useRouter();
  const { id: projectId } = use(params);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [benefitInput, setBenefitInput] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  
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

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ✅ Gestion des bénéfices
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

  // ✅ Upload d'image vers Supabase Storage
  const uploadImage = async (file: File) => {
    try {
      setUploading(true);
      
      // Vérifier le type de fichier
      if (!file.type.startsWith('image/')) {
        toast.error('Veuillez sélectionner une image');
        setUploading(false);
        return;
      }

      // Vérifier la taille (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('L\'image ne doit pas dépasser 5MB');
        setUploading(false);
        return;
      }

      // Générer un nom unique
      const fileExt = file.name.split('.').pop();
      const fileName = `${projectId}_${Date.now()}.${fileExt}`;
      const filePath = `projects/${fileName}`;

      // Upload vers Supabase Storage
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

      // Récupérer l'URL publique
      const { data: publicUrlData } = supabase.storage
        .from('project-images')
        .getPublicUrl(filePath);

      const imageUrl = publicUrlData.publicUrl;

      // Ajouter l'URL à la galerie
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

  // ✅ Gestion du changement de fichier
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
      <div className="min-h-screen flex items-center justify-center bg-[#F5F7FB]">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#1E3A8A] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#F5F7FB] p-6">
      <Toaster position="top-right" richColors />

      <div className="mx-auto max-w-3xl">
        <div className="mb-4 flex items-center gap-4">
          <Link
            href="/admin/projects"
            className="inline-flex items-center gap-2 text-slate-500 hover:text-[#1E3A8A] transition"
          >
            <FaArrowLeft className="h-4 w-4" />
            Retour aux projets
          </Link>
          <span className="text-sm text-slate-400">|</span>
          <span className="text-sm text-slate-500">Modification du projet</span>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-[#1E3A8A]">Modifier le projet</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* ============================================ */}
              {/* INFORMATIONS GÉNÉRALES */}
              {/* ============================================ */}
              <div className="border-b border-slate-200 pb-6">
                <h3 className="text-lg font-semibold text-[#1E3A8A] mb-4">Informations générales</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nom du projet *</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="slug">Slug *</Label>
                    <Input
                      id="slug"
                      name="slug"
                      value={formData.slug}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                  />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="icon">Icône</Label>
                    <Input
                      id="icon"
                      name="icon"
                      value={formData.icon}
                      onChange={handleInputChange}
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
                          onClick={() => setFormData((prev) => ({ ...prev, color }))}
                          className={`h-8 w-8 rounded-full border-2 transition ${
                            formData.color === color
                              ? 'border-[#1E3A8A] ring-2 ring-[#1E3A8A]/30'
                              : 'border-transparent hover:scale-110'
                          } bg-${color}-500`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* ============================================ */}
              {/* SUIVI DU PROJET */}
              {/* ============================================ */}
              <div className="border-b border-slate-200 pb-6">
                <h3 className="text-lg font-semibold text-[#1E3A8A] mb-4">Suivi du projet</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="progress">Progression (%)</Label>
                    <Input
                      id="progress"
                      name="progress"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.progress}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div>
                    <Label htmlFor="status">Statut</Label>
                    <select
                      id="status"
                      name="status"
                      value={formData.status}
                      onChange={handleSelectChange}
                      className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                    >
                      {statuses.map((status) => (
                        <option key={status} value={status}>
                          {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mt-4">
                  <Label htmlFor="next_milestone">Prochain jalon</Label>
                  <Input
                    id="next_milestone"
                    name="next_milestone"
                    value={formData.next_milestone}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              {/* ============================================ */}
              {/* PROBLÈME ET SOLUTION */}
              {/* ============================================ */}
              <div className="border-b border-slate-200 pb-6">
                <h3 className="text-lg font-semibold text-[#1E3A8A] mb-4">Problème et solution</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="problem">Problème résolu</Label>
                    <Textarea
                      id="problem"
                      name="problem"
                      value={formData.problem}
                      onChange={handleInputChange}
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label htmlFor="solution">Solution</Label>
                    <Textarea
                      id="solution"
                      name="solution"
                      value={formData.solution}
                      onChange={handleInputChange}
                      rows={2}
                    />
                  </div>
                </div>
              </div>

              {/* ============================================ */}
              {/* BÉNÉFICES */}
              {/* ============================================ */}
              <div className="border-b border-slate-200 pb-6">
                <h3 className="text-lg font-semibold text-[#1E3A8A] mb-4">Bénéfices</h3>
                
                <div className="flex gap-2 mt-1">
                  <Input
                    value={benefitInput}
                    onChange={(e) => setBenefitInput(e.target.value)}
                    placeholder="Ajouter un bénéfice"
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addBenefit())}
                  />
                  <Button type="button" onClick={addBenefit} variant="outline" size="sm">
                    <FaPlus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {formData.benefits.map((benefit, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-sm"
                    >
                      {benefit}
                      <button
                        type="button"
                        onClick={() => removeBenefit(index)}
                        className="text-slate-400 hover:text-red-500"
                      >
                        <FaTimes className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                  {formData.benefits.length === 0 && (
                    <p className="text-sm text-slate-400">Aucun bénéfice ajouté</p>
                  )}
                </div>
              </div>

              {/* ============================================ */}
              {/* ✅ GALERIE D'IMAGES - UPLOAD */}
              {/* ============================================ */}
              <div className="border-2 border-dashed border-[#F97316] rounded-lg p-4 bg-orange-50/30">
                <div className="flex items-center gap-2 mb-3">
                  <FaImage className="h-6 w-6 text-[#F97316]" />
                  <h3 className="text-lg font-semibold text-[#1E3A8A]">Galerie d'images</h3>
                  <span className="ml-auto text-sm text-slate-500">
                    {formData.gallery.length} / 3 images
                  </span>
                </div>
                <p className="text-sm text-slate-500 mb-4">
                  Upload des images (max 3, format JPG/PNG, max 5MB)
                </p>

                {/* ✅ Upload d'images */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-4">
                    <Label
                      htmlFor="imageUpload"
                      className={`flex-1 cursor-pointer rounded-lg border-2 border-dashed border-slate-300 p-6 text-center transition hover:border-[#F97316] hover:bg-orange-50/50 ${
                        formData.gallery.length >= 3 ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <FaUpload className="h-8 w-8 text-slate-400" />
                        <span className="text-sm text-slate-500">
                          {uploading ? 'Upload en cours...' : 'Cliquez ou glissez une image'}
                        </span>
                        <span className="text-xs text-slate-400">JPG, PNG, GIF (max 5MB)</span>
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
                        <FaSpinner className="h-5 w-5 animate-spin text-[#F97316]" />
                        <span className="text-sm text-slate-500">Upload...</span>
                      </div>
                    )}
                  </div>

                  {/* Liste des images */}
                  <div className="mt-3">
                    {formData.gallery.length === 0 ? (
                      <div className="rounded-lg border-2 border-dashed border-slate-200 p-8 text-center text-slate-400">
                        <FaImage className="mx-auto h-10 w-10" />
                        <p className="mt-2 text-sm">Aucune image uploadée</p>
                        <p className="text-xs">Uploadez jusqu'à 3 images</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-3">
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
                            <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition group-hover:opacity-100">
                              <button
                                type="button"
                                onClick={() => previewImageUrl(image)}
                                className="rounded-full bg-white/20 p-1.5 text-white hover:bg-white/40"
                              >
                                <FaEye className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => removeImage(index)}
                                className="rounded-full bg-red-500/80 p-1.5 text-white hover:bg-red-600"
                              >
                                <FaTrash className="h-4 w-4" />
                              </button>
                            </div>
                            <span className="absolute bottom-1 right-1 rounded bg-black/50 px-1.5 py-0.5 text-xs text-white">
                              {index + 1}/3
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {formData.gallery.length >= 3 && (
                    <p className="mt-2 text-xs text-orange-500 flex items-center gap-1">
                      <FaTimes className="h-3 w-3" />
                      Maximum 3 images atteint
                    </p>
                  )}
                </div>
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
                      className="absolute -right-4 -top-4 rounded-full bg-red-500 p-2 text-white hover:bg-red-600"
                    >
                      <FaTimes className="h-6 w-6" />
                    </button>
                    <img
                      src={previewImage}
                      alt="Prévisualisation"
                      className="max-h-[85vh] max-w-[85vw] rounded-lg object-contain"
                    />
                  </div>
                </div>
              )}

              {/* Boutons */}
              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <Button
                  type="submit"
                  className="bg-[#F97316] hover:bg-[#ea580c] text-white font-semibold"
                  disabled={saving || uploading}
                >
                  <FaSave className="mr-2 h-4 w-4" />
                  {saving ? 'Enregistrement...' : 'Enregistrer'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/admin/projects')}
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