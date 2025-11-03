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

  // Sites (v2 - with MCP plugin support)
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
    mcpJwtToken?: string
    username?: string
    password?: string
    authType?: 'mcp' | 'basic'
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

  async testMcpConnection(url: string, jwtToken: string) {
    const response = await this.client.post('/sites/test-mcp', { url, jwtToken })
    return response.data.data
  }

  // Chat (v2 - OpenAI only, siteId required)
  async streamChat(
    data: {
      message: string
      siteId: string  // Now required
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
            } else if (parsed.error) {
              throw new Error(parsed.error)
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

  // Policies (v2 - replaces MCP tools)
  async getPolicyCategories() {
    const response = await this.client.get('/policies/categories')
    return response.data.categories
  }

  async getSitePolicy(siteId: string) {
    const response = await this.client.get(`/policies/sites/${siteId}`)
    return response.data.policy
  }

  async updatePolicyRule(siteId: string, category: string, data: {
    isEnabled?: boolean
    allowedActions?: string[]
    maxOpsPerDay?: number
    minPrice?: number
    maxPrice?: number
    maxPublishPerDay?: number
    requireConfirm?: boolean
  }) {
    const response = await this.client.put(`/policies/sites/${siteId}/rules/${category}`, data)
    return response.data.rule
  }

  async checkPermission(siteId: string, category: string, action: string) {
    const response = await this.client.post(`/policies/sites/${siteId}/check`, { category, action })
    return response.data.permission
  }

  async getEnabledTools(siteId: string) {
    const response = await this.client.get(`/policies/sites/${siteId}/enabled-tools`)
    return response.data
  }

  // Audit (v2)
  async getAuditLogs(params?: {
    siteId?: string
    category?: string
    action?: string
    limit?: number
    offset?: number
  }) {
    const query = new URLSearchParams(params as any).toString()
    const response = await this.client.get(`/audit?${query}`)
    return response.data
  }

  async getSiteAuditLogs(siteId: string, params?: {
    limit?: number
    offset?: number
  }) {
    const query = new URLSearchParams(params as any).toString()
    const response = await this.client.get(`/audit/sites/${siteId}?${query}`)
    return response.data
  }

  async getAuditStats(params?: {
    siteId?: string
    days?: number
  }) {
    const query = new URLSearchParams(params as any).toString()
    const response = await this.client.get(`/audit/stats?${query}`)
    return response.data
  }

  async getAuditLog(logId: string) {
    const response = await this.client.get(`/audit/${logId}`)
    return response.data.log
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

  // Admin (v2)
  // Configuration
  async getOpenAIKeyStatus() {
    const response = await this.client.get('/admin/config/openai-key/status')
    return response.data
  }

  async setOpenAIKey(apiKey: string) {
    const response = await this.client.put('/admin/config/openai-key', { apiKey })
    return response.data
  }

  // Stats & Analytics
  async getAdminStats() {
    const response = await this.client.get('/admin/stats')
    return response.data
  }

  async getAdminAnalytics(period: '7d' | '30d' | '90d' = '30d') {
    const response = await this.client.get(`/admin/analytics?period=${period}`)
    return response.data
  }

  // User Management
  async getAdminUsers(params?: {
    page?: number
    limit?: number
    search?: string
    tier?: string
    isAdmin?: boolean
  }) {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.search) queryParams.append('search', params.search)
    if (params?.tier) queryParams.append('tier', params.tier)
    if (params?.isAdmin !== undefined) queryParams.append('isAdmin', params.isAdmin.toString())

    const response = await this.client.get(`/admin/users?${queryParams.toString()}`)
    return response.data
  }

  async getAdminUserDetails(userId: string) {
    const response = await this.client.get(`/admin/users/${userId}`)
    return response.data
  }

  async makeUserAdmin(userId: string) {
    const response = await this.client.post(`/admin/users/${userId}/make-admin`)
    return response.data
  }

  async removeUserAdmin(userId: string) {
    const response = await this.client.delete(`/admin/users/${userId}/remove-admin`)
    return response.data
  }

  async suspendUser(userId: string, reason?: string) {
    const response = await this.client.patch(`/admin/users/${userId}/suspend`, { reason })
    return response.data
  }

  async unsuspendUser(userId: string) {
    const response = await this.client.patch(`/admin/users/${userId}/unsuspend`)
    return response.data
  }

  async deleteUser(userId: string, confirm: string) {
    const response = await this.client.delete(`/admin/users/${userId}`, {
      data: { confirm }
    })
    return response.data
  }

  // System Logs
  async getAdminLogs(params?: {
    page?: number
    limit?: number
    action?: string
    resource?: string
    userId?: string
  }) {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.action) queryParams.append('action', params.action)
    if (params?.resource) queryParams.append('resource', params.resource)
    if (params?.userId) queryParams.append('userId', params.userId)

    const response = await this.client.get(`/admin/logs?${queryParams.toString()}`)
    return response.data
  }
}

export const apiClient = new ApiClient()
