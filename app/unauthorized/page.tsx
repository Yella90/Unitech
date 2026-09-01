// app/unauthorized/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FaShieldAlt, FaArrowLeft, FaSignOutAlt } from 'react-icons/fa';

export default function UnauthorizedPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [role, setRole] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setRole(searchParams.get('role'));
    setEmail(searchParams.get('email'));
    setMessage(searchParams.get('message'));
  }, [searchParams]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
      console.error('Erreur déconnexion:', error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F7FB] p-4">
      <Card className="max-w-md w-full shadow-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
              <FaShieldAlt className="h-8 w-8 text-red-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-red-600">Accès non autorisé</CardTitle>
          <CardDescription>
            Vous n'avez pas les permissions nécessaires pour accéder à cette page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-slate-50 rounded-lg p-4 space-y-2">
            <p className="text-sm text-slate-600 text-center">
              {email && (
                <span className="block">
                  Utilisateur : <strong className="text-[#1E3A8A]">{email}</strong>
                </span>
              )}
              {role && (
                <span className="block">
                  Rôle actuel : <strong className="text-[#1E3A8A]">{role}</strong>
                </span>
              )}
              {message && (
                <span className="block text-xs text-red-500 mt-2">
                  {message}
                </span>
              )}
            </p>
            <p className="text-xs text-slate-500 text-center">
              Contactez l'administrateur pour modifier vos permissions.
            </p>
          </div>
          
          <div className="flex flex-col gap-2">
            <Button 
              onClick={() => router.push('/')}
              className="w-full bg-[#1E3A8A] hover:bg-[#162f58]"
            >
              <FaArrowLeft className="mr-2 h-4 w-4" />
              Retour à l'accueil
            </Button>
            <Button 
              onClick={handleLogout}
              variant="outline"
              className="w-full"
            >
              <FaSignOutAlt className="mr-2 h-4 w-4" />
              Se déconnecter
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}