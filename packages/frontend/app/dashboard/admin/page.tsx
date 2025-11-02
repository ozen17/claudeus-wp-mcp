"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Label } from "@/components/ui/label"
import {
  Shield,
  Key,
  Users,
  Globe,
  MessageSquare,
  Loader2,
  CheckCircle,
  AlertCircle,
  Info
} from "lucide-react"
import { apiClient } from "@/lib/api-client"

interface AdminStats {
  totalUsers: number
  totalSites: number
  totalConversations: number
  activeUsersLast30Days: number
}

interface OpenAIKeyStatus {
  configured: boolean
  masked?: string
  lastUpdated?: string
}

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [keyStatus, setKeyStatus] = useState<OpenAIKeyStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [apiKey, setApiKey] = useState("")
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setLoading(true)
      const [statsData, keyStatusData] = await Promise.all([
        apiClient.getAdminStats(),
        apiClient.getOpenAIKeyStatus()
      ])

      setStats(statsData.stats)
      setKeyStatus(keyStatusData)
    } catch (error: any) {
      console.error("Failed to load admin data:", error)
      setMessage({ type: 'error', text: error.response?.data?.message || "Erreur de chargement" })
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveApiKey(e: React.FormEvent) {
    e.preventDefault()
    if (!apiKey.trim()) return

    try {
      setSaving(true)
      setMessage(null)

      const result = await apiClient.setOpenAIKey(apiKey)

      setMessage({ type: 'success', text: 'Clé API OpenAI configurée avec succès!' })
      setApiKey("")

      // Reload status
      const newStatus = await apiClient.getOpenAIKeyStatus()
      setKeyStatus(newStatus)
    } catch (error: any) {
      console.error("Failed to save API key:", error)
      setMessage({
        type: 'error',
        text: error.response?.data?.message || "Erreur lors de la configuration de la clé API"
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Shield className="h-8 w-8 text-blue-500" />
          Administration
        </h1>
        <p className="text-gray-600 mt-2">
          Configuration système et statistiques de la plateforme
        </p>
      </div>

      {/* Message */}
      {message && (
        <Alert className={message.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}>
          {message.type === 'success' ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-600" />
          )}
          <AlertDescription className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      {/* OpenAI Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5 text-blue-500" />
            Configuration OpenAI
          </CardTitle>
          <CardDescription>
            Configurez la clé API OpenAI pour l'ensemble de la plateforme
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Status */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-500 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">État actuel</p>
                {keyStatus?.configured ? (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600">
                      ✓ Clé API configurée
                    </p>
                    {keyStatus.masked && (
                      <p className="text-xs text-gray-500 font-mono mt-1">
                        {keyStatus.masked}
                      </p>
                    )}
                    {keyStatus.lastUpdated && (
                      <p className="text-xs text-gray-500 mt-1">
                        Dernière mise à jour: {new Date(keyStatus.lastUpdated).toLocaleString('fr-FR')}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-orange-600 mt-2">
                    ⚠️ Aucune clé API configurée
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Configuration Form */}
          <form onSubmit={handleSaveApiKey} className="space-y-4">
            <div>
              <Label htmlFor="apiKey">
                Clé API OpenAI
              </Label>
              <Input
                id="apiKey"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-proj-..."
                className="font-mono text-sm mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Format: sk-proj-... (disponible sur{' '}
                <a
                  href="https://platform.openai.com/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  platform.openai.com
                </a>
                )
              </p>
            </div>

            <Button
              type="submit"
              disabled={!apiKey.trim() || saving}
              className="bg-blue-500 hover:bg-blue-600"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Configuration...
                </>
              ) : (
                <>
                  <Key className="h-4 w-4 mr-2" />
                  {keyStatus?.configured ? 'Mettre à jour' : 'Configurer'}
                </>
              )}
            </Button>
          </form>

          {/* Security Notice */}
          <Alert className="bg-blue-50 border-blue-200">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800 text-sm">
              <strong>Sécurité:</strong> La clé API est chiffrée avec AES-256 avant d'être stockée dans la base de données.
              Elle est utilisée par l'agent IA pour interagir avec OpenAI au nom de tous les utilisateurs.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Utilisateurs</p>
                <p className="text-3xl font-bold mt-2">{stats?.totalUsers || 0}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats?.activeUsersLast30Days || 0} actifs (30j)
                </p>
              </div>
              <Users className="h-12 w-12 text-blue-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Sites WordPress</p>
                <p className="text-3xl font-bold mt-2">{stats?.totalSites || 0}</p>
              </div>
              <Globe className="h-12 w-12 text-green-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Conversations</p>
                <p className="text-3xl font-bold mt-2">{stats?.totalConversations || 0}</p>
              </div>
              <MessageSquare className="h-12 w-12 text-purple-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Agent IA</p>
                <p className="text-sm font-medium mt-2">
                  {keyStatus?.configured ? (
                    <span className="text-green-600">✓ Actif</span>
                  ) : (
                    <span className="text-orange-600">⚠️ Non configuré</span>
                  )}
                </p>
              </div>
              <Shield className="h-12 w-12 text-blue-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Guide de configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2 text-sm">
            <p className="font-medium">1. Obtenir une clé API OpenAI</p>
            <p className="text-gray-600 ml-4">
              Créez un compte sur{' '}
              <a
                href="https://platform.openai.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                platform.openai.com
              </a>
              {' '}et générez une clé API dans la section API Keys.
            </p>
          </div>

          <div className="space-y-2 text-sm">
            <p className="font-medium">2. Configurer la clé dans le dashboard</p>
            <p className="text-gray-600 ml-4">
              Collez votre clé API OpenAI dans le champ ci-dessus et cliquez sur "Configurer".
              La clé sera chiffrée et stockée de manière sécurisée.
            </p>
          </div>

          <div className="space-y-2 text-sm">
            <p className="font-medium">3. Vérifier le fonctionnement</p>
            <p className="text-gray-600 ml-4">
              Une fois configurée, tous les utilisateurs pourront utiliser l'assistant IA sans avoir à fournir leur propre clé API.
              Testez le chat avec un site WordPress pour vérifier que tout fonctionne.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
