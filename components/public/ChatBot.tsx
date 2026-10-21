// components/public/ChatBot.tsx
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaRobot,
  FaTimes,
  FaPaperPlane,
  FaSpinner,
  FaBrain,
  FaCheckCircle,
  FaCircle,
  FaCog,
  FaLightbulb,
  FaRocket,
  FaHandshake,
  FaTrash,
  FaClock,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaBuilding,
  FaMoneyBillWave
} from 'react-icons/fa';
import { toast } from 'sonner';
import { chatStorage, type StoredMessage, type StoredConversation } from '@/lib/services/chat-storage';
import { askHarvey, getChatSessionId, resetChatSessionId } from '@/lib/chat/client';
import ChatMarkdown from './ChatMarkdown';

// ============================================================
// TYPES
// ============================================================

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  agent?: 'dona' | 'harvey' | 'both';
  category?: string;
  isTyping?: boolean;
}

interface ChatBotProps {
  isOpen: boolean;
  onClose: () => void;
}

// ============================================================
// ACTIONS RAPIDES
// ============================================================

const QUICK_ACTIONS = [
  { label: 'Nos services', icon: FaCog, value: 'Présente-moi les services de UNITECH' },
  { label: 'Nos agents IA', icon: FaBrain, value: 'Présente-moi les agents IA de UNITECH' },
  { label: 'Nos solutions', icon: FaRocket, value: 'Quelles sont vos solutions technologiques ?' },
  { label: 'Nous contacter', icon: FaHandshake, value: 'Comment puis-je contacter UNITECH ?' },
  { label: 'Formations', icon: FaClock, value: 'Quelles formations proposez-vous ?' },
  { label: 'Projets', icon: FaLightbulb, value: 'Quels sont vos projets en cours ?' }
];

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================

export default function ChatBot({ isOpen, onClose }: ChatBotProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [conversations, setConversations] = useState<StoredConversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [storageStats, setStorageStats] = useState({ totalConversations: 0, totalMessages: 0, storageSize: 0 });
  const [leadId, setLeadId] = useState<string | null>(null);
  
  // Même conversation que la page /chat, conservée entre les pages
  const sessionId = useRef('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    sessionId.current = getChatSessionId();
  }, []);

  // ============================================================
  // CHARGEMENT DES DONNÉES STOCKÉES
  // ============================================================

  useEffect(() => {
    if (isOpen) {
      loadConversations();
    }
  }, [isOpen]);

  const loadConversations = useCallback(() => {
    const convs = chatStorage.getConversations();
    setConversations(convs);
    setStorageStats(chatStorage.getStats());

    const current = chatStorage.getCurrentConversation();
    if (current) {
      setCurrentConversationId(current.id);
      loadMessages(current.id);
    } else if (convs.length > 0) {
      chatStorage.switchConversation(convs[0].id);
      setCurrentConversationId(convs[0].id);
      loadMessages(convs[0].id);
    } else {
      const newConv = chatStorage.createConversation();
      setCurrentConversationId(newConv.id);
      setMessages([]);
    }
  }, []);

  const loadMessages = useCallback((conversationId: string) => {
    const conv = chatStorage.getConversation(conversationId);
    if (conv) {
      const msgs: Message[] = conv.messages.map((msg: StoredMessage) => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
        isTyping: false
      }));
      setMessages(msgs);
    } else {
      setMessages([]);
    }
  }, []);

  // ============================================================
  // SCROLL ET FOCUS
  // ============================================================

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  // ============================================================
  // GESTION DES MESSAGES
  // ============================================================

  const addMessage = useCallback(async (message: Omit<Message, 'id' | 'timestamp'>) => {
    const newMessage: Message = {
      ...message,
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMessage]);

    const stored = chatStorage.addMessage({
      role: message.role,
      content: message.content,
      agent: message.agent,
      category: message.category
    });

    if (stored) {
      const convs = chatStorage.getConversations();
      setConversations(convs);
      setStorageStats(chatStorage.getStats());
    }

    return newMessage;
  }, []);

  const clearHistory = useCallback(() => {
    if (currentConversationId) {
      chatStorage.deleteConversation(currentConversationId);
    }
    
    const newConv = chatStorage.createConversation();
    setCurrentConversationId(newConv.id);
    setMessages([]);
    setConversations(chatStorage.getConversations());
    setStorageStats(chatStorage.getStats());
    sessionId.current = resetChatSessionId();
    setLeadId(null);

    toast.info('Conversation réinitialisée');
  }, [currentConversationId]);

  // ============================================================
  // SAUVEGARDE DES LEADS
  // ============================================================

  useEffect(() => {
    if (messages.length >= 5 && !leadId) {
      const saveLead = async () => {
        try {
          const response = await fetch('/api/leads/chatbot', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId: sessionId.current,
              messages: messages.map(m => ({
                role: m.role,
                content: m.content,
                timestamp: m.timestamp.toISOString()
              }))
            })
          });
          const lead = await response.json();
          if (lead?.id) {
            setLeadId(lead.id);
          }
        } catch (error) {
          console.error('❌ Erreur sauvegarde lead:', error);
        }
      };
      saveLead();
    }
  }, [messages, leadId]);

  // ============================================================
  // ENVOI DU MESSAGE
  // ============================================================

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;

    await addMessage({
      role: 'user',
      content: text.trim()
    });

    setInput('');
    setIsLoading(true);
    setIsTyping(true);

    const typingId = `typing-${Date.now()}`;
    setMessages(prev => [...prev, {
      id: typingId,
      role: 'assistant',
      content: '...',
      timestamp: new Date(),
      isTyping: true
    }]);

    const history = messages
      .filter(m => !m.isTyping)
      .slice(-10)
      .map(m => ({ role: m.role, content: m.content }));

    // askHarvey renvoie toujours un texte : réponse, refus du serveur
    // (limite de messages) ou message d'erreur
    const reply = await askHarvey({ message: text.trim(), history, sessionId: sessionId.current });

    setMessages(prev => prev.filter(m => m.id !== typingId));
    await addMessage({
      role: 'assistant',
      content: reply.content,
      agent: reply.agent,
      category: reply.category
    });
    if (!reply.ok) toast.error('Le message n\'a pas pu être traité');

    setIsLoading(false);
    setIsTyping(false);
  }, [isLoading, addMessage, messages]);

  // ============================================================
  // RENDU DES MESSAGES AVEC LIENS
  // ============================================================

  const renderMessageContent = (message: Message) => {
    if (message.isTyping) {
      return (
        <div className="flex items-center gap-1.5 py-1">
          <div className="h-2 w-2 bg-[#1E3A8A] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="h-2 w-2 bg-[#1E3A8A] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="h-2 w-2 bg-[#1E3A8A] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      );
    }

    if (message.role === 'user') {
      return <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>;
    }

    return <ChatMarkdown content={message.content} />;
  };

  // ============================================================
  // RENDU PRINCIPAL
  // ============================================================

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          transition={{ duration: 0.3, type: 'spring', damping: 25 }}
          // Hauteur bornée par l'écran : l'en-tête (fermer, effacer) reste toujours visible
          className="fixed bottom-24 right-4 z-50 w-[380px] max-w-[calc(100vw-2rem)] sm:w-[420px] h-[min(640px,calc(100dvh-7.5rem))] bg-white rounded-2xl shadow-2xl border border-slate-200/50 flex flex-col overflow-hidden"
        >
          {/* En-tête */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[#1E3A8A] to-[#1E40AF] text-white flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative">
                <FaRobot className="h-6 w-6" />
                {!isLoading && (
                  <FaCircle className="absolute -bottom-1 -right-1 h-3 w-3 text-green-400 animate-pulse" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-sm">HARVEY · Assistant UNITECH</h3>
                <p className="text-[11px] text-white/75 flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400" />
                  {isLoading ? 'Écrit une réponse…' : 'En ligne'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={clearHistory}
                className="p-1.5 rounded-lg hover:bg-white/20 transition text-white/70 hover:text-white"
                title="Nouvelle conversation"
                aria-label="Nouvelle conversation"
              >
                <FaTrash className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-white/20 transition"
                aria-label="Fermer le chat"
              >
                <FaTimes className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3 bg-[#F8FAFC] chat-scroll" aria-live="polite">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <FaRobot className="h-12 w-12 mb-3 opacity-50" />
                <p className="text-sm">Commencez une conversation</p>
                <p className="text-xs">Posez votre question ci-dessous</p>
              </div>
            ) : (
              messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                      message.role === 'user'
                        ? 'bg-[#1E3A8A] text-white rounded-br-none'
                        : message.isTyping
                        ? 'bg-white border border-slate-200 rounded-bl-none shadow-sm'
                        : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-sm'
                    }`}
                  >
                    {message.role === 'assistant' && !message.isTyping && (
                      <div className="mb-1 text-[11px] font-semibold text-[#F97316]">
                        {message.agent === 'dona' ? '🧠 DONA' : '🤖 HARVEY'}
                      </div>
                    )}

                    {renderMessageContent(message)}

                    {!message.isTyping && (
                      <div className={`mt-1 text-[10px] ${message.role === 'user' ? 'text-white/60' : 'text-slate-400'}`}>
                        {new Date(message.timestamp).toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Actions Rapides */}
          <div className="px-3 py-2 bg-white border-t border-slate-100 flex-shrink-0">
            <div className="flex gap-1.5 overflow-x-auto pb-1 chat-scroll">
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action.label}
                  onClick={() => sendMessage(action.value)}
                  disabled={isLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#1E3A8A] bg-[#1E3A8A]/10 rounded-full hover:bg-[#1E3A8A]/20 transition disabled:opacity-50 whitespace-nowrap"
                >
                  <action.icon className="h-3 w-3" />
                  {action.label}
                </button>
              ))}
            </div>
          </div>

          {/* Input */}
          <div className="p-3 bg-white border-t border-slate-200 flex-shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage(input);
              }}
              className="flex gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Écrivez votre question…"
                aria-label="Votre message"
                autoComplete="off"
                enterKeyHint="send"
                maxLength={4000}
                className="min-w-0 flex-1 px-4 py-2 text-base sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#1E3A8A] focus:border-transparent"
              />
              <button
                type="submit"
                aria-label="Envoyer"
                disabled={isLoading || !input.trim()}
                className="px-3 bg-[#F97316] text-white rounded-xl hover:bg-[#ea580c] transition disabled:bg-slate-300 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <FaSpinner className="h-4 w-4 animate-spin" />
                ) : (
                  <FaPaperPlane className="h-4 w-4" />
                )}
              </button>
            </form>
          </div>

        </motion.div>
      )}
    </AnimatePresence>
  );
}