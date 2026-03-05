export interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: 'free' | 'pro' | 'enterprise';
  status: 'active' | 'suspended' | 'cancelled';
  logo_url?: string;
  primary_color?: string;
  created_at: number;
  updated_at: number;
}
export interface User {
  id: string;
  tenant_id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: 'admin' | 'manager' | 'member' | 'guest';
  status: 'active' | 'inactive' | 'suspended';
  last_login_at?: number;
  created_at: number;
  updated_at: number;
}
export interface Contact {
  id: string;
  tenant_id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  company?: string;
  job_title?: string;
  status: 'lead' | 'prospect' | 'customer' | 'archived';
  source?: string;
  notes?: string;
  created_by_id: string;
  created_at: number;
  updated_at: number;
}
export interface Deal {
  id: string;
  tenant_id: string;
  name: string;
  contact_id: string;
  amount: number;
  currency: string;
  status: 'open' | 'won' | 'lost';
  stage: 'prospecting' | 'qualification' | 'proposal' | 'negotiation' | 'closed';
  expected_close_date?: number;
  probability: number;
  notes?: string;
  owner_id: string;
  created_at: number;
  updated_at: number;
}
export interface Task {
  id: string;
  tenant_id: string;
  title: string;
  description?: string;
  due_date?: number;
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigned_to_id?: string;
  related_contact_id?: string;
  related_deal_id?: string;
  created_by_id: string;
  created_at: number;
  updated_at: number;
}
export interface Activity {
  id: string;
  tenant_id: string;
  entity_type: 'contact' | 'deal' | 'task' | 'user';
  entity_id: string;
  action: 'created' | 'updated' | 'deleted' | 'commented';
  user_id: string;
  changes?: Record<string, any>;
  created_at: number;
}
export interface Communication {
  id: string;
  tenant_id: string;
  contact_id: string;
  deal_id?: string;
  type: 'email' | 'call' | 'sms' | 'meeting' | 'note';
  direction?: 'inbound' | 'outbound' | 'internal';
  subject?: string;
  content: string;
  metadata?: string;
  status: 'sent' | 'delivered' | 'read' | 'failed' | 'scheduled';
  scheduled_at?: number;
  sent_at?: number;
  created_by_id: string;
  created_at: number;
  updated_at: number;
}
export interface CommunicationTemplate {
  id: string;
  tenant_id: string;
  name: string;
  type: 'email' | 'sms' | 'call_script';
  subject?: string;
  content: string;
  variables?: string;
  is_default: boolean;
  created_by_id: string;
  created_at: number;
  updated_at: number;
}
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}
//# sourceMappingURL=index.d.ts.map
