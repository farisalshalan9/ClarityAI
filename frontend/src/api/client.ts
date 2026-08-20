import axios from 'axios';
import { 
  AuthResponse, User, DocumentItem, DocumentDetail, 
  ActionItem, ChatMessage, QuickToolResult 
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export const api = axios.create({
  baseURL: API_BASE_URL,
});

// Request interceptor to attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('clarity_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token expired or invalid
      if (!window.location.pathname.startsWith('/share/')) {
        localStorage.removeItem('clarity_token');
        localStorage.removeItem('clarity_user');
      }
    }
    return Promise.reject(error);
  }
);

export const apiClient = {
  // Auth
  async register(email: string, password: string, fullName?: string): Promise<AuthResponse> {
    const res = await api.post<AuthResponse>('/api/auth/register', { email, password, full_name: fullName });
    return res.data;
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const res = await api.post<AuthResponse>('/api/auth/login', { email, password });
    return res.data;
  },

  async getMe(): Promise<User> {
    const res = await api.get<User>('/api/auth/me');
    return res.data;
  },

  // Documents
  async getDocuments(): Promise<DocumentItem[]> {
    const res = await api.get<DocumentItem[]>('/api/documents/');
    return res.data;
  },

  async getDocument(id: string): Promise<DocumentDetail> {
    const res = await api.get<DocumentDetail>(`/api/documents/${id}`);
    return res.data;
  },

  async uploadDocument(file: File, onProgress?: (pct: number) => void): Promise<DocumentDetail> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post<DocumentDetail>('/api/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(pct);
        }
      }
    });
    return res.data;
  },

  async deleteDocument(id: string): Promise<void> {
    await api.delete(`/api/documents/${id}`);
  },

  async reanalyzeDocument(id: string): Promise<DocumentDetail> {
    const res = await api.post<DocumentDetail>(`/api/documents/${id}/reanalyze`);
    return res.data;
  },

  getPageImageUrl(documentId: string, pageNumber: number, isShared: boolean = false, shareToken?: string): string {
    if (isShared && shareToken) {
      return `${API_BASE_URL}/api/share/${shareToken}/page/${pageNumber}?zoom=1.5`;
    }
    const token = localStorage.getItem('clarity_token');
    const tokenParam = token ? `token=${encodeURIComponent(token)}&t=${encodeURIComponent(token)}&` : '';
    return `${API_BASE_URL}/api/documents/${documentId}/page/${pageNumber}?${tokenParam}zoom=1.5`;
  },

  getRawPdfUrl(documentId: string, isShared: boolean = false, shareToken?: string): string {
    if (isShared && shareToken) {
      return `${API_BASE_URL}/api/share/${shareToken}/file`;
    }
    const token = localStorage.getItem('clarity_token');
    const tokenParam = token ? `?token=${encodeURIComponent(token)}&t=${encodeURIComponent(token)}` : '';
    return `${API_BASE_URL}/api/documents/${documentId}/file${tokenParam}`;
  },

  // Actions
  async createActionItem(documentId: string, item: { task: string; priority: string; category: string; assignee?: string; page_number?: number }): Promise<ActionItem> {
    const res = await api.post<ActionItem>(`/api/documents/${documentId}/actions`, item);
    return res.data;
  },

  async updateActionItem(documentId: string, actionId: string, updates: Partial<ActionItem>): Promise<ActionItem> {
    const res = await api.patch<ActionItem>(`/api/documents/${documentId}/actions/${actionId}`, updates);
    return res.data;
  },

  async deleteActionItem(documentId: string, actionId: string): Promise<void> {
    await api.delete(`/api/documents/${documentId}/actions/${actionId}`);
  },

  // Deadlines & Calendar Export
  getCalendarDownloadUrl(documentId: string): string {
    const token = localStorage.getItem('clarity_token');
    const tokenParam = token ? `?token=${encodeURIComponent(token)}&t=${encodeURIComponent(token)}` : '';
    return `${API_BASE_URL}/api/documents/${documentId}/deadlines/calendar.ics${tokenParam}`;
  },

  // Chat & Quick Tools
  async getChatHistory(documentId: string): Promise<ChatMessage[]> {
    const res = await api.get<ChatMessage[]>(`/api/documents/${documentId}/chat`);
    return res.data;
  },

  async sendChatMessage(documentId: string, content: string): Promise<ChatMessage> {
    const res = await api.post<ChatMessage>(`/api/documents/${documentId}/chat`, { content });
    return res.data;
  },

  async executeQuickTool(documentId: string, toolType: string, extraInstructions?: string): Promise<QuickToolResult> {
    const res = await api.post<QuickToolResult>(`/api/documents/${documentId}/quick-tool`, {
      tool_type: toolType,
      extra_instructions: extraInstructions
    });
    return res.data;
  },

  // Share
  async updateShareSettings(documentId: string, isPublic: boolean): Promise<{ is_public: boolean; share_token: string; share_url: string }> {
    const res = await api.patch(`/api/documents/${documentId}/share`, { is_public: isPublic });
    return res.data;
  },

  async getSharedDocument(shareToken: string): Promise<DocumentDetail> {
    const res = await api.get<DocumentDetail>(`/api/share/${shareToken}`);
    return res.data;
  }
};

export default api;
