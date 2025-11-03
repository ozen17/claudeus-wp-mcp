"use client"

import { useEffect, useState } from "react"
import { GradientButton } from "@/components/ui/gradient-button"
import { GlassCard, GlassCardContent, GlassCardDescription, GlassCardHeader, GlassCardTitle } from "@/components/ui/glass-card"
import { Check, CreditCard, Zap } from "lucide-react"
import { apiClient } from "@/lib/api-client"

const PLANS = {
  FREE: {
    name: "Free",
    price: 0,
    maxSites: 1,
    maxRequests: 50,
    features: [
      "1 WordPress site",
      "50 AI requests/month",
      "Basic CLI access",
      "Community support"
    ]
  },
  PRO: {
    name: "Pro",
    price: 29,
    maxSites: 5,
    maxRequests: 500,
    features: [
      "5 WordPress sites",
      "500 AI requests/month",
      "Full CLI access",
      "Email support",
      "30-day history"
    ]
  },
  ENTERPRISE: {
    name: "Enterprise",
    price: 99,
    maxSites: 999,
    maxRequests: 999999,
    features: [
      "Unlimited sites",
      "Unlimited requests",
      "Priority support",
      "White-label option",
      "99.9% SLA"
    ]
  }
}

export default function SubscriptionPage() {
  const [subscription, setSubscription] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [upgrading, setUpgrading] = useState(false)

  useEffect(() => {
    fetchSubscription()
  }, [])

  const fetchSubscription = async () => {
    try {
      const data = await apiClient.getSubscription()
      setSubscription(data)
    } catch (error) {
      console.error("Failed to fetch subscription:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpgrade = async (tier: 'PRO' | 'ENTERPRISE') => {
    if (!confirm(`Upgrade to ${tier}? You will be charged $${PLANS[tier].price}/month.`)) return

    setUpgrading(true)
    try {
      await apiClient.upgradeSubscription({ tier })
      alert("Subscription upgraded successfully!")
      fetchSubscription()
    } catch (error: any) {
      alert(error.response?.data?.error?.message || "Upgrade failed")
    } finally {
      setUpgrading(false)
    }
  }

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel your subscription? It will remain active until the end of the billing period.")) return

    try {
      await apiClient.cancelSubscription()
      alert("Subscription cancelled successfully")
      fetchSubscription()
    } catch (error: any) {
      alert(error.response?.data?.error?.message || "Cancellation failed")
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  const currentTier = subscription?.tier || 'FREE'

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Subscription</h1>
        <p className="text-muted-foreground">Manage your subscription and billing</p>
      </div>

      {/* Current Plan */}
      <GlassCard className="glass-card border-border mb-8">
        <GlassCardHeader>
          <GlassCardTitle>Current Plan</GlassCardTitle>
          <GlassCardDescription>Your active subscription</GlassCardDescription>
        </GlassCardHeader>
        <GlassCardContent>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold mb-2">{PLANS[currentTier as keyof typeof PLANS].name}</h3>
              <p className="text-muted-foreground">
                ${PLANS[currentTier as keyof typeof PLANS].price}/month
              </p>
              {subscription?.currentPeriodEnd && (
                <p className="text-sm text-neutral mt-2">
                  {subscription.cancelAtPeriodEnd
                    ? `Expires on ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`
                    : `Renews on ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`
                  }
                </p>
              )}
            </div>
            {currentTier !== 'FREE' && !subscription?.cancelAtPeriodEnd && (
              <GradientButton variant="outline" onClick={handleCancel}>
                Cancel Subscription
              </GradientButton>
            )}
          </div>
        </GlassCardContent>
      </GlassCard>

      {/* Plans */}
      <div className="grid md:grid-cols-3 gap-6">
        {Object.entries(PLANS).map(([key, plan]) => {
          const isCurrentPlan = key === currentTier
          const canUpgrade = key !== 'FREE' && (
            (key === 'PRO' && currentTier === 'FREE') ||
            (key === 'ENTERPRISE' && (currentTier === 'FREE' || currentTier === 'PRO'))
          )

          return (
            <GlassCard
              key={key}
              className={`${
                isCurrentPlan
                  ? 'bg-blue-500/10 border-blue-500'
                  : 'glass-card border-border'
              }`}
            >
              <GlassCardHeader>
                {isCurrentPlan && (
                  <div className="flex items-center gap-2 text-blue-400 text-sm font-medium mb-2">
                    <Zap className="h-4 w-4" />
                    Current Plan
                  </div>
                )}
                <GlassCardTitle>{plan.name}</GlassCardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold">${plan.price}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </GlassCardHeader>
              <GlassCardContent>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                {canUpgrade && (
                  <Button
                    className="w-full"
                    onClick={() => handleUpgrade(key as 'PRO' | 'ENTERPRISE')}
                    disabled={upgrading}
                  >
                    {upgrading ? 'Processing...' : `Upgrade to ${plan.name}`}
                  </GradientButton>
                )}

                {isCurrentPlan && (
                  <GradientButton className="w-full" variant="outline" disabled>
                    Current Plan
                  </GradientButton>
                )}
              </GlassCardContent>
            </GlassCard>
          )
        })}
      </div>

      {/* Payment Info */}
      {currentTier !== 'FREE' && (
        <GlassCard className="glass-card border-border mt-8">
          <GlassCardHeader>
            <GlassCardTitle>Payment Method</GlassCardTitle>
            <GlassCardDescription>Manage your payment information</GlassCardDescription>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="flex items-center gap-3">
              <CreditCard className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="text-sm">Payment managed through Stripe</p>
                <p className="text-xs text-muted-foreground">
                  Contact support to update payment method
                </p>
              </div>
            </div>
          </GlassCardContent>
        </GlassCard>
      )}
    </div>
  )
}
