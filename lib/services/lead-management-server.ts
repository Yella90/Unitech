// lib/services/lead-management-server.ts
// Instance serveur du service de leads (clé service_role).
import { supabaseServer } from '@/lib/supabase-admin';
import { LeadManagementService } from './LeadManagementService';

export const leadManagement = new LeadManagementService(supabaseServer);
