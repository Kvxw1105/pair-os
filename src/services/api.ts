const API_BASE = import.meta.env.VITE_API_BASE || '/api';

interface AiConfig {
  enabled: boolean;
  baseUrl: string;
  apiKey: string;
  model: string;
}

class ApiClient {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('pair_os_token');
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('pair_os_token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('pair_os_token');
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  // Local AI mode (key not stored on server)
  isLocalAiMode(): boolean {
    return localStorage.getItem('pair_os_ai_local') === 'true';
  }

  getLocalAiConfig(): AiConfig | null {
    const raw = localStorage.getItem('pair_os_ai_local_config');
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  }

  setLocalAiConfig(config: AiConfig) {
    localStorage.setItem('pair_os_ai_local', 'true');
    localStorage.setItem('pair_os_ai_local_config', JSON.stringify(config));
  }

  clearLocalAiConfig() {
    localStorage.removeItem('pair_os_ai_local');
    localStorage.removeItem('pair_os_ai_local_config');
  }

  private async request(path: string, options: RequestInit = {}) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    // If AI route and local mode is on, pass config via headers
    if (path.startsWith('/ai') && this.isLocalAiMode()) {
      const localCfg = this.getLocalAiConfig();
      if (localCfg && localCfg.enabled) {
        headers['X-AI-Key'] = localCfg.apiKey;
        headers['X-AI-BaseURL'] = localCfg.baseUrl;
        headers['X-AI-Model'] = localCfg.model;
      }
    }

    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(data?.error || `HTTP ${res.status}`);
    }
    return data;
  }

  // Auth
  async register(email: string, password: string, name: string) {
    const data = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
    this.setToken(data.token);
    return data;
  }

  async login(email: string, password: string) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(data.token);
    return data;
  }

  async getMe() {
    return this.request('/auth/me');
  }

  logout() {
    this.clearToken();
  }

  // Actions
  async getActions() {
    return this.request('/actions');
  }

  async createAction(title: string, visibility: string = 'solo') {
    return this.request('/actions', {
      method: 'POST',
      body: JSON.stringify({ title, visibility }),
    });
  }

  async logAction(title: string, durationMinutes: number, result: string, completionPercent?: number | null, note?: string, visibility: string = 'solo') {
    return this.request('/actions/log', {
      method: 'POST',
      body: JSON.stringify({ title, durationMinutes, result, completionPercent, note, visibility }),
    });
  }

  async updateActionState(id: string, state: string, reason?: string, note?: string) {
    return this.request(`/actions/${id}/state`, {
      method: 'PATCH',
      body: JSON.stringify({ state, reason, note }),
    });
  }

  async endAction(id: string, result: string, completionPercent?: number | null, note?: string) {
    return this.request(`/actions/${id}/end`, {
      method: 'POST',
      body: JSON.stringify({ result, completionPercent, note }),
    });
  }

  // Partner
  async getPartnerStatus() {
    return this.request('/partner/status');
  }

  async invitePartner(partnerEmail: string) {
    return this.request('/partner/invite', {
      method: 'POST',
      body: JSON.stringify({ partnerEmail }),
    });
  }

  async deleteAction(id: string) {
    return this.request(`/actions/${id}`, {
      method: 'DELETE',
    });
  }

  // AI
  async getAiConfig() {
    return this.request('/ai/config');
  }

  async updateAiConfig(config: { enabled: boolean; baseUrl: string; apiKey: string; model: string }) {
    return this.request('/ai/config', {
      method: 'PUT',
      body: JSON.stringify(config),
    });
  }

  async testAiConnection(config: { baseUrl: string; apiKey: string; model: string }) {
    return this.request('/ai/test', {
      method: 'POST',
      body: JSON.stringify(config),
    });
  }

  async suggestBlocked(reason: string, actionTitle: string, note?: string) {
    return this.request('/ai/suggest', {
      method: 'POST',
      body: JSON.stringify({ reason, actionTitle, note }),
    });
  }

  async refineAction(title: string) {
    return this.request('/ai/refine', {
      method: 'POST',
      body: JSON.stringify({ title }),
    });
  }

  async getInsight() {
    return this.request('/ai/insight', { method: 'POST' });
  }

  // Reports
  async getReports() {
    return this.request('/reports');
  }

  async getReport(date: string) {
    return this.request(`/reports/${date}`);
  }

  async updateReport(id: string, updates: { user1Summary?: string; user2Summary?: string; mutualMessage?: string }) {
    return this.request(`/reports/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  // Health check
  async health() {
    return fetch(`${API_BASE.replace('/api', '')}/health`).then(r => r.json());
  }
}

export const api = new ApiClient();
