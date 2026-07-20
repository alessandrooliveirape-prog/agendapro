const API_BASE = import.meta.env.VITE_API_URL || '/api';

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('agendapro_token', token);
    } else {
      localStorage.removeItem('agendapro_token');
    }
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('agendapro_token');
    }
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Erro na requisição');
    }

    return data;
  }

  // Auth
  async login(email: string, password: string) {
    const data = await this.request<{ token: string; user: any; business: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(data.token);
    return data;
  }

  async loginWithGoogle(credential: string) {
    const data = await this.request<{ token: string; user: any; business: any }>('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ credential }),
    });
    this.setToken(data.token);
    return data;
  }

  async register(data: {
    business_name: string;
    slug: string;
    name: string;
    email: string;
    password: string;
    phone?: string;
  }) {
    const result = await this.request<{ token: string; business: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    this.setToken(result.token);
    return result;
  }

  async getMe() {
    return this.request<{ user: any }>('/auth/me');
  }

  logout() {
    this.setToken(null);
  }

  // Business
  async getBusiness() {
    return this.request<any>('/business');
  }

  async updateBusiness(data: any) {
    return this.request<any>('/business', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getDashboard() {
    return this.request<any>('/business/dashboard');
  }

  // Services
  async getServices() {
    return this.request<any[]>('/services');
  }

  async createService(data: any) {
    return this.request<any>('/services', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateService(id: string, data: any) {
    return this.request<any>(`/services/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteService(id: string) {
    return this.request<any>(`/services/${id}`, { method: 'DELETE' });
  }

  // Professionals
  async getProfessionals() {
    return this.request<any[]>('/professionals');
  }

  async createProfessional(data: any) {
    return this.request<any>('/professionals', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateProfessional(id: string, data: any) {
    return this.request<any>(`/professionals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteProfessional(id: string) {
    return this.request<any>(`/professionals/${id}`, { method: 'DELETE' });
  }

  // Appointments
  async getAppointments(params?: { date?: string; start_date?: string; end_date?: string; status?: string }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request<any[]>(`/appointments${query ? `?${query}` : ''}`);
  }

  async createAppointment(data: any) {
    return this.request<any>('/appointments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAppointmentStatus(id: string, status: string) {
    return this.request<any>(`/appointments/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async deleteAppointment(id: string) {
    return this.request<any>(`/appointments/${id}`, { method: 'DELETE' });
  }

  // Clients
  async getClients(search?: string) {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    return this.request<any[]>(`/clients${query}`);
  }

  async getClient(id: string) {
    return this.request<any>(`/clients/${id}`);
  }

  async createClient(data: any) {
    return this.request<any>('/clients', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateClient(id: string, data: any) {
    return this.request<any>(`/clients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteClient(id: string) {
    return this.request<any>(`/clients/${id}`, { method: 'DELETE' });
  }

  // Public
  async getPublicBusiness(slug: string) {
    return this.request<any>(`/public/${slug}`);
  }

  async getAvailableTimes(slug: string, date: string, serviceId: string) {
    return this.request<any>(`/public/${slug}/available-times?date=${date}&service_id=${serviceId}`);
  }

  async bookAppointment(slug: string, data: any) {
    return this.request<any>(`/public/${slug}/book`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const api = new ApiClient();
