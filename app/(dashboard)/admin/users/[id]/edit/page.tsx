'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast, Toaster } from 'sonner';
import { 
  FaArrowLeft, 
  FaSave, 
  FaUserEdit, 
  FaSpinner,
  FaEnvelope,
  FaIdCard,
  FaUserTag,
  FaBuilding,
  FaPhone,
  FaUserCheck,
  FaUserTimes,
  FaShieldAlt
} from 'react-icons/fa';
import Link from 'next/link';

// ✅ Interface avec params Promise (Next.js 15)
interface EditUserPageProps {
  params: Promise<{
    id: string;
  }>;
}

const roles = [
  { value: 'admin', label: 'Administrateur', icon: '🛡️' },
  { value: 'super_admin', label: 'Super Admin', icon: '👑' },
  { value: 'project_manager', label: 'Chef de Projet', icon: '📋' },
  { value: 'team_lead', label: 'Lead Technique', icon: '👨‍💻' },
  { value: 'developer', label: 'Développeur', icon: '💻' },
  { value: 'designer', label: 'Designer', icon: '🎨' },
  { value: 'client', label: 'Client', icon: '🤝' },
  { value: 'viewer', label: 'Visiteur', icon: '👀' },
];

const departments = [
  { value: '', label: 'Aucun' },
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

  // ✅ États pour l'interface
  const [fullName, setFullName] = useState('');

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

        setFullName([data.first_name, data.last_name].filter(Boolean).join(' ') || 'Utilisateur');
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
      <div className="min-h-screen flex items-center justify-center bg-[#F5F7FB] p-4">
        <div className="h-10 w-10 sm:h-12 sm:w-12 animate-spin rounded-full border-4 border-[#1E3A8A] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#F5F7FB] p-3 sm:p-4 md:p-6">
      <Toaster position="top-right" richColors />

      <div className="mx-auto max-w-2xl">
        {/* En-tête responsive */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
          <Link 
            href="/admin/users" 
            className="inline-flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-slate-500 hover:text-[#1E3A8A] transition"
          >
            <FaArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline">Retour aux utilisateurs</span>
            <span className="xs:hidden">Retour</span>
          </Link>
          <span className="text-xs sm:text-sm text-slate-300">|</span>
          <span className="text-xs sm:text-sm text-slate-500 truncate">
            Modification: {fullName}
          </span>
        </div>

        <Card className="border-0 sm:border shadow-sm sm:shadow-md">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg md:text-xl font-bold text-[#1E3A8A] flex flex-wrap items-center gap-2">
              <FaUserEdit className="h-5 w-5 sm:h-6 sm:w-6 text-[#F97316] flex-shrink-0" />
              <span>Modifier l'utilisateur</span>
              <span className="text-xs sm:text-sm font-normal text-slate-400 truncate">
                - {formData.email}
              </span>
            </CardTitle>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Modifiez les informations du compte utilisateur.
            </p>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              {/* Email (non modifiable) - avec icône */}
              <div>
                <Label htmlFor="email" className="text-xs sm:text-sm flex items-center gap-2">
                  <FaEnvelope className="h-3 w-3 sm:h-4 sm:w-4 text-slate-400" />
                  Email
                </Label>
                <Input 
                  id="email" 
                  value={formData.email} 
                  disabled 
                  className="mt-1 text-sm bg-slate-50 text-slate-600"
                />
                <p className="mt-1 text-[10px] sm:text-xs text-slate-400">
                  L'email ne peut pas être modifié pour des raisons de sécurité
                </p>
              </div>

              {/* Prénom et Nom - responsive */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name" className="text-xs sm:text-sm flex items-center gap-2">
                    <FaIdCard className="h-3 w-3 sm:h-4 sm:w-4 text-slate-400" />
                    Prénom
                  </Label>
                  <Input 
                    id="first_name" 
                    name="first_name" 
                    value={formData.first_name} 
                    onChange={handleChange} 
                    className="mt-1 text-sm"
                    placeholder="Jean"
                  />
                </div>
                <div>
                  <Label htmlFor="last_name" className="text-xs sm:text-sm">
                    Nom
                  </Label>
                  <Input 
                    id="last_name" 
                    name="last_name" 
                    value={formData.last_name} 
                    onChange={handleChange} 
                    className="mt-1 text-sm"
                    placeholder="Dupont"
                  />
                </div>
              </div>

              {/* Rôle et Département - responsive */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="role" className="text-xs sm:text-sm flex items-center gap-2">
                    <FaUserTag className="h-3 w-3 sm:h-4 sm:w-4 text-slate-400" />
                    Rôle
                  </Label>
                  <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full mt-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] focus:border-transparent bg-white"
                  >
                    {roles.map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.icon} {role.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="department" className="text-xs sm:text-sm flex items-center gap-2">
                    <FaBuilding className="h-3 w-3 sm:h-4 sm:w-4 text-slate-400" />
                    Département
                  </Label>
                  <select
                    id="department"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    className="w-full mt-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] focus:border-transparent bg-white"
                  >
                    {departments.map((dept) => (
                      <option key={dept.value} value={dept.value}>
                        {dept.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Téléphone */}
              <div>
                <Label htmlFor="phone" className="text-xs sm:text-sm flex items-center gap-2">
                  <FaPhone className="h-3 w-3 sm:h-4 sm:w-4 text-slate-400" />
                  Téléphone
                </Label>
                <Input 
                  id="phone" 
                  name="phone" 
                  value={formData.phone} 
                  onChange={handleChange} 
                  className="mt-1 text-sm"
                  placeholder="+223 90 69 23 63"
                />
              </div>

              {/* Statut - avec boutons toggle */}
              <div>
                <Label className="mb-2 block text-xs sm:text-sm flex items-center gap-2">
                  <FaShieldAlt className="h-3 w-3 sm:h-4 sm:w-4 text-slate-400" />
                  Statut du compte
                </Label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, is_active: true }))}
                    className={`flex-1 sm:flex-none px-4 py-2.5 rounded-lg border-2 transition ${
                      formData.is_active
                        ? 'bg-green-50 border-green-500 text-green-700 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    <span className="flex items-center justify-center gap-2 text-sm">
                      <FaUserCheck className="h-4 w-4" />
                      Actif
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, is_active: false }))}
                    className={`flex-1 sm:flex-none px-4 py-2.5 rounded-lg border-2 transition ${
                      !formData.is_active
                        ? 'bg-red-50 border-red-500 text-red-700 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    <span className="flex items-center justify-center gap-2 text-sm">
                      <FaUserTimes className="h-4 w-4" />
                      Inactif
                    </span>
                  </button>
                </div>
                <p className="mt-1 text-[10px] sm:text-xs text-slate-400">
                  {formData.is_active 
                    ? '✅ L\'utilisateur peut se connecter et accéder au système' 
                    : '❌ L\'utilisateur ne peut pas se connecter'}
                </p>
              </div>

              {/* Boutons - responsive */}
              <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t border-slate-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/admin/users')}
                  className="w-full sm:w-auto text-xs sm:text-sm"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  className="w-full sm:w-auto bg-[#F97316] hover:bg-[#ea580c] text-white font-semibold text-xs sm:text-sm"
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
              </div>

              {/* Information de sécurité */}
              <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-3 sm:p-4">
                <div className="flex items-start gap-3">
                  <FaShieldAlt className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-yellow-800">Sécurité</p>
                    <p className="text-[10px] sm:text-xs text-yellow-700">
                      Le rôle "{roles.find(r => r.value === formData.role)?.label || formData.role}" 
                      détermine les permissions de l'utilisateur dans le système.
                    </p>
                  </div>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}