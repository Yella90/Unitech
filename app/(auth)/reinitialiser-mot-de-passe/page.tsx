// app/(auth)/reinitialiser-mot-de-passe/page.tsx
'use client';

import { FormEvent, Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FaLock, FaSpinner, FaCheckCircle, FaEye, FaEyeSlash } from 'react-icons/fa';

const MIN_LENGTH = 8;

function ResetPasswordForm() {
  const token = useSearchParams().get('token') || '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loginHref, setLoginHref] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < MIN_LENGTH) {
      setError(`Le mot de passe doit contenir au moins ${MIN_LENGTH} caractères.`);
      return;
    }
    if (password !== confirm) {
      setError('Les deux mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/password/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(result.error || 'Le mot de passe n’a pas pu être modifié.');
      } else {
        setLoginHref(result.login || '/connexion');
      }
    } catch {
      setError('Le mot de passe n’a pas pu être modifié. Vérifiez votre connexion.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-xl font-bold text-[#1E3A8A]">Lien incomplet</CardTitle>
          <CardDescription>Ouvrez le lien reçu par e-mail, ou demandez-en un nouveau.</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Link href="/mot-de-passe-oublie" className="text-sm font-medium text-[#1E3A8A] hover:underline">
            Demander un nouveau lien
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md shadow-xl">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1E3A8A] text-white">
            <FaLock className="h-7 w-7" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold text-[#1E3A8A]">Nouveau mot de passe</CardTitle>
        <CardDescription>Choisissez un mot de passe d’au moins {MIN_LENGTH} caractères.</CardDescription>
      </CardHeader>
      <CardContent>
        {loginHref ? (
          <div className="space-y-4 text-center">
            <FaCheckCircle className="mx-auto h-10 w-10 text-green-600" />
            <p className="text-sm text-slate-700" role="status">
              Votre mot de passe a été modifié. Par sécurité, vos autres sessions ont été fermées.
            </p>
            <Link
              href={loginHref}
              className="inline-flex items-center justify-center rounded-lg bg-[#1E3A8A] px-4 py-2 text-sm font-semibold text-white hover:bg-[#162f58]"
            >
              Se connecter
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="password">Nouveau mot de passe</Label>
              <div className="relative mt-1">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10"
                  minLength={MIN_LENGTH}
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <FaEyeSlash className="h-4 w-4" /> : <FaEye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div>
              <Label htmlFor="confirm">Confirmer le mot de passe</Label>
              <Input
                id="confirm"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="mt-1"
                required
                disabled={loading}
              />
            </div>

            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</p>}

            <Button
              type="submit"
              className="w-full bg-[#1E3A8A] hover:bg-[#162f58] text-white font-semibold"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <FaSpinner className="animate-spin h-4 w-4" />
                  Enregistrement…
                </span>
              ) : (
                'Enregistrer le mot de passe'
              )}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F7FB] p-4">
      <Suspense>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
