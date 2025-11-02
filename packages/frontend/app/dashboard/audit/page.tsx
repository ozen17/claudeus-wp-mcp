'use client'

import { useState, useEffect } from 'react'
import { apiClient } from '@/lib/api-client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  Activity,
  Filter,
  ChevronLeft,
  ChevronRight,
  AlertCircle
} from 'lucide-react'

interface AuditLog {
  id: string
  userId: string
  siteId: string
  category: string
  action: string
  toolName: string
  intent: string
  result: string
  success: boolean
  createdAt: string
  site: {
    id: string
    name: string
    url: string
  }
}

interface AuditStats {
  totalActions: number
  successfulActions: number
  failedActions: number
  successRate: string
  byCategory: Array<{ category: string; count: number }>
  byAction: Array<{ action: string; count: number }>
}

const categoryLabels: Record<string, string> = {
  APPEARANCE_THEMES: 'Apparence',
  MENUS: 'Menus',
  CONTENT: 'Contenu',
  MEDIA: 'Médias',
  WOOCOMMERCE: 'WooCommerce',
  USERS: 'Utilisateurs',
  SETTINGS: 'Réglages',
}

const actionLabels: Record<string, string> = {
  READ: 'Lecture',
  CREATE: 'Création',
  UPDATE: 'Modification',
  DELETE: 'Suppression',
  PUBLISH: 'Publication',
}

const categoryColors: Record<string, string> = {
  APPEARANCE_THEMES: 'bg-purple-100 text-purple-800',
  MENUS: 'bg-blue-100 text-blue-800',
  CONTENT: 'bg-green-100 text-green-800',
  MEDIA: 'bg-yellow-100 text-yellow-800',
  WOOCOMMERCE: 'bg-pink-100 text-pink-800',
  USERS: 'bg-indigo-100 text-indigo-800',
  SETTINGS: 'bg-gray-100 text-gray-800',
}

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [stats, setStats] = useState<AuditStats | null>(null)
  const [sites, setSites] = useState<any[]>([])
  const [selectedSite, setSelectedSite] = useState<string>('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedAction, setSelectedAction] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(0)
  const [totalLogs, setTotalLogs] = useState(0)
  const [days, setDays] = useState(7)
  const limit = 20

  useEffect(() => {
    loadSites()
  }, [])

  useEffect(() => {
    loadData()
  }, [selectedSite, selectedCategory, selectedAction, page, days])

  async function loadSites() {
    try {
      const sitesData = await apiClient.getSites()
      setSites(sitesData)
    } catch (error) {
      console.error('Failed to load sites', error)
    }
  }

  async function loadData() {
    try {
      setLoading(true)

      const params: any = {
        limit,
        offset: page * limit,
      }

      if (selectedSite) params.siteId = selectedSite
      if (selectedCategory) params.category = selectedCategory
      if (selectedAction) params.action = selectedAction

      const [logsData, statsData] = await Promise.all([
        apiClient.getAuditLogs(params),
        apiClient.getAuditStats({ siteId: selectedSite || undefined, days }),
      ])

      setLogs(logsData.logs)
      setTotalLogs(logsData.pagination.total)
      setStats(statsData)
    } catch (error) {
      console.error('Failed to load audit data', error)
    } finally {
      setLoading(false)
    }
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return 'À l\'instant'
    if (diffMins < 60) return `Il y a ${diffMins} min`

    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `Il y a ${diffHours}h`

    const diffDays = Math.floor(diffHours / 24)
    if (diffDays < 7) return `Il y a ${diffDays}j`

    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const totalPages = Math.ceil(totalLogs / limit)

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Journal d'audit</h1>
        <p className="text-gray-600">
          Consultez l'historique de toutes les actions effectuées sur vos sites WordPress
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">{stats.totalActions}</div>
                <Activity className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-xs text-gray-500 mt-1">{days} derniers jours</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Succès</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold text-green-600">{stats.successfulActions}</div>
                <CheckCircle2 className="h-8 w-8 text-green-400" />
              </div>
              <p className="text-xs text-gray-500 mt-1">{stats.successRate}% de réussite</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Échecs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold text-red-600">{stats.failedActions}</div>
                <XCircle className="h-8 w-8 text-red-400" />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {stats.totalActions > 0
                  ? ((stats.failedActions / stats.totalActions) * 100).toFixed(1)
                  : 0}% du total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Période</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">{days}j</div>
                <Clock className="h-8 w-8 text-gray-400" />
              </div>
              <div className="flex gap-1 mt-2">
                {[7, 14, 30].map((d) => (
                  <button
                    key={d}
                    onClick={() => setDays(d)}
                    className={`text-xs px-2 py-1 rounded ${
                      days === d ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {d}j
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Category and Action Stats */}
      {stats && (stats.byCategory.length > 0 || stats.byAction.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Actions par catégorie</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stats.byCategory.map((item) => (
                  <div key={item.category} className="flex items-center justify-between">
                    <Badge className={categoryColors[item.category] || 'bg-gray-100'} variant="secondary">
                      {categoryLabels[item.category] || item.category}
                    </Badge>
                    <span className="font-semibold">{item.count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Actions par type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stats.byAction.map((item) => (
                  <div key={item.action} className="flex items-center justify-between">
                    <span className="text-gray-700">{actionLabels[item.action] || item.action}</span>
                    <span className="font-semibold">{item.count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Site</label>
              <select
                value={selectedSite}
                onChange={(e) => {
                  setSelectedSite(e.target.value)
                  setPage(0)
                }}
                className="w-full p-2 border rounded-md"
              >
                <option value="">Tous les sites</option>
                {sites.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Catégorie</label>
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value)
                  setPage(0)
                }}
                className="w-full p-2 border rounded-md"
              >
                <option value="">Toutes les catégories</option>
                {Object.entries(categoryLabels).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Action</label>
              <select
                value={selectedAction}
                onChange={(e) => {
                  setSelectedAction(e.target.value)
                  setPage(0)
                }}
                className="w-full p-2 border rounded-md"
              >
                <option value="">Toutes les actions</option>
                {Object.entries(actionLabels).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs List */}
      {loading && page === 0 ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      ) : logs.length === 0 ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Aucune action trouvée. Commencez à utiliser le chat pour voir l'historique ici.
          </AlertDescription>
        </Alert>
      ) : (
        <>
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {logs.map((log) => (
                  <div key={log.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {log.success ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-600" />
                          )}
                          <Badge className={categoryColors[log.category]} variant="secondary">
                            {categoryLabels[log.category] || log.category}
                          </Badge>
                          <Badge variant="outline">{actionLabels[log.action] || log.action}</Badge>
                          <span className="text-sm text-gray-500">{formatDate(log.createdAt)}</span>
                        </div>
                        <p className="text-sm text-gray-700 mb-1">
                          <strong>Intention :</strong> {log.intent}
                        </p>
                        <p className="text-sm text-gray-600">
                          <strong>Outil :</strong> <code className="bg-gray-100 px-1 rounded">{log.toolName}</code>
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-700">{log.site.name}</p>
                        <p className="text-xs text-gray-500">{log.site.url}</p>
                      </div>
                    </div>
                    {!log.success && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                        <p className="text-sm text-red-800">
                          <strong>Erreur :</strong> {log.result}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-gray-600">
                Page {page + 1} sur {totalPages} ({totalLogs} actions au total)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 0 || loading}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Précédent
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page >= totalPages - 1 || loading}
                >
                  Suivant
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
