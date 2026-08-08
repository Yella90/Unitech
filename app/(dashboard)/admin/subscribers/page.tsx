// app/(dashboard)/admin/subscribers/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FaEnvelope, 
  FaCheckCircle, 
  FaDownload, 
  FaTrash, 
  FaUsers,
  FaEye,
  FaReply,
  FaArchive,
  FaSync
} from 'react-icons/fa';
import { toast, Toaster } from 'sonner';

type Subscriber = {
  id: string;
  email: string;
  interested_in: string[] | null;
  created_at: string | null;
};

type Contact = {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'pending' | 'read' | 'replied' | 'archived';
  created_at: string;
  updated_at: string;
};

const contactStatusMap: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { 
    label: 'En attente', 
    color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    icon: <FaEnvelope className="h-3.5 w-3.5" />
  },
  read: { 
    label: 'Lu', 
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    icon: <FaEye className="h-3.5 w-3.5" />
  },
  replied: { 
    label: 'Répondu', 
    color: 'bg-green-100 text-green-700 border-green-200',
    icon: <FaReply className="h-3.5 w-3.5" />
  },
  archived: { 
    label: 'Archivé', 
    color: 'bg-gray-100 text-gray-700 border-gray-200',
    icon: <FaArchive className="h-3.5 w-3.5" />
  },
};

export default function AdminSubscribersPage() {
  const router = useRouter();
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState('subscribers');

  useEffect(() => {
    const checkAuthAndLoad = async () => {
      try {
        const sessionRes = await fetch('/api/auth/session');
        const sessionData = await sessionRes.json();

        if (!sessionData.user || !['admin', 'super_admin'].includes(sessionData.user.role)) {
          router.push('/login?error=unauthorized&message=Accès réservé aux administrateurs');
          return;
        }

        setIsAdmin(true);
        await loadData();

      } catch (error) {
        console.error('Erreur:', error);
        toast.error('Erreur lors du chargement');
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndLoad();
  }, [router]);

  const loadData = async () => {
    try {
      console.log('📊 Chargement des données...');

      // 1. Charger les abonnés
      const { data: subscribersData, error: subError } = await supabase
        .from('newsletter_subscribers')
        .select('*')
        .order('created_at', { ascending: false });

      if (subError) {
        console.error('❌ Erreur abonnés:', subError);
        toast.error('Erreur lors du chargement des abonnés');
      } else {
        console.log(`📊 ${subscribersData?.length || 0} abonnés chargés`);
        setSubscribers(subscribersData || []);
      }

      // 2. Charger les contacts
      console.log('📊 Chargement des contacts...');
      
      const { data: contactsData, error: contactError } = await supabase
        .from('contacts')
        .select('*')
        .order('created_at', { ascending: false });

      if (contactError) {
        console.error('❌ Erreur contacts:', contactError);
        toast.error(`Erreur lors du chargement des messages: ${contactError.message}`);
      } else {
        console.log(`📊 ${contactsData?.length || 0} contacts chargés`);
        console.log('📊 Données contacts:', contactsData);
        setContacts(contactsData || []);
      }

    } catch (error) {
      console.error('❌ Erreur générale:', error);
      toast.error('Erreur lors du chargement');
    }
  };

  // ✅ Supprimer un abonné
  const handleDeleteSubscriber = async (id: string, email: string) => {
    if (!confirm(`Supprimer l'abonné "${email}" ?`)) return;

    try {
      const { error } = await supabase
        .from('newsletter_subscribers')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('✅ Abonné supprimé avec succès');
      setSubscribers(subscribers.filter(s => s.id !== id));
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  // ✅ Supprimer un contact
  const handleDeleteContact = async (id: string, name: string) => {
    if (!confirm(`Supprimer le message de "${name}" ?`)) return;

    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('✅ Message supprimé avec succès');
      setContacts(contacts.filter(c => c.id !== id));
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  // ✅ Mettre à jour le statut d'un contact
  const updateContactStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from('contacts')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      setContacts(contacts.map(c => c.id === id ? { ...c, status: status as any } : c));
      toast.success(`Statut mis à jour : ${contactStatusMap[status]?.label}`);
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  // ✅ Exporter les emails en CSV
  const handleExportCSV = () => {
    const dataToExport = activeTab === 'subscribers' ? subscribers : contacts;
    
    if (dataToExport.length === 0) {
      toast.error('Aucune donnée à exporter');
      return;
    }

    try {
      let headers: string[];
      let rows: string[][];

      if (activeTab === 'subscribers') {
        headers = ['Email', 'Intérêts', "Date d'inscription"];
        rows = subscribers.map(s => [
          s.email,
          s.interested_in?.join('; ') || '',
          new Date(s.created_at || '').toLocaleDateString('fr-FR')
        ]);
      } else {
        headers = ['Nom', 'Email', 'Sujet', 'Message', 'Statut', 'Date'];
        rows = contacts.map(c => [
          c.name,
          c.email,
          c.subject || '',
          c.message,
          contactStatusMap[c.status]?.label || c.status,
          new Date(c.created_at).toLocaleDateString('fr-FR')
        ]);
      }

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${activeTab}_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

      toast.success('✅ Export CSV réussi');
    } catch (error) {
      console.error('Erreur export:', error);
      toast.error('Erreur lors de l\'export');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F7FB]">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#1E3A8A] border-t-transparent"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const pendingContacts = contacts.filter(c => c.status === 'pending').length;

  return (
    <main className="min-h-screen bg-[#F5F7FB] p-6">
      <Toaster position="top-right" richColors />
      
      <div className="mx-auto max-w-7xl">
        {/* En-tête */}
        <div className="mb-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#1E3A8A] flex items-center gap-3">
                <FaEnvelope className="h-8 w-8 text-[#F97316]" />
                Communications
              </h1>
              <p className="mt-1 text-slate-500">
                Gérez les abonnés à la newsletter et les messages de contact.
              </p>
            </div>
            <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center">
              <Button 
                variant="outline" 
                onClick={handleExportCSV}
                className="border-[#1E3A8A] text-[#1E3A8A] hover:bg-[#1E3A8A] hover:text-white"
              >
                <FaDownload className="mr-2 h-4 w-4" />
                Exporter CSV
              </Button>
              <Button variant="outline" onClick={loadData}>
                <FaSync className="mr-2 h-4 w-4" />
                Rafraîchir
              </Button>
            </div>
          </div>
        </div>

        {/* Statistiques rapides */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-slate-500">Abonnés</p>
              <p className="text-2xl font-bold text-[#1E3A8A]">{subscribers.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-slate-500">Messages</p>
              <p className="text-2xl font-bold text-[#1E3A8A]">{contacts.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-slate-500">En attente</p>
              <p className="text-2xl font-bold text-yellow-600">{pendingContacts}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-slate-500">Taux de réponse</p>
              <p className="text-2xl font-bold text-green-600">
                {contacts.length > 0 
                  ? Math.round((contacts.filter(c => c.status === 'replied').length / contacts.length) * 100)
                  : 0}%
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="subscribers" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="subscribers">
              <FaUsers className="mr-2 h-4 w-4" />
              Abonnés ({subscribers.length})
            </TabsTrigger>
            <TabsTrigger value="contacts">
              <FaEnvelope className="mr-2 h-4 w-4" />
              Messages ({contacts.length})
              {pendingContacts > 0 && (
                <Badge className="ml-2 bg-[#F97316] text-white">
                  {pendingContacts}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Onglet Abonnés */}
          <TabsContent value="subscribers">
            <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
              {subscribers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="rounded-full bg-slate-100 p-4">
                    <FaUsers className="h-8 w-8 text-slate-400" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-slate-700">Aucun abonné</h3>
                  <p className="text-sm text-slate-500">La newsletter n'a pas encore d'abonnés.</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-left">
                      <th className="px-4 py-3 font-semibold text-slate-600">Email</th>
                      <th className="px-4 py-3 font-semibold text-slate-600 hidden md:table-cell">Intérêts</th>
                      <th className="px-4 py-3 font-semibold text-slate-600">Date</th>
                      <th className="px-4 py-3 font-semibold text-slate-600">Statut</th>
                      <th className="px-4 py-3 font-semibold text-slate-600 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subscribers.map((subscriber) => (
                      <tr key={subscriber.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                        <td className="px-4 py-3 text-slate-800 font-medium">{subscriber.email}</td>
                        <td className="px-4 py-3 hidden md:table-cell text-slate-600">
                          {subscriber.interested_in && subscriber.interested_in.length > 0 
                            ? subscriber.interested_in.join(', ') 
                            : '—'}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {subscriber.created_at 
                            ? new Date(subscriber.created_at).toLocaleDateString('fr-FR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                            : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="default" className="inline-flex items-center gap-2 bg-green-100 text-green-700 hover:bg-green-100">
                            <FaCheckCircle className="h-3.5 w-3.5" /> 
                            Actif
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 text-slate-400 hover:text-red-600"
                            onClick={() => handleDeleteSubscriber(subscriber.id, subscriber.email)}
                            title="Supprimer"
                          >
                            <FaTrash className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </TabsContent>

          {/* Onglet Messages */}
          <TabsContent value="contacts">
            <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
              {contacts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="rounded-full bg-slate-100 p-4">
                    <FaEnvelope className="h-8 w-8 text-slate-400" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-slate-700">Aucun message</h3>
                  <p className="text-sm text-slate-500">Aucun message de contact pour le moment.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {contacts.map((contact) => {
                    const status = contactStatusMap[contact.status] || contactStatusMap.pending;
                    return (
                      <div key={contact.id} className="p-4 hover:bg-slate-50 transition">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 flex-wrap">
                              <p className="font-semibold text-slate-800">{contact.name}</p>
                              <p className="text-sm text-slate-500">{contact.email}</p>
                              <Badge className={status.color}>
                                <span className="flex items-center gap-1">
                                  {status.icon}
                                  {status.label}
                                </span>
                              </Badge>
                            </div>
                            {contact.subject && (
                              <p className="mt-1 text-sm font-medium text-slate-700">📌 {contact.subject}</p>
                            )}
                            <p className="mt-1 text-sm text-slate-600 line-clamp-3">{contact.message}</p>
                            <p className="mt-1 text-xs text-slate-400">
                              {new Date(contact.created_at).toLocaleDateString('fr-FR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {contact.status !== 'read' && (
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => updateContactStatus(contact.id, 'read')}
                              >
                                <FaEye className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            {contact.status !== 'replied' && (
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => updateContactStatus(contact.id, 'replied')}
                              >
                                <FaReply className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            {contact.status !== 'archived' && (
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => updateContactStatus(contact.id, 'archived')}
                              >
                                <FaArchive className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDeleteContact(contact.id, contact.name)}
                            >
                              <FaTrash className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Résumé des intérêts */}
        {subscribers.length > 0 && (
          <div className="mt-6">
            <h2 className="text-sm font-semibold text-slate-600 mb-2">Centres d'intérêt des abonnés</h2>
            <div className="flex flex-wrap gap-2">
              {(() => {
                const interests = subscribers
                  .flatMap(s => s.interested_in || [])
                  .reduce((acc, i) => {
                    acc[i] = (acc[i] || 0) + 1;
                    return acc;
                  }, {} as Record<string, number>);

                const sortedInterests = Object.entries(interests)
                  .sort((a, b) => b[1] - a[1]);

                return sortedInterests.map(([interest, count]) => (
                  <Badge key={interest} variant="secondary" className="text-sm px-3 py-1">
                    {interest}: {count}
                  </Badge>
                ));
              })()}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}