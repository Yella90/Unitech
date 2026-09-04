// app/(dashboard)/admin/services/[id]/edit/page.tsx
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
  FaRocket,
  FaBox
} from 'react-icons/fa';
import Link from 'next/link';

interface EditServicePageProps {
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
  { value: 'yellow', label: 'Jaune', class: 'bg-yellow-500' },
  { value: 'indigo', label: 'Indigo', class: 'bg-indigo-500' },
];

const icons = [
  '📁', '🏫', '🛒', '⚡', '🏗️', '📱', '💻', '🌐', '🤖', '🎯', 
  '🚀', '💡', '🔧', '📊', '🎨', '📈', '🔬', '🧪', '⚙️', '📋',
  'FaUniversity', 'FaStore', 'FaSolarPanel', 'FaRobot', 'FaGraduationCap',
  'FaLeaf', 'FaBuilding', 'FaCog', 'FaEnvelope', 'FaBriefcase', 'FaKey'
];

const categories = [
  { value: 'development', label: 'Développement' },
  { value: 'design', label: 'Design' },
  { value: 'consulting', label: 'Consulting' },
  { value: 'training', label: 'Formation' },
  { value: 'saas', label: 'SaaS' },
  { value: 'other', label: 'Autre' },
];

const serviceTypes = [
  { value: 'product', label: 'Produit', icon: <FaBox className="h-4 w-4" /> },
  { value: 'saas', label: 'SaaS', icon: <FaRocket className="h-4 w-4" /> },
];

export default function EditServicePage({ params }: EditServicePageProps) {
  const router = useRouter();
  const { id: serviceId } = use(params);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [featureInput, setFeatureInput] = useState('');
  const [showIconPicker, setShowIconPicker] = useState(false);
  
  const [expandedSections, setExpandedSections] = useState({
    general: true,
    features: true,
    pricing: true
  });
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'development',
    type: 'product' as 'product' | 'saas',
    icon: '📁',
    color: 'blue',
    features: [] as string[],
    order_index: 0,
    is_active: true,
    price_monthly: '',
    price_yearly: '',
    price_project: '',
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  useEffect(() => {
    const fetchService = async () => {
      if (!serviceId) return;

      try {
        setLoading(true);

        const { data, error } = await supabase
          .from('services')
          .select('*')
          .eq('id', serviceId)
          .single();

        if (error) throw error;

        if (data) {
          setFormData({
            name: data.name || '',
            description: data.description || '',
            category: data.category || 'development',
            type: data.type || 'product',
            icon: data.icon || '📁',
            color: data.color || 'blue',
            features: data.features || [],
            order_index: data.order_index || 0,
            is_active: data.is_active !== false,
            price_monthly: data.price_monthly?.toString() || '',
            price_yearly: data.price_yearly?.toString() || '',
            price_project: data.price_project?.toString() || '',
          });
        }
      } catch (error) {
        console.error('Erreur:', error);
        toast.error('Erreur lors du chargement du service');
        router.push('/admin/services');
      } finally {
        setLoading(false);
      }
    };

    fetchService();
  }, [serviceId, router]);

  const addFeature = () => {
    if (featureInput.trim() && !formData.features.includes(featureInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        features: [...prev.features, featureInput.trim()],
      }));
      setFeatureInput('');
    }
  };

  const removeFeature = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const updateData: any = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        type: formData.type,
        icon: formData.icon,
        color: formData.color,
        features: formData.features.length > 0 ? formData.features : null,
        order_index: formData.order_index,
        is_active: formData.is_active,
        updated_at: new Date().toISOString(),
      };

      // Ajouter les prix si type est SaaS
      if (formData.type === 'saas') {
        updateData.price_monthly = formData.price_monthly ? parseInt(formData.price_monthly) : null;
        updateData.price_yearly = formData.price_yearly ? parseInt(formData.price_yearly) : null;
        updateData.price_project = null;
      } else {
        updateData.price_project = formData.price_project ? parseInt(formData.price_project) : null;
        updateData.price_monthly = null;
        updateData.price_yearly = null;
      }

      const { error } = await supabase
        .from('services')
        .update(updateData)
        .eq('id', serviceId);

      if (error) throw error;

      toast.success('✅ Service mis à jour avec succès !');
      setTimeout(() => {
        router.push('/admin/services');
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
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
          <Link
            href="/admin/services"
            className="inline-flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-slate-500 hover:text-[#1E3A8A] transition"
          >
            <FaArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline">Retour aux services</span>
            <span className="xs:hidden">Retour</span>
          </Link>
          <span className="text-xs sm:text-sm text-slate-300">|</span>
          <span className="text-xs sm:text-sm text-slate-500 truncate">
            Modification: {formData.name || 'Service'}
          </span>
        </div>

        <Card className="border-0 sm:border shadow-sm sm:shadow-md">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-xl md:text-2xl font-bold text-[#1E3A8A] flex items-center gap-2">
              <span className="text-xl sm:text-2xl">✏️</span>
              <span className="truncate">Modifier le service</span>
            </CardTitle>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Modifiez les informations du service "{formData.name}"
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
                    {/* Nom */}
                    <div>
                      <Label htmlFor="name" className="text-xs sm:text-sm">
                        Nom du service <span className="text-red-500">*</span>
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

                    {/* Description */}
                    <div>
                      <Label htmlFor="description" className="text-xs sm:text-sm">Description</Label>
                      <Textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                        rows={3}
                        className="mt-1 text-sm"
                      />
                    </div>

                    {/* Catégorie et Type */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="category" className="text-xs sm:text-sm">Catégorie</Label>
                        <select
                          id="category"
                          value={formData.category}
                          onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                          className="w-full mt-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] focus:border-transparent bg-white"
                        >
                          {categories.map((cat) => (
                            <option key={cat.value} value={cat.value}>{cat.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="type" className="text-xs sm:text-sm">Type de service</Label>
                        <div className="flex gap-2 mt-1">
                          {serviceTypes.map((type) => (
                            <button
                              key={type.value}
                              type="button"
                              onClick={() => setFormData((prev) => ({ ...prev, type: type.value as 'product' | 'saas' }))}
                              className={`flex-1 px-4 py-2 rounded-lg border-2 transition flex items-center justify-center gap-2 text-sm ${
                                formData.type === type.value
                                  ? 'border-[#1E3A8A] bg-[#1E3A8A]/5 text-[#1E3A8A]'
                                  : 'border-slate-200 text-slate-500 hover:border-slate-300'
                              }`}
                            >
                              {type.icon}
                              {type.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Icône et Couleur */}
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

                    {/* Ordre et Statut */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="order_index" className="text-xs sm:text-sm">Ordre d'affichage</Label>
                        <Input
                          id="order_index"
                          name="order_index"
                          type="number"
                          min="0"
                          value={formData.order_index}
                          onChange={(e) => setFormData((prev) => ({ ...prev, order_index: parseInt(e.target.value) || 0 }))}
                          className="mt-1 text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs sm:text-sm">Statut</Label>
                        <div className="flex gap-2 mt-1">
                          <button
                            type="button"
                            onClick={() => setFormData((prev) => ({ ...prev, is_active: true }))}
                            className={`px-4 py-2 rounded-lg border-2 transition flex-1 sm:flex-none ${
                              formData.is_active
                                ? 'bg-green-50 border-green-500 text-green-700'
                                : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                            }`}
                          >
                            <span className="flex items-center justify-center gap-2 text-sm">
                              ✅ Actif
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormData((prev) => ({ ...prev, is_active: false }))}
                            className={`px-4 py-2 rounded-lg border-2 transition flex-1 sm:flex-none ${
                              !formData.is_active
                                ? 'bg-red-50 border-red-500 text-red-700'
                                : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                            }`}
                          >
                            <span className="flex items-center justify-center gap-2 text-sm">
                              ❌ Inactif
                            </span>
                          </button>
                        </div>
                        <p className="mt-1 text-[10px] sm:text-xs text-slate-400">
                          {formData.is_active 
                            ? '✅ Le service est visible sur le site' 
                            : '❌ Le service est caché sur le site'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* ============================================ */}
              {/* FONCTIONNALITÉS */}
              {/* ============================================ */}
              <div className="border-b border-slate-200 pb-4 sm:pb-6">
                <button
                  type="button"
                  onClick={() => toggleSection('features')}
                  className="flex w-full items-center justify-between text-left"
                >
                  <h3 className="text-base sm:text-lg font-semibold text-[#1E3A8A]">Fonctionnalités</h3>
                  <span className="text-slate-400">
                    {expandedSections.features ? <FaChevronUp /> : <FaChevronDown />}
                  </span>
                </button>
                
                {expandedSections.features && (
                  <div className="mt-4">
                    <div className="flex gap-2">
                      <Input
                        value={featureInput}
                        onChange={(e) => setFeatureInput(e.target.value)}
                        placeholder="Ajouter une fonctionnalité"
                        className="text-sm"
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                      />
                      <Button type="button" onClick={addFeature} variant="outline" size="sm">
                        <FaPlus className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="hidden xs:inline ml-1">Ajouter</span>
                      </Button>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {formData.features.map((feature, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1 rounded-full bg-blue-50 text-blue-700 px-2 py-1 text-xs sm:text-sm border border-blue-200"
                        >
                          {feature}
                          <button
                            type="button"
                            onClick={() => removeFeature(index)}
                            className="text-slate-400 hover:text-red-500 transition"
                          >
                            <FaTimes className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                      {formData.features.length === 0 && (
                        <p className="text-xs sm:text-sm text-slate-400">Aucune fonctionnalité ajoutée</p>
                      )}
                    </div>
                    <p className="mt-2 text-[10px] sm:text-xs text-slate-400">
                      {formData.features.length} fonctionnalité{formData.features.length > 1 ? 's' : ''} ajoutée{formData.features.length > 1 ? 's' : ''}
                    </p>
                  </div>
                )}
              </div>

              {/* ============================================ */}
              {/* TARIFICATION */}
              {/* ============================================ */}
              <div className="pb-4 sm:pb-6">
                <button
                  type="button"
                  onClick={() => toggleSection('pricing')}
                  className="flex w-full items-center justify-between text-left"
                >
                  <h3 className="text-base sm:text-lg font-semibold text-[#1E3A8A]">Tarification</h3>
                  <span className="text-slate-400">
                    {expandedSections.pricing ? <FaChevronUp /> : <FaChevronDown />}
                  </span>
                </button>
                
                {expandedSections.pricing && (
                  <div className="mt-4">
                    {formData.type === 'saas' ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="price_monthly" className="text-xs sm:text-sm">Prix mensuel (FCFA)</Label>
                          <Input
                            id="price_monthly"
                            type="number"
                            placeholder="25000"
                            value={formData.price_monthly}
                            onChange={(e) => setFormData((prev) => ({ ...prev, price_monthly: e.target.value }))}
                            className="mt-1 text-sm"
                          />
                        </div>
                        <div>
                          <Label htmlFor="price_yearly" className="text-xs sm:text-sm">Prix annuel (FCFA)</Label>
                          <Input
                            id="price_yearly"
                            type="number"
                            placeholder="250000"
                            value={formData.price_yearly}
                            onChange={(e) => setFormData((prev) => ({ ...prev, price_yearly: e.target.value }))}
                            className="mt-1 text-sm"
                          />
                        </div>
                      </div>
                    ) : (
                      <div>
                        <Label htmlFor="price_project" className="text-xs sm:text-sm">Prix projet (FCFA)</Label>
                        <Input
                          id="price_project"
                          type="number"
                          placeholder="1000000"
                          value={formData.price_project}
                          onChange={(e) => setFormData((prev) => ({ ...prev, price_project: e.target.value }))}
                          className="mt-1 text-sm"
                        />
                      </div>
                    )}
                    <p className="mt-2 text-[10px] sm:text-xs text-slate-400">
                      Laissez vide si le prix est sur devis
                    </p>
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
                  onClick={() => router.push('/admin/services')}
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