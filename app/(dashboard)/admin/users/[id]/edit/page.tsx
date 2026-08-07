'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast, Toaster } from 'sonner';
import { FaArrowLeft, FaSave, FaUserEdit } from 'react-icons/fa';
import Link from 'next/link';

// ✅ Interface avec params Promise (Next.js 15)
interface EditUserPageProps {
  params: Promise<{
    id: string;
  }>;
}

const roles = [
  { value: 'admin', label: 'Administrateur' },
  { value: 'project_manager', label: 'Chef de Projet' },
  { value: 'team_lead', label: 'Lead Technique' },
  { value: 'developer', label: 'Développeur' },
  { value: 'designer', label: 'Designer' },
  { value: 'client', label: 'Client' },
  { value: 'viewer', label: 'Visiteur' },
];

const departments = [
  { value: 'direction', label: 'Direction' },
  { value: 'development', label: 'Développement' },
  { value: 'design', label: 'Design' },
  { value: 'sales', label: 'Commercial' },
  { value: 'finance', label: 'Finance' },
  { value: 'hr', label: 'Ressources Humaines' },
  { value: 'marketing', label: 'Marketing' },
];

export default function EditUserPage({ params }: EditUserPageProps) {
  const router = useRouter();
  // ✅ Utiliser React.use() pour déballer la Promise
  const { id: userId } = use(params);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    role: 'viewer',
    department: '',
    phone: '',
    is_active: true,
  });

  useEffect(() => {
    const fetchUser = async () => {
      if (!userId) {
        console.error('❌ ID utilisateur manquant');
        toast.error('ID utilisateur invalide');
        router.push('/admin/users');
        return;
      }

      try {
        setLoading(true);

        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single();

        if (error) {
          console.error('❌ Erreur:', error);
          toast.error('Erreur lors du chargement');
          router.push('/admin/users');
          return;
        }

        if (!data) {
          toast.error('Utilisateur non trouvé');
          router.push('/admin/users');
          return;
        }

        setFormData({
          email: data.email || '',
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          role: data.role || 'viewer',
          department: data.department || '',
          phone: data.phone || '',
          is_active: data.is_active !== false,
        });
      } catch (error: any) {
        console.error('❌ Erreur:', error);
        toast.error(error.message || 'Erreur lors du chargement');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      toast.error('ID utilisateur invalide');
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase
        .from('users')
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          role: formData.role,
          department: formData.department || null,
          phone: formData.phone || null,
          is_active: formData.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) throw error;

      toast.success('✅ Utilisateur mis à jour avec succès !');
      setTimeout(() => {
        router.push('/admin/users');
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

      <div className="mx-auto max-w-2xl">
        <Link href="/admin/users" className="inline-flex items-center gap-2 text-slate-500 hover:text-[#1E3A8A] transition mb-4">
          <FaArrowLeft className="h-4 w-4" />
          Retour aux utilisateurs
        </Link>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-[#1E3A8A]">
              <FaUserEdit className="inline mr-2 h-6 w-6 text-[#F97316]" />
              Modifier l'utilisateur
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email (non modifiable) */}
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={formData.email} disabled className="bg-slate-50" />
                <p className="mt-1 text-xs text-slate-400">L'email ne peut pas être modifié</p>
              </div>

              {/* Prénom et Nom */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="first_name">Prénom</Label>
                  <Input id="first_name" name="first_name" value={formData.first_name} onChange={handleChange} />
                </div>
                <div>
                  <Label htmlFor="last_name">Nom</Label>
                  <Input id="last_name" name="last_name" value={formData.last_name} onChange={handleChange} />
                </div>
              </div>

              {/* Rôle et Département */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="role">Rôle</Label>
                  <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                  >
                    {roles.map((role) => (
                      <option key={role.value} value={role.value}>{role.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="department">Département</Label>
                  <select
                    id="department"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                  >
                    <option value="">Aucun</option>
                    {departments.map((dept) => (
                      <option key={dept.value} value={dept.value}>{dept.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Téléphone */}
              <div>
                <Label htmlFor="phone">Téléphone</Label>
                <Input id="phone" name="phone" value={formData.phone} onChange={handleChange} />
              </div>

              {/* Statut */}
              <div>
                <Label className="mb-2 block">Statut</Label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, is_active: true }))}
                    className={`px-4 py-2 rounded-lg border ${
                      formData.is_active
                        ? 'bg-green-100 border-green-400 text-green-700'
                        : 'bg-white border-slate-200 text-slate-500'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-green-500"></span>
                      Actif
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, is_active: false }))}
                    className={`px-4 py-2 rounded-lg border ${
                      !formData.is_active
                        ? 'bg-red-100 border-red-400 text-red-700'
                        : 'bg-white border-slate-200 text-slate-500'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-red-500"></span>
                      Inactif
                    </span>
                  </button>
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
                  onClick={() => router.push('/admin/users')}
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