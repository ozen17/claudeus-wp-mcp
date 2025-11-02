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
  ScrollText
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, adminOnly: false },
  { name: "Sites", href: "/dashboard/sites", icon: Globe, adminOnly: false },
  { name: "Chat", href: "/dashboard/chat", icon: MessageSquare, adminOnly: false },
  { name: "Permissions", href: "/dashboard/policies", icon: Shield, adminOnly: false },
  { name: "Journal", href: "/dashboard/audit", icon: ScrollText, adminOnly: false },
  { name: "Subscription", href: "/dashboard/subscription", icon: CreditCard, adminOnly: false },
  { name: "Admin", href: "/dashboard/admin", icon: Shield, adminOnly: true },
  { name: "Settings", href: "/dashboard/settings", icon: Settings, adminOnly: false },
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
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
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
    <div className="min-h-screen bg-black text-white">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 border-r border-gray-800 bg-black">
        {/* Logo */}
        <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-800">
          <Zap className="h-6 w-6 text-blue-500" />
          <span className="text-xl font-bold">Claudeus</span>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {navigation
            .filter((item) => !item.adminOnly || user?.isAdmin)
            .map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon

              return (
                <Link key={item.href} href={item.href}>
                  <div
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      isActive
                        ? "bg-gray-800 text-white"
                        : "text-gray-400 hover:text-white hover:bg-gray-800/50"
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
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-800">
          <div className="flex items-center justify-between mb-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.name || user.email}</p>
              <p className="text-xs text-gray-400 truncate">{user.subscription?.tier || "Free"}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start text-gray-400 hover:text-white"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-64 p-8">
        {children}
      </main>
    </div>
  )
}
