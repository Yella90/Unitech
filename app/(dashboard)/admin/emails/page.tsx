// app/(dashboard)/admin/emails/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  FaEnvelope, 
  FaCheckCircle, 
  FaClock, 
  FaExclamationTriangle,
  FaSync,
  FaRobot
} from 'react-icons/fa';

type Email = {
  id: string;
  from_email: string;
  to_email: string;
  subject: string;
  body: string;
  status: string;
  category: string;
  ai_analyzed: boolean;
  ai_response: string;
  created_at: string;
};

export default function AdminEmailsPage() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadEmails();
  }, []);

  const loadEmails = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('emails')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEmails(data || []);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const processEmails = async () => {
    try {
      setProcessing(true);
      const response = await fetch('/api/emails/process', {
        method: 'POST',
      });
      
      if (response.ok) {
        await loadEmails();
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setProcessing(false);
    }
  };

  const statusMap: Record<string, { label: string; color: string }> = {
    pending: { label: 'En attente', color: 'bg-yellow-100 text-yellow-700' },
    analyzed: { label: 'Analysé', color: 'bg-blue-100 text-blue-700' },
    sent: { label: 'Envoyé', color: 'bg-green-100 text-green-700' },
    error: { label: 'Erreur', color: 'bg-red-100 text-red-700' },
  };

  return (
    <main className="min-h-screen bg-[#F5F7FB] p-6">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-[#1E3A8A] flex items-center gap-3">
              <FaEnvelope className="h-8 w-8 text-[#F97316]" />
              Gestion des Emails
            </h1>
            <p className="mt-1 text-slate-500">
              Suivez et analysez les emails entrants
            </p>
          </div>
          <div className="flex gap-3">
            <Button onClick={processEmails} disabled={processing} variant="outline">
              <FaSync className={`mr-2 h-4 w-4 ${processing ? 'animate-spin' : ''}`} />
              {processing ? 'Traitement...' : 'Traiter les emails'}
            </Button>
            <Button onClick={loadEmails} variant="outline">
              <FaSync className="mr-2 h-4 w-4" />
              Rafraîchir
            </Button>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-slate-500">Total</p>
              <p className="text-2xl font-bold text-[#1E3A8A]">{emails.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-slate-500">En attente</p>
              <p className="text-2xl font-bold text-yellow-600">
                {emails.filter(e => e.status === 'pending').length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-slate-500">Analysés par IA</p>
              <p className="text-2xl font-bold text-blue-600">
                {emails.filter(e => e.ai_analyzed).length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-slate-500">Envoyés</p>
              <p className="text-2xl font-bold text-green-600">
                {emails.filter(e => e.status === 'sent').length}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Liste des emails */}
        <Card>
          <CardHeader>
            <CardTitle>Emails récents</CardTitle>
          </CardHeader>
          <CardContent>
            {emails.length === 0 ? (
              <p className="text-center text-slate-500 py-8">Aucun email</p>
            ) : (
              <div className="space-y-4">
                {emails.slice(0, 10).map((email) => {
                  const status = statusMap[email.status] || statusMap.pending;
                  return (
                    <div key={email.id} className="border-b border-slate-100 pb-4 last:border-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <span className="font-semibold text-slate-800">
                              {email.from_email}
                            </span>
                            <Badge className={status.color}>
                              {status.label}
                            </Badge>
                            {email.ai_analyzed && (
                              <Badge className="bg-purple-100 text-purple-700">
                                <FaRobot className="mr-1 h-3 w-3" />
                                IA
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm font-medium text-slate-700">
                            {email.subject}
                          </p>
                          <p className="text-sm text-slate-500 line-clamp-2 mt-1">
                            {email.body}
                          </p>
                          {email.ai_response && (
                            <div className="mt-2 p-2 bg-purple-50 rounded-lg text-sm text-slate-600">
                              <span className="font-medium text-purple-700">Réponse IA :</span>
                              {email.ai_response}
                            </div>
                          )}
                          <p className="text-xs text-slate-400 mt-1">
                            {new Date(email.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}