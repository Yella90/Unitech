'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast, Toaster } from 'sonner';
import { FaArrowLeft, FaPlus, FaUserPlus } from 'react-icons/fa';
import Link from 'next/link';

const roles = [
  { value: 'admin', label: 'Administrateur' },
  { value: 'project_manager', label: 'Chef de projet' },
  { value: 'team_lead', label: 'Lead technique' },
  { value: 'developer', label: 'Développeur' },
  { value: 'designer', label: 'Designer' },
  { value: 'client', label: 'Client' },
  { value: 'viewer', label: 'Visiteur' },
];

export default function NewUserPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    role: 'viewer',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { error } = await supabase.from('users').insert({
        email: formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name,
        role: formData.role,
        created_at: new Date().toISOString(),
      });

      if (error) throw error;

      toast.success('Utilisateur créé avec succès');
      router.push('/admin/users');
    } catch (err: any) {
      console.error('Erreur création utilisateur :', err);
      toast.error(err.message || 'Erreur lors de la création');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F5F7FB] p-6">
      <Toaster position="top-right" richColors />
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#1E3A8A] flex items-center gap-3">
              <FaUserPlus className="h-8 w-8 text-[#F97316]" />
              Nouvel utilisateur
            </h1>
            <p className="mt-1 text-slate-500">Ajouter un compte administrateur ou un membre de l'équipe.</p>
          </div>
          <Link href="/admin/users">
            <Button variant="outline">Retour à la liste</Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Créer un utilisateur</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="first_name">Prénom</Label>
                  <Input id="first_name" name="first_name" value={formData.first_name} onChange={handleChange} required />
                </div>
                <div>
                  <Label htmlFor="last_name">Nom</Label>
                  <Input id="last_name" name="last_name" value={formData.last_name} onChange={handleChange} required />
                </div>
              </div>
              <div>
                <Label htmlFor="role">Rôle</Label>
                <select id="role" name="role" value={formData.role} onChange={handleChange} className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm">
                  {roles.map((role) => (
                    <option key={role.value} value={role.value}>{role.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" type="button" onClick={() => router.push('/admin/users')}>Annuler</Button>
                <Button type="submit" className="bg-[#F97316] hover:bg-[#ea580c] text-white" disabled={saving}>
                  <FaPlus className="mr-2 h-4 w-4" /> {saving ? 'Création...' : 'Créer'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
