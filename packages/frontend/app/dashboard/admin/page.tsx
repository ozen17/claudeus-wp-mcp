"use client"

import { useEffect, useState } from "react"
import { apiClient } from "@/lib/api-client"
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle, GlassCardDescription } from "@/components/ui/glass-card"
import { GradientButton } from "@/components/ui/gradient-button"
import { Tag } from "@/components/ui/tag"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Users,
  Settings,
  BarChart3,
  Key,
  Shield,
  Activity,
  Search,
  Ban,
  CheckCircle,
  Trash2,
  AlertCircle,
  TrendingUp,
  Globe,
  MessageSquare,
  Sparkles
} from "lucide-react"

type Tab = 'overview' | 'config' | 'users' | 'analytics' | 'logs'

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)
  const [keyStatus, setKeyStatus] = useState<any>(null)
  const [newApiKey, setNewApiKey] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchAdminData()
  }, [])

  const fetchAdminData = async () => {
    try {
      const [statsData, keyData] = await Promise.all([
        apiClient.getAdminStats(),
        apiClient.getOpenAIKeyStatus()
      ])
      setStats(statsData)
      setKeyStatus(keyData)
    } catch (error) {
      console.error("Failed to fetch admin data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveApiKey = async () => {
    if (!newApiKey.trim()) return
    setSaving(true)
    try {
      await apiClient.setOpenAIKey(newApiKey)
      await fetchAdminData()
      setNewApiKey("")
    } catch (error: any) {
      alert(error.response?.data?.message || "Erreur lors de la sauvegarde")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'overview', label: 'Vue d\'ensemble', icon: BarChart3 },
    { id: 'config', label: 'Configuration', icon: Settings },
    { id: 'users', label: 'Utilisateurs', icon: Users },
    { id: 'analytics', label: 'Analytics', icon: Activity },
    { id: 'logs', label: 'Logs', icon: Shield },
  ] as const

  return (
    <div>
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-3">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold tracking-tight">Administration</h1>
          <Tag variant="destructive">Admin Only</Tag>
        </div>
        <p className="text-muted-foreground">Gestion complète de votre plateforme SaaS</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={`
                flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all whitespace-nowrap
                ${activeTab === tab.id
                  ? 'bg-primary/10 text-primary shadow-sm'
                  : 'text-neutral hover:text-foreground hover:bg-white/5'
                }
              `}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && <OverviewTab stats={stats} />}
      {activeTab === 'config' && (
        <ConfigTab
          keyStatus={keyStatus}
          newApiKey={newApiKey}
          setNewApiKey={setNewApiKey}
          saving={saving}
          onSave={handleSaveApiKey}
        />
      )}
      {activeTab === 'users' && <UsersTab />}
      {activeTab === 'analytics' && <AnalyticsTab />}
      {activeTab === 'logs' && <LogsTab />}
    </div>
  )
}

// ============================================
// OVERVIEW TAB
// ============================================

function OverviewTab({ stats }: { stats: any }) {
  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <GlassCard>
          <GlassCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <GlassCardTitle className="text-sm font-medium text-muted-foreground">
              Utilisateurs Total
            </GlassCardTitle>
            <Users className="h-4 w-4 text-primary" />
          </GlassCardHeader>
          <GlassCardContent>
            <div className="text-3xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-neutral mt-1">
              {stats.activeUsers} actifs
            </p>
          </GlassCardContent>
        </GlassCard>

        <GlassCard>
          <GlassCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <GlassCardTitle className="text-sm font-medium text-muted-foreground">
              Sites WordPress
            </GlassCardTitle>
            <Globe className="h-4 w-4 text-accent" />
          </GlassCardHeader>
          <GlassCardContent>
            <div className="text-3xl font-bold">{stats.totalSites}</div>
            <p className="text-xs text-neutral mt-1">Sites connectés</p>
          </GlassCardContent>
        </GlassCard>

        <GlassCard>
          <GlassCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <GlassCardTitle className="text-sm font-medium text-muted-foreground">
              Conversations
            </GlassCardTitle>
            <MessageSquare className="h-4 w-4 text-primary" />
          </GlassCardHeader>
          <GlassCardContent>
            <div className="text-3xl font-bold">{stats.totalConversations}</div>
            <p className="text-xs text-neutral mt-1">Sessions IA</p>
          </GlassCardContent>
        </GlassCard>

        <GlassCard>
          <GlassCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <GlassCardTitle className="text-sm font-medium text-muted-foreground">
              Audit Logs
            </GlassCardTitle>
            <Shield className="h-4 w-4 text-accent" />
          </GlassCardHeader>
          <GlassCardContent>
            <div className="text-3xl font-bold">{stats.totalAuditLogs}</div>
            <p className="text-xs text-neutral mt-1">Actions enregistrées</p>
          </GlassCardContent>
        </GlassCard>
      </div>

      {/* Subscription Distribution */}
      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Répartition des Abonnements
          </GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent>
          <div className="grid md:grid-cols-3 gap-4">
            {stats.subscriptionStats?.map((stat: any) => (
              <div key={stat.tier} className="p-4 rounded-xl bg-white/5 border border-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{stat.tier}</span>
                  <Tag variant={stat.tier === 'PRO' ? 'accent' : stat.tier === 'ENTERPRISE' ? 'primary' : 'secondary'}>
                    {stat.count}
                  </Tag>
                </div>
                <div className="text-2xl font-bold">{stat.count} users</div>
              </div>
            ))}
          </div>
        </GlassCardContent>
      </GlassCard>

      {/* Recent Users */}
      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent" />
            Utilisateurs Récents
          </GlassCardTitle>
          <GlassCardDescription>10 derniers inscrits</GlassCardDescription>
        </GlassCardHeader>
        <GlassCardContent>
          <div className="space-y-3">
            {stats.recentUsers?.map((user: any) => (
              <div key={user.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-700 flex items-center justify-center text-sm font-bold">
                    {(user.name || user.email).charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium">{user.name || user.email}</p>
                    <p className="text-sm text-neutral">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {user.isAdmin && <Tag variant="destructive">Admin</Tag>}
                  <Tag variant={user.subscription?.tier === 'PRO' ? 'accent' : 'secondary'}>
                    {user.subscription?.tier || 'FREE'}
                  </Tag>
                  <div className="text-sm text-neutral">
                    {user._count?.sites || 0} sites
                  </div>
                </div>
              </div>
            ))}
          </div>
        </GlassCardContent>
      </GlassCard>
    </div>
  )
}

// ============================================
// CONFIG TAB
// ============================================

function ConfigTab({ keyStatus, newApiKey, setNewApiKey, saving, onSave }: any) {
  return (
    <div className="max-w-3xl">
      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5 text-primary" />
            Configuration OpenAI
          </GlassCardTitle>
          <GlassCardDescription>
            Clé API partagée par tous les utilisateurs de la plateforme
          </GlassCardDescription>
        </GlassCardHeader>
        <GlassCardContent className="space-y-6">
          {/* Current Status */}
          <div className="p-4 rounded-xl bg-white/5 border border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">Statut Actuel</span>
              {keyStatus.configured ? (
                <Tag variant="success">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Configurée
                </Tag>
              ) : (
                <Tag variant="warning">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Non configurée
                </Tag>
              )}
            </div>
            {keyStatus.maskedKey && (
              <p className="text-sm font-mono text-neutral">{keyStatus.maskedKey}</p>
            )}
          </div>

          {/* Update Key */}
          <div className="space-y-3">
            <Label htmlFor="apiKey">Nouvelle Clé API OpenAI</Label>
            <Input
              id="apiKey"
              type="password"
              placeholder="sk-proj-..."
              value={newApiKey}
              onChange={(e) => setNewApiKey(e.target.value)}
              className="glass-card border-border/50 focus:border-primary font-mono"
            />
            <p className="text-xs text-neutral">
              🔒 La clé sera chiffrée en AES-256 dans la base de données
            </p>
          </div>

          <GradientButton
            onClick={onSave}
            disabled={saving || !newApiKey.trim()}
            className="w-full"
          >
            {saving ? "Enregistrement..." : "Enregistrer la Clé"}
          </GradientButton>

          {/* Info */}
          <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="space-y-2 text-sm">
                <p className="font-medium text-primary">Important :</p>
                <ul className="list-disc list-inside space-y-1 text-neutral">
                  <li>Cette clé est utilisée par tous les utilisateurs</li>
                  <li>Assurez-vous d'avoir des crédits OpenAI suffisants</li>
                  <li>Surveillez votre utilisation depuis le dashboard OpenAI</li>
                </ul>
              </div>
            </div>
          </div>
        </GlassCardContent>
      </GlassCard>
    </div>
  )
}

// ============================================
// USERS TAB
// ============================================

function UsersTab() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => {
    fetchUsers()
  }, [search])

  const fetchUsers = async () => {
    try {
      const data = await apiClient.getAdminUsers({ search, limit: 20 })
      setUsers(data.users)
    } catch (error) {
      console.error("Failed to fetch users:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Search */}
      <GlassCard>
        <GlassCardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral" />
            <Input
              placeholder="Rechercher par email ou nom..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 glass-card border-border/50 focus:border-primary"
            />
          </div>
        </GlassCardContent>
      </GlassCard>

      {/* Users List */}
      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Tous les Utilisateurs
            <Tag variant="secondary">{users.length}</Tag>
          </GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent>
          {loading ? (
            <div className="text-center py-8 text-neutral">Chargement...</div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-neutral">Aucun utilisateur trouvé</div>
          ) : (
            <div className="space-y-3">
              {users.map((user) => (
                <UserRow key={user.id} user={user} onUpdate={fetchUsers} />
              ))}
            </div>
          )}
        </GlassCardContent>
      </GlassCard>
    </div>
  )
}

function UserRow({ user, onUpdate }: any) {
  const [actionLoading, setActionLoading] = useState(false)

  const handleSuspend = async () => {
    if (!confirm(`Suspendre ${user.email} ?`)) return
    setActionLoading(true)
    try {
      await apiClient.suspendUser(user.id, "Admin action")
      onUpdate()
    } catch (error: any) {
      alert(error.response?.data?.message || "Erreur")
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-border">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-700 flex items-center justify-center text-sm font-bold">
          {(user.name || user.email).charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="font-medium">{user.name || user.email}</p>
          <p className="text-sm text-neutral">{user.email}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {user.isAdmin && <Tag variant="destructive">Admin</Tag>}
        <Tag variant={user.subscription?.tier === 'PRO' ? 'accent' : 'secondary'}>
          {user.subscription?.tier || 'FREE'}
        </Tag>
        <Tag variant={user.subscription?.status === 'ACTIVE' ? 'success' : 'warning'}>
          {user.subscription?.status || 'ACTIVE'}
        </Tag>
        <GradientButton
          variant="secondary"
          size="sm"
          onClick={handleSuspend}
          disabled={actionLoading || user.isAdmin}
        >
          <Ban className="h-3 w-3" />
        </GradientButton>
      </div>
    </div>
  )
}

// ============================================
// ANALYTICS TAB (Placeholder)
// ============================================

function AnalyticsTab() {
  return (
    <GlassCard>
      <GlassCardHeader>
        <GlassCardTitle>Analytics Détaillées</GlassCardTitle>
        <GlassCardDescription>À venir : graphiques et métriques avancées</GlassCardDescription>
      </GlassCardHeader>
      <GlassCardContent>
        <div className="py-12 text-center text-neutral">
          <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Fonctionnalité en cours de développement</p>
        </div>
      </GlassCardContent>
    </GlassCard>
  )
}

// ============================================
// LOGS TAB (Placeholder)
// ============================================

function LogsTab() {
  return (
    <GlassCard>
      <GlassCardHeader>
        <GlassCardTitle>Logs Système</GlassCardTitle>
        <GlassCardDescription>Journal d'audit de toutes les actions</GlassCardDescription>
      </GlassCardHeader>
      <GlassCardContent>
        <div className="py-12 text-center text-neutral">
          <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Fonctionnalité en cours de développement</p>
        </div>
      </GlassCardContent>
    </GlassCard>
  )
}
