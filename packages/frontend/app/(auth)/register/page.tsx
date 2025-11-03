"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { GradientButton } from "@/components/ui/gradient-button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { GlassCard, GlassCardContent, GlassCardDescription, GlassCardHeader, GlassCardTitle } from "@/components/ui/glass-card"
import { AlertCircle } from "lucide-react"
import { apiClient } from "@/lib/api-client"

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    if (password.length < 8) {
      setError("Password must be at least 8 characters")
      setLoading(false)
      return
    }

    try {
      await apiClient.register({ email, password, name })
      router.push("/dashboard")
    } catch (err: any) {
      setError(err.response?.data?.error?.message || "Registration failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-2.5 mb-12">
          <div className="w-3 h-3 rounded-full bg-accent shadow-lg shadow-accent/60" />
          <span className="text-xl font-semibold uppercase tracking-wider">Claudeus</span>
        </Link>

        {/* Register Card */}
        <GlassCard>
          <GlassCardHeader className="text-center">
            <GlassCardTitle className="text-2xl">Créer un compte</GlassCardTitle>
            <GlassCardDescription>Commencez gratuitement avec Claudeus</GlassCardDescription>
          </GlassCardHeader>
          <GlassCardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">Nom</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Votre nom"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                  className="glass-card border-border/50 focus:border-primary"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="votre@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="glass-card border-border/50 focus:border-primary"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="glass-card border-border/50 focus:border-primary"
                />
                <p className="text-xs text-neutral">
                  Minimum 8 caractères
                </p>
              </div>

              <GradientButton type="submit" className="w-full" disabled={loading}>
                {loading ? "Création du compte..." : "Créer mon compte"}
              </GradientButton>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              Vous avez déjà un compte ?{" "}
              <Link href="/login" className="text-primary hover:text-primary/80 transition font-medium">
                Se connecter
              </Link>
            </div>
          </GlassCardContent>
        </GlassCard>

        <p className="text-center text-sm text-neutral mt-8">
          En créant un compte, vous acceptez nos Conditions d'utilisation et notre Politique de confidentialité.
        </p>
      </div>
    </div>
  )
}
