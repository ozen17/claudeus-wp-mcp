"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/hooks/use-auth"
import {
  LayoutDashboard,
  Globe,
  MessageSquare,
  Shield,
  Settings,
  LogOut,
  Zap,
  CreditCard,
  ScrollText,
  HelpCircle
} from "lucide-react"
import { GradientButton } from "@/components/ui/gradient-button"
import { Tag } from "@/components/ui/tag"
import { cn } from "@/lib/utils"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, adminOnly: false },
  { name: "Sites", href: "/dashboard/sites", icon: Globe, adminOnly: false },
  { name: "Assistant", href: "/dashboard/chat", icon: MessageSquare, adminOnly: false },
  { name: "Permissions", href: "/dashboard/policies", icon: Shield, adminOnly: false },
  { name: "Journal", href: "/dashboard/audit", icon: ScrollText, adminOnly: false },
  { name: "FAQ", href: "/dashboard/faq", icon: HelpCircle, adminOnly: false },
  { name: "Subscription", href: "/dashboard/subscription", icon: CreditCard, adminOnly: false },
  { name: "Admin", href: "/dashboard/admin", icon: Settings, adminOnly: true },
]

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, loading, fetchUser, logout } = useAuth()

  useEffect(() => {
    fetchUser()
  }, [])

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const handleLogout = async () => {
    await logout()
    router.push("/login")
  }

  return (
    <div className="min-h-screen">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 glass-header z-10">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-6 py-5 border-b border-border">
          <div className="w-2.5 h-2.5 rounded-full bg-accent shadow-lg shadow-accent/60" />
          <span className="text-sm font-semibold uppercase tracking-wider">Claudeus</span>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1.5">
          {navigation
            .filter((item) => !item.adminOnly || user?.isAdmin)
            .map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon

              return (
                <Link key={item.href} href={item.href}>
                  <div
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                      isActive
                        ? "bg-primary/10 text-primary shadow-sm"
                        : "text-neutral hover:text-foreground hover:bg-white/5"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.name}
                  </div>
                </Link>
              )
            })}
        </nav>

        {/* User section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
          <div className="glass-card p-3 mb-3 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-purple-700 flex items-center justify-center text-xs font-bold">
                {(user.name || user.email).charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.name || user.email}</p>
                <Tag variant={user.subscription?.tier === "Pro" ? "accent" : "secondary"} className="text-xs mt-1">
                  {user.subscription?.tier || "Free"}
                </Tag>
              </div>
            </div>
          </div>
          <GradientButton
            variant="ghost"
            className="w-full justify-start"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Déconnexion
          </GradientButton>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-64 p-8">
        <div className="max-w-[1100px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
