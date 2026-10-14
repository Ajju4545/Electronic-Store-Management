export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export interface Category {
  category_id: number;
  category_name: string;
}

export interface Supplier {
  supplier_id: number;
  supplier_name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
}

export interface Customer {
  customer_id: number;
  customer_name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
}

export interface Employee {
  employee_id: number;
  employee_name: string;
  phone?: string | null;
  role?: string | null;
  salary?: number | null;
}

export interface Product {
  product_id: number;
  product_name: string;
  category_id: number;
  brand?: string | null;
  price: number;
  stock_quantity: number;
  warranty_months: number;
}

export interface Purchase {
  purchase_id: number;
  supplier_id: number;
  employee_id: number;
  purchase_date: string;
  total_cost: number;
}

export interface PurchaseDetails {
  purchase_detail_id: number;
  purchase_id: number;
  product_id: number;
  quantity: number;
  unit_cost: number;
  product_name?: string;
}

export interface Sale {
  sale_id: number;
  customer_id: number;
  employee_id: number;
  sale_date: string;
  total_amount: number;
  payment_method?: string | null;
}

export interface SaleDetails {
  sale_detail_id: number;
  sale_id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  product_name?: string;
}

export interface DashboardData {
  total_products: number;
  total_categories: number;
  total_customers: number;
  total_suppliers: number;
  total_employees: number;
  total_purchases: number;
  total_sales: number;
  recent_sales?: Sale[];
  recent_purchases?: Purchase[];
}

export interface SalesReport {
  total_sales: number;
  total_sales_amount: number;
}

export interface PurchasesReport {
  total_purchases: number;
  total_purchase_cost: number;
}

export interface InventoryReport {
  total_stock_items: number;
  inventory_value: number;
}

export interface TopProductReport {
  product_id: number;
  product_name: string;
  total_quantity_sold: number;
}

export interface PaymentMethodReport {
  payment_method: string;
  total_sales: number;
  total_amount: number;
}

export interface AdminUser {
  id: number;
  email: string;
  full_name?: string | null;
  created_at?: string | null;
}

export interface AuthStatus {
  has_admin: boolean;
  admin_count: number;
}

export interface AuthResponse {
  status: string;
  message: string;
  access_token: string;
  token_type: string;
  user: AdminUser;
}

export const TOKEN_STORAGE_KEY = 'electrostore_auth_token';
export const USER_STORAGE_KEY = 'electrostore_auth_user';

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredAuth(token: string, user: AdminUser): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  } catch {}
}

export function clearStoredAuth(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
  } catch {}
}

export function getStoredUser(): AdminUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function getRequestHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const token = getStoredToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = 8000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } catch (err: any) {
    if (err.name === "AbortError") {
      throw new Error(`Request timed out after ${timeoutMs / 1000}s.`);
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    if (data && typeof data === "object") {
      if (Array.isArray(data.detail)) {
        const msg = data.detail.map((e: any) => e.msg || JSON.stringify(e)).join(", ");
        throw new Error(msg);
      }
      if (data.detail) {
        throw new Error(String(data.detail));
      }
      if (data.message) {
        throw new Error(String(data.message));
      }
    }
    throw new Error(`API error (${res.status}): ${res.statusText}`);
  }

  if (data && typeof data === "object" && data.status === "error") {
    throw new Error(data.message || data.details || "Operation failed");
  }

  return data as T;
}

export const api = {
  async checkHealth(): Promise<{ status: string; database?: string; message?: string }> {
    try {
      const res = await fetchWithTimeout(
        `${API_BASE_URL}/test-db`,
        {
          cache: "no-store",
          headers: getRequestHeaders(),
        },
        5000
      );
      return await handleResponse(res);
    } catch (err: any) {
      if (err.name === "TypeError" && err.message.includes("fetch")) {
        throw new Error(
          `Cannot reach FastAPI backend at ${API_BASE_URL}. Ensure port 8000 is running.`
        );
      }
      throw err;
    }
  },

  async get<T>(endpoint: string): Promise<T> {
    try {
      const res = await fetchWithTimeout(`${API_BASE_URL}${endpoint}`, {
        cache: "no-store",
        headers: getRequestHeaders(),
      }, 10000);
      return await handleResponse<T>(res);
    } catch (err: any) {
      if (err.name === "TypeError" && err.message.includes("fetch")) {
        throw new Error(
          `Cannot connect to backend at ${API_BASE_URL}. Ensure FastAPI is running on port 8000.`
        );
      }
      throw err;
    }
  },

  async post<T>(endpoint: string, body: any): Promise<T> {
    try {
      const res = await fetchWithTimeout(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: getRequestHeaders(),
        body: JSON.stringify(body),
      }, 10000);
      return await handleResponse<T>(res);
    } catch (err: any) {
      if (err.name === "TypeError" && err.message.includes("fetch")) {
        throw new Error(
          `Cannot connect to backend at ${API_BASE_URL}. Ensure FastAPI is running on port 8000.`
        );
      }
      throw err;
    }
  },

  async put<T>(endpoint: string, body: any): Promise<T> {
    try {
      const res = await fetchWithTimeout(
        `${API_BASE_URL}${endpoint}`,
        {
          method: "PUT",
          headers: getRequestHeaders(),
          body: JSON.stringify(body),
        },
        10000
      );
      return await handleResponse<T>(res);
    } catch (err: any) {
      if (err.name === "TypeError" && err.message.includes("fetch")) {
        throw new Error(
          `Cannot connect to backend at ${API_BASE_URL}. Ensure FastAPI is running on port 8000.`
        );
      }
      throw err;
    }
  },

  async del<T>(endpoint: string): Promise<T> {
    try {
      const res = await fetchWithTimeout(
        `${API_BASE_URL}${endpoint}`,
        {
          method: "DELETE",
          headers: getRequestHeaders(),
        },
        10000
      );
      return await handleResponse<T>(res);
    } catch (err: any) {
      if (err.name === "TypeError" && err.message.includes("fetch")) {
        throw new Error(
          `Cannot connect to backend at ${API_BASE_URL}. Ensure FastAPI is running on port 8000.`
        );
      }
      throw err;
    }
  },

  auth: {
    async getStatus(): Promise<AuthStatus> {
      return api.get<AuthStatus>('/auth/status');
    },

    async login(payload: { email: string; password: string }): Promise<AuthResponse> {
      const res = await api.post<AuthResponse>('/auth/login', payload);
      if (res && res.access_token) {
        setStoredAuth(res.access_token, res.user);
      }
      return res;
    },

    async register(payload: { email: string; password: string; full_name?: string }): Promise<AuthResponse> {
      const res = await api.post<AuthResponse>('/auth/register', payload);
      if (res && res.access_token) {
        setStoredAuth(res.access_token, res.user);
      }
      return res;
    },

    async getMe(): Promise<AdminUser> {
      return api.get<AdminUser>('/auth/me');
    },

    async changePassword(payload: { old_password: string; new_password: string }): Promise<{ status: string; message: string }> {
      return api.post<{ status: string; message: string }>('/auth/change-password', payload);
    },

    logout(): void {
      clearStoredAuth();
    },
  },
};
