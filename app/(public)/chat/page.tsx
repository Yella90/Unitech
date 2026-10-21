// app/(public)/chat/page.tsx
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  FaArrowLeft, FaRobot, FaPaperPlane, FaSpinner, FaTrash,
  FaGraduationCap, FaCog, FaFileInvoice, FaHandshake,
} from 'react-icons/fa';
import { toast } from 'sonner';
import {
  chatStorage,
  CHAT_STORAGE_CONFIG,
  type LLMHistoryMessage,
} from '@/lib/services/chat-storage';
import { askHarvey, getChatSessionId, resetChatSessionId } from '@/lib/chat/client';
import ChatMarkdown from '@/components/public/ChatMarkdown';

// ============================================================
// CONSTANTES
// ============================================================

const WELCOME_TEXT = `👋 Bonjour ! Je suis **HARVEY**, l'assistant d'**UNITECH**.

Je peux vous renseigner sur :
- Nos services et solutions technologiques
- Nos formations : programmes, tarifs et dates
- Nos projets et nos agents IA
- Un devis ou un rendez-vous avec l'équipe

Comment puis-je vous aider aujourd'hui ?`;

// Proposées tant que le visiteur n'a rien écrit
const SUGGESTIONS = [
  { label: 'Formations et tarifs', icon: FaGraduationCap, value: 'Quelles formations proposez-vous, avec les tarifs et les dates ?' },
  { label: 'Nos services', icon: FaCog, value: 'Présente-moi les services de UNITECH' },
  { label: 'Demander un devis', icon: FaFileInvoice, value: "J'aimerais un devis pour un projet" },
  { label: 'Parler à un conseiller', icon: FaHandshake, value: 'Comment puis-je contacter un conseiller UNITECH ?' },
];

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  agent?: 'dona' | 'harvey' | 'both';
  category?: string;
  isTyping?: boolean;
}

// ============================================================
// COMPOSANT
// ============================================================

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const sessionIdRef = useRef<string>('');

  // ------------------------------------------------------------
  // INIT : charge depuis localStorage, crée conv + welcome si besoin
  // ------------------------------------------------------------
  useEffect(() => {
    sessionIdRef.current = getChatSessionId();

    let current = chatStorage.getCurrentConversation();

    // Aucune conversation → en créer une
    if (!current) {
      current = chatStorage.createConversation();
    }

    // Conversation vide → persister le welcome
    if (current.messages.length === 0) {
      chatStorage.addMessage({
        role: 'assistant',
        content: WELCOME_TEXT,
        agent: 'harvey',
      });
      current = chatStorage.getCurrentConversation()!;
    }

    // Hydrater le state React depuis le storage
    const msgs: Message[] = current.messages.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      timestamp: new Date(m.timestamp),
      agent: m.agent,
      category: m.category,
      isTyping: false,
    }));

    setMessages(msgs);
    setIsHydrated(true);
  }, []);

  // Focus auto (sauf sur mobile : le clavier masquerait le message d'accueil)
  useEffect(() => {
    if (!isHydrated || window.matchMedia('(pointer: coarse)').matches) return;
    const t = window.setTimeout(() => inputRef.current?.focus(), 100);
    return () => window.clearTimeout(t);
  }, [isHydrated]);

  // Scroll auto
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ------------------------------------------------------------
  // AJOUTER UN MESSAGE (state + storage)
  // ------------------------------------------------------------
  const addMessage = useCallback(
    (message: Omit<Message, 'id' | 'timestamp'>) => {
      const newMessage: Message = {
        ...message,
        id: `msg-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, newMessage]);

      // Persiste dans localStorage
      chatStorage.addMessage({
        role: message.role,
        content: message.content,
        agent: message.agent,
        category: message.category,
      });

      return newMessage;
    },
    []
  );

  // ------------------------------------------------------------
  // ENVOYER UN MESSAGE
  // ------------------------------------------------------------
  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;

      // Historique lu avant d'ajouter le message : 5 dernières paires Q/R
      const history: LLMHistoryMessage[] = chatStorage.getRecentHistory(
        CHAT_STORAGE_CONFIG.HISTORY_PAIRS_FOR_LLM
      );

      addMessage({ role: 'user', content: trimmed });
      setInput('');
      setIsLoading(true);

      // Placeholder typing
      const typingId = `typing-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        { id: typingId, role: 'assistant', content: '...', timestamp: new Date(), isTyping: true },
      ]);

      const reply = await askHarvey({ message: trimmed, history, sessionId: sessionIdRef.current });

      setMessages((prev) => prev.filter((m) => m.id !== typingId));
      addMessage({
        role: 'assistant',
        content: reply.content,
        agent: reply.agent,
        category: reply.category,
      });
      if (!reply.ok) toast.error('Le message n\'a pas pu être traité');

      setIsLoading(false);
      requestAnimationFrame(() => inputRef.current?.focus());
    },
    [isLoading, addMessage]
  );

  // ------------------------------------------------------------
  // EFFACER
  // ------------------------------------------------------------
  const clearHistory = () => {
    if (!confirm('Voulez-vous effacer toute la conversation ?')) return;

    chatStorage.clearAll();
    chatStorage.createConversation();
    chatStorage.addMessage({
      role: 'assistant',
      content: WELCOME_TEXT,
      agent: 'harvey',
    });
    sessionIdRef.current = resetChatSessionId();

    const current = chatStorage.getCurrentConversation();
    const msgs: Message[] = (current?.messages || []).map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      timestamp: new Date(m.timestamp),
      agent: m.agent,
      category: m.category,
    }));

    setMessages(msgs);
    toast.info('Conversation réinitialisée');
  };

  const hasUserMessage = messages.some((m) => m.role === 'user');

  // ------------------------------------------------------------
  // RENDER
  // ------------------------------------------------------------
  if (!isHydrated) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#F5F7FB]">
        <FaSpinner className="h-6 w-6 animate-spin text-[#1E3A8A]" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] flex h-[100dvh] flex-col overflow-hidden bg-[#F5F7FB]">
      {/* En-tête */}
      <header className="flex-shrink-0 bg-white border-b border-slate-200 shadow-sm">
        <div className="mx-auto max-w-4xl px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <Link
              href="/"
              aria-label="Retour au site"
              className="p-2 rounded-lg hover:bg-slate-100 transition flex-shrink-0"
            >
              <FaArrowLeft className="h-5 w-5 text-slate-600" />
            </Link>
            <div className="relative flex-shrink-0 flex h-9 w-9 items-center justify-center rounded-full bg-[#1E3A8A] text-white">
              <FaRobot className="h-5 w-5" />
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-green-500" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-base sm:text-lg font-bold leading-tight text-[#1E3A8A]">
                HARVEY<span className="hidden sm:inline"> · Assistant UNITECH</span>
              </h1>
              <p className="truncate text-xs text-slate-500 leading-tight">
                {isLoading ? 'Écrit une réponse…' : 'En ligne'}
                <span className="hidden sm:inline">{isLoading ? '' : ' · répond en quelques secondes'}</span>
              </p>
            </div>
          </div>
          <button
            onClick={clearHistory}
            aria-label="Nouvelle conversation"
            title="Nouvelle conversation"
            className="p-2 rounded-lg hover:bg-red-50 text-slate-500 hover:text-red-600 transition flex-shrink-0"
          >
            <FaTrash className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Messages */}
      <div className="min-h-0 flex-1 overflow-y-auto" aria-live="polite">
        <div className="mx-auto max-w-4xl space-y-3 px-3 sm:px-4 py-4">
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[88%] sm:max-w-[80%] rounded-2xl px-4 py-2.5 ${
                  message.role === 'user'
                    ? 'bg-[#1E3A8A] text-white rounded-br-none'
                    : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-sm'
                }`}
              >
                {message.role === 'assistant' && !message.isTyping && (
                  <div className="mb-1 text-[11px] font-semibold text-[#F97316]">
                    {message.agent === 'dona' ? '🧠 DONA' : '🤖 HARVEY'}
                  </div>
                )}
                {message.isTyping ? (
                  <div className="flex items-center gap-1.5 py-1" aria-label="HARVEY écrit">
                    <div className="h-2 w-2 bg-[#1E3A8A] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="h-2 w-2 bg-[#1E3A8A] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="h-2 w-2 bg-[#1E3A8A] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                ) : message.role === 'user' ? (
                  <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
                ) : (
                  <ChatMarkdown content={message.content} />
                )}
                {!message.isTyping && (
                  <div className={`mt-1 text-[10px] ${message.role === 'user' ? 'text-white/60' : 'text-slate-400'}`}>
                    {new Date(message.timestamp).toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          ))}

          {/* Suggestions avant le premier message */}
          {!hasUserMessage && (
            <div className="flex flex-wrap gap-2 pt-1">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s.label}
                  onClick={() => sendMessage(s.value)}
                  disabled={isLoading}
                  className="flex items-center gap-2 rounded-full border border-[#1E3A8A]/20 bg-white px-3.5 py-2 text-sm font-medium text-[#1E3A8A] shadow-sm transition hover:border-[#F97316] hover:text-[#F97316] disabled:opacity-50"
                >
                  <s.icon className="h-3.5 w-3.5" />
                  {s.label}
                </button>
              ))}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Saisie */}
      <div
        className="flex-shrink-0 bg-white border-t border-slate-200"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="mx-auto max-w-4xl px-3 sm:px-4 py-3">
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
              className="min-w-0 flex-1 px-4 py-2.5 text-base sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#1E3A8A] focus:border-transparent"
            />
            <button
              type="submit"
              aria-label="Envoyer"
              disabled={isLoading || !input.trim()}
              className="px-3.5 bg-[#F97316] text-white rounded-xl hover:bg-[#ea580c] transition disabled:bg-slate-300 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <FaSpinner className="h-4 w-4 animate-spin" />
              ) : (
                <FaPaperPlane className="h-4 w-4" />
              )}
            </button>
          </form>
          <p className="text-center text-[11px] text-slate-400 mt-1.5">
            HARVEY est une IA : faites confirmer les informations importantes par l&apos;équipe.
          </p>
        </div>
      </div>
    </div>
  );
}
