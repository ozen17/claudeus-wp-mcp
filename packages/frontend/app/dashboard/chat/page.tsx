"use client"

import { useEffect, useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Send, Bot, User, Loader2, AlertCircle, Sparkles } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import Link from "next/link"

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface Site {
  id: string
  name: string
  url: string
  isHealthy: boolean
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [sites, setSites] = useState<Site[]>([])
  const [selectedSite, setSelectedSite] = useState<string>("")
  const [conversationId, setConversationId] = useState<string | undefined>()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Fetch sites
    async function fetchData() {
      try {
        const sitesData = await apiClient.getSites()
        setSites(sitesData)

        // Set default site
        if (sitesData.length > 0 && !selectedSite) {
          setSelectedSite(sitesData[0].id)
        }
      } catch (error) {
        console.error("Failed to fetch sites:", error)
      }
    }

    fetchData()
  }, [])

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Reset conversation when changing site
  useEffect(() => {
    if (selectedSite) {
      setMessages([])
      setConversationId(undefined)
    }
  }, [selectedSite])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading || !selectedSite) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput("")
    setLoading(true)

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, assistantMessage])

    try {
      await apiClient.streamChat(
        {
          message: userMessage.content,
          siteId: selectedSite,
          conversationId
        },
        (text) => {
          setMessages(prev => {
            const newMessages = [...prev]
            const lastMessage = newMessages[newMessages.length - 1]
            if (lastMessage && lastMessage.role === 'assistant') {
              lastMessage.content += text
            }
            return newMessages
          })
        }
      )
    } catch (error: any) {
      console.error("Chat error:", error)
      setMessages(prev => {
        const newMessages = [...prev]
        const lastMessage = newMessages[newMessages.length - 1]
        if (lastMessage && lastMessage.role === 'assistant') {
          lastMessage.content = "Désolé, une erreur s'est produite. " +
            (error.message || "Veuillez réessayer.")
        }
        return newMessages
      })
    } finally {
      setLoading(false)
    }
  }

  const selectedSiteData = sites.find(s => s.id === selectedSite)

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col p-6">
      {/* Header with site selector */}
      <div className="mb-4">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Sparkles className="h-8 w-8 text-blue-500" />
          Assistant WordPress IA
        </h1>
        <p className="text-gray-600 mb-4">
          Gérez votre site WordPress en langage naturel avec l'aide de l'IA
        </p>

        {sites.length > 0 ? (
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium">Site WordPress :</label>
            <select
              value={selectedSite}
              onChange={(e) => setSelectedSite(e.target.value)}
              className="bg-white border border-gray-300 rounded-md px-3 py-2 text-sm min-w-[250px]"
            >
              {sites.map((site) => (
                <option key={site.id} value={site.id}>
                  {site.name} {site.isHealthy ? '✓' : '⚠️'}
                </option>
              ))}
            </select>
            {selectedSiteData && !selectedSiteData.isHealthy && (
              <span className="text-xs text-orange-600">
                Connexion MCP non vérifiée
              </span>
            )}
          </div>
        ) : (
          <Alert className="bg-yellow-50 border-yellow-200">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              Vous devez d'abord ajouter un site WordPress.{' '}
              <Link href="/dashboard/sites" className="underline font-medium">
                Ajouter un site
              </Link>
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Messages */}
      <Card className="flex-1 overflow-hidden flex flex-col">
        <CardContent className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-center">
              <div>
                <Bot className="h-16 w-16 text-blue-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-3">Bonjour ! 👋</h3>
                <p className="text-gray-600 text-sm max-w-md mb-6">
                  Je suis votre assistant WordPress alimenté par l'IA. Parlez-moi en français,
                  comme si vous parliez à un collègue. Pas besoin de connaître des commandes techniques !
                </p>
                <div className="grid grid-cols-1 gap-2 max-w-xl mx-auto text-left">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-gray-700">
                      <strong>Exemple :</strong> "Crée-moi un article sur les tendances IA en 2025"
                    </p>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-sm text-gray-700">
                      <strong>Exemple :</strong> "Ajoute un produit T-shirt à 25€ dans ma boutique"
                    </p>
                  </div>
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                    <p className="text-sm text-gray-700">
                      <strong>Exemple :</strong> "Montre-moi les dernières commandes"
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <Bot className="h-5 w-5 text-white" />
                    </div>
                  )}

                  <div
                    className={`rounded-lg px-4 py-3 max-w-2xl ${
                      message.role === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-900 border border-gray-200'
                    }`}
                  >
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
                  </div>

                  {message.role === 'user' && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                      <User className="h-5 w-5 text-gray-600" />
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex gap-3 justify-start">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <Bot className="h-5 w-5 text-white" />
                  </div>
                  <div className="bg-gray-100 border border-gray-200 rounded-lg px-4 py-3">
                    <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </>
          )}
        </CardContent>

        {/* Input */}
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                selectedSite
                  ? "Tapez votre message en français..."
                  : "Sélectionnez un site pour commencer"
              }
              disabled={loading || !selectedSite}
              className="flex-1 bg-white"
            />
            <Button
              type="submit"
              disabled={loading || !input.trim() || !selectedSite}
              className="bg-blue-500 hover:bg-blue-600"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
          {!selectedSite && sites.length > 0 && (
            <p className="text-xs text-gray-500 mt-2">
              Sélectionnez un site WordPress ci-dessus pour commencer
            </p>
          )}
        </div>
      </Card>

      {/* Help */}
      <div className="mt-4 text-center">
        <p className="text-xs text-gray-500">
          💡 Tip: Configurez les permissions dans{' '}
          <Link href="/dashboard/policies" className="text-blue-600 hover:underline">
            Permissions & Politiques
          </Link>
          {' '}pour contrôler ce que l'assistant peut faire
        </p>
      </div>
    </div>
  )
}
