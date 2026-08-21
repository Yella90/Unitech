// components/public/ChatButton.tsx
'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { FaComments, FaTimes, FaBrain, FaRobot, FaBell } from 'react-icons/fa';
import ChatBot from './ChatBot';
import { useChat } from '@/contexts/ChatContext';

// ✅ Exporter l'interface pour les autres composants
export interface ChatButtonHandle {
  openChat: () => void;
  closeChat: () => void;
  toggleChat: () => void;
}

export default function ChatButton() {
  const { isOpen, toggleChat, closeChat, openChat: contextOpenChat } = useChat();
  const [showNotification, setShowNotification] = useState(true);
  const pathname = usePathname();

  // ✅ Ne pas afficher le chat sur les pages admin
  const isAdminPage = pathname?.startsWith('/admin') || false;

  // Cacher la notification après 8 secondes
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowNotification(false);
    }, 8000);
    return () => clearTimeout(timer);
  }, []);

  // ✅ Écouter les événements personnalisés
  useEffect(() => {
    const handleOpenChat = () => {
      console.log('📩 Événement openChat reçu');
      contextOpenChat();
    };

    const handleCloseChat = () => {
      console.log('📩 Événement closeChat reçu');
      closeChat();
    };

    const handleToggleChat = () => {
      console.log('📩 Événement toggleChat reçu');
      toggleChat();
    };

    window.addEventListener('openChat', handleOpenChat);
    window.addEventListener('closeChat', handleCloseChat);
    window.addEventListener('toggleChat', handleToggleChat);

    return () => {
      window.removeEventListener('openChat', handleOpenChat);
      window.removeEventListener('closeChat', handleCloseChat);
      window.removeEventListener('toggleChat', handleToggleChat);
    };
  }, [contextOpenChat, closeChat, toggleChat]);

  // ✅ Ne pas afficher sur les pages admin
  if (isAdminPage) {
    return null;
  }

  return (
    <>
      {/* Bouton flottant - Responsive */}
      <motion.button
        onClick={() => {
          console.log('🔄 Bouton chat cliqué');
          toggleChat();
          setShowNotification(false);
        }}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col items-center group"
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        aria-label={isOpen ? 'Fermer le chat' : 'Ouvrir le chat'}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, type: 'spring', damping: 20 }}
      >
        {/* ✅ Notification flottante - Responsive */}
        <AnimatePresence>
          {showNotification && !isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.8 }}
              transition={{ duration: 0.3 }}
              className="absolute -top-14 sm:-top-20 right-0 bg-gradient-to-r from-[#F97316] to-orange-500 text-white text-xs sm:text-sm font-bold px-3 py-2 sm:px-5 sm:py-3 rounded-2xl shadow-2xl whitespace-nowrap flex items-center gap-2 sm:gap-3 border-2 border-white/20"
            >
              <FaBell className="h-3 w-3 sm:h-4 sm:w-4 animate-bounce" />
              <span className="text-[10px] sm:text-sm">💬 Une question ?</span>
              <div className="absolute bottom-[-6px] sm:bottom-[-8px] right-4 sm:right-8 w-3 h-3 sm:w-4 sm:h-4 bg-[#F97316] rotate-45 border-r-2 border-b-2 border-white/20" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ✅ Cercle principal - Responsive */}
        <div className="relative">
          <div className="absolute inset-[-8px] sm:inset-[-12px] rounded-full border-4 border-[#F97316]/20 animate-ping" style={{ animationDuration: '2s' }} />
          <div className="absolute inset-[-4px] sm:inset-[-6px] rounded-full border-2 border-[#F97316]/40 animate-pulse" style={{ animationDuration: '1.5s' }} />
          
          <div className="relative w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-[#1E3A8A] via-[#1E40AF] to-[#F97316] shadow-2xl hover:shadow-[0_0_40px_rgba(249,115,22,0.3)] sm:hover:shadow-[0_0_60px_rgba(249,115,22,0.4)] transition-all duration-300 flex items-center justify-center border-2 sm:border-4 border-white/30">
            <AnimatePresence mode="wait">
              {isOpen ? (
                <motion.div
                  key="close"
                  initial={{ rotate: 0 }}
                  animate={{ rotate: 180 }}
                  exit={{ rotate: 0 }}
                  transition={{ duration: 0.3 }}
                  className="text-white"
                >
                  <FaTimes className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8" />
                </motion.div>
              ) : (
                <motion.div
                  key="open"
                  initial={{ rotate: 0 }}
                  animate={{ rotate: 0 }}
                  exit={{ rotate: -180 }}
                  transition={{ duration: 0.3 }}
                  className="relative text-white"
                >
                  <FaComments className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8" />
                  <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 flex h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 bg-green-500 border-2 border-white" />
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ✅ Texte - Responsive */}
        <div className="mt-2 sm:mt-3 flex flex-col items-center gap-0.5 sm:gap-1">
          <div className="bg-white/95 backdrop-blur-md px-3 py-1.5 sm:px-4 sm:py-2 md:px-5 md:py-2 rounded-2xl shadow-xl border border-slate-200/50 group-hover:border-[#F97316]/30 transition-all duration-300">
            <span className="text-[10px] sm:text-xs md:text-sm font-bold text-[#1E3A8A] flex items-center gap-1 sm:gap-2">
              <FaBrain className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 text-[#F97316]" />
              <span className="hidden xs:inline">{isOpen ? 'Fermer' : '💬 Chatbot IA'}</span>
              <span className="xs:hidden">{isOpen ? '✕' : '💬'}</span>
            </span>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <span className="text-[8px] sm:text-[9px] md:text-[10px] font-semibold text-white bg-gradient-to-r from-[#1E3A8A] to-[#1E40AF] px-2 py-0.5 sm:px-3 sm:py-1 rounded-full shadow-md border border-white/20 flex items-center gap-1 sm:gap-1.5">
              <FaRobot className="h-2 w-2 sm:h-2.5 sm:w-2.5 md:h-3 md:w-3 text-[#F97316]" />
              <span className="hidden xs:inline">DONA + HARVEY</span>
              <span className="xs:hidden">IA</span>
            </span>
            <span className="text-[6px] sm:text-[7px] md:text-[8px] bg-green-500 text-white px-1.5 py-0.5 sm:px-2 sm:py-0.5 rounded-full animate-pulse font-bold">
              <span className="hidden xs:inline">EN LIGNE</span>
              <span className="xs:hidden">●</span>
            </span>
          </div>
        </div>
      </motion.button>

      {/* ChatBot */}
      <ChatBot isOpen={isOpen} onClose={closeChat} />
    </>
  );
}