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
import { FaArrowLeft, FaSave } from 'react-icons/fa';
import Link from 'next/link';

const colors = ['blue', 'orange', 'green'];
const statuses = ['planning', 'in-progress', 'testing', 'pending', 'completed', 'on-hold'];

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
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

  return (
    <main className="min-h-screen bg-[#F5F7FB] p-6">
      <Toaster position="top-right" richColors />
      
      <div className="mx-auto max-w-3xl">
        <Link href="/admin/projects" className="inline-flex items-center gap-2 text-slate-500 hover:text-[#1E3A8A] transition mb-4">
          <FaArrowLeft className="h-4 w-4" />
          Retour aux projets
        </Link>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-[#1E3A8A]">Nouveau projet</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Nom */}
              <div>
                <Label htmlFor="name">Nom du projet *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Ex: SaaS Gestion Scolaire"
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
                  placeholder="Ex: school-saas"
                  required
                />
                <p className="mt-1 text-xs text-slate-400">Identifiant unique pour l'URL</p>
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Description du projet..."
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
                    placeholder="Ex: 🏫"
                    maxLength={2}
                  />
                </div>
                <div>
                  <Label htmlFor="color">Couleur</Label>
                  <Select
                    value={formData.color}
                    onValueChange={(value) => handleSelectChange('color', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir une couleur" />
                    </SelectTrigger>
                    <SelectContent>
                      {colors.map((color) => (
                        <SelectItem key={color} value={color}>
                          <span className={`inline-block h-4 w-4 rounded-full bg-${color}-500`} />
                          {color}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Progression et Statut */}
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
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <Label htmlFor="status">Statut</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => handleSelectChange('status', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir un statut" />
                    </SelectTrigger>
                    <SelectContent>
                      {statuses.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Jalon */}
              <div>
                <Label htmlFor="next_milestone">Prochain jalon</Label>
                <Input
                  id="next_milestone"
                  name="next_milestone"
                  value={formData.next_milestone}
                  onChange={handleChange}
                  placeholder="Ex: Beta interne - Septembre 2026"
                />
              </div>

              {/* Problème et Solution */}
              <div>
                <Label htmlFor="problem">Problème résolu</Label>
                <Textarea
                  id="problem"
                  name="problem"
                  value={formData.problem}
                  onChange={handleChange}
                  placeholder="Quel problème ce projet résout-il ?"
                  rows={2}
                />
              </div>
              <div>
                <Label htmlFor="solution">Solution</Label>
                <Textarea
                  id="solution"
                  name="solution"
                  value={formData.solution}
                  onChange={handleChange}
                  placeholder="Quelle est votre solution ?"
                  rows={2}
                />
              </div>

              {/* Boutons */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  className="bg-[#F97316] hover:bg-[#ea580c] text-white font-semibold"
                  disabled={loading}
                >
                  <FaSave className="mr-2 h-4 w-4" />
                  {loading ? 'Création...' : 'Créer le projet'}
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