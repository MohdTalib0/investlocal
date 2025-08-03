import { apiRequest } from "./queryClient";

export interface User {
  id: string;
  email: string;
  fullName: string;
  userType: 'entrepreneur' | 'investor' | 'admin';
  isVerified: boolean;
  avatar?: string;
  bio?: string;
  city: string;
  phone: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

class AuthService {
  private token: string | null = null;
  private user: User | null = null;

  constructor() {
    // Only access localStorage in browser environment
    if (typeof window !== 'undefined' && window.localStorage) {
      this.token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          this.user = JSON.parse(storedUser);
        } catch (e) {
          localStorage.removeItem('user');
        }
      }
    }
  }

  async register(userData: {
    email: string;
    password: string;
    fullName: string;
    phone: string;
    city: string;
    userType: 'entrepreneur' | 'investor';
  }): Promise<AuthResponse> {
    const response = await apiRequest('POST', '/api/auth/register', userData);
    const data = await response.json();
    
    this.setAuthData(data);
    return data;
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await apiRequest('POST', '/api/auth/login', { email, password });
    const data = await response.json();
    
    this.setAuthData(data);
    return data;
  }

  logout(): void {
    this.token = null;
    this.user = null;
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }

  getToken(): string | null {
    return this.token;
  }

  getUser(): User | null {
    return this.user;
  }

  isAuthenticated(): boolean {
    return !!this.token && !!this.user;
  }

  private setAuthData(data: AuthResponse): void {
    this.token = data.token;
    this.user = data.user;
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }
  }

  // Add Authorization header to requests
  getAuthHeaders(): Record<string, string> {
    if (this.token) {
      return {
        'Authorization': `Bearer ${this.token}`,
      };
    }
    return {};
  }

  // Verify token (can be used on server side)
  verifyToken(token: string): any {
    try {
      const jwt = require('jsonwebtoken');
      return jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    } catch (error) {
      return null;
    }
  }
}

export const authService = new AuthService();

// Update apiRequest to include auth headers
export async function authenticatedApiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  options?: { headers?: Record<string, string> }
): Promise<Response> {
  const isFormData = data instanceof FormData;
  
  const headers = {
    ...authService.getAuthHeaders(),
    ...(data && !isFormData ? { "Content-Type": "application/json" } : {}),
    ...(options?.headers || {}),
  };

  const res = await fetch(url, {
    method,
    headers,
    body: data ? (isFormData ? data : JSON.stringify(data)) : undefined,
    credentials: "include",
  });

  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }

  return res;
}
