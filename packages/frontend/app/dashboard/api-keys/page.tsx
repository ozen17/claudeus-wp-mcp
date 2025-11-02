"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Key, Trash2, Eye, EyeOff } from "lucide-react"
import { apiClient } from "@/lib/api-client"

interface ApiKey {
  id: string
  provider: 'OPENAI' | 'ANTHROPIC'
  name: string
  lastUsed: string | null
  createdAt: string
}

export default function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    provider: 'ANTHROPIC' as 'OPENAI' | 'ANTHROPIC',
    key: "",
    name: ""
  })
  const [showKey, setShowKey] = useState(false)
  const [formError, setFormError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchApiKeys()
  }, [])

  const fetchApiKeys = async () => {
    try {
      const data = await apiClient.getApiKeys()
      setApiKeys(data)
    } catch (error) {
      console.error("Failed to fetch API keys:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError("")
    setSubmitting(true)

    try {
      await apiClient.createApiKey(formData)
      setFormData({ provider: 'ANTHROPIC', key: "", name: "" })
      setShowAddForm(false)
      fetchApiKeys()
    } catch (error: any) {
      setFormError(error.response?.data?.error?.message || "Failed to add API key")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this API key?")) return

    try {
      await apiClient.deleteApiKey(id)
      fetchApiKeys()
    } catch (error) {
      console.error("Failed to delete API key:", error)
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">API Keys</h1>
          <p className="text-gray-400">Manage your OpenAI and Anthropic API keys</p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Add API Key
        </Button>
      </div>

      {/* Info Card */}
      <Card className="bg-blue-500/10 border-blue-500/20 mb-6">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Key className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold mb-1">Your API keys are encrypted</h3>
              <p className="text-sm text-gray-300">
                All API keys are encrypted with AES-256 before being stored. We never have access
                to your actual keys. You can get API keys from{" "}
                <a href="https://platform.openai.com/api-keys" target="_blank" className="text-blue-400 hover:underline">
                  OpenAI
                </a>{" "}
                or{" "}
                <a href="https://console.anthropic.com/settings/keys" target="_blank" className="text-blue-400 hover:underline">
                  Anthropic
                </a>.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add API Key Form */}
      {showAddForm && (
        <Card className="bg-gray-900 border-gray-800 mb-6">
          <CardHeader>
            <CardTitle>Add API Key</CardTitle>
            <CardDescription>
              Add your OpenAI or Anthropic API key to start using the AI assistant
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {formError && (
                <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-md text-sm">
                  {formError}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="provider">Provider</Label>
                <select
                  id="provider"
                  value={formData.provider}
                  onChange={(e) => setFormData({ ...formData, provider: e.target.value as 'OPENAI' | 'ANTHROPIC' })}
                  className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm"
                >
                  <option value="ANTHROPIC">Anthropic (Claude)</option>
                  <option value="OPENAI">OpenAI (GPT)</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Name (optional)</Label>
                <Input
                  id="name"
                  placeholder="My API Key"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="key">API Key</Label>
                <div className="relative">
                  <Input
                    id="key"
                    type={showKey ? "text" : "password"}
                    placeholder={formData.provider === 'ANTHROPIC' ? 'sk-ant-...' : 'sk-...'}
                    value={formData.key}
                    onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Adding..." : "Add API Key"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* API Keys List */}
      {apiKeys.length === 0 ? (
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="py-12 text-center">
            <Key className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No API keys yet</h3>
            <p className="text-gray-400 mb-4">Add your first API key to start using the AI assistant</p>
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add API Key
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {apiKeys.map((key) => (
            <Card key={key.id} className="bg-gray-900 border-gray-800">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">
                        {key.name || `${key.provider} Key`}
                      </h3>
                      <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">
                        {key.provider}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <span>Added: {new Date(key.createdAt).toLocaleDateString()}</span>
                      {key.lastUsed && (
                        <span>Last used: {new Date(key.lastUsed).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(key.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
