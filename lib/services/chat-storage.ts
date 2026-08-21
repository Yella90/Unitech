// lib/services/chat-storage.ts

// ============================================================
// CONFIGURATION
// ============================================================

export const CHAT_STORAGE_CONFIG = {
  // Nom de la clé dans localStorage
  STORAGE_KEY: 'unitech_chat_history',
  // Nombre maximum de messages par conversation
  MAX_MESSAGES_PER_CONVERSATION: 50,
  // Taille maximale totale en caractères (environ 1MB)
  MAX_TOTAL_SIZE: 1000000,
  // Nombre maximum de conversations
  MAX_CONVERSATIONS: 10,
  // Durée de conservation (30 jours en millisecondes)
  RETENTION_DAYS: 30,
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
}

export interface ChatStorageData {
  conversations: StoredConversation[];
  currentConversationId: string | null;
  lastUpdated: string;
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
  // INITIALISATION
  // ============================================================

  private getStorageData(): ChatStorageData | null {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return null;
      
      const data = JSON.parse(raw) as ChatStorageData;
      
      // Vérifier l'intégrité des données
      if (!data.conversations || !Array.isArray(data.conversations)) {
        return null;
      }
      
      return data;
    } catch (error) {
      console.warn('⚠️ Erreur lecture localStorage:', error);
      return null;
    }
  }

  private setStorageData(data: ChatStorageData): boolean {
    try {
      // Vérifier la taille avant de sauvegarder
      const jsonString = JSON.stringify(data);
      if (jsonString.length > this.maxTotalSize) {
        // Si trop volumineux, réduire les données
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
  // COMPRESSION ET GESTION DE LA TAILLE
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

    // 3. Limiter le nombre de messages par conversation
    data.conversations = data.conversations.map(conv => ({
      ...conv,
      messages: conv.messages.slice(-this.maxMessages),
      messageCount: conv.messages.slice(-this.maxMessages).length
    }));

    // 4. Mettre à jour le timestamp
    data.lastUpdated = new Date().toISOString();

    try {
      const jsonString = JSON.stringify(data);
      if (jsonString.length > this.maxTotalSize) {
        // Si encore trop gros, supprimer le contenu des messages longs
        data.conversations = data.conversations.map(conv => ({
          ...conv,
          messages: conv.messages.map(msg => ({
            ...msg,
            content: msg.content.length > 1000 ? msg.content.slice(0, 1000) + '...' : msg.content
          }))
        }));
        
        const compressedString = JSON.stringify(data);
        localStorage.setItem(this.storageKey, compressedString);
        console.log(`✅ Compression terminée: ${compressedString.length} caractères`);
        return true;
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

  // Récupérer toutes les conversations
  getConversations(): StoredConversation[] {
    const data = this.getStorageData();
    if (!data) return [];
    
    // Filtrer les conversations trop anciennes
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.retentionDays);
    
    return data.conversations.filter(conv => {
      const updated = new Date(conv.updatedAt);
      return updated > cutoffDate;
    });
  }

  // Récupérer une conversation par ID
  getConversation(id: string): StoredConversation | null {
    const data = this.getStorageData();
    if (!data) return null;
    
    return data.conversations.find(conv => conv.id === id) || null;
  }

  // Récupérer la conversation active
  getCurrentConversation(): StoredConversation | null {
    const data = this.getStorageData();
    if (!data || !data.currentConversationId) return null;
    
    return data.conversations.find(conv => conv.id === data.currentConversationId) || null;
  }

  // Créer une nouvelle conversation
  createConversation(title?: string): StoredConversation {
    const newConversation: StoredConversation = {
      id: `conv-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      title: title || 'Nouvelle conversation',
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messageCount: 0,
      lastMessagePreview: ''
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
        lastUpdated: new Date().toISOString()
      };
      this.setStorageData(newData);
    }

    return newConversation;
  }

  // Ajouter un message à la conversation active
  addMessage(message: Omit<StoredMessage, 'id' | 'timestamp'>): StoredMessage | null {
    // ✅ Correction : Récupérer les données avec une variable non-null
    let data = this.getStorageData();
    
    if (!data) {
      // Créer une nouvelle conversation si aucune n'existe
      this.createConversation();
      data = this.getStorageData();
      if (!data) return null;
    }

    // Si pas de conversation active, en créer une
    if (!data.currentConversationId) {
      const conv = this.createConversation();
      data.currentConversationId = conv.id;
    }

    // ✅ Vérification que currentConversationId n'est pas null
    if (!data.currentConversationId) {
      const conv = this.createConversation();
      data.currentConversationId = conv.id;
    }

    const conversation = data.conversations.find(conv => conv.id === data.currentConversationId);
    if (!conversation) return null;

    const newMessage: StoredMessage = {
      ...message,
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      timestamp: new Date().toISOString()
    };

    // Ajouter le message
    conversation.messages.push(newMessage);
    conversation.messageCount = conversation.messages.length;
    conversation.updatedAt = new Date().toISOString();
    conversation.lastMessagePreview = message.content.slice(0, 100);

    // Mettre à jour le titre si c'est le premier message
    if (conversation.messages.length === 1 && message.role === 'user') {
      const title = message.content.slice(0, 50) + (message.content.length > 50 ? '...' : '');
      conversation.title = title;
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

  // Supprimer une conversation
  deleteConversation(id: string): boolean {
    const data = this.getStorageData();
    if (!data) return false;

    data.conversations = data.conversations.filter(conv => conv.id !== id);
    
    if (data.currentConversationId === id) {
      data.currentConversationId = data.conversations.length > 0 ? data.conversations[0].id : null;
    }

    data.lastUpdated = new Date().toISOString();
    this.setStorageData(data);
    return true;
  }

  // Changer de conversation active
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

  // Supprimer toutes les conversations
  clearAll(): boolean {
    const data: ChatStorageData = {
      conversations: [],
      currentConversationId: null,
      lastUpdated: new Date().toISOString()
    };
    return this.setStorageData(data);
  }

  // Obtenir les statistiques de stockage
  getStats(): { totalConversations: number; totalMessages: number; storageSize: number; } {
    const data = this.getStorageData();
    if (!data) {
      return { totalConversations: 0, totalMessages: 0, storageSize: 0 };
    }

    const totalMessages = data.conversations.reduce((acc, conv) => acc + conv.messages.length, 0);
    const storageSize = JSON.stringify(data).length;

    return {
      totalConversations: data.conversations.length,
      totalMessages,
      storageSize
    };
  }

  // Exporter les données
  exportData(): string {
    const data = this.getStorageData();
    if (!data) return '[]';
    return JSON.stringify(data, null, 2);
  }

  // Importer des données
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

// ============================================================
// EXPORT DE L'INSTANCE
// ============================================================

export const chatStorage = new ChatStorageService();