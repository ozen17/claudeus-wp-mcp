'use client'

import { useState, useEffect } from 'react'
import { apiClient } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { GlassCard, GlassCardContent, GlassCardDescription, GlassCardHeader, GlassCardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Paintbrush,
  Menu,
  FileText,
  Image,
  ShoppingCart,
  Users,
  Settings,
  ChevronDown,
  ChevronUp,
  Save,
  AlertCircle,
  CheckCircle2
} from 'lucide-react'

interface CategoryInfo {
  category: string
  displayName: string
  description: string
  icon: string
  availableActions: string[]
}

interface PolicyRule {
  id: string
  category: string
  isEnabled: boolean
  allowedActions: string[]
  maxOpsPerDay?: number
  minPrice?: number
  maxPrice?: number
  maxPublishPerDay?: number
  requireConfirm: boolean
}

interface SitePolicy {
  id: string
  siteId: string
  requireConfirmDelete: boolean
  defaultEnabled: boolean
  rules: PolicyRule[]
}

const iconMap: Record<string, any> = {
  Paintbrush,
  Menu,
  FileText,
  Image,
  ShoppingCart,
  Users,
  Settings,
}

const actionLabels: Record<string, string> = {
  READ: 'Lire',
  CREATE: 'Créer',
  UPDATE: 'Modifier',
  DELETE: 'Supprimer',
  PUBLISH: 'Publier',
}

const actionColors: Record<string, string> = {
  READ: 'bg-blue-500',
  CREATE: 'bg-green-500',
  UPDATE: 'bg-yellow-500',
  DELETE: 'bg-red-500',
  PUBLISH: 'bg-purple-500',
}

export default function PoliciesPage() {
  const [categories, setCategories] = useState<CategoryInfo[]>([])
  const [sites, setSites] = useState<any[]>([])
  const [selectedSite, setSelectedSite] = useState<string>('')
  const [policy, setPolicy] = useState<SitePolicy | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (selectedSite) {
      loadPolicy()
    }
  }, [selectedSite])

  async function loadData() {
    try {
      setLoading(true)
      const [categoriesData, sitesData] = await Promise.all([
        apiClient.getPolicyCategories(),
        apiClient.getSites(),
      ])
      setCategories(categoriesData)
      setSites(sitesData)

      if (sitesData.length > 0 && !selectedSite) {
        setSelectedSite(sitesData[0].id)
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Erreur lors du chargement' })
    } finally {
      setLoading(false)
    }
  }

  async function loadPolicy() {
    try {
      setLoading(true)
      const policyData = await apiClient.getSitePolicy(selectedSite)
      setPolicy(policyData)
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Erreur lors du chargement de la politique' })
    } finally {
      setLoading(false)
    }
  }

  function toggleCategory(category: string) {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(category)) {
      newExpanded.delete(category)
    } else {
      newExpanded.add(category)
    }
    setExpandedCategories(newExpanded)
  }

  function getCategoryRule(category: string): PolicyRule | undefined {
    return policy?.rules.find((r) => r.category === category)
  }

  async function toggleCategoryEnabled(category: string, isEnabled: boolean) {
    try {
      await apiClient.updatePolicyRule(selectedSite, category, { isEnabled })
      await loadPolicy()
      setMessage({ type: 'success', text: 'Catégorie mise à jour' })
      setTimeout(() => setMessage(null), 3000)
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Erreur' })
    }
  }

  async function toggleAction(category: string, action: string, enabled: boolean) {
    const rule = getCategoryRule(category)
    if (!rule) return

    const newActions = enabled
      ? [...rule.allowedActions, action]
      : rule.allowedActions.filter((a) => a !== action)

    try {
      await apiClient.updatePolicyRule(selectedSite, category, { allowedActions: newActions })
      await loadPolicy()
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Erreur' })
    }
  }

  async function updateConstraints(category: string, constraints: any) {
    try {
      setSaving(true)
      await apiClient.updatePolicyRule(selectedSite, category, constraints)
      await loadPolicy()
      setMessage({ type: 'success', text: 'Contraintes enregistrées' })
      setTimeout(() => setMessage(null), 3000)
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Erreur' })
    } finally {
      setSaving(false)
    }
  }

  if (loading && !policy) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  if (sites.length === 0) {
    return (
      <div className="p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Vous devez d'abord ajouter un site WordPress pour gérer les permissions.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Permissions & Politiques</h1>
        <p className="text-gray-600">
          Configurez les catégories d'outils et actions autorisées pour votre site WordPress
        </p>
      </div>

      {message && (
        <Alert className={`mb-4 ${message.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          {message.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-600" />
          )}
          <AlertDescription className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      {/* Site selector */}
      <GlassCard className="mb-6">
        <GlassCardHeader>
          <GlassCardTitle>Site WordPress</GlassCardTitle>
          <GlassCardDescription>Sélectionnez le site à configurer</GlassCardDescription>
        </GlassCardHeader>
        <GlassCardContent>
          <select
            value={selectedSite}
            onChange={(e) => setSelectedSite(e.target.value)}
            className="w-full p-2 border rounded-md"
          >
            {sites.map((site) => (
              <option key={site.id} value={site.id}>
                {site.name} - {site.url}
              </option>
            ))}
          </select>
        </GlassCardContent>
      </GlassCard>

      {/* Categories */}
      <div className="space-y-4">
        {categories.map((categoryInfo) => {
          const rule = getCategoryRule(categoryInfo.category)
          const IconComponent = iconMap[categoryInfo.icon] || Settings
          const isExpanded = expandedCategories.has(categoryInfo.category)

          return (
            <GlassCard key={categoryInfo.category} className="overflow-hidden">
              <div
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                onClick={() => toggleCategory(categoryInfo.category)}
              >
                <div className="flex items-center space-x-4 flex-1">
                  <div className={`p-2 rounded-lg ${rule?.isEnabled ? 'bg-blue-100' : 'bg-gray-100'}`}>
                    <IconComponent className={`h-6 w-6 ${rule?.isEnabled ? 'text-blue-600' : 'text-muted-foreground'}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{categoryInfo.displayName}</h3>
                    <p className="text-sm text-gray-600">{categoryInfo.description}</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Switch
                      checked={rule?.isEnabled || false}
                      onCheckedChange={(checked) => toggleCategoryEnabled(categoryInfo.category, checked)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </div>

              {isExpanded && rule && (
                <div className="border-t p-4 bg-gray-50">
                  {/* Actions */}
                  <div className="mb-6">
                    <Label className="mb-2 block">Actions autorisées</Label>
                    <div className="flex flex-wrap gap-2">
                      {categoryInfo.availableActions.map((action) => {
                        const isAllowed = rule.allowedActions.includes(action)
                        return (
                          <button
                            key={action}
                            onClick={() => toggleAction(categoryInfo.category, action, !isAllowed)}
                            disabled={!rule.isEnabled}
                            className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                              isAllowed
                                ? `${actionColors[action]} text-white`
                                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                            } ${!rule.isEnabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            {actionLabels[action]}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Constraints */}
                  <div className="space-y-4">
                    {/* Max ops per day */}
                    <div>
                      <Label htmlFor={`maxOps-${categoryInfo.category}`}>
                        Limite quotidienne d'opérations (optionnel)
                      </Label>
                      <Input
                        id={`maxOps-${categoryInfo.category}`}
                        type="number"
                        placeholder="Illimité"
                        value={rule.maxOpsPerDay || ''}
                        onChange={(e) => {
                          const value = e.target.value ? parseInt(e.target.value) : undefined
                          updateConstraints(categoryInfo.category, { maxOpsPerDay: value })
                        }}
                        disabled={!rule.isEnabled}
                        className="mt-1"
                      />
                    </div>

                    {/* WooCommerce price constraints */}
                    {categoryInfo.category === 'WOOCOMMERCE' && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor={`minPrice-${categoryInfo.category}`}>Prix minimum (€)</Label>
                          <Input
                            id={`minPrice-${categoryInfo.category}`}
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={rule.minPrice || ''}
                            onChange={(e) => {
                              const value = e.target.value ? parseFloat(e.target.value) : undefined
                              updateConstraints(categoryInfo.category, { minPrice: value })
                            }}
                            disabled={!rule.isEnabled}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`maxPrice-${categoryInfo.category}`}>Prix maximum (€)</Label>
                          <Input
                            id={`maxPrice-${categoryInfo.category}`}
                            type="number"
                            step="0.01"
                            placeholder="Illimité"
                            value={rule.maxPrice || ''}
                            onChange={(e) => {
                              const value = e.target.value ? parseFloat(e.target.value) : undefined
                              updateConstraints(categoryInfo.category, { maxPrice: value })
                            }}
                            disabled={!rule.isEnabled}
                            className="mt-1"
                          />
                        </div>
                      </div>
                    )}

                    {/* Content publish limit */}
                    {categoryInfo.category === 'CONTENT' && (
                      <div>
                        <Label htmlFor={`maxPublish-${categoryInfo.category}`}>
                          Publications maximum par jour (optionnel)
                        </Label>
                        <Input
                          id={`maxPublish-${categoryInfo.category}`}
                          type="number"
                          placeholder="Illimité"
                          value={rule.maxPublishPerDay || ''}
                          onChange={(e) => {
                            const value = e.target.value ? parseInt(e.target.value) : undefined
                            updateConstraints(categoryInfo.category, { maxPublishPerDay: value })
                          }}
                          disabled={!rule.isEnabled}
                          className="mt-1"
                        />
                      </div>
                    )}

                    {/* Require confirmation */}
                    <div className="flex items-center space-x-2">
                      <Switch
                        id={`confirm-${categoryInfo.category}`}
                        checked={rule.requireConfirm}
                        onCheckedChange={(checked) => {
                          updateConstraints(categoryInfo.category, { requireConfirm: checked })
                        }}
                        disabled={!rule.isEnabled}
                      />
                      <Label htmlFor={`confirm-${categoryInfo.category}`}>
                        Demander confirmation avant chaque action
                      </Label>
                    </div>
                  </div>
                </div>
              )}
            </GlassCard>
          )
        })}
      </div>

      {/* Help section */}
      <GlassCard className="mt-6 bg-blue-50 border-blue-200">
        <GlassCardHeader>
          <GlassCardTitle className="text-blue-900">💡 Comment ça marche ?</GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent className="text-blue-800 space-y-2">
          <p>
            • <strong>Catégories</strong> : Activez/désactivez des groupes d'outils (Contenu, Médias, WooCommerce...)
          </p>
          <p>
            • <strong>Actions</strong> : Choisissez ce que l'assistant peut faire (Lire, Créer, Modifier, Supprimer)
          </p>
          <p>
            • <strong>Contraintes</strong> : Définissez des limites (prix min/max, quotas quotidiens)
          </p>
          <p>
            • <strong>Sécurité</strong> : Les actions destructrices (suppressions) nécessitent toujours une confirmation
          </p>
        </GlassCardContent>
      </GlassCard>
    </div>
  )
}
