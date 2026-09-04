// app/(client)/clients/services/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  FaEnvelope, 
  FaBriefcase, 
  FaKey, 
  FaChartLine,
  FaRobot,
  FaCogs,
  FaCode,
  FaMobileAlt,
  FaPaintBrush,
  FaCloud,
  FaShieldAlt,
  FaDatabase,
  FaBrain,
  FaHome,
  FaSolarPanel,
  FaStore,
  FaGraduationCap,
  FaSpinner,
  FaCheckCircle,
  FaArrowRight,
  FaClock,
  FaCreditCard,
  FaInfoCircle,
  FaTag,
  FaStar,
  FaUsers,
  FaRocket,
  FaServer,
  FaLock,
  FaGlobe,
  FaFileAlt,
  FaUserTie,
  FaBuilding,
  FaPhone,
  FaEnvelopeOpen,
  FaHandshake,
  FaLaptop,
  FaNetworkWired
} from 'react-icons/fa';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast, Toaster } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

// ============================================================
// TYPES
// ============================================================
interface Service {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  type: 'product' | 'saas';
  icon: string;
  features: string[];
  color: string;
  is_active: boolean;
  order_index: number;
  price_monthly?: number;
  price_yearly?: number;
  price_project?: number;
  is_subscribed?: boolean;
}

interface ClientService {
  id: string;
  client_id: string;
  service_id: string;
  status: 'pending' | 'active' | 'suspended' | 'expired' | 'cancelled';
  config: any;
  started_at: string;
  expires_at: string;
  auto_renew: boolean;
  service?: Service;
}

interface ServiceRequest {
  id: string;
  service_id: string;
  title: string;
  description: string;
  budget?: string;
  deadline?: string;
  status: string;
  priority: string;
  created_at: string;
}

// ============================================================
// MAPPING DES ICÔNES
// ============================================================
const iconMap: Record<string, any> = {
  FaEnvelope: FaEnvelope,
  FaBriefcase: FaBriefcase,
  FaKey: FaKey,
  FaChartLine: FaChartLine,
  FaRobot: FaRobot,
  FaCogs: FaCogs,
  FaCode: FaCode,
  FaMobileAlt: FaMobileAlt,
  FaPaintBrush: FaPaintBrush,
  FaCloud: FaCloud,
  FaShieldAlt: FaShieldAlt,
  FaDatabase: FaDatabase,
  FaBrain: FaBrain,
  FaHome: FaHome,
  FaSolarPanel: FaSolarPanel,
  FaStore: FaStore,
  FaGraduationCap: FaGraduationCap,
  FaUsers: FaUsers,
  FaRocket: FaRocket,
  FaServer: FaServer,
  FaGlobe: FaGlobe,
  FaFileAlt: FaFileAlt,
  FaUserTie: FaUserTie,
  FaBuilding: FaBuilding,
  FaPhone: FaPhone,
  FaEnvelopeOpen: FaEnvelopeOpen,
  FaHandshake: FaHandshake,
  FaLaptop: FaLaptop,
  FaNetworkWired: FaNetworkWired,
};

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================
export default function ClientServicesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [requesting, setRequesting] = useState<string | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [subscriptions, setSubscriptions] = useState<ClientService[]>([]);
  const [activeTab, setActiveTab] = useState('saas');
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [requestForm, setRequestForm] = useState({
    title: '',
    description: '',
    budget: '',
    deadline: '',
    priority: 'normal'
  });

  // ============================================================
  // CHARGEMENT DES DONNÉES
  // ============================================================
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // 1. Récupérer tous les services
      const servicesResponse = await fetch('/api/client/services/list');
      const servicesData = await servicesResponse.json();
      
      if (servicesData.success) {
        setServices(servicesData.data || []);
      }

      // 2. Récupérer les souscriptions du client
      const subscriptionsResponse = await fetch('/api/client/services/subscriptions');
      const subscriptionsData = await subscriptionsResponse.json();
      
      if (subscriptionsData.success) {
        setSubscriptions(subscriptionsData.data || []);
      }

    } catch (error) {
      console.error('Erreur chargement:', error);
      toast.error('Erreur lors du chargement des services');
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // SOUSCRIPTION (SaaS)
  // ============================================================
  const handleSubscribe = async (serviceId: string) => {
    setSubscribing(serviceId);
    
    try {
      const response = await fetch('/api/client/services/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          serviceId,
          autoRenew: true,
          expiresInDays: 30
        })
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || 'Erreur lors de la souscription');
        setSubscribing(null);
        return;
      }

      toast.success('✅ Souscription réussie !');
      await fetchData();
      
    } catch (error) {
      console.error('Erreur souscription:', error);
      toast.error('Erreur serveur');
    } finally {
      setSubscribing(null);
    }
  };

  // ============================================================
  // ANNULER LA SOUSCRIPTION
  // ============================================================
  const handleCancelSubscription = async (subscriptionId: string) => {
    if (!confirm('Voulez-vous vraiment annuler cette souscription ?')) return;
    
    try {
      const response = await fetch(`/api/client/services/cancel/${subscriptionId}`, {
        method: 'POST',
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || 'Erreur lors de l\'annulation');
        return;
      }

      toast.success('✅ Souscription annulée');
      await fetchData();
      
    } catch (error) {
      console.error('Erreur annulation:', error);
      toast.error('Erreur serveur');
    }
  };

  // ============================================================
  // DEMANDE DE SERVICE (Produit)
  // ============================================================
  const handleRequestService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService) return;

    setRequesting(selectedService.id);

    try {
      const response = await fetch('/api/client/services/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: selectedService.id,
          title: requestForm.title,
          description: requestForm.description,
          budget: requestForm.budget,
          deadline: requestForm.deadline,
          priority: requestForm.priority
        })
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || 'Erreur lors de la demande');
        setRequesting(null);
        return;
      }

      toast.success('✅ Demande envoyée avec succès !');
      setShowRequestDialog(false);
      setRequestForm({
        title: '',
        description: '',
        budget: '',
        deadline: '',
        priority: 'normal'
      });
      setSelectedService(null);
      
    } catch (error) {
      console.error('Erreur demande:', error);
      toast.error('Erreur serveur');
    } finally {
      setRequesting(null);
    }
  };

  const openRequestDialog = (service: Service) => {
    setSelectedService(service);
    setRequestForm({
      title: `Demande pour ${service.name}`,
      description: '',
      budget: '',
      deadline: '',
      priority: 'normal'
    });
    setShowRequestDialog(true);
  };

  // ============================================================
  // UTILITAIRES
  // ============================================================
  const getServiceIcon = (iconName: string) => {
    return iconMap[iconName] || FaFileAlt;
  };

  const getServiceStatus = (serviceId: string): 'subscribed' | 'available' | 'pending' => {
    const sub = subscriptions.find(s => s.service_id === serviceId);
    if (!sub) return 'available';
    if (sub.status === 'active') return 'subscribed';
    if (sub.status === 'pending') return 'pending';
    return 'available';
  };

  const getSubscription = (serviceId: string): ClientService | undefined => {
    return subscriptions.find(s => s.service_id === serviceId);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-700 border-green-200">Actif</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">En attente</Badge>;
      case 'expired':
        return <Badge className="bg-red-100 text-red-700 border-red-200">Expiré</Badge>;
      case 'suspended':
        return <Badge className="bg-orange-100 text-orange-700 border-orange-200">Suspendu</Badge>;
      case 'cancelled':
        return <Badge className="bg-gray-100 text-gray-700 border-gray-200">Annulé</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatPrice = (price?: number) => {
    if (!price) return 'Sur devis';
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(price);
  };

  // ============================================================
  // FILTRAGE DES SERVICES
  // ============================================================
  const saasServices = services.filter(s => s.type === 'saas' && s.is_active);
  const productServices = services.filter(s => s.type === 'product' && s.is_active);

  // ============================================================
  // RENDU
  // ============================================================
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <FaSpinner className="h-12 w-12 animate-spin text-[#1E3A8A] mx-auto" />
          <p className="mt-4 text-sm text-slate-500">Chargement des services...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Toaster position="top-right" richColors />

      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1E3A8A] flex items-center gap-2">
            <FaRocket className="h-6 w-6 text-[#F97316]" />
            Services UNITECH
          </h1>
          <p className="text-sm sm:text-base text-slate-500">
            Découvrez nos services et souscrivez à nos solutions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-blue-100 text-blue-700 border-blue-200">
            {subscriptions.filter(s => s.status === 'active').length} services actifs
          </Badge>
          <Button variant="outline" size="sm" onClick={fetchData}>
            <FaSpinner className={loading ? 'animate-spin h-4 w-4' : 'h-4 w-4'} />
          </Button>
        </div>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-slate-500">Services SaaS</p>
            <p className="text-xl font-bold text-[#1E3A8A]">{saasServices.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-slate-500">Services Produits</p>
            <p className="text-xl font-bold text-[#1E3A8A]">{productServices.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-slate-500">Services actifs</p>
            <p className="text-xl font-bold text-green-600">
              {subscriptions.filter(s => s.status === 'active').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-slate-500">Total souscrit</p>
            <p className="text-xl font-bold text-[#1E3A8A]">{subscriptions.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Onglets */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-sm grid-cols-2">
          <TabsTrigger value="saas" className="flex items-center gap-2">
            <FaRocket className="h-4 w-4" />
            Services SaaS
            <Badge variant="secondary" className="ml-1 text-xs">
              {saasServices.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="products" className="flex items-center gap-2">
            <FaCogs className="h-4 w-4" />
            Services Produits
            <Badge variant="secondary" className="ml-1 text-xs">
              {productServices.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        {/* ============================================================
        TAB: SERVICES SAAS (Souscription)
        ============================================================ */}
        <TabsContent value="saas" className="mt-4">
          {saasServices.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <FaRocket className="h-12 w-12 mx-auto mb-3 text-slate-300" />
              <p className="text-lg font-medium text-slate-600">Aucun service SaaS disponible</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {saasServices.map((service) => {
                const Icon = getServiceIcon(service.icon);
                const status = getServiceStatus(service.id);
                const isSubscribed = status === 'subscribed';
                const isPending = status === 'pending';

                return (
                  <Card key={service.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="p-4 pb-2">
                      <div className="flex items-start justify-between">
                        <div className={`p-2 rounded-lg ${service.color} text-white`}>
                          <Icon className="h-6 w-6" />
                        </div>
                        <Badge className={
                          isSubscribed ? 'bg-green-100 text-green-700' :
                          isPending ? 'bg-yellow-100 text-yellow-700' :
                          'bg-blue-100 text-blue-700'
                        }>
                          {isSubscribed ? '✅ Actif' : isPending ? '⏳ En attente' : 'Disponible'}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg mt-2">{service.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <p className="text-sm text-slate-500 line-clamp-2 min-h-[40px]">
                        {service.description}
                      </p>
                      
                      <div className="mt-3 space-y-1">
                        <p className="text-xs text-slate-500">
                          <span className="font-medium text-[#1E3A8A]">
                            {formatPrice(service.price_monthly)}
                          </span>
                          {service.price_monthly && ' / mois'}
                        </p>
                        {service.price_yearly && (
                          <p className="text-xs text-slate-400">
                            {formatPrice(service.price_yearly)} / an
                          </p>
                        )}
                      </div>

                      <div className="mt-3 flex flex-wrap gap-1">
                        {service.features?.slice(0, 3).map((feature, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                        {service.features?.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{service.features.length - 3}
                          </Badge>
                        )}
                      </div>

                      {isSubscribed ? (
                        <Link href={`/clients/${service.slug}`}>
                          <Button variant="outline" className="w-full mt-4">
                            <FaArrowRight className="mr-2 h-4 w-4" />
                            Accéder
                          </Button>
                        </Link>
                      ) : (
                        <Button 
                          className="w-full mt-4 bg-[#F97316] hover:bg-[#ea580c] text-white"
                          onClick={() => handleSubscribe(service.id)}
                          disabled={subscribing === service.id || isPending}
                        >
                          {subscribing === service.id ? (
                            <FaSpinner className="animate-spin mr-2 h-4 w-4" />
                          ) : isPending ? (
                            'En attente...'
                          ) : (
                            <>
                              Souscrire
                              <FaArrowRight className="ml-2 h-4 w-4" />
                            </>
                          )}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ============================================================
        TAB: SERVICES PRODUITS (Demande de devis)
        ============================================================ */}
        <TabsContent value="products" className="mt-4">
          {productServices.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <FaCogs className="h-12 w-12 mx-auto mb-3 text-slate-300" />
              <p className="text-lg font-medium text-slate-600">Aucun service produit disponible</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {productServices.map((service) => {
                const Icon = getServiceIcon(service.icon);

                return (
                  <Card key={service.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="p-4 pb-2">
                      <div className="flex items-start justify-between">
                        <div className={`p-2 rounded-lg ${service.color} text-white`}>
                          <Icon className="h-6 w-6" />
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {service.category || 'Service'}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg mt-2">{service.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <p className="text-sm text-slate-500 line-clamp-2 min-h-[40px]">
                        {service.description}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-1">
                        {service.features?.slice(0, 3).map((feature, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                        {service.features?.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{service.features.length - 3}
                          </Badge>
                        )}
                      </div>

                      <Button 
                        className="w-full mt-4 bg-[#1E3A8A] hover:bg-[#162f58] text-white"
                        onClick={() => openRequestDialog(service)}
                        disabled={requesting === service.id}
                      >
                        {requesting === service.id ? (
                          <FaSpinner className="animate-spin mr-2 h-4 w-4" />
                        ) : (
                          <>
                            Demander un devis
                            <FaArrowRight className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ============================================================
      DIALOG: DEMANDE DE DEVIS
      ============================================================ */}
      <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#1E3A8A]">
              Demander un devis
            </DialogTitle>
            <DialogDescription>
              {selectedService && (
                <>Pour le service : <strong>{selectedService.name}</strong></>
              )}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleRequestService} className="space-y-4">
            <div>
              <Label htmlFor="request-title">Titre de la demande *</Label>
              <Input
                id="request-title"
                value={requestForm.title}
                onChange={(e) => setRequestForm({ ...requestForm, title: e.target.value })}
                placeholder="Ex: Création d'un site web e-commerce"
                required
              />
            </div>

            <div>
              <Label htmlFor="request-description">Description *</Label>
              <Textarea
                id="request-description"
                value={requestForm.description}
                onChange={(e) => setRequestForm({ ...requestForm, description: e.target.value })}
                placeholder="Décrivez votre besoin en détail..."
                rows={4}
                required
              />
            </div>

            <div>
              <Label htmlFor="request-budget">Budget estimé</Label>
              <Input
                id="request-budget"
                value={requestForm.budget}
                onChange={(e) => setRequestForm({ ...requestForm, budget: e.target.value })}
                placeholder="Ex: 1 000 000 FCFA"
              />
            </div>

            <div>
              <Label htmlFor="request-deadline">Date souhaitée</Label>
              <Input
                id="request-deadline"
                type="date"
                value={requestForm.deadline}
                onChange={(e) => setRequestForm({ ...requestForm, deadline: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="request-priority">Priorité</Label>
              <select
                id="request-priority"
                value={requestForm.priority}
                onChange={(e) => setRequestForm({ ...requestForm, priority: e.target.value })}
                className="w-full mt-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] focus:border-transparent bg-white"
              >
                <option value="low">Basse</option>
                <option value="normal">Normale</option>
                <option value="high">Haute</option>
                <option value="urgent">Urgente</option>
              </select>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setShowRequestDialog(false)}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-[#F97316] hover:bg-[#ea580c] text-white"
                disabled={requesting === selectedService?.id}
              >
                {requesting === selectedService?.id ? (
                  <FaSpinner className="animate-spin mr-2 h-4 w-4" />
                ) : (
                  'Envoyer la demande'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}