// app/(client)/register/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  FaEnvelope, 
  FaLock, 
  FaUser, 
  FaBuilding, 
  FaPhone,
  FaArrowRight,
  FaShieldAlt,
  FaSpinner,
  FaCheckCircle
} from 'react-icons/fa';
import { toast, Toaster } from 'sonner';

export default function ClientRegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
    company_name: '',
    phone: ''
  });
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong' | null>(null);

  const checkPasswordStrength = (password: string) => {
    if (!password) {
      setPasswordStrength(null);
      return;
    }
    let score = 0;
    if (password.length >= 8) score++;
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) score++;
    if (password.match(/\d/)) score++;
    if (password.match(/[^a-zA-Z\d]/)) score++;
    
    if (score <= 1) setPasswordStrength('weak');
    else if (score <= 2) setPasswordStrength('medium');
    else setPasswordStrength('strong');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'password') {
      checkPasswordStrength(value);
    }
  };

  const getStrengthColor = () => {
    if (!passwordStrength) return 'bg-gray-200';
    switch (passwordStrength) {
      case 'weak': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'strong': return 'bg-green-500';
    }
  };

  const getStrengthText = () => {
    if (!passwordStrength) return '';
    switch (passwordStrength) {
      case 'weak': return 'Faible';
      case 'medium': return 'Moyen';
      case 'strong': return 'Fort';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validation
      if (formData.password !== formData.confirmPassword) {
        toast.error('Les mots de passe ne correspondent pas');
        setLoading(false);
        return;
      }

      if (formData.password.length < 8) {
        toast.error('Le mot de passe doit contenir au moins 8 caractères');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/auth/client/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          first_name: formData.first_name,
          last_name: formData.last_name,
          company_name: formData.company_name,
          phone: formData.phone
        })
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || 'Erreur lors de l\'inscription');
        setLoading(false);
        return;
      }

      toast.success('Compte créé avec succès !');
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);

    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur serveur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F7FB] p-4">
      <Toaster position="top-right" richColors />
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1E3A8A] text-white">
              <FaShieldAlt className="h-8 w-8" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-[#1E3A8A]">Créer un compte</CardTitle>
          <CardDescription>
            Rejoignez UNITECH et accédez à nos services
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="first_name">Prénom</Label>
                <div className="relative mt-1">
                  <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                  <Input
                    id="first_name"
                    name="first_name"
                    placeholder="Jean"
                    value={formData.first_name}
                    onChange={handleChange}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="last_name">Nom</Label>
                <Input
                  id="last_name"
                  name="last_name"
                  placeholder="Dupont"
                  value={formData.last_name}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <div className="relative mt-1">
                <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="votre@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="company_name">Nom de l'entreprise</Label>
              <div className="relative mt-1">
                <FaBuilding className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                <Input
                  id="company_name"
                  name="company_name"
                  placeholder="Ma Société"
                  value={formData.company_name}
                  onChange={handleChange}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="phone">Téléphone</Label>
              <div className="relative mt-1">
                <FaPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="+221 77 123 45 67"
                  value={formData.phone}
                  onChange={handleChange}
                  className="pl-10"
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
                  type="password"
                  placeholder="Minimum 8 caractères"
                  value={formData.password}
                  onChange={handleChange}
                  className="pl-10"
                  required
                  minLength={8}
                />
              </div>
              {formData.password && (
                <div className="mt-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-gray-200 overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${getStrengthColor()}`}
                        style={{ 
                          width: passwordStrength === 'weak' ? '33%' : 
                                 passwordStrength === 'medium' ? '66%' : 
                                 passwordStrength === 'strong' ? '100%' : '0%' 
                        }}
                      />
                    </div>
                    <span className={`text-xs font-medium ${
                      passwordStrength === 'weak' ? 'text-red-500' :
                      passwordStrength === 'medium' ? 'text-yellow-500' :
                      passwordStrength === 'strong' ? 'text-green-500' :
                      'text-slate-400'
                    }`}>
                      {getStrengthText()}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
              <div className="relative mt-1">
                <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="Confirmer le mot de passe"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="pl-10"
                  required
                />
              </div>
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <p className="mt-1 text-xs text-red-500">Les mots de passe ne correspondent pas</p>
              )}
              {formData.confirmPassword && formData.password === formData.confirmPassword && (
                <p className="mt-1 text-xs text-green-500 flex items-center gap-1">
                  <FaCheckCircle className="h-3 w-3" /> Les mots de passe correspondent
                </p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full bg-[#F97316] hover:bg-[#ea580c] text-white font-semibold"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <FaSpinner className="animate-spin h-4 w-4" />
                  Inscription en cours...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Créer mon compte
                  <FaArrowRight className="h-4 w-4" />
                </span>
              )}
            </Button>

            <p className="text-center text-sm text-slate-500">
              Déjà un compte ?{' '}
              <Link href="/connexion" className="text-[#F97316] hover:underline font-medium">
                Se connecter
              </Link>
            </p>

            <div className="text-center text-xs text-slate-400">
              <p>En créant un compte, vous acceptez nos conditions générales</p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}