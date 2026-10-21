// types/database.ts
// Types générés depuis la base Supabase (projet Unitech ERP Mali).
// Ne pas modifier à la main : régénérer après chaque migration
// (Supabase CLI : supabase gen types typescript --project-id sagvtnbbbdrfuoqxnplf).

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      access_tokens: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          token: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          token: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          token?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "access_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_context_rules: {
        Row: {
          conditions: Json | null
          context_type: string
          created_at: string | null
          id: string
          is_active: boolean | null
          model: string | null
          priority: number | null
          provider_id: string | null
          score: number | null
          updated_at: string | null
        }
        Insert: {
          conditions?: Json | null
          context_type: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          model?: string | null
          priority?: number | null
          provider_id?: string | null
          score?: number | null
          updated_at?: string | null
        }
        Update: {
          conditions?: Json | null
          context_type?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          model?: string | null
          priority?: number | null
          provider_id?: string | null
          score?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_context_rules_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "ai_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_decisions: {
        Row: {
          applied_at: string | null
          client_id: string | null
          confidence: number | null
          confirmed_by: string | null
          created_at: string | null
          decision_type: string | null
          description: string | null
          id: string
          status: string | null
          suggestions: Json | null
          updated_at: string | null
        }
        Insert: {
          applied_at?: string | null
          client_id?: string | null
          confidence?: number | null
          confirmed_by?: string | null
          created_at?: string | null
          decision_type?: string | null
          description?: string | null
          id?: string
          status?: string | null
          suggestions?: Json | null
          updated_at?: string | null
        }
        Update: {
          applied_at?: string | null
          client_id?: string | null
          confidence?: number | null
          confirmed_by?: string | null
          created_at?: string | null
          decision_type?: string | null
          description?: string | null
          id?: string
          status?: string | null
          suggestions?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_decisions_confirmed_by_fkey"
            columns: ["confirmed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_errors: {
        Row: {
          api_key_id: string | null
          created_at: string | null
          error_message: string | null
          error_type: string | null
          id: string
          provider_id: string | null
          request_data: Json | null
          resolved: boolean | null
          resolved_at: string | null
          response_data: Json | null
          status_code: number | null
        }
        Insert: {
          api_key_id?: string | null
          created_at?: string | null
          error_message?: string | null
          error_type?: string | null
          id?: string
          provider_id?: string | null
          request_data?: Json | null
          resolved?: boolean | null
          resolved_at?: string | null
          response_data?: Json | null
          status_code?: number | null
        }
        Update: {
          api_key_id?: string | null
          created_at?: string | null
          error_message?: string | null
          error_type?: string | null
          id?: string
          provider_id?: string | null
          request_data?: Json | null
          resolved?: boolean | null
          resolved_at?: string | null
          response_data?: Json | null
          status_code?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_errors_api_key_id_fkey"
            columns: ["api_key_id"]
            isOneToOne: false
            referencedRelation: "api_keys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_errors_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "ai_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_performance: {
        Row: {
          api_key_id: string | null
          context: string | null
          cost: number | null
          duration_ms: number | null
          error_message: string | null
          id: string
          metadata: Json | null
          model: string | null
          provider_id: string | null
          request_type: string | null
          response_time: number | null
          session_id: string | null
          success: boolean | null
          timestamp: string | null
          tokens_input: number | null
          tokens_output: number | null
          tokens_total: number | null
        }
        Insert: {
          api_key_id?: string | null
          context?: string | null
          cost?: number | null
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          model?: string | null
          provider_id?: string | null
          request_type?: string | null
          response_time?: number | null
          session_id?: string | null
          success?: boolean | null
          timestamp?: string | null
          tokens_input?: number | null
          tokens_output?: number | null
          tokens_total?: number | null
        }
        Update: {
          api_key_id?: string | null
          context?: string | null
          cost?: number | null
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          model?: string | null
          provider_id?: string | null
          request_type?: string | null
          response_time?: number | null
          session_id?: string | null
          success?: boolean | null
          timestamp?: string | null
          tokens_input?: number | null
          tokens_output?: number | null
          tokens_total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_performance_api_key_id_fkey"
            columns: ["api_key_id"]
            isOneToOne: false
            referencedRelation: "api_keys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_performance_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "ai_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_providers: {
        Row: {
          api_base_url: string | null
          created_at: string | null
          description: string | null
          display_name: string
          id: string
          is_active: boolean | null
          models: Json | null
          name: string
          priority: number | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          api_base_url?: string | null
          created_at?: string | null
          description?: string | null
          display_name: string
          id?: string
          is_active?: boolean | null
          models?: Json | null
          name: string
          priority?: number | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          api_base_url?: string | null
          created_at?: string | null
          description?: string | null
          display_name?: string
          id?: string
          is_active?: boolean | null
          models?: Json | null
          name?: string
          priority?: number | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      api_keys: {
        Row: {
          created_at: string | null
          daily_usage: number | null
          error_count: number | null
          expires_at: string | null
          id: string
          is_primary: boolean | null
          key_name: string | null
          key_value: string
          last_error: string | null
          last_used_at: string | null
          monthly_usage: number | null
          notes: string | null
          provider_id: string | null
          rate_limit: number | null
          remaining_quota: number | null
          status: string | null
          total_quota: number | null
          updated_at: string | null
          usage_count: number | null
        }
        Insert: {
          created_at?: string | null
          daily_usage?: number | null
          error_count?: number | null
          expires_at?: string | null
          id?: string
          is_primary?: boolean | null
          key_name?: string | null
          key_value: string
          last_error?: string | null
          last_used_at?: string | null
          monthly_usage?: number | null
          notes?: string | null
          provider_id?: string | null
          rate_limit?: number | null
          remaining_quota?: number | null
          status?: string | null
          total_quota?: number | null
          updated_at?: string | null
          usage_count?: number | null
        }
        Update: {
          created_at?: string | null
          daily_usage?: number | null
          error_count?: number | null
          expires_at?: string | null
          id?: string
          is_primary?: boolean | null
          key_name?: string | null
          key_value?: string
          last_error?: string | null
          last_used_at?: string | null
          monthly_usage?: number | null
          notes?: string | null
          provider_id?: string | null
          rate_limit?: number | null
          remaining_quota?: number | null
          status?: string | null
          total_quota?: number | null
          updated_at?: string | null
          usage_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "ai_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          created_at: string | null
          description: string | null
          duration: number | null
          id: string
          lead_id: string | null
          meeting_link: string | null
          scheduled_at: string | null
          status: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          duration?: number | null
          id?: string
          lead_id?: string | null
          meeting_link?: string | null
          scheduled_at?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          duration?: number | null
          id?: string
          lead_id?: string | null
          meeting_link?: string | null
          scheduled_at?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      client_service_requests: {
        Row: {
          assigned_to: string | null
          budget: string | null
          client_id: string | null
          created_at: string | null
          deadline: string | null
          description: string
          id: string
          notes: string | null
          priority: string | null
          service_id: string | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          budget?: string | null
          client_id?: string | null
          created_at?: string | null
          deadline?: string | null
          description: string
          id?: string
          notes?: string | null
          priority?: string | null
          service_id?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          budget?: string | null
          client_id?: string | null
          created_at?: string | null
          deadline?: string | null
          description?: string
          id?: string
          notes?: string | null
          priority?: string | null
          service_id?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_service_requests_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_service_requests_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_service_requests_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      client_services: {
        Row: {
          auto_renew: boolean | null
          client_id: string | null
          config: Json | null
          created_at: string | null
          expires_at: string | null
          id: string
          last_renewed_at: string | null
          service_id: string | null
          started_at: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          auto_renew?: boolean | null
          client_id?: string | null
          config?: Json | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          last_renewed_at?: string | null
          service_id?: string | null
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          auto_renew?: boolean | null
          client_id?: string | null
          config?: Json | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          last_renewed_at?: string | null
          service_id?: string | null
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_services_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      client_sessions: {
        Row: {
          client_id: string | null
          created_at: string | null
          expires_at: string
          id: string
          ip_address: string | null
          is_active: boolean | null
          last_activity_at: string | null
          token: string
          user_agent: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          expires_at: string
          id?: string
          ip_address?: string | null
          is_active?: boolean | null
          last_activity_at?: string | null
          token: string
          user_agent?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          expires_at?: string
          id?: string
          ip_address?: string | null
          is_active?: boolean | null
          last_activity_at?: string | null
          token?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_sessions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string | null
          city: string | null
          company_name: string | null
          company_siret: string | null
          company_website: string | null
          country: string | null
          created_at: string | null
          credits_balance: number | null
          email: string
          email_verified: boolean | null
          first_name: string | null
          id: string
          is_active: boolean | null
          last_login_at: string | null
          last_name: string | null
          password_hash: string
          phone: string | null
          reset_password_expires: string | null
          reset_password_token: string | null
          subscription_plan: string | null
          updated_at: string | null
          verification_token: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          company_name?: string | null
          company_siret?: string | null
          company_website?: string | null
          country?: string | null
          created_at?: string | null
          credits_balance?: number | null
          email: string
          email_verified?: boolean | null
          first_name?: string | null
          id?: string
          is_active?: boolean | null
          last_login_at?: string | null
          last_name?: string | null
          password_hash: string
          phone?: string | null
          reset_password_expires?: string | null
          reset_password_token?: string | null
          subscription_plan?: string | null
          updated_at?: string | null
          verification_token?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          company_name?: string | null
          company_siret?: string | null
          company_website?: string | null
          country?: string | null
          created_at?: string | null
          credits_balance?: number | null
          email?: string
          email_verified?: boolean | null
          first_name?: string | null
          id?: string
          is_active?: boolean | null
          last_login_at?: string | null
          last_name?: string | null
          password_hash?: string
          phone?: string | null
          reset_password_expires?: string | null
          reset_password_token?: string | null
          subscription_plan?: string | null
          updated_at?: string | null
          verification_token?: string | null
        }
        Relationships: []
      }
      collaborations: {
        Row: {
          agreement: Json | null
          contact: Json | null
          contributions: Json[] | null
          created_at: string | null
          id: string
          name: string
          notes: string | null
          projects: string[] | null
          status: string | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          agreement?: Json | null
          contact?: Json | null
          contributions?: Json[] | null
          created_at?: string | null
          id?: string
          name: string
          notes?: string | null
          projects?: string[] | null
          status?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          agreement?: Json | null
          contact?: Json | null
          contributions?: Json[] | null
          created_at?: string | null
          id?: string
          name?: string
          notes?: string | null
          projects?: string[] | null
          status?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      company_data: {
        Row: {
          created_at: string | null
          description: string | null
          faq: Json | null
          formations: Json | null
          founder: string | null
          id: string
          missions: Json | null
          name: string
          pricing: Json | null
          projects: Json | null
          services: Json | null
          team: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          faq?: Json | null
          formations?: Json | null
          founder?: string | null
          id?: string
          missions?: Json | null
          name: string
          pricing?: Json | null
          projects?: Json | null
          services?: Json | null
          team?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          faq?: Json | null
          formations?: Json | null
          founder?: string | null
          id?: string
          missions?: Json | null
          name?: string
          pricing?: Json | null
          projects?: Json | null
          services?: Json | null
          team?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      contacts: {
        Row: {
          assigned_agent: string | null
          category: string | null
          created_at: string | null
          email: string
          id: string
          message: string
          name: string
          priority: string | null
          processed_at: string | null
          status: string | null
          subject: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_agent?: string | null
          category?: string | null
          created_at?: string | null
          email: string
          id?: string
          message: string
          name: string
          priority?: string | null
          processed_at?: string | null
          status?: string | null
          subject?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_agent?: string | null
          category?: string | null
          created_at?: string | null
          email?: string
          id?: string
          message?: string
          name?: string
          priority?: string | null
          processed_at?: string | null
          status?: string | null
          subject?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      email_conversations: {
        Row: {
          actions: string[] | null
          agent_response: string | null
          agent_response_html: string | null
          body: string | null
          category: string | null
          client_id: string | null
          confidence: number | null
          created_at: string | null
          email_id: string | null
          from_email: string
          id: string
          is_outgoing: boolean | null
          mail_account_id: string | null
          message: string | null
          requires_human_review: boolean | null
          response_tone: string | null
          sent_at: string | null
          source: string | null
          status: string | null
          subject: string | null
          suggested_agent: string | null
          to_email: string
          tone: string | null
          updated_at: string | null
        }
        Insert: {
          actions?: string[] | null
          agent_response?: string | null
          agent_response_html?: string | null
          body?: string | null
          category?: string | null
          client_id?: string | null
          confidence?: number | null
          created_at?: string | null
          email_id?: string | null
          from_email: string
          id?: string
          is_outgoing?: boolean | null
          mail_account_id?: string | null
          message?: string | null
          requires_human_review?: boolean | null
          response_tone?: string | null
          sent_at?: string | null
          source?: string | null
          status?: string | null
          subject?: string | null
          suggested_agent?: string | null
          to_email: string
          tone?: string | null
          updated_at?: string | null
        }
        Update: {
          actions?: string[] | null
          agent_response?: string | null
          agent_response_html?: string | null
          body?: string | null
          category?: string | null
          client_id?: string | null
          confidence?: number | null
          created_at?: string | null
          email_id?: string | null
          from_email?: string
          id?: string
          is_outgoing?: boolean | null
          mail_account_id?: string | null
          message?: string | null
          requires_human_review?: boolean | null
          response_tone?: string | null
          sent_at?: string | null
          source?: string | null
          status?: string | null
          subject?: string | null
          suggested_agent?: string | null
          to_email?: string
          tone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_conversations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_conversations_mail_account_id_fkey"
            columns: ["mail_account_id"]
            isOneToOne: false
            referencedRelation: "mail_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      email_logs: {
        Row: {
          action: string | null
          created_at: string | null
          details: Json | null
          email_id: string | null
          id: string
        }
        Insert: {
          action?: string | null
          created_at?: string | null
          details?: Json | null
          email_id?: string | null
          id?: string
        }
        Update: {
          action?: string | null
          created_at?: string | null
          details?: Json | null
          email_id?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_logs_email_id_fkey"
            columns: ["email_id"]
            isOneToOne: false
            referencedRelation: "incoming_emails"
            referencedColumns: ["id"]
          },
        ]
      }
      emails: {
        Row: {
          ai_analysis: Json | null
          ai_analyzed: boolean | null
          ai_confidence: number | null
          ai_response: string | null
          attachments: Json | null
          bcc_email: string[] | null
          body: string
          body_html: string | null
          body_text: string | null
          category: string | null
          cc_email: string[] | null
          client_id: string | null
          created_at: string | null
          error_message: string | null
          from_email: string
          from_name: string | null
          harvey_actions: Json | null
          harvey_confidence: number | null
          harvey_requires_review: boolean | null
          harvey_response: string | null
          harvey_response_html: string | null
          harvey_response_json: Json | null
          harvey_suggested_agent: string | null
          harvey_tone: string | null
          headers: Json | null
          id: string
          is_read: boolean | null
          is_replied: boolean | null
          mail_account_id: string | null
          max_retries: number | null
          message_id: string | null
          message_id_unique: string | null
          priority: string | null
          processed_at: string | null
          received_at: string | null
          replied_at: string | null
          response_template_used: string | null
          retry_count: number | null
          sent_at: string | null
          status: string | null
          subject: string | null
          thread_id: string | null
          to_email: string
          updated_at: string | null
        }
        Insert: {
          ai_analysis?: Json | null
          ai_analyzed?: boolean | null
          ai_confidence?: number | null
          ai_response?: string | null
          attachments?: Json | null
          bcc_email?: string[] | null
          body: string
          body_html?: string | null
          body_text?: string | null
          category?: string | null
          cc_email?: string[] | null
          client_id?: string | null
          created_at?: string | null
          error_message?: string | null
          from_email: string
          from_name?: string | null
          harvey_actions?: Json | null
          harvey_confidence?: number | null
          harvey_requires_review?: boolean | null
          harvey_response?: string | null
          harvey_response_html?: string | null
          harvey_response_json?: Json | null
          harvey_suggested_agent?: string | null
          harvey_tone?: string | null
          headers?: Json | null
          id?: string
          is_read?: boolean | null
          is_replied?: boolean | null
          mail_account_id?: string | null
          max_retries?: number | null
          message_id?: string | null
          message_id_unique?: string | null
          priority?: string | null
          processed_at?: string | null
          received_at?: string | null
          replied_at?: string | null
          response_template_used?: string | null
          retry_count?: number | null
          sent_at?: string | null
          status?: string | null
          subject?: string | null
          thread_id?: string | null
          to_email: string
          updated_at?: string | null
        }
        Update: {
          ai_analysis?: Json | null
          ai_analyzed?: boolean | null
          ai_confidence?: number | null
          ai_response?: string | null
          attachments?: Json | null
          bcc_email?: string[] | null
          body?: string
          body_html?: string | null
          body_text?: string | null
          category?: string | null
          cc_email?: string[] | null
          client_id?: string | null
          created_at?: string | null
          error_message?: string | null
          from_email?: string
          from_name?: string | null
          harvey_actions?: Json | null
          harvey_confidence?: number | null
          harvey_requires_review?: boolean | null
          harvey_response?: string | null
          harvey_response_html?: string | null
          harvey_response_json?: Json | null
          harvey_suggested_agent?: string | null
          harvey_tone?: string | null
          headers?: Json | null
          id?: string
          is_read?: boolean | null
          is_replied?: boolean | null
          mail_account_id?: string | null
          max_retries?: number | null
          message_id?: string | null
          message_id_unique?: string | null
          priority?: string | null
          processed_at?: string | null
          received_at?: string | null
          replied_at?: string | null
          response_template_used?: string | null
          retry_count?: number | null
          sent_at?: string | null
          status?: string | null
          subject?: string | null
          thread_id?: string | null
          to_email?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_emails_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_emails_mail_account"
            columns: ["mail_account_id"]
            isOneToOne: false
            referencedRelation: "mail_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_logs: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_address: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      faq: {
        Row: {
          answer: string
          category: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          keywords: string[] | null
          order_index: number | null
          question: string
          updated_at: string | null
        }
        Insert: {
          answer: string
          category?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          keywords?: string[] | null
          order_index?: number | null
          question: string
          updated_at?: string | null
        }
        Update: {
          answer?: string
          category?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          keywords?: string[] | null
          order_index?: number | null
          question?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      finances: {
        Row: {
          amount: number
          category: string | null
          created_at: string | null
          currency: string | null
          date: string | null
          description: string | null
          id: string
          notes: string | null
          project_id: string | null
          receipt: Json | null
          status: string | null
          sub_category: string | null
          tags: string[] | null
          type: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          category?: string | null
          created_at?: string | null
          currency?: string | null
          date?: string | null
          description?: string | null
          id?: string
          notes?: string | null
          project_id?: string | null
          receipt?: Json | null
          status?: string | null
          sub_category?: string | null
          tags?: string[] | null
          type: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string | null
          currency?: string | null
          date?: string | null
          description?: string | null
          id?: string
          notes?: string | null
          project_id?: string | null
          receipt?: Json | null
          status?: string | null
          sub_category?: string | null
          tags?: string[] | null
          type?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "finances_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finances_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      incoming_emails: {
        Row: {
          ai_analysis: Json | null
          assigned_agent: string | null
          body: string | null
          category: string | null
          created_at: string | null
          from_email: string
          id: string
          is_relevant: boolean | null
          priority: string | null
          processed_at: string | null
          received_at: string | null
          status: string | null
          subject: string | null
          to_email: string | null
          updated_at: string | null
        }
        Insert: {
          ai_analysis?: Json | null
          assigned_agent?: string | null
          body?: string | null
          category?: string | null
          created_at?: string | null
          from_email: string
          id?: string
          is_relevant?: boolean | null
          priority?: string | null
          processed_at?: string | null
          received_at?: string | null
          status?: string | null
          subject?: string | null
          to_email?: string | null
          updated_at?: string | null
        }
        Update: {
          ai_analysis?: Json | null
          assigned_agent?: string | null
          body?: string | null
          category?: string | null
          created_at?: string | null
          from_email?: string
          id?: string
          is_relevant?: boolean | null
          priority?: string | null
          processed_at?: string | null
          received_at?: string | null
          status?: string | null
          subject?: string | null
          to_email?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      keyword_config: {
        Row: {
          category: string
          created_at: string | null
          id: string
          is_active: boolean | null
          keywords: string[]
          priority: number | null
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          keywords: string[]
          priority?: number | null
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          keywords?: string[]
          priority?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      knowledge_base: {
        Row: {
          answer: string
          category: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          keyword: string
          question: string
          updated_at: string | null
        }
        Insert: {
          answer: string
          category?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          keyword: string
          question: string
          updated_at?: string | null
        }
        Update: {
          answer?: string
          category?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          keyword?: string
          question?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      leads: {
        Row: {
          budget: string | null
          company: string | null
          conversation_summary: string | null
          created_at: string | null
          email: string | null
          id: string
          interest: string | null
          last_contact_at: string | null
          messages: Json | null
          name: string | null
          phone: string | null
          session_id: string
          source: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          budget?: string | null
          company?: string | null
          conversation_summary?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          interest?: string | null
          last_contact_at?: string | null
          messages?: Json | null
          name?: string | null
          phone?: string | null
          session_id: string
          source?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          budget?: string | null
          company?: string | null
          conversation_summary?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          interest?: string | null
          last_contact_at?: string | null
          messages?: Json | null
          name?: string | null
          phone?: string | null
          session_id?: string
          source?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      mail_accounts: {
        Row: {
          block_rules: Json | null
          blocked_domains: Json | null
          blocked_senders: Json | null
          client_id: string | null
          created_at: string | null
          email: string
          email_password: string
          encryption: string | null
          id: string
          imap_port: number | null
          imap_server: string
          is_active: boolean | null
          is_connected: boolean | null
          last_sync_at: string | null
          max_emails_per_sync: number | null
          prompt_config: Json | null
          smtp_port: number | null
          smtp_server: string
          updated_at: string | null
        }
        Insert: {
          block_rules?: Json | null
          blocked_domains?: Json | null
          blocked_senders?: Json | null
          client_id?: string | null
          created_at?: string | null
          email: string
          email_password: string
          encryption?: string | null
          id?: string
          imap_port?: number | null
          imap_server: string
          is_active?: boolean | null
          is_connected?: boolean | null
          last_sync_at?: string | null
          max_emails_per_sync?: number | null
          prompt_config?: Json | null
          smtp_port?: number | null
          smtp_server: string
          updated_at?: string | null
        }
        Update: {
          block_rules?: Json | null
          blocked_domains?: Json | null
          blocked_senders?: Json | null
          client_id?: string | null
          created_at?: string | null
          email?: string
          email_password?: string
          encryption?: string | null
          id?: string
          imap_port?: number | null
          imap_server?: string
          is_active?: boolean | null
          is_connected?: boolean | null
          last_sync_at?: string | null
          max_emails_per_sync?: number | null
          prompt_config?: Json | null
          smtp_port?: number | null
          smtp_server?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mail_accounts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_subscribers: {
        Row: {
          created_at: string | null
          email: string
          id: string
          interested_in: string[] | null
          interests: string[] | null
          is_active: boolean | null
          source: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          interested_in?: string[] | null
          interests?: string[] | null
          is_active?: boolean | null
          source?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          interested_in?: string[] | null
          interests?: string[] | null
          is_active?: boolean | null
          source?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      page_visits: {
        Row: {
          browser: string | null
          city: string | null
          country: string | null
          created_at: string | null
          device_type: string | null
          duration: number | null
          id: string
          ip_address: string | null
          os: string | null
          page: string
          referrer: string | null
          session_id: string | null
          user_agent: string | null
          visitor_id: string | null
        }
        Insert: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          device_type?: string | null
          duration?: number | null
          id?: string
          ip_address?: string | null
          os?: string | null
          page: string
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          visitor_id?: string | null
        }
        Update: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          device_type?: string | null
          duration?: number | null
          id?: string
          ip_address?: string | null
          os?: string | null
          page?: string
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          visitor_id?: string | null
        }
        Relationships: []
      }
      password_resets: {
        Row: {
          account_id: string
          account_type: string
          created_at: string
          expires_at: string
          id: string
          token_hash: string
          used_at: string | null
        }
        Insert: {
          account_id: string
          account_type: string
          created_at?: string
          expires_at: string
          id?: string
          token_hash: string
          used_at?: string | null
        }
        Update: {
          account_id?: string
          account_type?: string
          created_at?: string
          expires_at?: string
          id?: string
          token_hash?: string
          used_at?: string | null
        }
        Relationships: []
      }
      project_members: {
        Row: {
          created_at: string | null
          id: string
          project_id: string | null
          role: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          project_id?: string | null
          role?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          project_id?: string | null
          role?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      project_stages: {
        Row: {
          created_at: string | null
          id: string
          name: string
          progress: number | null
          project_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          progress?: number | null
          project_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          progress?: number | null
          project_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_stages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          benefits: string[] | null
          color: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          gallery: Json[] | null
          icon: string | null
          id: string
          name: string
          next_milestone: string | null
          problem: string | null
          progress: number | null
          site: string | null
          slug: string
          solution: string | null
          status: string | null
          tech_stack: Json | null
          updated_at: string | null
        }
        Insert: {
          benefits?: string[] | null
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          gallery?: Json[] | null
          icon?: string | null
          id?: string
          name: string
          next_milestone?: string | null
          problem?: string | null
          progress?: number | null
          site?: string | null
          slug: string
          solution?: string | null
          status?: string | null
          tech_stack?: Json | null
          updated_at?: string | null
        }
        Update: {
          benefits?: string[] | null
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          gallery?: Json[] | null
          icon?: string | null
          id?: string
          name?: string
          next_milestone?: string | null
          problem?: string | null
          progress?: number | null
          site?: string | null
          slug?: string
          solution?: string | null
          status?: string | null
          tech_stack?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      public_visits: {
        Row: {
          accuracy_m: number | null
          city: string | null
          country_code: string | null
          country_name: string | null
          created_at: string
          deleted_at: string | null
          id: number
          ip_address: string | null
          ip_anonymized: string | null
          latitude: number | null
          locale: string | null
          longitude: number | null
          page_path: string
          referer: string | null
          region: string | null
          school_id: number
          source: string | null
          sync_synced_at: string | null
          synced_to_central: number
          timezone: string | null
          updated_at: string | null
          user_agent: string | null
          uuid: string | null
          version: number
          visitor_token: string | null
        }
        Insert: {
          accuracy_m?: number | null
          city?: string | null
          country_code?: string | null
          country_name?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: number
          ip_address?: string | null
          ip_anonymized?: string | null
          latitude?: number | null
          locale?: string | null
          longitude?: number | null
          page_path: string
          referer?: string | null
          region?: string | null
          school_id?: number
          source?: string | null
          sync_synced_at?: string | null
          synced_to_central?: number
          timezone?: string | null
          updated_at?: string | null
          user_agent?: string | null
          uuid?: string | null
          version?: number
          visitor_token?: string | null
        }
        Update: {
          accuracy_m?: number | null
          city?: string | null
          country_code?: string | null
          country_name?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: number
          ip_address?: string | null
          ip_anonymized?: string | null
          latitude?: number | null
          locale?: string | null
          longitude?: number | null
          page_path?: string
          referer?: string | null
          region?: string | null
          school_id?: number
          source?: string | null
          sync_synced_at?: string | null
          synced_to_central?: number
          timezone?: string | null
          updated_at?: string | null
          user_agent?: string | null
          uuid?: string | null
          version?: number
          visitor_token?: string | null
        }
        Relationships: []
      }
      quotes: {
        Row: {
          amount: number | null
          created_at: string | null
          description: string | null
          id: string
          lead_id: string | null
          quote_number: string | null
          services: string[] | null
          status: string | null
          updated_at: string | null
          valid_until: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          lead_id?: string | null
          quote_number?: string | null
          services?: string[] | null
          status?: string | null
          updated_at?: string | null
          valid_until?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          lead_id?: string | null
          quote_number?: string | null
          services?: string[] | null
          status?: string | null
          updated_at?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotes_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      response_templates: {
        Row: {
          category: string
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          template: string
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          template: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          template?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      review_notifications: {
        Row: {
          confidence: number | null
          created_at: string | null
          email_id: string | null
          id: string
          message: string
          resolved_at: string | null
          status: string | null
        }
        Insert: {
          confidence?: number | null
          created_at?: string | null
          email_id?: string | null
          id?: string
          message: string
          resolved_at?: string | null
          status?: string | null
        }
        Update: {
          confidence?: number | null
          created_at?: string | null
          email_id?: string | null
          id?: string
          message?: string
          resolved_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "review_notifications_email_id_fkey"
            columns: ["email_id"]
            isOneToOne: false
            referencedRelation: "incoming_emails"
            referencedColumns: ["id"]
          },
        ]
      }
      service_requests: {
        Row: {
          attachments: string[] | null
          budget: string | null
          company: string | null
          created_at: string | null
          deadline: string | null
          description: string
          email: string
          id: string
          name: string
          phone: string | null
          service_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          attachments?: string[] | null
          budget?: string | null
          company?: string | null
          created_at?: string | null
          deadline?: string | null
          description: string
          email: string
          id?: string
          name: string
          phone?: string | null
          service_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          attachments?: string[] | null
          budget?: string | null
          company?: string | null
          created_at?: string | null
          deadline?: string | null
          description?: string
          email?: string
          id?: string
          name?: string
          phone?: string | null
          service_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_requests_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          category: string | null
          color: string | null
          created_at: string | null
          description: string
          features: string[] | null
          icon: string
          id: string
          is_active: boolean | null
          name: string
          order_index: number | null
          price_monthly: number | null
          price_project: number | null
          price_yearly: number | null
          slug: string | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          color?: string | null
          created_at?: string | null
          description: string
          features?: string[] | null
          icon: string
          id?: string
          is_active?: boolean | null
          name: string
          order_index?: number | null
          price_monthly?: number | null
          price_project?: number | null
          price_yearly?: number | null
          slug?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          color?: string | null
          created_at?: string | null
          description?: string
          features?: string[] | null
          icon?: string
          id?: string
          is_active?: boolean | null
          name?: string
          order_index?: number | null
          price_monthly?: number | null
          price_project?: number | null
          price_yearly?: number | null
          slug?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      sessions: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          token: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          token: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          token?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      solutions: {
        Row: {
          color: string | null
          created_at: string | null
          description: string
          features: string[] | null
          icon: string
          id: string
          image_url: string | null
          is_active: boolean | null
          link_text: string | null
          link_url: string | null
          order_index: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description: string
          features?: string[] | null
          icon: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          link_text?: string | null
          link_url?: string | null
          order_index?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string
          features?: string[] | null
          icon?: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          link_text?: string | null
          link_url?: string | null
          order_index?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      tasks: {
        Row: {
          actual_hours: number | null
          assigned_by: string | null
          assigned_to: string | null
          completed_at: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          estimated_hours: number | null
          id: string
          priority: string | null
          project_id: string | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          actual_hours?: number | null
          assigned_by?: string | null
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          priority?: string | null
          project_id?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          actual_hours?: number | null
          assigned_by?: string | null
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          priority?: string | null
          project_id?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      training_registrations: {
        Row: {
          amount: number | null
          company: string | null
          created_at: string | null
          email: string
          full_name: string
          id: string
          level: string | null
          motivation: string | null
          notes: string | null
          payment_date: string | null
          payment_method: string | null
          payment_status: string | null
          phone: string | null
          profession: string | null
          status: string | null
          training_id: string
          updated_at: string | null
        }
        Insert: {
          amount?: number | null
          company?: string | null
          created_at?: string | null
          email: string
          full_name: string
          id?: string
          level?: string | null
          motivation?: string | null
          notes?: string | null
          payment_date?: string | null
          payment_method?: string | null
          payment_status?: string | null
          phone?: string | null
          profession?: string | null
          status?: string | null
          training_id: string
          updated_at?: string | null
        }
        Update: {
          amount?: number | null
          company?: string | null
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          level?: string | null
          motivation?: string | null
          notes?: string | null
          payment_date?: string | null
          payment_method?: string | null
          payment_status?: string | null
          phone?: string | null
          profession?: string | null
          status?: string | null
          training_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "training_registrations_training_id_fkey"
            columns: ["training_id"]
            isOneToOne: false
            referencedRelation: "trainings"
            referencedColumns: ["id"]
          },
        ]
      }
      trainings: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          duration: string | null
          icon: string | null
          id: string
          level: string | null
          modules: string[] | null
          price: string | null
          schedule: string | null
          slug: string
          title: string
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          duration?: string | null
          icon?: string | null
          id?: string
          level?: string | null
          modules?: string[] | null
          price?: string | null
          schedule?: string | null
          slug: string
          title: string
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          duration?: string | null
          icon?: string | null
          id?: string
          level?: string | null
          modules?: string[] | null
          price?: string | null
          schedule?: string | null
          slug?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          avatar: string | null
          created_at: string | null
          department: string | null
          email: string
          first_name: string | null
          id: string
          is_active: boolean | null
          last_login: string | null
          last_name: string | null
          password_hash: string | null
          phone: string | null
          role: string | null
          skills: string[] | null
          updated_at: string | null
        }
        Insert: {
          avatar?: string | null
          created_at?: string | null
          department?: string | null
          email: string
          first_name?: string | null
          id?: string
          is_active?: boolean | null
          last_login?: string | null
          last_name?: string | null
          password_hash?: string | null
          phone?: string | null
          role?: string | null
          skills?: string[] | null
          updated_at?: string | null
        }
        Update: {
          avatar?: string | null
          created_at?: string | null
          department?: string | null
          email?: string
          first_name?: string | null
          id?: string
          is_active?: boolean | null
          last_login?: string | null
          last_name?: string | null
          password_hash?: string | null
          phone?: string | null
          role?: string | null
          skills?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_project_status: { Args: { project_id: string }; Returns: string }
      get_user_project_count: { Args: { user_id: string }; Returns: number }
      get_user_role: { Args: never; Returns: string }
      is_admin: { Args: never; Returns: boolean }
      is_current_user_admin: { Args: never; Returns: boolean }
      uuid_generate_v1: { Args: never; Returns: string }
      uuid_generate_v1mc: { Args: never; Returns: string }
      uuid_generate_v3: {
        Args: { name: string; namespace: string }
        Returns: string
      }
      uuid_generate_v4: { Args: never; Returns: string }
      uuid_generate_v5: {
        Args: { name: string; namespace: string }
        Returns: string
      }
      uuid_nil: { Args: never; Returns: string }
      uuid_ns_dns: { Args: never; Returns: string }
      uuid_ns_oid: { Args: never; Returns: string }
      uuid_ns_url: { Args: never; Returns: string }
      uuid_ns_x500: { Args: never; Returns: string }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
