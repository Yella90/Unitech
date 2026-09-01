// app/(public)/chat/page.tsx
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { FaArrowLeft, FaRobot, FaPaperPlane, FaSpinner, FaTrash } from 'react-icons/fa';
import { toast } from 'sonner';
import { chatStorage } from '@/lib/services/chat-storage';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  agent?: 'dona' | 'harvey' | 'both';
  category?: string;
  isTyping?: boolean;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId] = useState(`chat-${Date.now()}-${Math.random().toString(36).substring(7)}`);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // This page is dedicated to the conversation: focus the composer as soon as
  // it is rendered instead of leaving focus on surrounding site chrome.
  useEffect(() => {
    const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 100);
    return () => window.clearTimeout(focusTimer);
  }, []);

  // Charger l'historique depuis localStorage
  useEffect(() => {
    const convs = chatStorage.getConversations();
    if (convs.length > 0) {
      const current = chatStorage.getCurrentConversation();
      if (current) {
        const msgs = current.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
          isTyping: false
        }));
        setMessages(msgs);
      }
    } else {
      // Message de bienvenue
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: `👋 Bonjour ! Je suis l'assistant intelligent d'**UNITECH**.
        
Je peux vous renseigner en temps réel sur :
• Nos services et solutions technologiques
• Nos agents IA (DONA et HARVEY)
• Nos projets et formations
• Toute question sur UNITECH

Comment puis-je vous aider aujourd'hui ?`,
        timestamp: new Date(),
        agent: 'both'
      }]);
    }
  }, []);

  // Scroll automatique
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMessage = useCallback(async (message: Omit<Message, 'id' | 'timestamp'>) => {
    const newMessage: Message = {
      ...message,
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMessage]);

    // Sauvegarder dans localStorage
    chatStorage.addMessage({
      role: message.role,
      content: message.content,
      agent: message.agent,
      category: message.category
    });

    return newMessage;
  }, []);

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
      const history = messages.slice(-10).map(m => ({
        role: m.role,
        content: m.content
      }));

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          history: history,
          sessionId: sessionId,
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
          agent: 'harvey',
          category: data.category || 'general'
        });
      } else {
        await addMessage({
          role: 'assistant',
          content: data.content || "Je suis désolé, je n'ai pas pu traiter votre demande."
        });
      }

    } catch (error: any) {
      console.error('❌ Erreur:', error);
      setMessages(prev => prev.filter(m => m.id !== typingId));
      setIsTyping(false);

      await addMessage({
        role: 'assistant',
        content: "Je rencontre un problème technique. Veuillez réessayer dans quelques instants."
      });
      
      toast.error('Erreur de communication');
    } finally {
      setIsLoading(false);
      setIsTyping(false);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [isLoading, addMessage, messages, sessionId]);

  const clearHistory = () => {
    if (confirm('Voulez-vous effacer toute la conversation ?')) {
      chatStorage.clearAll();
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: `👋 Bonjour ! Je suis l'assistant intelligent d'**UNITECH**.
        
Comment puis-je vous aider aujourd'hui ?`,
        timestamp: new Date(),
        agent: 'both'
      }]);
      toast.info('Conversation réinitialisée');
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex min-h-[100dvh] flex-col overflow-hidden bg-[#F5F7FB]">
      {/* En-tête */}
      <header className="sticky top-0 z-10 bg-white border-b border-slate-200 shadow-sm">
        <div className="mx-auto max-w-4xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 rounded-lg hover:bg-slate-100 transition"
            >
              <FaArrowLeft className="h-5 w-5 text-slate-600" />
            </Link>
            <div className="flex items-center gap-2">
              <FaRobot className="h-6 w-6 text-[#1E3A8A]" />
              <h1 className="text-lg font-bold text-[#1E3A8A]">Assistant UNITECH</h1>
            </div>
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
              En ligne
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={clearHistory}
              className="p-2 rounded-lg hover:bg-red-50 text-slate-500 hover:text-red-600 transition"
              title="Effacer l'historique"
            >
              <FaTrash className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl space-y-3 px-4 py-4">
          {messages.map((message) => (
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
                    </span>
                    {message.category && (
                      <span className="text-[8px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded-full">
                        {message.category}
                      </span>
                    )}
                  </div>
                )}
                {message.isTyping ? (
                  <div className="flex items-center gap-1.5 py-1">
                    <div className="h-2 w-2 bg-[#1E3A8A] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="h-2 w-2 bg-[#1E3A8A] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="h-2 w-2 bg-[#1E3A8A] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                ) : (
                  <div className="text-sm leading-relaxed">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        strong: ({ children }) => <strong className="font-bold">{children}</strong>,
                        ul: ({ children }) => <ul className="list-disc pl-4 my-1">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal pl-4 my-1">{children}</ol>,
                        li: ({ children }) => <li>{children}</li>,
                        p: ({ children }) => <span className="block my-1">{children}</span>,
                        a: ({ href, children }) => (
                          <a href={href} target="_blank" rel="noopener noreferrer" className="text-[#1E3A8A] underline hover:text-[#F97316]">
                            {children}
                          </a>
                        ),
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                )}
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
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="flex-shrink-0 bg-white border-t border-slate-200 shadow-lg">
        <div className="mx-auto max-w-4xl px-4 py-3">
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
              className="flex-1 px-4 py-2 text-sm border bg-green-100 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] focus:border-transparent"
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
          <p className="text-center text-[10px] text-slate-400 mt-1.5">
            L'assistant est propulsé par DONA et HARVEY • {messages.length} messages
          </p>
        </div>
      </div>
    </div>
  );
}
