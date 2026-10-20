import axios from 'axios';
import {
  AuthResponse,
  User,
  HealthProfile,
  RiskPrediction,
  CostPrediction,
  AssessmentDetail,
  AssessmentSummary,
  InsurancePlan,
  DemoProfileItem,
  ModelPerformanceData,
  RecommendedPlanItem
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token to outgoing requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Don't auto-redirect if already on login/register
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    return Promise.reject(error);
  }
);

// ----------------------------------------
// Authentication Services
// ----------------------------------------

export const authService = {
  async register(data: { email: string; password: string; full_name: string }): Promise<User> {
    const res = await api.post('/api/auth/register', data);
    return res.data;
  },

  async login(formData: FormData): Promise<AuthResponse> {
    const res = await api.post('/api/auth/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    localStorage.setItem('token', res.data.access_token);
    localStorage.setItem('user', JSON.stringify(res.data.user));
    return res.data;
  },

  async getMe(): Promise<User> {
    const res = await api.get('/api/auth/me');
    return res.data;
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser(): User | null {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  }
};

// ----------------------------------------
// Prediction & Assessment Services
// ----------------------------------------

export const assessmentService = {
  async predictRisk(profile: HealthProfile): Promise<RiskPrediction> {
    const res = await api.post('/api/predict/risk', profile);
    return res.data;
  },

  async predictCost(profile: HealthProfile): Promise<CostPrediction> {
    const res = await api.post('/api/predict/cost', profile);
    return res.data;
  },

  async getRecommendations(profile: HealthProfile, weights?: Record<string, number>): Promise<{ recommendations: RecommendedPlanItem[] }> {
    const res = await api.post('/api/recommendations', { profile, custom_weights: weights });
    return res.data;
  },

  async createAssessment(data: { title?: string; is_demo?: boolean; profile: HealthProfile }): Promise<AssessmentDetail> {
    const res = await api.post('/api/assessment', data);
    return res.data;
  },

  async getAssessment(id: number): Promise<AssessmentDetail> {
    const res = await api.get(`/api/assessment/${id}`);
    return res.data;
  },

  async listAssessments(): Promise<AssessmentSummary[]> {
    const res = await api.get('/api/assessments');
    return res.data;
  },

  async deleteAssessment(id: number): Promise<void> {
    await api.delete(`/api/assessment/${id}`);
  }
};

// ----------------------------------------
// Insurance Plans & Catalog
// ----------------------------------------

export const planService = {
  async getPlans(filter?: { plan_type?: string; max_premium?: number }): Promise<InsurancePlan[]> {
    const params = new URLSearchParams();
    if (filter?.plan_type) params.append('plan_type', filter.plan_type);
    if (filter?.max_premium) params.append('max_premium', String(filter.max_premium));
    const res = await api.get(`/api/plans?${params.toString()}`);
    return res.data;
  },

  async getPlanById(id: number): Promise<InsurancePlan> {
    const res = await api.get(`/api/plans/${id}`);
    return res.data;
  }
};

// ----------------------------------------
// Demo & Performance
// ----------------------------------------

export const demoService = {
  async getDemoProfiles(): Promise<DemoProfileItem[]> {
    const res = await api.get('/api/demo/profiles');
    return res.data;
  }
};

export const performanceService = {
  async getModelPerformance(): Promise<ModelPerformanceData> {
    const res = await api.get('/api/model-performance');
    return res.data;
  },

  async getModelVersions(): Promise<any[]> {
    const res = await api.get('/api/model-versions');
    return res.data;
  },

  async triggerRetrain(): Promise<any> {
    const res = await api.post('/api/retrain');
    return res.data;
  }
};
