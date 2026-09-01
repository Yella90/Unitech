// app/(auth)/login/page.tsx
'use client';

import { FormEvent, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  FaEnvelope, 
  FaLock, 
  FaArrowRight, 
  FaShieldAlt,
  FaSpinner,
  FaEye,
  FaEyeSlash,
  FaUserCog
} from 'react-icons/fa';
import { toast, Toaster } from 'sonner';

// ✅ Rôles autorisés pour l'accès admin
const ADMIN_ROLES = ['admin', 'super_admin', 'developer'];

export default function AdminLoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch('/api/auth/session');
        const data = await response.json();
        if (data.user && ADMIN_ROLES.includes(data.user.role)) {
          router.push('/admin');
        }
      } catch (error) {
        console.error('Erreur:', error);
      } finally {
        setChecking(false);
      }
    };

    checkSession();
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.email || !formData.password) {
        toast.error('Email et mot de passe requis');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || 'Erreur de connexion');
        setLoading(false);
        return;
      }

      // ✅ Vérifier si c'est un admin
      if (!result.user || !ADMIN_ROLES.includes(result.user.role)) {
        toast.error('Accès non autorisé. Espace réservé aux administrateurs.');
        setLoading(false);
        return;
      }

      toast.success('Connexion réussie !');
      setTimeout(() => {
        router.push('/admin');
      }, 500);

    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur serveur');
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F7FB]">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#1E3A8A] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F7FB] p-4">
      <Toaster position="top-right" richColors />
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1E3A8A] text-white">
              <FaUserCog className="h-8 w-8" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-[#1E3A8A]">Administration</CardTitle>
          <CardDescription>Connexion à l'espace administrateur UNITECH</CardDescription>
          <div className="mt-2 inline-block rounded-full bg-blue-50 px-3 py-1 text-xs text-blue-700">
            Accès réservé aux administrateurs
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <div className="relative mt-1">
                <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="admin@unitech.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="pl-10"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password">Mot de passe</Label>
              <div className="relative mt-1">
                <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Votre mot de passe"
                  value={formData.password}
                  onChange={handleChange}
                  className="pl-10 pr-10"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <FaEyeSlash className="h-4 w-4" /> : <FaEye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-[#1E3A8A] hover:bg-[#162f58] text-white font-semibold"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <FaSpinner className="animate-spin h-4 w-4" />
                  Connexion en cours...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Se connecter
                  <FaArrowRight className="h-4 w-4" />
                </span>
              )}
            </Button>

            <div className="text-center text-xs text-slate-400">
              <p>Espace réservé aux administrateurs UNITECH</p>
              <Link href="/connexion" className="text-[#F97316] hover:underline mt-2 block">
                Espace client →
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}