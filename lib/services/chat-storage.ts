// lib/services/chat-storage.ts

// ============================================================
// CONFIGURATION
// ============================================================

export const CHAT_STORAGE_CONFIG = {
  STORAGE_KEY: 'unitech_chat_history',
  MAX_MESSAGES_PER_CONVERSATION: 50,
  MAX_TOTAL_SIZE: 1000000,
  MAX_CONVERSATIONS: 10,
  RETENTION_DAYS: 30,
  // Nombre de paires Q/R envoyées au LLM
  HISTORY_PAIRS_FOR_LLM: 5,
};

// ============================================================
// TYPES
// ============================================================

export interface StoredMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  agent?: 'dona' | 'harvey' | 'both';
  category?: string;
}

export interface StoredConversation {
  id: string;
  title: string;
  messages: StoredMessage[];
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  lastMessagePreview: string;
  leadNotified?: boolean;
}

export interface ChatStorageData {
  conversations: StoredConversation[];
  currentConversationId: string | null;
  lastUpdated: string;
}

export interface LLMHistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

// ============================================================
// SERVICE DE STOCKAGE
// ============================================================

class ChatStorageService {
  private storageKey: string;
  private maxMessages: number;
  private maxTotalSize: number;
  private maxConversations: number;
  private retentionDays: number;

  constructor() {
    this.storageKey = CHAT_STORAGE_CONFIG.STORAGE_KEY;
    this.maxMessages = CHAT_STORAGE_CONFIG.MAX_MESSAGES_PER_CONVERSATION;
    this.maxTotalSize = CHAT_STORAGE_CONFIG.MAX_TOTAL_SIZE;
    this.maxConversations = CHAT_STORAGE_CONFIG.MAX_CONVERSATIONS;
    this.retentionDays = CHAT_STORAGE_CONFIG.RETENTION_DAYS;
  }

  // ============================================================
  // LECTURE / ÉCRITURE
  // ============================================================

  private getStorageData(): ChatStorageData | null {
    try {
      if (typeof window === 'undefined') return null;
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return null;

      const data = JSON.parse(raw) as ChatStorageData;
      if (!data.conversations || !Array.isArray(data.conversations)) return null;

      return data;
    } catch (error) {
      console.warn('⚠️ Erreur lecture localStorage:', error);
      return null;
    }
  }

  private setStorageData(data: ChatStorageData): boolean {
    try {
      if (typeof window === 'undefined') return false;
      const jsonString = JSON.stringify(data);
      if (jsonString.length > this.maxTotalSize) {
        return this.compressAndSave(data);
      }
      localStorage.setItem(this.storageKey, jsonString);
      return true;
    } catch (error) {
      console.error('❌ Erreur sauvegarde localStorage:', error);
      return false;
    }
  }

  // ============================================================
  // COMPRESSION
  // ============================================================

  private compressAndSave(data: ChatStorageData): boolean {
    console.log('🔄 Compression des données du chat...');

    // 1. Supprimer les anciennes conversations
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.retentionDays);

    data.conversations = data.conversations.filter(conv => {
      const updated = new Date(conv.updatedAt);
      return updated > cutoffDate;
    });

    // 2. Limiter le nombre de conversations
    if (data.conversations.length > this.maxConversations) {
      data.conversations = data.conversations
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, this.maxConversations);
    }

    // 3. Limiter les messages par conversation
    data.conversations = data.conversations.map(conv => {
      const trimmed = conv.messages.slice(-this.maxMessages);
      return { ...conv, messages: trimmed, messageCount: trimmed.length };
    });

    data.lastUpdated = new Date().toISOString();

    try {
      let jsonString = JSON.stringify(data);
      if (jsonString.length > this.maxTotalSize) {
        // 4. Tronquer les messages longs
        data.conversations = data.conversations.map(conv => ({
          ...conv,
          messages: conv.messages.map(msg => ({
            ...msg,
            content: msg.content.length > 1000 ? msg.content.slice(0, 1000) + '...' : msg.content
          }))
        }));
        jsonString = JSON.stringify(data);
      }

      localStorage.setItem(this.storageKey, jsonString);
      console.log(`✅ Compression terminée: ${jsonString.length} caractères`);
      return true;
    } catch (error) {
      console.error('❌ Erreur compression:', error);
      return false;
    }
  }

  // ============================================================
  // GESTION DES CONVERSATIONS
  // ============================================================

  getConversations(): StoredConversation[] {
    const data = this.getStorageData();
    if (!data) return [];

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.retentionDays);

    return data.conversations.filter(conv => {
      const updated = new Date(conv.updatedAt);
      return updated > cutoffDate;
    });
  }

  getConversation(id: string): StoredConversation | null {
    const data = this.getStorageData();
    if (!data) return null;
    return data.conversations.find(conv => conv.id === id) || null;
  }

  getCurrentConversation(): StoredConversation | null {
    const data = this.getStorageData();
    if (!data || !data.currentConversationId) return null;
    return data.conversations.find(conv => conv.id === data.currentConversationId) || null;
  }

  createConversation(title?: string): StoredConversation {
    const newConversation: StoredConversation = {
      id: `conv-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      title: title || 'Nouvelle conversation',
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messageCount: 0,
      lastMessagePreview: '',
      leadNotified: false,
    };

    const data = this.getStorageData();
    if (data) {
      data.conversations.unshift(newConversation);
      data.currentConversationId = newConversation.id;
      data.lastUpdated = new Date().toISOString();
      this.setStorageData(data);
    } else {
      const newData: ChatStorageData = {
        conversations: [newConversation],
        currentConversationId: newConversation.id,
        lastUpdated: new Date().toISOString(),
      };
      this.setStorageData(newData);
    }

    return newConversation;
  }

  // ============================================================
  // AJOUT D'UN MESSAGE
  // ✅ BUG FIXÉ : recharge les données après createConversation
  // ============================================================

  addMessage(message: Omit<StoredMessage, 'id' | 'timestamp'>): StoredMessage | null {
    let data = this.getStorageData();

    // Aucune donnée → créer conversation
    if (!data) {
      this.createConversation();
      data = this.getStorageData();
      if (!data) return null;
    }

    // Pas de conversation active → créer et RECHARGER
    if (!data.currentConversationId) {
      this.createConversation();
      data = this.getStorageData(); // ✅ FIX : recharger après createConversation
      if (!data || !data.currentConversationId) return null;
    }

    const conversation = data.conversations.find(
      conv => conv.id === data!.currentConversationId
    );
    if (!conversation) return null;

    const newMessage: StoredMessage = {
      ...message,
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      timestamp: new Date().toISOString(),
    };

    conversation.messages.push(newMessage);
    conversation.messageCount = conversation.messages.length;
    conversation.updatedAt = new Date().toISOString();
    conversation.lastMessagePreview = message.content.slice(0, 100);

    // Titre auto sur le premier message utilisateur
    if (conversation.messages.length === 1 && message.role === 'user') {
      conversation.title =
        message.content.slice(0, 50) + (message.content.length > 50 ? '...' : '');
    }

    // Limiter le nombre de messages
    if (conversation.messages.length > this.maxMessages) {
      conversation.messages = conversation.messages.slice(-this.maxMessages);
      conversation.messageCount = conversation.messages.length;
    }

    data.lastUpdated = new Date().toISOString();
    this.setStorageData(data);

    return newMessage;
  }

  // ============================================================
  // ✅ NOUVEAU : HISTORIQUE POUR LE LLM (5 dernières Q/R par défaut)
  // ============================================================

  /**
   * Renvoie les N dernières paires Question/Réponse sous forme
   * prête à être envoyée au LLM.
   *
   * Exemple avec pairs=5 → renvoie au maximum 10 messages
   * (5 user + 5 assistant) en ordre chronologique.
   */
  getRecentHistory(pairs: number = CHAT_STORAGE_CONFIG.HISTORY_PAIRS_FOR_LLM): LLMHistoryMessage[] {
    const conv = this.getCurrentConversation();
    if (!conv || conv.messages.length === 0) return [];

    // On ne garde que user/assistant (exclut system et typing)
    const relevant = conv.messages
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .filter(m => m.content && m.content.trim().length > 0)
      .filter(m => m.content !== '...'); // ignore typing placeholder

    // 1 paire = 1 user + 1 assistant → on prend 2 * pairs messages
    const recent = relevant.slice(-(pairs * 2));

    return recent.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));
  }

  /**
   * Alternative : renvoie exactement N derniers messages (utile pour debug).
   */
  getRecentMessages(count: number): StoredMessage[] {
    const conv = this.getCurrentConversation();
    if (!conv) return [];
    return conv.messages.slice(-count);
  }

  // ============================================================
  // ✅ NOUVEAU : EXPORT TRANSCRIPT POUR LE LEAD
  // ============================================================

  getConversationTranscript(conversationId?: string): string {
    const conv = conversationId
      ? this.getConversation(conversationId)
      : this.getCurrentConversation();
    if (!conv) return '';

    const lines: string[] = [];
    lines.push(`# Conversation: ${conv.title}`);
    lines.push(`Début: ${new Date(conv.createdAt).toLocaleString('fr-FR')}`);
    lines.push(`Messages: ${conv.messageCount}`);
    lines.push('');

    for (const msg of conv.messages) {
      const who =
        msg.role === 'user' ? '👤 Client' :
        msg.role === 'assistant' ? '🤖 Assistant' : '⚙️ Système';
      const time = new Date(msg.timestamp).toLocaleString('fr-FR');
      lines.push(`[${time}] ${who}:`);
      lines.push(msg.content);
      lines.push('');
    }

    return lines.join('\n');
  }

  // ============================================================
  // ✅ NOUVEAU : MARQUER LE LEAD COMME NOTIFIÉ
  // ============================================================

  markLeadNotified(conversationId?: string): void {
    const data = this.getStorageData();
    if (!data) return;

    const id = conversationId || data.currentConversationId;
    if (!id) return;

    const conv = data.conversations.find(c => c.id === id);
    if (!conv) return;

    conv.leadNotified = true;
    conv.updatedAt = new Date().toISOString();
    data.lastUpdated = new Date().toISOString();
    this.setStorageData(data);
  }

  wasLeadNotified(conversationId?: string): boolean {
    const conv = conversationId
      ? this.getConversation(conversationId)
      : this.getCurrentConversation();
    return !!conv?.leadNotified;
  }

  // ============================================================
  // SUPPRESSION / CHANGEMENT
  // ============================================================

  deleteConversation(id: string): boolean {
    const data = this.getStorageData();
    if (!data) return false;

    data.conversations = data.conversations.filter(conv => conv.id !== id);

    if (data.currentConversationId === id) {
      data.currentConversationId =
        data.conversations.length > 0 ? data.conversations[0].id : null;
    }

    data.lastUpdated = new Date().toISOString();
    this.setStorageData(data);
    return true;
  }

  switchConversation(id: string): boolean {
    const data = this.getStorageData();
    if (!data) return false;

    const exists = data.conversations.some(conv => conv.id === id);
    if (!exists) return false;

    data.currentConversationId = id;
    data.lastUpdated = new Date().toISOString();
    this.setStorageData(data);
    return true;
  }

  clearAll(): boolean {
    const data: ChatStorageData = {
      conversations: [],
      currentConversationId: null,
      lastUpdated: new Date().toISOString(),
    };
    return this.setStorageData(data);
  }

  // ============================================================
  // STATS / IMPORT / EXPORT
  // ============================================================

  getStats(): { totalConversations: number; totalMessages: number; storageSize: number } {
    const data = this.getStorageData();
    if (!data) return { totalConversations: 0, totalMessages: 0, storageSize: 0 };

    const totalMessages = data.conversations.reduce(
      (acc, conv) => acc + conv.messages.length,
      0
    );
    const storageSize = JSON.stringify(data).length;

    return {
      totalConversations: data.conversations.length,
      totalMessages,
      storageSize,
    };
  }

  exportData(): string {
    const data = this.getStorageData();
    if (!data) return '[]';
    return JSON.stringify(data, null, 2);
  }

  importData(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString) as ChatStorageData;
      if (!data.conversations || !Array.isArray(data.conversations)) {
        throw new Error('Données invalides');
      }
      return this.setStorageData(data);
    } catch (error) {
      console.error('❌ Erreur import:', error);
      return false;
    }
  }
}

export const chatStorage = new ChatStorageService();