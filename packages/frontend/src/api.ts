// API client for SMB CRM
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8789';

export interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: string;
}

export interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  company?: string;
  job_title?: string;
  status: string;
  created_at: number;
}

export interface Communication {
  id: string;
  contact_id: string;
  type: 'email' | 'call' | 'sms' | 'meeting' | 'note';
  direction?: 'inbound' | 'outbound' | 'internal';
  subject?: string;
  content: string;
  status: string;
  sent_at?: number;
  created_at: number;
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

class APIClient {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('auth_token');
    }
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE}${endpoint}`;
    const token = this.getToken();

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'API request failed');
    }

    return response.json();
  }

  // Auth methods
  async login(email: string, password: string) {
    const response = await this.request<{ accessToken: string; user: User }>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(response.accessToken);
    return response;
  }

  async register(data: {
    email: string;
    password: string;
    tenantName: string;
    firstName: string;
    lastName: string;
  }) {
    return this.request('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Contact methods
  async getContacts(params?: { page?: number; limit?: number }) {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());

    return this.request<PaginatedResponse<Contact>>(`/api/v1/contacts?${query.toString()}`);
  }

  async createContact(data: Partial<Contact>) {
    return this.request<Contact>('/api/v1/contacts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getContact(id: string) {
    return this.request<Contact>(`/api/v1/contacts/${id}`);
  }

  // Communication methods
  async getCommunications(params?: { contactId?: string; page?: number; limit?: number }) {
    const query = new URLSearchParams();
    if (params?.contactId) query.set('contactId', params.contactId);
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());

    return this.request<PaginatedResponse<Communication>>(
      `/api/v1/communications?${query.toString()}`
    );
  }

  async createCommunication(data: {
    contact_id: string;
    type: string;
    direction?: string;
    subject?: string;
    content: string;
  }) {
    return this.request<Communication>('/api/v1/communications', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async sendEmail(data: { contact_id: string; subject: string; content: string }) {
    return this.request('/api/v1/communications/email/send', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const api = new APIClient();
