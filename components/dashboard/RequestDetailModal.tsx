// components/dashboard/RequestDetailModal.tsx
'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaBuilding,
  FaCalendar,
  FaClipboardList,
  FaFile,
  FaDownload,
  FaTimes,
  FaCheck,
  FaSpinner,
  FaClock,
  FaExclamationTriangle
} from 'react-icons/fa';
import { toast } from 'sonner';

type ServiceRequest = {
  id: string;
  service_id: string;
  service?: {
    name: string;
    slug: string;
  };
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  description: string;
  budget: string | null;
  deadline: string | null;
  attachments: string[];
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
};

const statusMap: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: {
    label: 'En attente',
    color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    icon: <FaClock className="h-4 w-4" />
  },
  processing: {
    label: 'En traitement',
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    icon: <FaSpinner className="h-4 w-4 animate-spin" />
  },
  completed: {
    label: 'Terminé',
    color: 'bg-green-100 text-green-700 border-green-200',
    icon: <FaCheck className="h-4 w-4" />
  },
  cancelled: {
    label: 'Annulé',
    color: 'bg-red-100 text-red-700 border-red-200',
    icon: <FaTimes className="h-4 w-4" />
  },
};

interface RequestDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: ServiceRequest;
  onStatusUpdate: (id: string, status: string) => void;
}

export default function RequestDetailModal({
  isOpen,
  onClose,
  request,
  onStatusUpdate,
}: RequestDetailModalProps) {
  const [loading, setLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState<string | null>(null);

  // ✅ Gestion avec confirmation
  const handleStatusUpdate = (status: string) => {
    if (status === 'cancelled') {
      // ✅ Demander confirmation pour l'annulation
      if (!confirm('⚠️ Êtes-vous sûr de vouloir annuler cette demande ? Cette action est irréversible.')) {
        return;
      }
    } else if (status === 'completed') {
      if (!confirm('✅ Confirmez-vous que cette demande est terminée ?')) {
        return;
      }
    } else if (status === 'processing') {
      if (!confirm('📋 Confirmez-vous la prise en charge de cette demande ?')) {
        return;
      }
    }

    setLoading(true);
    try {
      onStatusUpdate(request.id, status);
      toast.success(`Demande ${status === 'completed' ? 'terminée' : status === 'processing' ? 'prise en charge' : 'annulée'} avec succès`);
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl text-[#1E3A8A]">
            <FaClipboardList className="h-5 w-5 text-[#F97316]" />
            Détails de la demande
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* En-tête */}
          <div className="flex items-center justify-between">
            <Badge className={statusMap[request.status]?.color}>
              <span className="flex items-center gap-1.5">
                {statusMap[request.status]?.icon}
                {statusMap[request.status]?.label || request.status}
              </span>
            </Badge>
            <span className="text-xs text-slate-400">
              ID: {request.id.slice(0, 8)}...
            </span>
          </div>

          {/* Service */}
          <div className="p-4 bg-slate-50 rounded-lg">
            <p className="text-xs text-slate-500">Service demandé</p>
            <p className="font-medium text-slate-800">
              {request.service?.name || 'Non spécifié'}
            </p>
          </div>

          {/* Infos client */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-start gap-3">
              <FaUser className="h-5 w-5 text-slate-400 mt-0.5" />
              <div>
                <p className="text-xs text-slate-500">Nom</p>
                <p className="font-medium">{request.name}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <FaEnvelope className="h-5 w-5 text-slate-400 mt-0.5" />
              <div>
                <p className="text-xs text-slate-500">Email</p>
                <a href={`mailto:${request.email}`} className="font-medium text-[#1E3A8A] hover:underline">
                  {request.email}
                </a>
              </div>
            </div>
            {request.phone && (
              <div className="flex items-start gap-3">
                <FaPhone className="h-5 w-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-500">Téléphone</p>
                  <a href={`tel:${request.phone}`} className="font-medium">
                    {request.phone}
                  </a>
                </div>
              </div>
            )}
            {request.company && (
              <div className="flex items-start gap-3">
                <FaBuilding className="h-5 w-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-500">Entreprise</p>
                  <p className="font-medium">{request.company}</p>
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <p className="text-xs text-slate-500 mb-1.5">Description du besoin</p>
            <div className="p-4 bg-slate-50 rounded-lg whitespace-pre-wrap text-sm text-slate-700">
              {request.description}
            </div>
          </div>

          {/* Budget et Délai */}
          <div className="grid gap-4 sm:grid-cols-2">
            {request.budget && (
              <div>
                <p className="text-xs text-slate-500">Budget estimé</p>
                <p className="font-medium capitalize">{request.budget.replace('-', ' - ')}</p>
              </div>
            )}
            {request.deadline && (
              <div>
                <p className="text-xs text-slate-500">Délai souhaité</p>
                <p className="font-medium capitalize">{request.deadline.replace('-', ' - ')}</p>
              </div>
            )}
          </div>

          {/* Pièces jointes */}
          {request.attachments && request.attachments.length > 0 && (
            <div>
              <p className="text-xs text-slate-500 mb-1.5">Pièces jointes</p>
              <div className="space-y-2">
                {request.attachments.map((url, index) => (
                  <a
                    key={index}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg hover:bg-slate-100 transition group"
                  >
                    <FaFile className="h-4 w-4 text-[#1E3A8A]" />
                    <span className="text-sm truncate flex-1">
                      {url.split('/').pop() || `Fichier ${index + 1}`}
                    </span>
                    <FaDownload className="h-4 w-4 text-slate-400 group-hover:text-[#1E3A8A] transition" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Date */}
          <div className="flex items-center gap-2 text-xs text-slate-400 border-t border-slate-200 pt-4">
            <FaCalendar className="h-3 w-3" />
            Créé le {new Date(request.created_at).toLocaleString('fr-FR')}
          </div>

          {/* ✅ Actions avec meilleure gestion */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200">
            {request.status === 'pending' && (
              <Button
                onClick={() => handleStatusUpdate('processing')}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {loading ? (
                  <FaSpinner className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <FaSpinner className="mr-2 h-4 w-4" />
                )}
                Prendre en charge
              </Button>
            )}
            {request.status === 'processing' && (
              <Button
                onClick={() => handleStatusUpdate('completed')}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {loading ? (
                  <FaSpinner className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <FaCheck className="mr-2 h-4 w-4" />
                )}
                Marquer terminé
              </Button>
            )}
            {request.status !== 'cancelled' && request.status !== 'completed' && (
              <Button
                variant="destructive"
                onClick={() => handleStatusUpdate('cancelled')}
                disabled={loading}
              >
                {loading ? (
                  <FaSpinner className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <FaTimes className="mr-2 h-4 w-4" />
                )}
                Annuler
              </Button>
            )}
            <Button variant="outline" onClick={onClose} className="ml-auto">
              Fermer
            </Button>
          </div>

          {/* ✅ Message d'information */}
          {request.status === 'pending' && (
            <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-700">
              <FaClock className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>Cette demande est en attente de traitement. Cliquez sur "Prendre en charge" pour commencer.</span>
            </div>
          )}
          {request.status === 'processing' && (
            <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700">
              <FaSpinner className="h-4 w-4 flex-shrink-0 mt-0.5 animate-spin" />
              <span>Cette demande est en cours de traitement. Marquez-la comme terminée une fois le travail achevé.</span>
            </div>
          )}
          {request.status === 'completed' && (
            <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-xs text-green-700">
              <FaCheck className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>Cette demande est terminée. Félicitations pour ce travail accompli !</span>
            </div>
          )}
          {request.status === 'cancelled' && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
              <FaExclamationTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>Cette demande a été annulée. Vous pouvez la réactiver si nécessaire.</span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}