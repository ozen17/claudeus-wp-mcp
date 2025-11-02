"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Globe, MessageSquare, Key, TrendingUp, ArrowRight } from "lucide-react"
import Link from "next/link"
import { apiClient } from "@/lib/api-client"

export default function DashboardPage() {
  const [stats, setStats] = useState({
    sites: 0,
    conversations: 0,
    apiKeys: 0,
    quota: { used: 0, limit: 0, remaining: 0, percentage: 0 }
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const [sites, conversations, apiKeys, quota] = await Promise.all([
          apiClient.getSites(),
          apiClient.getConversations(),
          apiClient.getApiKeys(),
          apiClient.getQuota()
        ])

        setStats({
          sites: sites.length,
          conversations: conversations.length,
          apiKeys: apiKeys.length,
          quota
        })
      } catch (error) {
        console.error("Failed to fetch stats:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <div>
        <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
        <div className="text-gray-400">Loading...</div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-gray-400">Welcome back! Here's an overview of your account.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Sites</CardTitle>
            <Globe className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.sites}</div>
            <p className="text-xs text-gray-500 mt-1">WordPress sites connected</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Conversations</CardTitle>
            <MessageSquare className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.conversations}</div>
            <p className="text-xs text-gray-500 mt-1">AI chat sessions</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">API Keys</CardTitle>
            <Key className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.apiKeys}</div>
            <p className="text-xs text-gray-500 mt-1">OpenAI/Anthropic keys</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Usage</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.quota.used}/{stats.quota.limit}</div>
            <p className="text-xs text-gray-500 mt-1">Requests this month</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link href="/dashboard/sites">
            <Card className="bg-gray-900 border-gray-800 hover:border-gray-700 transition-colors cursor-pointer h-full">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold mb-1">Add WordPress Site</h3>
                    <p className="text-sm text-gray-400">Connect a new WordPress site</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/api-keys">
            <Card className="bg-gray-900 border-gray-800 hover:border-gray-700 transition-colors cursor-pointer h-full">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold mb-1">Configure API Keys</h3>
                    <p className="text-sm text-gray-400">Add OpenAI or Anthropic keys</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/chat">
            <Card className="bg-gray-900 border-gray-800 hover:border-gray-700 transition-colors cursor-pointer h-full">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold mb-1">Start Chatting</h3>
                    <p className="text-sm text-gray-400">Talk to your AI assistant</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>

      {/* Usage Progress */}
      {stats.quota.limit > 0 && (
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle>Usage This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">
                  {stats.quota.used} of {stats.quota.limit} requests used
                </span>
                <span className="font-medium">{stats.quota.percentage.toFixed(0)}%</span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all"
                  style={{ width: `${Math.min(stats.quota.percentage, 100)}%` }}
                />
              </div>
              {stats.quota.percentage >= 80 && (
                <p className="text-sm text-yellow-500 mt-2">
                  You're approaching your monthly limit. Consider upgrading your plan.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
