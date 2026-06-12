// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

// API Client
export class ApiClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  protected async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const config: RequestInit = {
      headers: {
        ...options.headers,
      },
      ...options,
    };

    // Only set Content-Type for non-FormData requests
    if (!(options.body instanceof FormData)) {
      config.headers = {
        'Content-Type': 'application/json',
        ...config.headers,
      };
    }

    // Add authorization header if token exists
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers = { ...config.headers, 'Authorization': `Bearer ${token}` };
    }

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { detail: errorText };
        }

        console.error('API Error:', {
          endpoint,
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });

        const apiError: any = new Error(errorData.detail || errorData.message || `HTTP ${response.status}: ${response.statusText}`);
        apiError.status = response.status;
        throw apiError;
      }

      const data = await response.json();
      console.log('API Success:', { endpoint, data });
      return data;
    } catch (error) {
      console.error('Request failed:', { endpoint, error });
      throw error;
    }
  }

  // Auth endpoints
  async login(email: string, password: string) {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(userData: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
    confirmPassword: string;
  }) {
    return this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async verifyEmail(email: string, code: string) {
    return this.request('/api/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    });
  }

  async resendVerification(email: string) {
    return this.request('/api/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async verifyLogin(email: string, code: string) {
    return this.request('/api/auth/verify-login', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    });
  }

  async resendLoginCode(email: string) {
    return this.request('/api/auth/resend-login-code', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async forgotPassword(email: string) {
    return this.request('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(token: string, newPassword: string) {
    return this.request('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, new_password: newPassword }),
    });
  }

  // Patient endpoints
  async getPatients(page: number = 1, pageSize: number = 10, filters?: any) {
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
      ...(filters && Object.keys(filters).reduce((acc, key) => {
        if (filters[key]) acc[key] = filters[key];
        return acc;
      }, {} as any)),
    });
    
    const url = `/api/patients?${params}`;
    console.log('API call URL:', url);
    console.log('page_size parameter:', pageSize);
    return this.request(url);
  }

  async getPatient(id: number) {
    return this.request(`/api/patients/${id}`);
  }

  async createPatient(patientData: any) {
    return this.request('/api/patients', {
      method: 'POST',
      body: JSON.stringify(patientData),
    });
  }

  async updatePatient(id: number, patientData: any) {
    return this.request(`/api/patients/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patientData),
    });
  }

  async deletePatient(id: number) {
    return this.request(`/api/patients/${id}`, {
      method: 'DELETE',
    });
  }

  // Admin endpoints
  async getAdminDoctors() {
    return this.request('/api/admin/doctors');
  }

  // Health check
  async healthCheck() {
    return this.request('/api/health');
  }
}

// Create singleton instance
export const api = new ApiClient();
