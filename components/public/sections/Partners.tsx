// components/public/sections/Partners.tsx
'use client';

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { 
  FaHandshake, 
  FaUsers,
  FaIndustry,
  FaChartLine,
  FaUserTie,
  FaCode,
  FaLightbulb
} from "react-icons/fa";
import { Target } from "lucide-react";

// ✅ Mapping des types
const typeConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  'partner': {
    icon: <FaHandshake className="h-8 w-8" />,
    color: 'from-blue-50 to-blue-100 border-blue-200 text-blue-600',
    label: 'Partenaire'
  },
  'association': {
    icon: <FaUsers className="h-8 w-8" />,
    color: 'from-purple-50 to-purple-100 border-purple-200 text-purple-600',
    label: 'Association'
  },
  'supplier': {
    icon: <FaIndustry className="h-8 w-8" />,
    color: 'from-green-50 to-green-100 border-green-200 text-green-600',
    label: 'Fournisseur'
  },
  'consultant': {
    icon: <FaUserTie className="h-8 w-8" />,
    color: 'from-orange-50 to-orange-100 border-orange-200 text-orange-600',
    label: 'Consultant'
  },
  'investor': {
    icon: <FaChartLine className="h-8 w-8" />,
    color: 'from-yellow-50 to-yellow-100 border-yellow-200 text-yellow-600',
    label: 'Investisseur'
  },
  'default': {
    icon: <FaHandshake className="h-8 w-8" />,
    color: 'from-gray-50 to-gray-100 border-gray-200 text-gray-600',
    label: 'Partenaire'
  }
};

const statusConfig: Record<string, { color: string; label: string }> = {
  'active': { color: 'bg-green-100 text-green-700 border-green-200', label: 'Actif' },
  'pending': { color: 'bg-yellow-100 text-yellow-700 border-yellow-200', label: 'En attente' },
  'inactive': { color: 'bg-gray-100 text-gray-700 border-gray-200', label: 'Inactif' },
  'ended': { color: 'bg-red-100 text-red-700 border-red-200', label: 'Terminé' },
  'default': { color: 'bg-gray-100 text-gray-700 border-gray-200', label: 'Inconnu' }
};

type Collaboration = {
  id: string;
  name: string;
  type: string;
  status: string;
  contact: { name?: string; email?: string; phone?: string; site?: string } | null;
  agreement: { type?: string; start_date?: string; end_date?: string; terms?: string } | null;
  contributions: string[] | null;
  projects: string[] | null;
  notes: string | null;
  created_at: string;
};

interface PartnersProps {
  initialCollaborations?: Collaboration[];
  limit?: number;
}

export default function Partners({ initialCollaborations = [], limit = 3 }: PartnersProps) {
  // ✅ Utiliser les données passées en props
  const collaborations = initialCollaborations || [];

  // ✅ Ajouter un log pour déboguer
  //console.log('🔍 Partners - collaborations reçues:', collaborations.length);

  if (!collaborations || collaborations.length === 0) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#1E3A8A]/10 px-4 py-1.5 text-sm font-medium text-[#1E3A8A]">
            <FaHandshake className="h-4 w-4" />
            Nos Partenaires
          </div>
          <h2 className="mt-4 text-3xl font-black text-[#1E3A8A] md:text-4xl">
            Collaborations & Partenariats
          </h2>
          <p className="mt-4 text-slate-500">
            Aucune collaboration active pour le moment. Revenez bientôt !
          </p>
        </div>
      </section>
    );
  }

  const getTypeConfig = (type: string) => typeConfig[type] || typeConfig.default;
  const getStatusConfig = (status: string) => statusConfig[status] || statusConfig.default;

  const renderLogo = (type: string) => {
    const config = getTypeConfig(type);
    return (
      <div className={`flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-white shadow-sm ${config.color}`}>
        {config.icon}
      </div>
    );
  };

  const renderContributions = (contributions: string[] | null) => {
    if (!contributions || contributions.length === 0) return null;
    
    return (
      <div className="mt-3 flex flex-wrap gap-1.5">
        {contributions.slice(0, 3).map((contrib, idx) => (
          <span 
            key={idx}
            className="inline-flex items-center gap-1 rounded-full bg-[#1E3A8A]/5 px-2 py-0.5 text-[10px] text-[#1E3A8A] border border-[#1E3A8A]/10"
          >
            <FaLightbulb className="h-2.5 w-2.5" />
            {contrib}
          </span>
        ))}
        {contributions.length > 3 && (
          <span className="text-[10px] text-slate-400">
            +{contributions.length - 3}
          </span>
        )}
      </div>
    );
  };

  const renderContact = (contact: Collaboration['contact']) => {
    if (!contact) return null;
    
    return (
      <div className="mt-2 space-y-0.5">
        {contact.name && (
          <p className="text-[10px] text-slate-500">{contact.name}</p>
        )}
        {contact.email && (
          <a
            href={`mailto:${contact.email}`}
            className="text-[10px] text-[#1E3A8A] hover:text-[#F97316] transition block truncate"
          >
            ✉️ {contact.email}
          </a>
        )}
        {contact.site && (
          <a
            href={`${contact.site}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-[#1E3A8A] hover:text-[#F97316] transition block truncate"
          >
            ✉️ {contact.site}
          </a>
        )}
        {contact.phone && (
          <a
            href={`tel:${contact.phone}`}
            className="text-[10px] text-[#1E3A8A] hover:text-[#F97316] transition block"
          >
            📱 {contact.phone}
          </a>
        )}
      </div>
    );
  };

  const totalActive = collaborations.filter(c => c.status === 'active').length;
  const typesCount = new Set(collaborations.map(c => c.type)).size;
  const totalProjects = collaborations.reduce((acc, c) => acc + (c.projects?.length || 0), 0);

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:py-16">
      {/* En-tête */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="text-center"
      >
        <div className="inline-flex items-center gap-2 rounded-full bg-[#1E3A8A]/10 px-4 py-1.5 text-sm font-medium text-[#1E3A8A]">
          <FaHandshake className="h-4 w-4" />
          Nos Partenaires
        </div>
        <h2 className="mt-4 text-3xl font-black text-[#1E3A8A] md:text-4xl">
          Collaborations & Partenariats
        </h2>
        <p className="mt-2 text-slate-600 max-w-2xl mx-auto">
          Nous collaborons avec des entreprises et institutions de confiance pour offrir des solutions complètes et intégrées.
        </p>
      </motion.div>

      {/* Statistiques */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        viewport={{ once: true }}
        className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4"
      >
        <div className="rounded-lg bg-white p-3 text-center shadow-sm border border-slate-100">
          <p className="text-2xl font-bold text-[#1E3A8A]">{collaborations.length}</p>
          <p className="text-xs text-slate-500">Partenaires</p>
        </div>
        <div className="rounded-lg bg-white p-3 text-center shadow-sm border border-slate-100">
          <p className="text-2xl font-bold text-[#1E3A8A]">{totalActive}</p>
          <p className="text-xs text-slate-500">Actifs</p>
        </div>
        <div className="rounded-lg bg-white p-3 text-center shadow-sm border border-slate-100">
          <p className="text-2xl font-bold text-[#1E3A8A]">{typesCount}</p>
          <p className="text-xs text-slate-500">Types</p>
        </div>
        <div className="rounded-lg bg-white p-3 text-center shadow-sm border border-slate-100">
          <p className="text-2xl font-bold text-[#1E3A8A]">{totalProjects}</p>
          <p className="text-xs text-slate-500">Projets</p>
        </div>
      </motion.div>

      {/* Grille */}
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {collaborations.slice(0, limit).map((collab, index) => {
          const typeConfig = getTypeConfig(collab.type);
          const statusConfig = getStatusConfig(collab.status);
          
          return (
            <motion.div
              key={collab.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ y: -5 }}
            >
              <Card className={`border-2 bg-gradient-to-br ${typeConfig.color} hover:shadow-xl transition-all h-full`}>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row items-start gap-4">
                    <div className="flex-shrink-0">
                      {renderLogo(collab.type)}
                    </div>
                    <div className="flex-1 min-w-0 w-full">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <h3 className="text-base sm:text-lg font-bold text-slate-800 truncate max-w-[150px] sm:max-w-[200px]">
                          {collab.name}
                        </h3>
                        <span className={`text-[8px] sm:text-[10px] px-2 py-0.5 rounded-full border ${statusConfig.color} flex-shrink-0`}>
                          {statusConfig.label}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-[#1E3A8A] mt-0.5">
                        {typeConfig.label}
                      </p>
                      {collab.notes && (
                        <p className="mt-2 text-xs sm:text-sm text-slate-600 line-clamp-2">
                          {collab.notes}
                        </p>
                      )}
                      {renderContributions(collab.contributions)}
                      {collab.projects && collab.projects.length > 0 && (
                        <div className="mt-2 flex items-center gap-1 text-[10px] text-slate-400">
                          <FaCode className="h-2.5 w-2.5" />
                          <span>{collab.projects.length} projet(s) associé(s)</span>
                        </div>
                      )}
                      {renderContact(collab.contact)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Bannière */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        viewport={{ once: true }}
        className="mt-12 rounded-2xl bg-gradient-to-r from-[#1E3A8A] to-[#1E40AF] p-6 sm:p-8 text-center text-white"
      >
        <h3 className="text-xl sm:text-2xl font-bold">Vous souhaitez collaborer avec nous ?</h3>
        <p className="mt-2 text-white/80 text-sm sm:text-base">
          Rejoignez notre réseau de partenaires pour construire ensemble les solutions de demain.
        </p>
        <a
          href="/contact"
          className="mt-4 inline-block rounded-xl bg-[#F97316] px-6 py-3 font-semibold text-white hover:bg-[#ea580c] transition hover:scale-105 text-sm sm:text-base"
        >
          Devenir partenaire →
        </a>
      </motion.div>
    </section>
  );
}