// lib/services/LeadManagementService.ts
import { supabase } from '@/lib/supabase';

export interface Lead {
  id?: string;
  session_id: string;
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  interest?: string;
  budget?: string;
  status?: 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost';
  source?: string;
  messages?: any[];
  conversation_summary?: string;
  created_at?: string;
  updated_at?: string;
  last_contact_at?: string;
}

export interface Quote {
  id?: string;
  lead_id: string;
  quote_number: string;
  amount: number;
  description: string;
  services: string[];
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  valid_until: string;
  created_at?: string;
  updated_at?: string;
}

export interface Appointment {
  id?: string;
  lead_id: string;
  title: string;
  description?: string;
  scheduled_at: string;
  duration: number;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'rescheduled';
  meeting_link?: string;
  created_at?: string;
  updated_at?: string;
}

class LeadManagementService {
  private static instance: LeadManagementService;

  static getInstance(): LeadManagementService {
    if (!LeadManagementService.instance) {
      LeadManagementService.instance = new LeadManagementService();
    }
    return LeadManagementService.instance;
  }

  // ============================================================
  // GESTION DES LEADS
  // ============================================================

  async createLead(lead: Lead): Promise<Lead | null> {
    try {
      const { data, error } = await supabase
        .from('leads')
        .insert({
          session_id: lead.session_id,
          name: lead.name || null,
          email: lead.email || null,
          phone: lead.phone || null,
          company: lead.company || null,
          interest: lead.interest || null,
          budget: lead.budget || null,
          status: lead.status || 'new',
          source: lead.source || 'chatbot',
          messages: lead.messages || [],
          conversation_summary: lead.conversation_summary || null,
          last_contact_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Erreur création lead:', error);
        return null;
      }

      console.log(`✅ Lead créé: ${data.id}`);
      return data;
    } catch (error) {
      console.error('❌ Erreur createLead:', error);
      return null;
    }
  }

  async updateLead(id: string, updates: Partial<Lead>): Promise<Lead | null> {
    try {
      const { data, error } = await supabase
        .from('leads')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ Erreur mise à jour lead:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('❌ Erreur updateLead:', error);
      return null;
    }
  }

  async getLeadBySession(sessionId: string): Promise<Lead | null> {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('❌ Erreur récupération lead:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('❌ Erreur getLeadBySession:', error);
      return null;
    }
  }

  async addMessageToLead(leadId: string, message: any): Promise<Lead | null> {
    try {
      const { data: lead } = await supabase
        .from('leads')
        .select('messages')
        .eq('id', leadId)
        .single();

      if (!lead) return null;

      const messages = lead.messages || [];
      messages.push(message);

      const { data, error } = await supabase
        .from('leads')
        .update({
          messages: messages,
          last_contact_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', leadId)
        .select()
        .single();

      if (error) {
        console.error('❌ Erreur ajout message:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('❌ Erreur addMessageToLead:', error);
      return null;
    }
  }

  // ============================================================
  // GESTION DES DEVIS
  // ============================================================

  async generateQuoteNumber(): Promise<string> {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    // Compter les devis du jour
    const { count } = await supabase
      .from('quotes')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', new Date(date.setHours(0, 0, 0, 0)).toISOString());

    const sequence = String((count || 0) + 1).padStart(4, '0');
    
    return `DEV-${year}${month}${day}-${sequence}`;
  }

  async createQuote(quote: Quote): Promise<Quote | null> {
    try {
      const { data, error } = await supabase
        .from('quotes')
        .insert({
          lead_id: quote.lead_id,
          quote_number: quote.quote_number || await this.generateQuoteNumber(),
          amount: quote.amount,
          description: quote.description,
          services: quote.services,
          status: quote.status || 'draft',
          valid_until: quote.valid_until || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Erreur création devis:', error);
        return null;
      }

      console.log(`✅ Devis créé: ${data.quote_number}`);
      return data;
    } catch (error) {
      console.error('❌ Erreur createQuote:', error);
      return null;
    }
  }

  // ============================================================
  // GESTION DES RENDEZ-VOUS
  // ============================================================

  async createAppointment(appointment: Appointment): Promise<Appointment | null> {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .insert({
          lead_id: appointment.lead_id,
          title: appointment.title,
          description: appointment.description || null,
          scheduled_at: appointment.scheduled_at,
          duration: appointment.duration || 30,
          status: appointment.status || 'scheduled',
          meeting_link: appointment.meeting_link || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Erreur création rendez-vous:', error);
        return null;
      }

      console.log(`✅ Rendez-vous créé: ${data.id}`);
      return data;
    } catch (error) {
      console.error('❌ Erreur createAppointment:', error);
      return null;
    }
  }

  // ============================================================
  // STATISTIQUES
  // ============================================================

  async getStats(): Promise<any> {
    try {
      const { data: leads } = await supabase
        .from('leads')
        .select('status');

      const total = leads?.length || 0;
      const newLeads = leads?.filter(l => l.status === 'new').length || 0;
      const qualified = leads?.filter(l => l.status === 'qualified').length || 0;
      const won = leads?.filter(l => l.status === 'won').length || 0;

      return { total, newLeads, qualified, won };
    } catch (error) {
      console.error('❌ Erreur stats:', error);
      return { total: 0, newLeads: 0, qualified: 0, won: 0 };
    }
  }
}

export const leadManagement = LeadManagementService.getInstance();