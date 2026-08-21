// contexts/ChatContext.tsx
'use client';

import { createContext, useContext, useState, useRef, ReactNode, useEffect, useCallback } from 'react';

interface ChatContextType {
  isOpen: boolean;
  openChat: () => void;
  closeChat: () => void;
  toggleChat: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const isOpeningRef = useRef(false);

  const openChat = useCallback(() => {
    console.log('📩 ChatProvider: openChat appelé');
    if (!isOpeningRef.current) {
      isOpeningRef.current = true;
      setIsOpen(true);
      setTimeout(() => {
        isOpeningRef.current = false;
      }, 500);
    }
  }, []);

  const closeChat = useCallback(() => {
    console.log('📩 ChatProvider: closeChat appelé');
    setIsOpen(false);
  }, []);

  const toggleChat = useCallback(() => {
    console.log('📩 ChatProvider: toggleChat appelé, état actuel:', isOpen);
    setIsOpen(prev => !prev);
  }, [isOpen]);

  // ✅ Écouter l'événement personnalisé pour ouvrir le chat
  useEffect(() => {
    const handleOpenChat = () => {
      console.log('📩 Événement openChat reçu dans ChatProvider');
      openChat();
    };

    const handleCloseChat = () => {
      console.log('📩 Événement closeChat reçu dans ChatProvider');
      closeChat();
    };

    const handleToggleChat = () => {
      console.log('📩 Événement toggleChat reçu dans ChatProvider');
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
  }, [openChat, closeChat, toggleChat]);

  return (
    <ChatContext.Provider value={{ isOpen, openChat, closeChat, toggleChat }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}