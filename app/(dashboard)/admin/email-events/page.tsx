// app/(dashboard)/admin/email-events/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type EmailEvent = {
  id: string;
  action: string;
  details: any;
  created_at: string;
};

const eventColors: Record<string, string> = {
  delivered: 'bg-green-100 text-green-700',
  open: 'bg-blue-100 text-blue-700',
  click: 'bg-purple-100 text-purple-700',
  bounce: 'bg-red-100 text-red-700',
  drop: 'bg-yellow-100 text-yellow-700',
  unsubscribe: 'bg-gray-100 text-gray-700',
  spamreport: 'bg-orange-100 text-orange-700',
};

export default function EmailEventsPage() {
  const [events, setEvents] = useState<EmailEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const { data, error } = await supabase
          .from('email_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);

        if (error) throw error;
        setEvents(data || []);
      } catch (error) {
        console.error('Erreur:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  return (
    <main className="min-h-screen bg-[#F5F7FB] p-6">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-3xl font-bold text-[#1E3A8A] mb-6">📊 Événements Email</h1>

        <Card>
          <CardHeader>
            <CardTitle>Derniers événements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {events.map((event) => (
                <div key={event.id} className="border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <Badge className={eventColors[event.action] || 'bg-gray-100'}>
                      {event.action}
                    </Badge>
                    <span className="text-sm text-slate-600">
                      {event.details?.email || 'N/A'}
                    </span>
                    <span className="text-xs text-slate-400 ml-auto">
                      {new Date(event.created_at).toLocaleString()}
                    </span>
                  </div>
                  {event.details?.url && (
                    <p className="text-xs text-slate-500 mt-1 truncate">
                      {event.details.url}
                    </p>
                  )}
                </div>
              ))}
              {events.length === 0 && (
                <p className="text-center text-slate-500 py-8">Aucun événement reçu</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}