// components/ui/DeleteConfirmModal.tsx (version enrichie)
'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaExclamationTriangle, 
  FaTimes, 
  FaTrash, 
  FaSpinner,
  FaShieldAlt 
} from 'react-icons/fa';
import { Button } from '@/components/ui/button';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  itemName: string;
  itemType?: string;
  isLoading?: boolean;
}

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  itemName,
  itemType = 'élément',
  isLoading = false,
}: DeleteConfirmModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleConfirm = async () => {
    setIsDeleting(true);
    await onConfirm();
    setIsDeleting(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
          onClick={handleOverlayClick}
        >
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, scale: 0.8, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 30 }}
            transition={{ 
              duration: 0.3, 
              ease: [0.16, 1, 0.3, 1],
              type: 'spring',
              stiffness: 500,
              damping: 30
            }}
            className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            {/* Glow effect */}
            <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-red-500/10 blur-2xl" />
            <div className="absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-red-500/10 blur-2xl" />

            {/* Header */}
            <div className="relative px-6 pt-8 pb-4">
              <button
                onClick={onClose}
                className="absolute right-4 top-4 p-1.5 rounded-xl hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600"
                disabled={isLoading}
              >
                <FaTimes className="h-5 w-5" />
              </button>
              
              <div className="flex items-start gap-4">
                <div className="relative flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-red-600 shadow-lg shadow-red-500/30">
                  <FaExclamationTriangle className="h-7 w-7 text-white" />
                  <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-md">
                    <FaShieldAlt className="h-3.5 w-3.5 text-red-500" />
                  </div>
                </div>
                <div className="pt-1">
                  <h3 className="text-xl font-bold text-slate-900">{title}</h3>
                  <p className="text-sm text-slate-500">Cette action est irréversible</p>
                </div>
              </div>
            </div>

            {/* Corps */}
            <div className="relative px-6 py-4">
              <p className="text-slate-600 text-sm leading-relaxed">
                {message}
              </p>
              
              <div className="mt-4 rounded-xl bg-red-50/80 border-2 border-red-200 p-4">
                <p className="text-sm font-medium text-red-700 flex items-center gap-2">
                  <span className="text-lg">⚠️</span>
                  <span>Vous allez supprimer :</span>
                </p>
                <p className="mt-1 text-base font-bold text-red-800 break-words">
                  "{itemName}"
                </p>
                {itemType && (
                  <p className="mt-1 text-xs text-red-600/70">
                    Type : {itemType}
                  </p>
                )}
              </div>

              <div className="mt-4 flex items-start gap-2 text-xs text-slate-400">
                <FaShieldAlt className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <p>
                  Cette action supprimera définitivement toutes les données associées à ce{itemType ? ' ' + itemType : ''}.
                  Vous ne pourrez pas récupérer ces données.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="relative flex flex-col-reverse sm:flex-row justify-end gap-3 px-6 py-5 bg-slate-50/80 border-t border-slate-200">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading || isDeleting}
                className="w-full sm:w-auto justify-center text-sm font-medium"
              >
                Annuler
              </Button>
              <Button
                type="button"
                onClick={handleConfirm}
                disabled={isLoading || isDeleting}
                className="w-full sm:w-auto justify-center bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white text-sm font-medium gap-2 group shadow-lg shadow-red-500/20 hover:shadow-red-500/30 transition-all"
              >
                {isLoading || isDeleting ? (
                  <>
                    <FaSpinner className="h-4 w-4 animate-spin" />
                    Suppression en cours...
                  </>
                ) : (
                  <>
                    <FaTrash className="h-4 w-4 group-hover:scale-110 transition-transform" />
                    <span>Supprimer définitivement</span>
                  </>
                )}
              </Button>
            </div>

            {/* Bandeau décoratif */}
            <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-400 via-red-500 to-red-600" />
            
            {/* Pulsing ring animation (uniquement quand le modal est ouvert) */}
            {isOpen && !isLoading && !isDeleting && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-20 right-20 h-32 w-32 animate-ping rounded-full bg-red-500/5" />
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}