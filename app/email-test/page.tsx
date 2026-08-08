// app/email-test/page.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast, Toaster } from 'sonner';

export default function EmailTestPage() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const testSimpleEmail = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/email/test-simple');
      const data = await response.json();
      setResults(data);
      if (data.success) {
        toast.success('✅ Email simple envoyé !');
      } else {
        toast.error('❌ Erreur: ' + data.error);
      }
    } catch (error) {
      toast.error('❌ Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const testAllEmails = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/email/test');
      const data = await response.json();
      setResults(data);
      if (data.success) {
        toast.success('✅ Tous les emails envoyés !');
      } else {
        toast.error('❌ Erreur: ' + data.message);
      }
    } catch (error) {
      toast.error('❌ Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const testTemplates = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/email/test-template');
      const data = await response.json();
      setResults(data);
      if (data.success) {
        toast.success('✅ Templates testés !');
      } else {
        toast.error('❌ Erreur: ' + data.message);
      }
    } catch (error) {
      toast.error('❌ Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FB] p-6">
      <Toaster position="top-right" richColors />
      
      <div className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold text-[#1E3A8A] mb-6">🧪 Test des emails</h1>
        
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Email simple</CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={testSimpleEmail} 
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Envoi...' : '📧 Envoyer'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tous les emails</CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={testAllEmails} 
                disabled={loading}
                className="w-full bg-[#F97316] hover:bg-[#ea580c] text-white"
              >
                {loading ? 'Envoi...' : '📨 Tester tout'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Templates</CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={testTemplates} 
                disabled={loading}
                variant="outline"
                className="w-full"
              >
                {loading ? 'Envoi...' : '📋 Tester templates'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {results && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Résultats</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-slate-100 p-4 rounded-lg overflow-auto max-h-96 text-xs">
                {JSON.stringify(results, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}