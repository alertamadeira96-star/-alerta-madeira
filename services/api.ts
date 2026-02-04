import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

class ApiService {
  private async getToken(): Promise<string | null> {
    return await AsyncStorage.getItem('auth_token');
  }

  private async getHeaders(): Promise<HeadersInit> {
    const token = await this.getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers = await this.getHeaders();
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  }

  // Auth
  async login(email: string, password: string) {
    const data = await this.request<{ user: any; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    await AsyncStorage.setItem('auth_token', data.token);
    await AsyncStorage.setItem('current_user', JSON.stringify(data.user));
    return data;
  }

  async register(email: string, password: string, name: string) {
    const data = await this.request<{ user: any; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
    await AsyncStorage.setItem('auth_token', data.token);
    await AsyncStorage.setItem('current_user', JSON.stringify(data.user));
    return data;
  }

  async getCurrentUser() {
    return this.request<any>('/auth/me');
  }

  async logout() {
    await AsyncStorage.removeItem('auth_token');
    await AsyncStorage.removeItem('current_user');
  }

  // Users
  async getUsers() {
    return this.request<any[]>('/users');
  }

  async deleteUser(userId: string) {
    return this.request<{ message: string }>(`/users/${userId}`, {
      method: 'DELETE',
    });
  }

  // Posts
  async getPosts() {
    return this.request<any[]>('/posts');
  }

  async getPost(postId: string) {
    return this.request<any>(`/posts/${postId}`);
  }

  async createPost(post: any) {
    return this.request<any>('/posts', {
      method: 'POST',
      body: JSON.stringify(post),
    });
  }

  async deletePost(postId: string) {
    return this.request<{ message: string }>(`/posts/${postId}`, {
      method: 'DELETE',
    });
  }

  async toggleReaction(postId: string, reactionType: string) {
    return this.request<{ reactions: any }>(`/posts/${postId}/reactions`, {
      method: 'POST',
      body: JSON.stringify({ reactionType }),
    });
  }

  // Comments
  async getComments(postId: string) {
    return this.request<any[]>(`/comments/post/${postId}`);
  }

  async addComment(postId: string, text: string) {
    return this.request<any>('/comments', {
      method: 'POST',
      body: JSON.stringify({ postId, text }),
    });
  }

  // Ads
  async getAds() {
    return this.request<any[]>('/ads');
  }

  async getActiveAds() {
    return this.request<any[]>('/ads/active');
  }

  async addAd(ad: any) {
    return this.request<any>('/ads', {
      method: 'POST',
      body: JSON.stringify(ad),
    });
  }

  async deleteAd(adId: string) {
    return this.request<{ message: string }>(`/ads/${adId}`, {
      method: 'DELETE',
    });
  }

  // Notifications
  async getNotifications() {
    return this.request<any[]>('/notifications');
  }

  async sendNotification(title: string, body: string) {
    return this.request<any>('/notifications/send', {
      method: 'POST',
      body: JSON.stringify({ title, body }),
    });
  }

  // Push Tokens
  async registerPushToken(token: string, platform?: string) {
    return this.request<{ message: string }>('/push-tokens', {
      method: 'POST',
      body: JSON.stringify({ token, platform }),
    });
  }
}

export const api = new ApiService();

