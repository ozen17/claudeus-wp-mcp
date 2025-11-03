'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  FileText,
  File,
  Image,
  Users,
  MessageSquare,
  Puzzle,
  Palette,
  Settings,
  ChevronDown,
  Check,
  AlertCircle,
  ArrowLeft,
  RefreshCw,
  Trash2,
} from 'lucide-react'
import { apiClient } from '@/lib/api-client'
import { MCP_TOOLS_CONFIG, getGroupToolIds, isGroupFullyEnabled, getDefaultEnabledTools } from '../../../../../shared/mcp-tools-config'
import { GlassCard, GlassCardContent, GlassCardDescription, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card'
import { GradientButton } from '@/components/ui/gradient-button'
import { Tag } from '@/components/ui/tag'

// Icon mapping
const iconMap: Record<string, any> = {
  FileText,
  File,
  Image,
  Users,
  MessageSquare,
  Puzzle,
  Palette,
  Settings,
}

export default function SiteDetailPage() {
  const params = useParams()
  const router = useRouter()
  const siteId = params.siteId as string

  const [site, setSite] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [enabledTools, setEnabledTools] = useState<string[]>([])
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    fetchSite()
  }, [siteId])

  const fetchSite = async () => {
    try {
      setLoading(true)
      const data = await apiClient.getSite(siteId)
      setSite(data)

      // Initialize enabled tools (default to all if empty)
      const tools = data.enabledMcpTools && data.enabledMcpTools.length > 0
        ? data.enabledMcpTools
        : getDefaultEnabledTools()
      setEnabledTools(tools)
    } catch (error: any) {
      console.error('Failed to fetch site:', error)
      alert(error.response?.data?.message || 'Échec du chargement du site')
    } finally {
      setLoading(false)
    }
  }

  const handleTestConnection = async () => {
    try {
      setTesting(true)
      await apiClient.testSite(siteId)
      alert('✅ Connexion réussie !')
      fetchSite() // Refresh to update health status
    } catch (error: any) {
      alert('❌ ' + (error.response?.data?.message || 'Échec de la connexion'))
    } finally {
      setTesting(false)
    }
  }

  const handleDeleteSite = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce site ? Cette action est irréversible.')) {
      return
    }

    try {
      await apiClient.deleteSite(siteId)
      alert('✅ Site supprimé avec succès')
      router.push('/dashboard/sites')
    } catch (error: any) {
      alert('❌ ' + (error.response?.data?.message || 'Échec de la suppression'))
    }
  }

  const toggleGroup = (groupId: string) => {
    const newExpanded = new Set(expandedGroups)
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId)
    } else {
      newExpanded.add(groupId)
    }
    setExpandedGroups(newExpanded)
  }

  const toggleGroupTools = (groupId: string, enabled: boolean) => {
    const groupToolIds = getGroupToolIds(groupId)

    let newEnabledTools: string[]
    if (enabled) {
      // Add all tools from this group
      newEnabledTools = [...new Set([...enabledTools, ...groupToolIds])]
    } else {
      // Remove all tools from this group
      newEnabledTools = enabledTools.filter(toolId => !groupToolIds.includes(toolId))
    }

    setEnabledTools(newEnabledTools)
    setHasChanges(true)
  }

  const toggleIndividualTool = (toolId: string, enabled: boolean) => {
    let newEnabledTools: string[]
    if (enabled) {
      newEnabledTools = [...enabledTools, toolId]
    } else {
      newEnabledTools = enabledTools.filter(id => id !== toolId)
    }

    setEnabledTools(newEnabledTools)
    setHasChanges(true)
  }

  const handleSaveTools = async () => {
    try {
      setSaving(true)
      await apiClient.updateSiteMcpTools(siteId, enabledTools)
      setHasChanges(false)
      alert('✅ Configuration des outils MCP sauvegardée')
    } catch (error: any) {
      alert('❌ ' + (error.response?.data?.message || 'Échec de la sauvegarde'))
    } finally {
      setSaving(false)
    }
  }

  const handleResetToDefault = () => {
    if (confirm('Réinitialiser tous les outils à leur état par défaut (tous activés) ?')) {
      setEnabledTools(getDefaultEnabledTools())
      setHasChanges(true)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
          <p className="text-neutral">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!site) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-error mx-auto mb-2" />
          <p className="text-neutral">Site introuvable</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <GradientButton variant="ghost" size="sm" onClick={() => router.push('/dashboard/sites')}>
            <ArrowLeft className="h-4 w-4" />
            Retour
          </GradientButton>
          <div>
            <h1 className="text-2xl font-bold">{site.name}</h1>
            <p className="text-sm text-neutral">{site.url}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <GradientButton
            variant="secondary"
            size="sm"
            onClick={handleTestConnection}
            disabled={testing}
          >
            <RefreshCw className={`h-4 w-4 ${testing ? 'animate-spin' : ''}`} />
            Tester
          </GradientButton>
          <GradientButton
            variant="secondary"
            size="sm"
            onClick={handleDeleteSite}
          >
            <Trash2 className="h-4 w-4" />
            Supprimer
          </GradientButton>
        </div>
      </div>

      {/* Site Info */}
      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle>Informations du site</GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-neutral">Statut de connexion</span>
            {site.isHealthy ? (
              <Tag variant="success">✅ Connecté</Tag>
            ) : (
              <Tag variant="destructive">❌ Déconnecté</Tag>
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-neutral">Type d'authentification</span>
            <Tag variant="primary">{site.authType === 'mcp' ? 'MCP Plugin' : 'Basique'}</Tag>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-neutral">Dernière vérification</span>
            <span className="text-sm">
              {site.lastChecked
                ? new Date(site.lastChecked).toLocaleString('fr-FR')
                : 'Jamais'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-neutral">Date d'ajout</span>
            <span className="text-sm">
              {new Date(site.createdAt).toLocaleDateString('fr-FR')}
            </span>
          </div>
        </GlassCardContent>
      </GlassCard>

      {/* MCP Tools Configuration */}
      <GlassCard>
        <GlassCardHeader>
          <div className="flex items-center justify-between">
            <div>
              <GlassCardTitle>Configuration des outils MCP</GlassCardTitle>
              <GlassCardDescription className="mt-2">
                Activez ou désactivez les outils que l'assistant IA peut utiliser sur ce site WordPress
              </GlassCardDescription>
            </div>
            <GradientButton
              variant="secondary"
              size="sm"
              onClick={handleResetToDefault}
            >
              Réinitialiser
            </GradientButton>
          </div>
        </GlassCardHeader>
        <GlassCardContent className="space-y-3">
          {MCP_TOOLS_CONFIG.map((group) => {
            const IconComponent = iconMap[group.icon] || Settings
            const isExpanded = expandedGroups.has(group.id)
            const isGroupEnabled = isGroupFullyEnabled(group.id, enabledTools)
            const groupToolIds = getGroupToolIds(group.id)
            const enabledCount = groupToolIds.filter(id => enabledTools.includes(id)).length

            return (
              <div key={group.id} className="border border-border rounded-xl overflow-hidden">
                {/* Group Header */}
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/5 transition-colors"
                  onClick={() => toggleGroup(group.id)}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <IconComponent className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{group.name}</h3>
                        <span className="text-xs text-neutral">
                          {enabledCount}/{groupToolIds.length} activés
                        </span>
                      </div>
                      <p className="text-xs text-neutral">{group.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* Group Toggle */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleGroupTools(group.id, !isGroupEnabled)
                      }}
                      className={`relative w-11 h-6 rounded-full transition-colors ${
                        isGroupEnabled ? 'bg-primary' : 'bg-white/10'
                      }`}
                    >
                      <div
                        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                          isGroupEnabled ? 'translate-x-5' : ''
                        }`}
                      />
                    </button>
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                </div>

                {/* Individual Tools */}
                {isExpanded && (
                  <div className="border-t border-border bg-white/5 p-4 space-y-2">
                    {group.tools.map((tool) => {
                      const isToolEnabled = enabledTools.includes(tool.id)

                      return (
                        <div
                          key={tool.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                        >
                          <div className="flex-1 pr-4">
                            <div className="font-medium text-sm">{tool.name}</div>
                            <div className="text-xs text-neutral mt-1">{tool.description}</div>
                          </div>
                          <button
                            onClick={() => toggleIndividualTool(tool.id, !isToolEnabled)}
                            className={`relative w-11 h-6 rounded-full transition-colors ${
                              isToolEnabled ? 'bg-accent' : 'bg-white/10'
                            }`}
                          >
                            <div
                              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                                isToolEnabled ? 'translate-x-5' : ''
                              }`}
                            />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </GlassCardContent>
      </GlassCard>

      {/* Save Button */}
      {hasChanges && (
        <div className="fixed bottom-6 right-6">
          <GradientButton
            variant="primary"
            size="lg"
            onClick={handleSaveTools}
            disabled={saving}
          >
            {saving ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Sauvegarde...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Sauvegarder les modifications
              </>
            )}
          </GradientButton>
        </div>
      )}
    </div>
  )
}
