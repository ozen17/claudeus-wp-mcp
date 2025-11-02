"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import {
  Wrench,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Crown,
  FileText,
  Image,
  Tag,
  Users,
  MessageCircle,
  Menu,
  Layout,
  Star,
  Settings,
  Activity,
  Search,
  ShoppingCart,
  Server
} from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { cn } from "@/lib/utils"

const CATEGORY_ICONS: Record<string, any> = {
  CONTENT: FileText,
  MEDIA: Image,
  TAXONOMY: Tag,
  USER: Users,
  COMMENT: MessageCircle,
  MENU: Menu,
  FSE: Layout,
  ASTRA: Star,
  SITE_CONFIG: Settings,
  HEALTH: Activity,
  SEARCH: Search,
  WOOCOMMERCE: ShoppingCart,
  SYSTEM: Server,
}

const DANGER_LEVELS = {
  0: { label: 'Safe', icon: ShieldCheck, color: 'text-green-500' },
  1: { label: 'Moderate', icon: ShieldAlert, color: 'text-yellow-500' },
  2: { label: 'High Risk', icon: AlertTriangle, color: 'text-red-500' },
}

interface McpTool {
  id: string
  name: string
  displayName: string
  category: string
  description: string
  dangerLevel: number
  minTier: string
  isPremium: boolean
  hasAccess: boolean
  isEnabled: boolean
  usageCount: number
  lastUsed: string | null
}

export default function ToolsPage() {
  const [toolsByCategory, setToolsByCategory] = useState<Record<string, McpTool[]>>({})
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [tools, statsData] = await Promise.all([
        apiClient.getMcpToolsByCategory(),
        apiClient.getMcpToolsStats()
      ])

      setToolsByCategory(tools)
      setStats(statsData)

      // Expand first category by default
      if (Object.keys(tools).length > 0) {
        setExpandedCategories(new Set([Object.keys(tools)[0]]))
      }
    } catch (error) {
      console.error("Failed to fetch MCP tools:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleTool = async (toolId: string, isEnabled: boolean) => {
    try {
      await apiClient.toggleMcpTool(toolId, isEnabled)

      // Update local state
      setToolsByCategory(prev => {
        const updated = { ...prev }
        Object.keys(updated).forEach(category => {
          updated[category] = updated[category].map(tool =>
            tool.id === toolId ? { ...tool, isEnabled } : tool
          )
        })
        return updated
      })

      // Refresh stats
      const statsData = await apiClient.getMcpToolsStats()
      setStats(statsData)
    } catch (error: any) {
      alert(error.response?.data?.error?.message || "Failed to toggle tool")
    }
  }

  const handleToggleCategory = async (category: string, isEnabled: boolean) => {
    try {
      await apiClient.toggleMcpCategory(category, isEnabled)
      await fetchData()
    } catch (error: any) {
      alert(error.response?.data?.error?.message || "Failed to toggle category")
    }
  }

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const updated = new Set(prev)
      if (updated.has(category)) {
        updated.delete(category)
      } else {
        updated.add(category)
      }
      return updated
    })
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">MCP Tools</h1>
        <p className="text-gray-400">
          Manage WordPress tools available to your AI assistant. Enable or disable tools based on your needs.
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-400">Total Tools</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-400">Enabled</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">{stats.enabled}</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-400">Accessible</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-500">{stats.accessible}</div>
              <p className="text-xs text-gray-500 mt-1">Based on your plan</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-400">Premium</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-500">{stats.premium}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tools by Category */}
      <div className="space-y-4">
        {Object.entries(toolsByCategory).map(([category, tools]) => {
          const Icon = CATEGORY_ICONS[category] || Wrench
          const isExpanded = expandedCategories.has(category)
          const enabledCount = tools.filter(t => t.isEnabled).length
          const accessibleCount = tools.filter(t => t.hasAccess).length

          return (
            <Card key={category} className="bg-gray-900 border-gray-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 cursor-pointer" onClick={() => toggleCategory(category)}>
                    <Icon className="h-5 w-5 text-blue-500" />
                    <div>
                      <CardTitle className="capitalize">{category.toLowerCase().replace('_', ' ')}</CardTitle>
                      <CardDescription>
                        {enabledCount}/{tools.length} enabled · {accessibleCount}/{tools.length} accessible
                      </CardDescription>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleCategory(category, true)}
                    >
                      Enable All
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleCategory(category, false)}
                    >
                      Disable All
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent>
                  <div className="space-y-3">
                    {tools.map((tool) => {
                      const DangerIcon = DANGER_LEVELS[tool.dangerLevel as keyof typeof DANGER_LEVELS].icon
                      const dangerColor = DANGER_LEVELS[tool.dangerLevel as keyof typeof DANGER_LEVELS].color

                      return (
                        <div
                          key={tool.id}
                          className={cn(
                            "p-4 rounded-lg border transition-colors",
                            tool.hasAccess
                              ? "bg-gray-800/50 border-gray-700"
                              : "bg-gray-800/20 border-gray-700/50 opacity-50"
                          )}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-medium">{tool.displayName}</h4>

                                {/* Badges */}
                                <div className="flex items-center gap-1">
                                  {tool.isPremium && (
                                    <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded flex items-center gap-1">
                                      <Crown className="h-3 w-3" />
                                      Premium
                                    </span>
                                  )}

                                  {tool.minTier !== 'FREE' && (
                                    <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">
                                      {tool.minTier}+
                                    </span>
                                  )}

                                  <span className={cn("text-xs px-2 py-0.5 rounded flex items-center gap-1", dangerColor, "bg-current/10")}>
                                    <DangerIcon className="h-3 w-3" />
                                    {DANGER_LEVELS[tool.dangerLevel as keyof typeof DANGER_LEVELS].label}
                                  </span>
                                </div>
                              </div>

                              <p className="text-sm text-gray-400 mb-2">{tool.description}</p>

                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                <span>Code: <code className="bg-gray-700 px-1 rounded">{tool.name}</code></span>
                                {tool.usageCount > 0 && (
                                  <span>Used {tool.usageCount} times</span>
                                )}
                                {tool.lastUsed && (
                                  <span>Last used: {new Date(tool.lastUsed).toLocaleDateString()}</span>
                                )}
                              </div>

                              {!tool.hasAccess && (
                                <p className="text-sm text-yellow-500 mt-2">
                                  Upgrade to {tool.minTier} to use this tool
                                </p>
                              )}
                            </div>

                            <Switch
                              checked={tool.isEnabled}
                              onCheckedChange={(checked) => handleToggleTool(tool.id, checked)}
                              disabled={!tool.hasAccess}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
