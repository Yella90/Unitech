'use client';

import { FormEvent, useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FaEnvelope, FaLock, FaArrowRight, FaShieldAlt } from 'react-icons/fa';
import { toast, Toaster } from 'sonner';

const ADMIN_ROLES = ['admin', 'super_admin'];

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const error = query.get('error');
    const message = query.get('message');
    if (error === 'unauthorized') {
      toast.error(message || 'Accès non autorisé');
    }
  }, []);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch('/api/auth/session');
        const payload = await response.json();

        if (payload?.user && ADMIN_ROLES.includes(payload.user.role)) {
          window.location.assign('/admin');
          return;
        }
      } catch (err) {
        console.error('Erreur vérifier session:', err);
      } finally {
        setChecking(false);
      }
    };

    checkSession();
  }, []);

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log('submit login', { email });
    setStatusMessage('');
    setLoading(true);

    try {
      if (!email || !password) {
        const message = 'Veuillez remplir tous les champs';
        toast.error(message);
        setStatusMessage(message);
        setLoading(false);
        return;
      }

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        const message = result.error || 'Email ou mot de passe incorrect';
        toast.error(message);
        setStatusMessage(message);
        setLoading(false);
        return;
      }

      if (!result.user || !ADMIN_ROLES.includes(result.user.role)) {
        const message = "Accès non autorisé. Contactez l'administrateur.";
        toast.error(message);
        setStatusMessage(message);
        setLoading(false);
        return;
      }

      toast.success('Connexion réussie. Redirection...');
      window.location.assign('/admin');
      return;
    } catch (err) {
      console.error('Erreur login:', err);
      const message = 'Une erreur est survenue. Veuillez réessayer.';
      toast.error(message);
      setStatusMessage(message);
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
    <div className="min-h-screen flex items-center justify-center bg-[#F5F7FB]">
      <Toaster position="top-right" richColors />
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1E3A8A] text-white">
              <FaShieldAlt className="h-8 w-8" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-[#1E3A8A]">Administration UNITECH</CardTitle>
          <CardDescription>Connectez-vous pour accéder au dashboard d'administration</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <div className="relative mt-1">
                <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                <Input
                  id="email"
                  type="email"
                  placeholder="votre@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                  type="password"
                  placeholder="Votre mot de passe"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                  disabled={loading}
                />
              </div>
            </div>
            <Button type="submit" className="w-full bg-[#F97316] hover:bg-[#ea580c] text-white font-semibold" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Connexion en cours...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Se connecter
                  <FaArrowRight className="h-4 w-4" />
                </span>
              )}
            </Button>
            {statusMessage ? (
              <p className="text-center text-sm text-red-600 mt-3">{statusMessage}</p>
            ) : null}
            <div className="text-center text-xs text-slate-400 mt-4">
              <p>Accès réservé aux administrateurs UNITECH</p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
