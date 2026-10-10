import { Product, Category, User, Order, Coupon, Review, StoreSettings, InventoryMovement } from '../types';

const API_BASE = '/api';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('aura_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse<T>(res: globalThis.Response): Promise<T> {
  if (!res.ok) {
    let errMsg = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      errMsg = data.error || errMsg;
    } catch {
      // ignore
    }
    throw new Error(errMsg);
  }
  return res.json();
}

export const api = {
  // Products
  async getProducts(params?: Record<string, string>): Promise<{
    products: Product[];
    total: number;
    page: number;
    totalPages: number;
    limit: number;
  }> {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    const res = await fetch(`${API_BASE}/products${qs}`);
    return handleResponse(res);
  },

  async getProduct(idOrSlug: string): Promise<{ product: Product; reviews: Review[]; related: Product[] }> {
    const res = await fetch(`${API_BASE}/products/${idOrSlug}`);
    return handleResponse(res);
  },

  async createProduct(productData: Partial<Product>): Promise<{ product: Product }> {
    const res = await fetch(`${API_BASE}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(productData),
    });
    return handleResponse(res);
  },

  async updateProduct(id: string, updates: Partial<Product>): Promise<{ product: Product }> {
    const res = await fetch(`${API_BASE}/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(updates),
    });
    return handleResponse(res);
  },

  async deleteProduct(id: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/products/${id}`, {
      method: 'DELETE',
      headers: getAuthHeader(),
    });
    return handleResponse(res);
  },

  // Categories
  async getCategories(): Promise<{ categories: Category[] }> {
    const res = await fetch(`${API_BASE}/categories`);
    return handleResponse(res);
  },

  // Auth
  async login(emailOrUsername: string, password?: string): Promise<{ user: User; token: string }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailOrUsername, password }),
    });
    return handleResponse(res);
  },

  async adminLogin(username: string, password: string): Promise<{ user: User; token: string; notice?: string }> {
    const res = await fetch(`${API_BASE}/auth/admin-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    return handleResponse(res);
  },

  async register(userData: {
    username: string;
    email: string;
    fullName: string;
    password?: string;
    phone?: string;
  }): Promise<{ user: User; token: string }> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    return handleResponse(res);
  },

  async getMe(): Promise<{ user: User }> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeader(),
    });
    return handleResponse(res);
  },

  async updateProfile(data: { fullName?: string; phone?: string; address?: any }): Promise<{ user: User }> {
    const res = await fetch(`${API_BASE}/auth/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  // Orders
  async getOrders(params?: Record<string, string>): Promise<{ orders: Order[]; total: number; page: number; totalPages: number }> {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    const res = await fetch(`${API_BASE}/orders${qs}`, {
      headers: getAuthHeader(),
    });
    return handleResponse(res);
  },

  async getOrder(id: string): Promise<{ order: Order }> {
    const res = await fetch(`${API_BASE}/orders/${id}`, {
      headers: getAuthHeader(),
    });
    return handleResponse(res);
  },

  async checkout(orderData: any): Promise<{ success: boolean; order: Order }> {
    const res = await fetch(`${API_BASE}/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(orderData),
    });
    return handleResponse(res);
  },

  async buyNow(purchaseData: any): Promise<{ success: boolean; order: Order }> {
    const res = await fetch(`${API_BASE}/buy-now`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(purchaseData),
    });
    return handleResponse(res);
  },

  async cancelOrder(id: string): Promise<{ success: boolean; order: Order }> {
    const res = await fetch(`${API_BASE}/orders/${id}/cancel`, {
      method: 'POST',
      headers: getAuthHeader(),
    });
    return handleResponse(res);
  },

  async updateOrderStatus(id: string, updates: any): Promise<{ order: Order }> {
    const res = await fetch(`${API_BASE}/orders/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(updates),
    });
    return handleResponse(res);
  },

  async refundOrder(id: string, notes?: string): Promise<{ success: boolean; order: Order }> {
    const res = await fetch(`${API_BASE}/orders/${id}/refund`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ notes }),
    });
    return handleResponse(res);
  },

  // Coupons
  async validateCoupon(code: string, subtotal: number): Promise<{
    valid: boolean;
    code: string;
    discountType: string;
    discountValue: number;
    discountAmount: number;
  }> {
    const res = await fetch(`${API_BASE}/coupons/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, subtotal }),
    });
    return handleResponse(res);
  },

  async getCoupons(): Promise<{ coupons: Coupon[] }> {
    const res = await fetch(`${API_BASE}/coupons`, {
      headers: getAuthHeader(),
    });
    return handleResponse(res);
  },

  async createCoupon(data: Partial<Coupon>): Promise<{ coupon: Coupon }> {
    const res = await fetch(`${API_BASE}/coupons`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async updateCoupon(id: string, data: Partial<Coupon>): Promise<{ coupon: Coupon }> {
    const res = await fetch(`${API_BASE}/coupons/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async deleteCoupon(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/coupons/${id}`, {
      method: 'DELETE',
      headers: getAuthHeader(),
    });
    return handleResponse(res);
  },

  // Inventory & Stock
  async getInventoryMovements(productId?: string): Promise<{ movements: InventoryMovement[] }> {
    const qs = productId ? `?productId=${productId}` : '';
    const res = await fetch(`${API_BASE}/inventory/movements${qs}`, {
      headers: getAuthHeader(),
    });
    return handleResponse(res);
  },

  async adjustStock(productId: string, quantityChange: number, reason: string, notes?: string): Promise<{ success: boolean; newStock: number }> {
    const res = await fetch(`${API_BASE}/inventory/adjust`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ productId, quantityChange, reason, notes }),
    });
    return handleResponse(res);
  },

  // Admin Analytics
  async getAdminAnalytics(): Promise<{
    kpis: any;
    charts: any;
    lowStockAlerts: any[];
  }> {
    const res = await fetch(`${API_BASE}/admin/analytics`, {
      headers: getAuthHeader(),
    });
    return handleResponse(res);
  },

  // Admin Customers
  async getAdminCustomers(): Promise<{ customers: any[] }> {
    const res = await fetch(`${API_BASE}/admin/customers`, {
      headers: getAuthHeader(),
    });
    return handleResponse(res);
  },

  async toggleCustomerStatus(id: string): Promise<{ customer: any }> {
    const res = await fetch(`${API_BASE}/admin/customers/${id}/toggle-status`, {
      method: 'PUT',
      headers: getAuthHeader(),
    });
    return handleResponse(res);
  },

  // Reviews & Wishlist
  async addReview(productId: string, review: { rating: number; title: string; comment: string; userName?: string }): Promise<{ review: Review }> {
    const res = await fetch(`${API_BASE}/reviews/${productId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(review),
    });
    return handleResponse(res);
  },

  async getWishlist(): Promise<{ wishlist: string[]; products: Product[] }> {
    const res = await fetch(`${API_BASE}/wishlist`, {
      headers: getAuthHeader(),
    });
    return handleResponse(res);
  },

  async toggleWishlist(productId: string): Promise<{ wishlist: string[] }> {
    const res = await fetch(`${API_BASE}/wishlist/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ productId }),
    });
    return handleResponse(res);
  },

  // Store Settings & Reset
  async getSettings(): Promise<{ settings: StoreSettings }> {
    const res = await fetch(`${API_BASE}/settings`);
    return handleResponse(res);
  },

  async updateSettings(data: Partial<StoreSettings>): Promise<{ settings: StoreSettings }> {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async resetSeed(): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/seed/reset`, {
      method: 'POST',
      headers: getAuthHeader(),
    });
    return handleResponse(res);
  },
};
