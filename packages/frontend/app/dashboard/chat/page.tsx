"use client"

import { useEffect, useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Send, Bot, User, Loader2, AlertCircle, Sparkles, MessageSquare, ShoppingCart, FileText, Package, Users as UsersIcon, HelpCircle } from "lucide-react"
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

// Questions pré-remplies pour aider les utilisateurs
const EXAMPLE_QUESTIONS = [
  {
    icon: FileText,
    color: "blue",
    question: "Montre-moi mes 5 derniers articles publiés",
    category: "Articles"
  },
  {
    icon: ShoppingCart,
    color: "green",
    question: "Combien de commandes j'ai reçues cette semaine ?",
    category: "WooCommerce"
  },
  {
    icon: Package,
    color: "purple",
    question: "Ajoute un produit T-shirt blanc à 29€ dans ma boutique",
    category: "Produits"
  },
  {
    icon: UsersIcon,
    color: "orange",
    question: "Liste-moi les nouveaux utilisateurs inscrits ce mois",
    category: "Utilisateurs"
  },
  {
    icon: FileText,
    color: "pink",
    question: "Crée-moi un article sur les tendances e-commerce en 2025",
    category: "Création"
  },
  {
    icon: MessageSquare,
    color: "indigo",
    question: "Y a-t-il des commentaires en attente de modération ?",
    category: "Commentaires"
  }
]

const COLOR_CLASSES = {
  blue: "bg-blue-50 border-blue-200 hover:bg-blue-100 text-blue-700",
  green: "bg-green-50 border-green-200 hover:bg-green-100 text-green-700",
  purple: "bg-purple-50 border-purple-200 hover:bg-purple-100 text-purple-700",
  orange: "bg-orange-50 border-orange-200 hover:bg-orange-100 text-orange-700",
  pink: "bg-pink-50 border-pink-200 hover:bg-pink-100 text-pink-700",
  indigo: "bg-indigo-50 border-indigo-200 hover:bg-indigo-100 text-indigo-700"
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

  const handleSubmit = async (e?: React.FormEvent, customMessage?: string) => {
    if (e) e.preventDefault()

    const messageToSend = customMessage || input
    if (!messageToSend.trim() || loading || !selectedSite) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageToSend,
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
          lastMessage.content = "❌ Désolé, une erreur s'est produite. " +
            (error.message || "Veuillez réessayer. Si le problème persiste, vérifiez que votre site WordPress est bien connecté.")
        }
        return newMessages
      })
    } finally {
      setLoading(false)
    }
  }

  const handleExampleClick = (question: string) => {
    setInput(question)
    // Optionally auto-send
    // handleSubmit(undefined, question)
  }

  const selectedSiteData = sites.find(s => s.id === selectedSite)

  return (
    <TooltipProvider>
      <div className="h-[calc(100vh-4rem)] flex flex-col p-6">
        {/* Header with site selector */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
                <Sparkles className="h-8 w-8 text-blue-500" />
                Assistant WordPress IA
              </h1>
              <p className="text-gray-600">
                Gérez votre site WordPress en langage naturel avec l'aide de l'IA
              </p>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon">
                  <HelpCircle className="h-5 w-5 text-gray-400" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">
                  Parlez naturellement à l'assistant comme si vous parliez à un collègue.
                  Pas besoin de connaître des commandes techniques !
                </p>
              </TooltipContent>
            </Tooltip>
          </div>

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
                  ⚠️ Connexion MCP non vérifiée
                </span>
              )}
            </div>
          ) : (
            <Alert className="bg-yellow-50 border-yellow-200">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                Vous devez d'abord ajouter un site WordPress.{' '}
                <Link href="/dashboard/sites/setup" className="underline font-medium">
                  Utiliser l'assistant de configuration
                </Link>
                {' '}ou{' '}
                <Link href="/dashboard/sites" className="underline font-medium">
                  ajouter manuellement
                </Link>
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Messages */}
        <Card className="flex-1 overflow-hidden flex flex-col">
          <CardContent className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <div className="max-w-4xl w-full">
                  <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Bot className="h-10 w-10 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold mb-3">Bonjour ! 👋</h3>
                    <p className="text-gray-600 max-w-2xl mx-auto mb-2">
                      Je suis votre assistant WordPress alimenté par l'IA. Parlez-moi en français,
                      comme si vous parliez à un collègue.
                    </p>
                    <p className="text-sm text-blue-600 font-medium">
                      ✨ Pas besoin de connaître des commandes techniques !
                    </p>
                  </div>

                  {/* Example Questions */}
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-lg p-6">
                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-blue-500" />
                      💡 Questions d'exemple - Cliquez pour essayer !
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {EXAMPLE_QUESTIONS.map((example, index) => {
                        const Icon = example.icon
                        return (
                          <button
                            key={index}
                            onClick={() => handleExampleClick(example.question)}
                            disabled={!selectedSite}
                            className={`text-left p-4 rounded-lg border-2 transition-all ${
                              COLOR_CLASSES[example.color as keyof typeof COLOR_CLASSES]
                            } ${!selectedSite ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                          >
                            <div className="flex items-start gap-3">
                              <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" />
                              <div className="flex-1">
                                <p className="text-xs font-semibold mb-1 opacity-75">
                                  {example.category}
                                </p>
                                <p className="text-sm font-medium">
                                  "{example.question}"
                                </p>
                              </div>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                    <p className="text-xs text-gray-600 mt-4 text-center">
                      👆 Cliquez sur une question pour la poser instantanément, ou écrivez votre propre message ci-dessous !
                    </p>
                  </div>

                  {/* Tips */}
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                    <div className="p-4 bg-white rounded-lg border border-gray-200">
                      <p className="text-2xl mb-2">🗣️</p>
                      <p className="text-sm font-medium text-gray-900 mb-1">Langage naturel</p>
                      <p className="text-xs text-gray-600">Parlez comme à un humain</p>
                    </div>
                    <div className="p-4 bg-white rounded-lg border border-gray-200">
                      <p className="text-2xl mb-2">⚡</p>
                      <p className="text-sm font-medium text-gray-900 mb-1">Réponses rapides</p>
                      <p className="text-xs text-gray-600">L'IA agit immédiatement</p>
                    </div>
                    <div className="p-4 bg-white rounded-lg border border-gray-200">
                      <p className="text-2xl mb-2">🔒</p>
                      <p className="text-sm font-medium text-gray-900 mb-1">Sécurisé</p>
                      <p className="text-xs text-gray-600">Permissions configurables</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {messages.map((message, index) => (
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
                    <div className="bg-gray-100 border border-gray-200 rounded-lg px-4 py-3 flex items-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                      <span className="text-sm text-gray-600">L'assistant réfléchit...</span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </>
            )}
          </CardContent>

          {/* Input */}
          <div className="border-t border-gray-200 p-4 bg-gray-50">
            {messages.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                <p className="text-xs text-gray-500 w-full mb-1">💡 Suggestions rapides :</p>
                {['Résume les dernières activités', 'Quels sont mes produits les plus vendus ?', 'Crée un brouillon d\'article'].map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => handleExampleClick(suggestion)}
                    disabled={loading}
                    className="text-xs bg-white border border-gray-300 text-gray-700 px-3 py-1 rounded-full hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  selectedSite
                    ? "Tapez votre message en français... (ex: Montre-moi mes derniers articles)"
                    : "Sélectionnez un site pour commencer"
                }
                disabled={loading || !selectedSite}
                className="flex-1 bg-white"
              />
              <Tooltip>
                <TooltipTrigger asChild>
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
                </TooltipTrigger>
                <TooltipContent>
                  <p>Envoyer le message (ou appuyez sur Entrée)</p>
                </TooltipContent>
              </Tooltip>
            </form>
            {!selectedSite && sites.length > 0 && (
              <p className="text-xs text-orange-600 mt-2 font-medium">
                ⚠️ Sélectionnez un site WordPress ci-dessus pour commencer à discuter
              </p>
            )}
            {selectedSite && !loading && (
              <p className="text-xs text-gray-500 mt-2">
                ✨ <strong>Astuce :</strong> Vous pouvez me demander n'importe quoi en langage naturel !
              </p>
            )}
          </div>
        </Card>

        {/* Help */}
        <div className="mt-4 flex items-center justify-center gap-6 text-xs text-gray-500">
          <div>
            💡 Configurez les{' '}
            <Link href="/dashboard/policies" className="text-blue-600 hover:underline font-medium">
              permissions
            </Link>
          </div>
          <div>
            📊 Consultez le{' '}
            <Link href="/dashboard/audit" className="text-blue-600 hover:underline font-medium">
              journal d'activité
            </Link>
          </div>
          <div>
            ❓{' '}
            <Link href="/dashboard/faq" className="text-blue-600 hover:underline font-medium">
              Besoin d'aide ?
            </Link>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
