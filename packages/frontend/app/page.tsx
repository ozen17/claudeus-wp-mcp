"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Zap,
  Shield,
  Globe,
  MessageSquare,
  ArrowRight,
  Check
} from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <nav className="border-b border-gray-800">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-6 w-6 text-blue-500" />
            <span className="text-xl font-bold">Claudeus</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link href="/register">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-24 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">
            WordPress Management,
            <br />
            Powered by AI
          </h1>
          <p className="text-xl text-gray-400 mb-8">
            Manage your WordPress sites with AI assistance using your own OpenAI or Anthropic API keys.
            145 powerful tools at your fingertips.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="gap-2">
                Start Free <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="#features">
              <Button size="lg" variant="outline">
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="container mx-auto px-4 py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Everything you need</h2>
          <p className="text-gray-400">Powerful features to manage WordPress like never before</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <MessageSquare className="h-12 w-12 text-blue-500 mb-4" />
              <CardTitle>AI-Powered Chat</CardTitle>
              <CardDescription>
                Interact with your WordPress sites using natural language. Create posts, manage users, and more.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <Globe className="h-12 w-12 text-blue-500 mb-4" />
              <CardTitle>Multi-Site Management</CardTitle>
              <CardDescription>
                Manage multiple WordPress sites from a single dashboard. Switch between sites effortlessly.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <Shield className="h-12 w-12 text-blue-500 mb-4" />
              <CardTitle>Secure & Private</CardTitle>
              <CardDescription>
                Your API keys and credentials are encrypted with AES-256. We never access your data.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Pricing */}
      <section className="container mx-auto px-4 py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Simple, transparent pricing</h2>
          <p className="text-gray-400">Choose the plan that's right for you</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Free */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle>Free</CardTitle>
              <div className="mt-4">
                <span className="text-4xl font-bold">$0</span>
                <span className="text-gray-400">/month</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-blue-500" />
                  <span>1 WordPress site</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-blue-500" />
                  <span>50 AI requests/month</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-blue-500" />
                  <span>Basic CLI access</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-blue-500" />
                  <span>Community support</span>
                </li>
              </ul>
              <Button className="w-full mt-6" variant="outline">
                Get Started
              </Button>
            </CardContent>
          </Card>

          {/* Pro */}
          <Card className="bg-blue-500/10 border-blue-500 relative">
            <div className="absolute -top-4 left-0 right-0 flex justify-center">
              <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                Popular
              </span>
            </div>
            <CardHeader>
              <CardTitle>Pro</CardTitle>
              <div className="mt-4">
                <span className="text-4xl font-bold">$29</span>
                <span className="text-gray-400">/month</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-blue-500" />
                  <span>5 WordPress sites</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-blue-500" />
                  <span>500 AI requests/month</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-blue-500" />
                  <span>Full CLI access</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-blue-500" />
                  <span>Email support</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-blue-500" />
                  <span>30-day history</span>
                </li>
              </ul>
              <Button className="w-full mt-6">
                Upgrade to Pro
              </Button>
            </CardContent>
          </Card>

          {/* Enterprise */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle>Enterprise</CardTitle>
              <div className="mt-4">
                <span className="text-4xl font-bold">$99</span>
                <span className="text-gray-400">/month</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-blue-500" />
                  <span>Unlimited sites</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-blue-500" />
                  <span>Unlimited requests</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-blue-500" />
                  <span>Priority support</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-blue-500" />
                  <span>White-label option</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-blue-500" />
                  <span>99.9% SLA</span>
                </li>
              </ul>
              <Button className="w-full mt-6" variant="outline">
                Contact Sales
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-12">
        <div className="container mx-auto px-4 text-center text-gray-400">
          <p>© 2024 Claudeus. Built with ❤️ by Deusware AB</p>
        </div>
      </footer>
    </div>
  )
}
