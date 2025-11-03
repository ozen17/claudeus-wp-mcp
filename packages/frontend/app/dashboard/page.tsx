"use client"

import { useEffect, useState } from "react"
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from "@/components/ui/glass-card"
import { GradientButton } from "@/components/ui/gradient-button"
import { Tag } from "@/components/ui/tag"
import { Globe, MessageSquare, Key, TrendingUp, ArrowRight, Sparkles } from "lucide-react"
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
        <h1 className="text-3xl font-bold mb-8">Tableau de bord</h1>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-3">
          <h1 className="text-4xl font-bold tracking-tight">Tableau de bord</h1>
          <Sparkles className="h-6 w-6 text-accent" />
        </div>
        <p className="text-muted-foreground">Bienvenue ! Voici un aperçu de votre activité.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <GlassCard>
          <GlassCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <GlassCardTitle className="text-sm font-medium text-muted-foreground">Sites</GlassCardTitle>
            <Globe className="h-4 w-4 text-primary" />
          </GlassCardHeader>
          <GlassCardContent>
            <div className="text-3xl font-bold">{stats.sites}</div>
            <p className="text-xs text-neutral mt-1">Sites WordPress connectés</p>
          </GlassCardContent>
        </GlassCard>

        <GlassCard>
          <GlassCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <GlassCardTitle className="text-sm font-medium text-muted-foreground">Conversations</GlassCardTitle>
            <MessageSquare className="h-4 w-4 text-accent" />
          </GlassCardHeader>
          <GlassCardContent>
            <div className="text-3xl font-bold">{stats.conversations}</div>
            <p className="text-xs text-neutral mt-1">Sessions de chat</p>
          </GlassCardContent>
        </GlassCard>

        <GlassCard>
          <GlassCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <GlassCardTitle className="text-sm font-medium text-muted-foreground">Clés API</GlassCardTitle>
            <Key className="h-4 w-4 text-primary" />
          </GlassCardHeader>
          <GlassCardContent>
            <div className="text-3xl font-bold">{stats.apiKeys}</div>
            <p className="text-xs text-neutral mt-1">Clés configurées</p>
          </GlassCardContent>
        </GlassCard>

        <GlassCard>
          <GlassCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <GlassCardTitle className="text-sm font-medium text-muted-foreground">Utilisation</GlassCardTitle>
            <TrendingUp className="h-4 w-4 text-accent" />
          </GlassCardHeader>
          <GlassCardContent>
            <div className="text-3xl font-bold">{stats.quota.used}/{stats.quota.limit}</div>
            <p className="text-xs text-neutral mt-1">Requêtes ce mois</p>
          </GlassCardContent>
        </GlassCard>
      </div>

      {/* Quick Actions */}
      <div className="mb-10">
        <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
          Actions rapides
          <Tag variant="accent">3</Tag>
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          <Link href="/dashboard/sites">
            <GlassCard className="hover:bg-white/5 transition-all cursor-pointer group h-full">
              <GlassCardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Globe className="h-5 w-5 text-primary" />
                      Ajouter un site
                    </h3>
                    <p className="text-sm text-neutral">Connecter un site WordPress</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-neutral group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
              </GlassCardContent>
            </GlassCard>
          </Link>

          <Link href="/dashboard/admin">
            <GlassCard className="hover:bg-white/5 transition-all cursor-pointer group h-full">
              <GlassCardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Key className="h-5 w-5 text-accent" />
                      Configurer OpenAI
                    </h3>
                    <p className="text-sm text-neutral">Ajouter votre clé API</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-neutral group-hover:text-accent group-hover:translate-x-1 transition-all" />
                </div>
              </GlassCardContent>
            </GlassCard>
          </Link>

          <Link href="/dashboard/chat">
            <GlassCard className="hover:bg-white/5 transition-all cursor-pointer group h-full">
              <GlassCardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-primary" />
                      Commencer à discuter
                    </h3>
                    <p className="text-sm text-neutral">Parler avec l'assistant</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-neutral group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
              </GlassCardContent>
            </GlassCard>
          </Link>
        </div>
      </div>

      {/* Usage Progress */}
      {stats.quota.limit > 0 && (
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle className="flex items-center gap-2">
              Utilisation mensuelle
              <Tag variant={stats.quota.percentage >= 80 ? "warning" : "accent"}>
                {stats.quota.percentage.toFixed(0)}%
              </Tag>
            </GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {stats.quota.used} sur {stats.quota.limit} requêtes utilisées
                </span>
                <span className="font-medium text-foreground">{stats.quota.remaining} restantes</span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-accent to-emerald-500 transition-all rounded-full"
                  style={{ width: `${Math.min(stats.quota.percentage, 100)}%` }}
                />
              </div>
              {stats.quota.percentage >= 80 && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-warning/10 border border-warning/20">
                  <TrendingUp className="h-4 w-4 text-warning" />
                  <p className="text-sm text-warning">
                    Vous approchez de votre limite mensuelle. Envisagez de passer à un plan supérieur.
                  </p>
                </div>
              )}
            </div>
          </GlassCardContent>
        </GlassCard>
      )}
    </div>
  )
}
