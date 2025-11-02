import axios, { AxiosInstance, AxiosError } from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'

class ApiClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Request interceptor to add auth token
    this.client.interceptors.request.use((config) => {
      const token = this.getToken()
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    })

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Try to refresh token
          try {
            await this.refreshToken()
            // Retry original request
            return this.client.request(error.config!)
          } catch {
            // Refresh failed, logout user
            this.logout()
            window.location.href = '/login'
          }
        }
        return Promise.reject(error)
      }
    )
  }

  private getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('accessToken')
    }
    return null
  }

  private setToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', token)
    }
  }

  private getRefreshToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('refreshToken')
    }
    return null
  }

  private setRefreshToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('refreshToken', token)
    }
  }

  // Auth
  async register(data: { email: string; password: string; name?: string }) {
    const response = await this.client.post('/auth/register', data)
    this.setToken(response.data.data.accessToken)
    this.setRefreshToken(response.data.data.refreshToken)
    return response.data
  }

  async login(data: { email: string; password: string }) {
    const response = await this.client.post('/auth/login', data)
    this.setToken(response.data.data.accessToken)
    this.setRefreshToken(response.data.data.refreshToken)
    return response.data
  }

  async refreshToken() {
    const refreshToken = this.getRefreshToken()
    if (!refreshToken) throw new Error('No refresh token')

    const response = await this.client.post('/auth/refresh', { refreshToken })
    this.setToken(response.data.data.accessToken)
    this.setRefreshToken(response.data.data.refreshToken)
    return response.data
  }

  async logout() {
    try {
      await this.client.post('/auth/logout')
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
      }
    }
  }

  async getMe() {
    const response = await this.client.get('/auth/me')
    return response.data.data
  }

  // Sites
  async getSites() {
    const response = await this.client.get('/sites')
    return response.data.data
  }

  async getSite(id: string) {
    const response = await this.client.get(`/sites/${id}`)
    return response.data.data
  }

  async createSite(data: {
    name: string
    url: string
    username: string
    password: string
    authType?: string
  }) {
    const response = await this.client.post('/sites', data)
    return response.data.data
  }

  async updateSite(id: string, data: any) {
    const response = await this.client.put(`/sites/${id}`, data)
    return response.data.data
  }

  async deleteSite(id: string) {
    await this.client.delete(`/sites/${id}`)
  }

  async testSite(id: string) {
    const response = await this.client.post(`/sites/${id}/test`)
    return response.data.data
  }

  // API Keys
  async getApiKeys() {
    const response = await this.client.get('/api-keys')
    return response.data.data
  }

  async createApiKey(data: {
    provider: 'OPENAI' | 'ANTHROPIC'
    key: string
    name?: string
  }) {
    const response = await this.client.post('/api-keys', data)
    return response.data.data
  }

  async deleteApiKey(id: string) {
    await this.client.delete(`/api-keys/${id}`)
  }

  async testApiKey(id: string) {
    const response = await this.client.post(`/api-keys/${id}/test`)
    return response.data.data
  }

  // Chat
  async streamChat(
    data: {
      message: string
      siteId?: string
      provider: 'OPENAI' | 'ANTHROPIC'
      conversationId?: string
    },
    onChunk: (text: string) => void
  ) {
    const response = await fetch(`${API_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.getToken()}`,
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error('Failed to start chat')
    }

    const reader = response.body?.getReader()
    const decoder = new TextDecoder()

    if (!reader) throw new Error('No reader available')

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value)
      const lines = chunk.split('\n')

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          if (data === '[DONE]') return
          try {
            const parsed = JSON.parse(data)
            if (parsed.text) {
              onChunk(parsed.text)
            }
          } catch (e) {
            // Ignore parse errors
          }
        }
      }
    }
  }

  async getConversations() {
    const response = await this.client.get('/chat/conversations')
    return response.data.data
  }

  async getConversation(id: string) {
    const response = await this.client.get(`/chat/conversations/${id}`)
    return response.data.data
  }

  async deleteConversation(id: string) {
    await this.client.delete(`/chat/conversations/${id}`)
  }

  // Subscription
  async getSubscription() {
    const response = await this.client.get('/subscription')
    return response.data.data
  }

  async upgradeSubscription(data: { tier: 'PRO' | 'ENTERPRISE'; paymentMethodId?: string }) {
    const response = await this.client.post('/subscription/upgrade', data)
    return response.data
  }

  async cancelSubscription() {
    const response = await this.client.post('/subscription/cancel')
    return response.data
  }

  // Usage
  async getUsage(period: string = 'month') {
    const response = await this.client.get(`/usage?period=${period}`)
    return response.data.data
  }

  async getQuota() {
    const response = await this.client.get('/usage/quota')
    return response.data.data
  }

  // User
  async getProfile() {
    const response = await this.client.get('/user/profile')
    return response.data.data
  }

  async updateProfile(data: { name?: string; avatarUrl?: string }) {
    const response = await this.client.put('/user/profile', data)
    return response.data.data
  }

  async changePassword(data: { currentPassword: string; newPassword: string }) {
    await this.client.post('/user/change-password', data)
  }

  // MCP Tools
  async getMcpTools() {
    const response = await this.client.get('/mcp-tools')
    return response.data.data
  }

  async getMcpToolsByCategory() {
    const response = await this.client.get('/mcp-tools/by-category')
    return response.data.data
  }

  async getMcpToolsStats() {
    const response = await this.client.get('/mcp-tools/stats')
    return response.data.data
  }

  async toggleMcpTool(toolId: string, isEnabled: boolean) {
    const response = await this.client.put(`/mcp-tools/${toolId}/toggle`, { isEnabled })
    return response.data
  }

  async toggleMcpCategory(category: string, isEnabled: boolean) {
    const response = await this.client.put('/mcp-tools/category/toggle', { category, isEnabled })
    return response.data
  }

  async seedMcpTools() {
    const response = await this.client.post('/mcp-tools/seed')
    return response.data
  }
}

export const apiClient = new ApiClient()
