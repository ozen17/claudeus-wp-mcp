"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
        <p className="text-gray-400">Manage your subscription and billing</p>
      </div>

      {/* Current Plan */}
      <Card className="bg-gray-900 border-gray-800 mb-8">
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
          <CardDescription>Your active subscription</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold mb-2">{PLANS[currentTier as keyof typeof PLANS].name}</h3>
              <p className="text-gray-400">
                ${PLANS[currentTier as keyof typeof PLANS].price}/month
              </p>
              {subscription?.currentPeriodEnd && (
                <p className="text-sm text-gray-500 mt-2">
                  {subscription.cancelAtPeriodEnd
                    ? `Expires on ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`
                    : `Renews on ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`
                  }
                </p>
              )}
            </div>
            {currentTier !== 'FREE' && !subscription?.cancelAtPeriodEnd && (
              <Button variant="outline" onClick={handleCancel}>
                Cancel Subscription
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Plans */}
      <div className="grid md:grid-cols-3 gap-6">
        {Object.entries(PLANS).map(([key, plan]) => {
          const isCurrentPlan = key === currentTier
          const canUpgrade = key !== 'FREE' && (
            (key === 'PRO' && currentTier === 'FREE') ||
            (key === 'ENTERPRISE' && (currentTier === 'FREE' || currentTier === 'PRO'))
          )

          return (
            <Card
              key={key}
              className={`${
                isCurrentPlan
                  ? 'bg-blue-500/10 border-blue-500'
                  : 'bg-gray-900 border-gray-800'
              }`}
            >
              <CardHeader>
                {isCurrentPlan && (
                  <div className="flex items-center gap-2 text-blue-400 text-sm font-medium mb-2">
                    <Zap className="h-4 w-4" />
                    Current Plan
                  </div>
                )}
                <CardTitle>{plan.name}</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold">${plan.price}</span>
                  <span className="text-gray-400">/month</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-blue-500 flex-shrink-0" />
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
                  </Button>
                )}

                {isCurrentPlan && (
                  <Button className="w-full" variant="outline" disabled>
                    Current Plan
                  </Button>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Payment Info */}
      {currentTier !== 'FREE' && (
        <Card className="bg-gray-900 border-gray-800 mt-8">
          <CardHeader>
            <CardTitle>Payment Method</CardTitle>
            <CardDescription>Manage your payment information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <CreditCard className="h-8 w-8 text-gray-400" />
              <div>
                <p className="text-sm">Payment managed through Stripe</p>
                <p className="text-xs text-gray-400">
                  Contact support to update payment method
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
