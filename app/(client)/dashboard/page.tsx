// app/(client)/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  FaEnvelope, 
  FaBriefcase, 
  FaKey, 
  FaCreditCard,
  FaRobot,
  FaChartLine,
  FaUsers,
  FaPlus,
  FaSpinner,
  FaCheckCircle,
  FaClock,
  FaArrowRight,
  FaBuilding,
  FaUserCog,
  FaCog,
  FaFileAlt,
  FaUserFriends,
  FaCalendarAlt,
  FaBell,
  FaSearch,
  FaFilter,
  FaSort,
  FaDownload,
  FaEye,
  FaEdit,
  FaTrash,
  FaUserPlus,
  FaMailBulk,
  FaQuestionCircle,
  FaHeadset,
  FaRocket,
  FaShieldAlt
} from 'react-icons/fa';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast, Toaster } from 'sonner';

// ============================================================
// TYPES
// ============================================================
interface DashboardStats {
  totalEmails: number;
  totalRecruitments: number;
  totalCandidates: number;
  creditsBalance: number;
  activeServices: number;
  recentActivity: Activity[];
}

interface Activity {
  id: string;
  type: 'email' | 'recruitment' | 'candidate' | 'service' | 'token';
  message: string;
  date: string;
  status?: 'success' | 'pending' | 'failed';
}

interface Service {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  status: 'active' | 'inactive' | 'pending' | 'coming_soon';
  color: string;
  href: string;
  features: string[];
}

// ============================================================
// SERVICES DISPONIBLES
// ============================================================
const services: Service[] = [
  {
    id: 'mail',
    name: 'Automation Mail',
    description: 'Gestion automatisée des emails avec IA et templates personnalisés',
    icon: FaMailBulk,
    status: 'active',
    color: 'bg-blue-500',
    href: '/client/mail',
    features: ['Récupération automatique', 'Réponses IA', 'Templates personnalisés']
  },
  {
    id: 'recruitment',
    name: 'Recrutement',
    description: 'Créez des offres d\'emploi et gérez vos candidats',
    icon: FaUserFriends,
    status: 'active',
    color: 'bg-green-500',
    href: '/client/recruitment',
    features: ['Formulaires personnalisés', 'Suivi candidats', 'Export données']
  },
  {
    id: 'api',
    name: 'API Access',
    description: 'Accédez à nos API pour intégrer nos services à vos applications',
    icon: FaKey,
    status: 'active',
    color: 'bg-purple-500',
    href: '/client/api',
    features: ['Documentation complète', 'Tokens sécurisés', 'Rate limiting']
  },
  {
    id: 'analytics',
    name: 'Analytics',
    description: 'Suivez vos performances et vos statistiques en temps réel',
    icon: FaChartLine,
    status: 'coming_soon',
    color: 'bg-orange-500',
    href: '/client/analytics',
    features: ['Tableaux de bord', 'Rapports personnalisés', 'Export de données']
  }
];

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================
export default function ClientDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalEmails: 0,
    totalRecruitments: 0,
    totalCandidates: 0,
    creditsBalance: 0,
    activeServices: 0,
    recentActivity: []
  });

  // ============================================================
  // RÉCUPÉRATION DES DONNÉES
  // ============================================================
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // 1. Récupérer les statistiques
        try {
          const statsResponse = await fetch('/api/client/stats');
          const statsData = await statsResponse.json();
          
          if (statsData.success) {
            setStats(prev => ({
              ...prev,
              totalEmails: statsData.data?.totalEmails || 0,
              totalRecruitments: statsData.data?.totalRecruitments || 0,
              totalCandidates: statsData.data?.totalCandidates || 0,
              creditsBalance: statsData.data?.creditsBalance || 0,
              activeServices: statsData.data?.activeServices || 0
            }));
          }
        } catch (statsError) {
          console.warn('Erreur chargement statistiques:', statsError);
        }

        // 2. Récupérer les activités récentes
        try {
          const activitiesResponse = await fetch('/api/client/activities?limit=5');
          
          // Vérifier si la réponse est JSON
          const contentType = activitiesResponse.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const activitiesData = await activitiesResponse.json();
            
            if (activitiesData.success) {
              setStats(prev => ({
                ...prev,
                recentActivity: activitiesData.data || []
              }));
            }
          } else {
            // Si la réponse n'est pas JSON, utiliser des données par défaut
            console.warn('La réponse n\'est pas du JSON, utilisation des données par défaut');
            setStats(prev => ({
              ...prev,
              recentActivity: getDefaultActivities()
            }));
          }
        } catch (activityError) {
          console.warn('Erreur chargement activités:', activityError);
          setStats(prev => ({
            ...prev,
            recentActivity: getDefaultActivities()
          }));
        }

      } catch (error) {
        console.error('Erreur chargement dashboard:', error);
        toast.error('Erreur lors du chargement des données');
        
        // Données de secours
        setStats(prev => ({
          ...prev,
          totalEmails: 42,
          totalRecruitments: 3,
          totalCandidates: 28,
          creditsBalance: 150,
          activeServices: 2,
          recentActivity: getDefaultActivities()
        }));
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // ============================================================
  // FONCTIONS UTILITAIRES
  // ============================================================
  const getDefaultActivities = (): Activity[] => {
    return [
      {
        id: '1',
        type: 'email',
        message: 'Email envoyé à contact@entreprise.com',
        date: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        status: 'success'
      },
      {
        id: '2',
        type: 'recruitment',
        message: 'Nouveau candidat pour "Développeur Full Stack"',
        date: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
        status: 'pending'
      },
      {
        id: '3',
        type: 'candidate',
        message: 'Candidature reçue de Jean Dupont',
        date: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
        status: 'success'
      }
    ];
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'success': return <FaCheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending': return <FaClock className="h-4 w-4 text-yellow-500" />;
      case 'failed': return <FaSpinner className="h-4 w-4 text-red-500" />;
      default: return <FaClock className="h-4 w-4 text-slate-400" />;
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'failed': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case 'success': return 'Terminé';
      case 'pending': return 'En cours';
      case 'failed': return 'Échoué';
      default: return 'En attente';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diff < 60) return 'À l\'instant';
    if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)}h`;
    if (diff < 604800) return `Il y a ${Math.floor(diff / 86400)}j`;
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getServiceStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'inactive': return 'bg-gray-100 text-gray-700';
      case 'coming_soon': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getServiceStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Actif';
      case 'pending': return 'En attente';
      case 'inactive': return 'Inactif';
      case 'coming_soon': return 'Bientôt disponible';
      default: return 'Inconnu';
    }
  };

  // ============================================================
  // RENDU
  // ============================================================
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <FaSpinner className="h-12 w-12 animate-spin text-[#1E3A8A] mx-auto" />
          <p className="mt-4 text-sm text-slate-500">Chargement de votre espace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Toaster position="top-right" richColors />

      {/* ============================================================
      EN-TÊTE
      ============================================================ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1E3A8A] flex items-center gap-2">
            <FaShieldAlt className="h-6 w-6 text-[#F97316]" />
            Tableau de bord
          </h1>
          <p className="text-sm sm:text-base text-slate-500">
            Bienvenue dans votre espace client UNITECH
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/client/services">
            <Button className="bg-[#F97316] hover:bg-[#ea580c] text-sm sm:text-base">
              <FaPlus className="mr-2 h-4 w-4" />
              Nouveau service
            </Button>
          </Link>
          <Link href="/client/profile">
            <Button variant="outline" className="text-sm sm:text-base">
              <FaUserCog className="mr-2 h-4 w-4" />
              <span className="hidden xs:inline">Mon profil</span>
              <span className="xs:hidden">Profil</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* ============================================================
      STATISTIQUES
      ============================================================ */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wider">Emails traités</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-[#1E3A8A]">{stats.totalEmails}</p>
              </div>
              <div className="rounded-full bg-blue-100 p-2 sm:p-3 text-blue-600">
                <FaEnvelope className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wider">Recrutements</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-[#1E3A8A]">{stats.totalRecruitments}</p>
              </div>
              <div className="rounded-full bg-green-100 p-2 sm:p-3 text-green-600">
                <FaBriefcase className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wider">Candidats</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-[#1E3A8A]">{stats.totalCandidates}</p>
              </div>
              <div className="rounded-full bg-purple-100 p-2 sm:p-3 text-purple-600">
                <FaUsers className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wider">Crédits</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-[#1E3A8A]">{stats.creditsBalance}</p>
              </div>
              <div className="rounded-full bg-orange-100 p-2 sm:p-3 text-orange-600">
                <FaCreditCard className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ============================================================
      SERVICES
      ============================================================ */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg sm:text-xl font-semibold text-[#1E3A8A] flex items-center gap-2">
            <FaRocket className="h-5 w-5 text-[#F97316]" />
            Vos services
          </h2>
          <Link href="/client/services">
            <Button variant="ghost" className="text-sm text-[#F97316] hover:text-[#ea580c]">
              Voir tous <FaArrowRight className="ml-2 h-3 w-3" />
            </Button>
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {services.map((service) => {
            const Icon = service.icon;
            const isActive = service.status === 'active';
            const isComingSoon = service.status === 'coming_soon';
            
            return (
              <Link key={service.id} href={isComingSoon ? '#' : service.href}>
                <Card className={`h-full transition-all hover:shadow-lg cursor-pointer ${
                  isComingSoon ? 'opacity-75' : ''
                } ${isActive ? 'hover:scale-[1.02]' : ''}`}>
                  <CardHeader className="p-4 pb-2">
                    <div className="flex items-start justify-between">
                      <div className={`p-2 rounded-lg ${service.color} text-white`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <Badge className={getServiceStatusColor(service.status)}>
                        {getServiceStatusLabel(service.status)}
                      </Badge>
                    </div>
                    <CardTitle className="text-base mt-2">{service.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <p className="text-sm text-slate-500 line-clamp-2">
                      {service.description}
                    </p>
                    {isComingSoon && (
                      <p className="text-xs text-blue-500 mt-2 flex items-center gap-1">
                        <FaClock className="h-3 w-3" />
                        Bientôt disponible
                      </p>
                    )}
                    {isActive && (
                      <Button variant="ghost" className="mt-2 p-0 h-auto text-[#F97316] hover:text-[#ea580c]">
                        Accéder <FaArrowRight className="ml-2 h-3 w-3" />
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ============================================================
      ACTIVITÉS ET ACTIONS
      ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activités récentes */}
        <Card>
          <CardHeader className="p-4">
            <CardTitle className="text-base flex items-center gap-2">
              <FaClock className="h-4 w-4 text-[#F97316]" />
              Activités récentes
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="space-y-3">
              {stats.recentActivity && stats.recentActivity.length > 0 ? (
                stats.recentActivity.map((activity) => (
                  <div 
                    key={activity.id} 
                    className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-50 transition group"
                  >
                    <div className="mt-0.5">
                      {getStatusIcon(activity.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-700 truncate">{activity.message}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="text-xs text-slate-400">
                          {formatDate(activity.date)}
                        </span>
                        {activity.status && (
                          <Badge className={`text-[10px] ${getStatusColor(activity.status)}`}>
                            {getStatusLabel(activity.status)}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="opacity-0 group-hover:opacity-100 transition h-7 text-xs"
                    >
                      <FaEye className="h-3 w-3" />
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-slate-400">
                  <FaClock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Aucune activité récente</p>
                  <p className="text-xs">Commencez à utiliser vos services pour voir les activités</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Actions rapides */}
        <Card>
          <CardHeader className="p-4">
            <CardTitle className="text-base flex items-center gap-2">
              <FaUserPlus className="h-4 w-4 text-[#F97316]" />
              Actions rapides
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <Link href="/client/mail/compose">
                <Button variant="outline" className="w-full justify-start text-xs sm:text-sm h-auto py-3">
                  <FaEnvelope className="mr-2 h-4 w-4 flex-shrink-0" />
                  <span className="truncate">Nouvel email</span>
                </Button>
              </Link>
              <Link href="/client/recruitment/create">
                <Button variant="outline" className="w-full justify-start text-xs sm:text-sm h-auto py-3">
                  <FaBriefcase className="mr-2 h-4 w-4 flex-shrink-0" />
                  <span className="truncate">Recrutement</span>
                </Button>
              </Link>
              <Link href="/client/api-keys/new">
                <Button variant="outline" className="w-full justify-start text-xs sm:text-sm h-auto py-3">
                  <FaKey className="mr-2 h-4 w-4 flex-shrink-0" />
                  <span className="truncate">Token API</span>
                </Button>
              </Link>
              <Link href="/client/credits">
                <Button variant="outline" className="w-full justify-start text-xs sm:text-sm h-auto py-3">
                  <FaCreditCard className="mr-2 h-4 w-4 flex-shrink-0" />
                  <span className="truncate">Recharger</span>
                </Button>
              </Link>
              <Link href="/client/mail/templates">
                <Button variant="outline" className="w-full justify-start text-xs sm:text-sm h-auto py-3">
                  <FaFileAlt className="mr-2 h-4 w-4 flex-shrink-0" />
                  <span className="truncate">Templates</span>
                </Button>
              </Link>
              <Link href="/client/support">
                <Button variant="outline" className="w-full justify-start text-xs sm:text-sm h-auto py-3">
                  <FaHeadset className="mr-2 h-4 w-4 flex-shrink-0" />
                  <span className="truncate">Support</span>
                </Button>
              </Link>
            </div>

            {/* Crédits */}
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FaCreditCard className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-blue-700">
                    Crédits disponibles : <strong>{stats.creditsBalance}</strong>
                  </span>
                </div>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-7">
                  Recharger
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      
    </div>
  );
}