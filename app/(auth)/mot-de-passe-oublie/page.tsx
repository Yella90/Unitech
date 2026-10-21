// app/(auth)/mot-de-passe-oublie/page.tsx
'use client';

import { FormEvent, Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FaEnvelope, FaKey, FaSpinner, FaCheckCircle } from 'react-icons/fa';

function ForgotPasswordForm() {
  const params = useSearchParams();
  const type = params.get('espace') === 'admin' ? 'admin' : 'client';
  const loginHref = type === 'admin' ? '/login' : '/connexion';

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/auth/password/forgot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, type }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(result.error || 'La demande n’a pas pu être envoyée. Réessayez.');
      } else {
        setSent(result.message);
      }
    } catch {
      setError('La demande n’a pas pu être envoyée. Vérifiez votre connexion.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md shadow-xl">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1E3A8A] text-white">
            <FaKey className="h-7 w-7" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold text-[#1E3A8A]">Mot de passe oublié</CardTitle>
        <CardDescription>
          {type === 'admin' ? 'Espace administrateur' : 'Espace client'} : recevez un lien pour choisir un nouveau mot de passe.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {sent ? (
          <div className="space-y-4 text-center">
            <FaCheckCircle className="mx-auto h-10 w-10 text-green-600" />
            <p className="text-sm text-slate-700" role="status">{sent}</p>
            <p className="text-xs text-slate-500">Le lien est valable 1 heure.</p>
            <Link href={loginHref} className="inline-block text-sm font-medium text-[#1E3A8A] hover:underline">
              Retour à la connexion
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Adresse e-mail du compte</Label>
              <div className="relative mt-1">
                <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</p>}

            <Button
              type="submit"
              className="w-full bg-[#1E3A8A] hover:bg-[#162f58] text-white font-semibold"
              disabled={loading || !email}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <FaSpinner className="animate-spin h-4 w-4" />
                  Envoi en cours…
                </span>
              ) : (
                'Recevoir le lien'
              )}
            </Button>

            <p className="text-center text-sm">
              <Link href={loginHref} className="text-[#1E3A8A] hover:underline">
                Retour à la connexion
              </Link>
            </p>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F7FB] p-4">
      <Suspense>
        <ForgotPasswordForm />
      </Suspense>
    </div>
  );
}
