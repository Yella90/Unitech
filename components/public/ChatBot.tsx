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
  FaClock
} from 'react-icons/fa';
import { toast } from 'sonner';
import { chatStorage, type StoredMessage, type StoredConversation } from '@/lib/services/chat-storage';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ============================================================
  // CHARGEMENT DES DONNÉES STOCKÉES (localStorage)
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
    
    toast.info('Conversation réinitialisée');
  }, [currentConversationId]);

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

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          category: 'general',
          tone: 'friendly'
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      setMessages(prev => prev.filter(m => m.id !== typingId));
      setIsTyping(false);

      if (data.success && data.content) {
        await addMessage({
          role: 'assistant',
          content: data.content,
          agent: data.suggested_agent?.toLowerCase() === 'harvey' ? 'harvey' : 'dona',
          category: data.category || 'general'
        });
      } else {
        await addMessage({
          role: 'assistant',
          content: data.content || "Je suis désolé, je n'ai pas pu traiter votre demande. Veuillez réessayer."
        });
      }

    } catch (error: any) {
      console.error('❌ Erreur chat:', error);
      
      setMessages(prev => prev.filter(m => m.id !== typingId));
      setIsTyping(false);

      let errorMessage = "Je rencontre actuellement un problème technique. Veuillez réessayer dans quelques instants.";
      
      if (error.message.includes('HTTP 404')) {
        errorMessage = "Le service de chat est temporairement indisponible. Notre équipe technique a été informée.";
      } else if (error.message.includes('HTTP 500')) {
        errorMessage = "Le serveur rencontre un problème. Veuillez réessayer dans quelques minutes.";
      }

      await addMessage({
        role: 'assistant',
        content: errorMessage
      });
      
      toast.error('Erreur de communication');
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  }, [isLoading, addMessage]);

  // ============================================================
  // COMPOSANT DE RENDU DES MESSAGES AVEC LIENS (CORRIGÉ)
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

    return (
      <div className="text-sm leading-relaxed whitespace-pre-wrap">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            // ✅ Liens cliquables - gère automatiquement mailto
            a: ({ href, children }) => {
              // Vérifier si c'est un lien mailto
              const isMailto = href?.startsWith('mailto:');
              
              return (
                <a
                  href={href}
                  target={isMailto ? '_self' : '_blank'}
                  rel={isMailto ? '' : 'noopener noreferrer'}
                  className="text-[#1E3A8A] underline hover:text-[#F97316] transition-colors font-medium"
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  {children}
                </a>
              );
            },
            // ✅ Boutons
            button: ({ children }) => (
              <span className="inline-block bg-[#1E3A8A] text-white px-4 py-2 rounded-lg hover:bg-[#1A2F6A] transition">
                {children}
              </span>
            ),
            // ✅ Liste
            ul: ({ children }) => (
              <ul className="list-disc pl-4 space-y-1 my-2">
                {children}
              </ul>
            ),
            ol: ({ children }) => (
              <ol className="list-decimal pl-4 space-y-1 my-2">
                {children}
              </ol>
            ),
            li: ({ children }) => (
              <li className="text-slate-700">{children}</li>
            ),
            // ✅ Titres
            h1: ({ children }) => (
              <h1 className="text-xl font-bold text-[#1E3A8A] mt-4 mb-2">{children}</h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-lg font-semibold text-[#1E3A8A] mt-3 mb-2">{children}</h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-base font-semibold text-[#1E3A8A] mt-2 mb-1">{children}</h3>
            ),
            // ✅ Gras
            strong: ({ children }) => (
              <strong className="font-bold text-[#1E3A8A]">{children}</strong>
            ),
            // ✅ Paragraphe
            p: ({ children }) => (
              <p className="mb-2 last:mb-0">{children}</p>
            ),
            // ✅ Blockquote
            blockquote: ({ children }) => (
              <blockquote className="border-l-4 border-[#1E3A8A] pl-4 my-2 text-slate-600 italic">
                {children}
              </blockquote>
            ),
            // ✅ Code
            code: ({ children }) => (
              <code className="bg-slate-100 px-1.5 py-0.5 rounded text-sm font-mono">
                {children}
              </code>
            ),
          }}
        >
          {message.content}
        </ReactMarkdown>
      </div>
    );
  };

  // ============================================================
  // RENDU
  // ============================================================

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          transition={{ duration: 0.3, type: 'spring', damping: 25 }}
          className="fixed bottom-24 right-4 z-50 w-[380px] max-w-[calc(100vw-2rem)] sm:w-[420px] max-h-[600px] sm:max-h-[700px] bg-white rounded-2xl shadow-2xl border border-slate-200/50 flex flex-col overflow-hidden"
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
                <h3 className="font-semibold text-sm">Assistant UNITECH</h3>
                <p className="text-[10px] text-white/70 flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400" />
                  {isLoading ? 'En cours...' : 'En ligne'} • {messages.length} messages
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={clearHistory}
                className="p-1.5 rounded-lg hover:bg-white/20 transition text-white/70 hover:text-white"
                title="Nouvelle conversation"
              >
                <FaTrash className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-white/20 transition"
              >
                <FaTimes className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages - Avec support des liens */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F8FAFC] min-h-[300px] max-h-[400px] sm:max-h-[500px] chat-scroll">
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
                    {message.role === 'assistant' && !message.isTyping && message.agent && (
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <span className="text-[10px] font-medium text-[#F97316]">
                          {message.agent === 'harvey' ? '🤖 HARVEY' : '🧠 DONA'}
                          {message.agent === 'both' && '⚡'}
                        </span>
                        {message.category && (
                          <span className="text-[8px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded-full">
                            {message.category}
                          </span>
                        )}
                      </div>
                    )}
                    
                    {/* ✅ Rendu avec ReactMarkdown - mailto géré automatiquement */}
                    {renderMessageContent(message)}
                    
                    {!message.isTyping && (
                      <div className="mt-1 text-[9px] opacity-50">
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
            <div className="flex flex-wrap gap-1.5 max-h-16 overflow-y-auto">
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action.label}
                  onClick={() => sendMessage(action.value)}
                  disabled={isLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-medium text-[#1E3A8A] bg-[#1E3A8A]/10 rounded-full hover:bg-[#1E3A8A]/20 transition disabled:opacity-50 whitespace-nowrap"
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
                placeholder="Posez votre question..."
                className="flex-1 px-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] focus:border-transparent"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="p-2.5 bg-[#1E3A8A] text-white rounded-xl hover:bg-[#1A2F6A] transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <FaSpinner className="h-4 w-4 animate-spin" />
                ) : (
                  <FaPaperPlane className="h-4 w-4" />
                )}
              </button>
            </form>
          </div>

          {/* Infos stockage */}
          <div className="px-3 py-1.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[9px] text-slate-400 flex-shrink-0">
            <span>
              {storageStats.totalConversations} conv. • {storageStats.totalMessages} messages
            </span>
            <span>
              {(storageStats.storageSize / 1024).toFixed(1)} KB
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}