"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { GradientButton } from "@/components/ui/gradient-button"
import { GlassCard, GlassCardContent, GlassCardDescription, GlassCardHeader, GlassCardTitle } from "@/components/ui/glass-card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus, Globe, Trash2, TestTube, CheckCircle2, XCircle, Sparkles, Info, PartyPopper } from "lucide-react"
import { apiClient } from "@/lib/api-client"

interface Site {
  id: string
  name: string
  url: string
  username: string
  isActive: boolean
  isHealthy: boolean
  createdAt: string
}

export default function SitesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [sites, setSites] = useState<Site[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    url: "",
    username: "",
    password: ""
  })
  const [formError, setFormError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchSites()

    // Check for success parameter
    if (searchParams?.get('success') === 'true') {
      setShowSuccessMessage(true)
      // Remove the parameter from URL
      router.replace('/dashboard/sites')
      // Auto-hide after 10 seconds
      setTimeout(() => {
        setShowSuccessMessage(false)
      }, 10000)
    }
  }, [])

  const fetchSites = async () => {
    try {
      const data = await apiClient.getSites()
      setSites(data)
    } catch (error) {
      console.error("Failed to fetch sites:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError("")
    setSubmitting(true)

    try {
      await apiClient.createSite(formData)
      setFormData({ name: "", url: "", username: "", password: "" })
      setShowAddForm(false)
      fetchSites()
    } catch (error: any) {
      setFormError(error.response?.data?.error?.message || "Failed to add site")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this site?")) return

    try {
      await apiClient.deleteSite(id)
      fetchSites()
    } catch (error) {
      console.error("Failed to delete site:", error)
    }
  }

  const handleTest = async (id: string) => {
    try {
      const result = await apiClient.testSite(id)
      alert(result.message)
      fetchSites()
    } catch (error: any) {
      alert(error.response?.data?.error?.message || "Connection test failed")
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">WordPress Sites</h1>
          <p className="text-muted-foreground">Manage your WordPress sites</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => router.push('/dashboard/sites/setup')}
            className="bg-blue-500 hover:bg-blue-600"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Configuration guidée
          </GradientButton>
          <GradientButton onClick={() => setShowAddForm(!showAddForm)} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Site
          </GradientButton>
        </div>
      </div>

      {/* Success Message */}
      {showSuccessMessage && (
        <Alert className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 mb-6 animate-in fade-in slide-in-from-top-4">
          <PartyPopper className="h-5 w-5 text-green-600" />
          <AlertDescription className="text-green-900">
            <p className="font-bold text-lg mb-2">🎉 Félicitations ! Votre site est connecté !</p>
            <p className="text-sm mb-3">
              Vous pouvez maintenant profiter de toutes les fonctionnalités de Claudeus !
            </p>
            <div className="flex flex-wrap gap-3 text-xs">
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700 h-8"
                onClick={() => router.push('/dashboard/chat')}
              >
                <Sparkles className="h-3 w-3 mr-1" />
                Commencer à discuter avec l'assistant
              </GradientButton>
              <Button
                size="sm"
                variant="outline"
                className="border-green-300 text-green-700 hover:bg-green-100 h-8"
                onClick={() => router.push('/dashboard/policies')}
              >
                Configurer les permissions
              </GradientButton>
              <Button
                size="sm"
                variant="ghost"
                className="text-green-700 hover:bg-green-100 h-8"
                onClick={() => setShowSuccessMessage(false)}
              >
                Masquer ce message
              </GradientButton>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* MCP Info Alert */}
      <Alert className="bg-blue-50 border-blue-200 mb-6">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <strong>Recommandé:</strong> Utilisez l'<strong>assistant de configuration guidée</strong> pour connecter votre site WordPress
          avec le plugin MCP (connexion sécurisée et fonctionnalités complètes).
        </AlertDescription>
      </Alert>

      {/* Add Site Form */}
      {showAddForm && (
        <GlassCard className="glass-card border-border mb-6">
          <GlassCardHeader>
            <GlassCardTitle>Add WordPress Site</GlassCardTitle>
            <GlassCardDescription>
              Connect a new WordPress site using an application password
            </GlassCardDescription>
          </GlassCardHeader>
          <GlassCardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {formError && (
                <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-md text-sm">
                  {formError}
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Site Name</Label>
                  <Input
                    id="name"
                    placeholder="My WordPress Site"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="url">Site URL</Label>
                  <Input
                    id="url"
                    type="url"
                    placeholder="https://example.com"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    placeholder="admin"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Application Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="xxxx xxxx xxxx xxxx"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <GradientButton type="submit" disabled={submitting}>
                  {submitting ? "Adding..." : "Add Site"}
                </GradientButton>
                <GradientButton type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                  Cancel
                </GradientButton>
              </div>
            </form>
          </GlassCardContent>
        </GlassCard>
      )}

      {/* Sites List */}
      {sites.length === 0 ? (
        <GlassCard className="glass-card border-border">
          <GlassCardContent className="py-12 text-center">
            <Globe className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No sites yet</h3>
            <p className="text-muted-foreground mb-4">Add your first WordPress site to get started</p>
            <GradientButton onClick={() => setShowAddForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Site
            </GradientButton>
          </GlassCardContent>
        </GlassCard>
      ) : (
        <div className="grid gap-4">
          {sites.map((site) => (
            <GlassCard key={site.id} className="glass-card border-border">
              <GlassCardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{site.name}</h3>
                      {site.isHealthy ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                    <a
                      href={site.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      {site.url}
                    </a>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span>Username: {site.username}</span>
                      <span>Added: {new Date(site.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleTest(site.id)}
                    >
                      <TestTube className="h-4 w-4 mr-2" />
                      Test
                    </GradientButton>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(site.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </GradientButton>
                  </div>
                </div>
              </GlassCardContent>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  )
}
