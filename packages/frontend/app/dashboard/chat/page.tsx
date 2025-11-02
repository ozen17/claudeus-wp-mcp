"use client"

import { useEffect, useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Send, Bot, User, Loader2 } from "lucide-react"
import { apiClient } from "@/lib/api-client"

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface Site {
  id: string
  name: string
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [sites, setSites] = useState<Site[]>([])
  const [selectedSite, setSelectedSite] = useState<string>("")
  const [apiKeys, setApiKeys] = useState<any[]>([])
  const [selectedProvider, setSelectedProvider] = useState<'OPENAI' | 'ANTHROPIC'>('ANTHROPIC')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Fetch sites and API keys
    async function fetchData() {
      try {
        const [sitesData, keysData] = await Promise.all([
          apiClient.getSites(),
          apiClient.getApiKeys()
        ])
        setSites(sitesData)
        setApiKeys(keysData)

        // Set default site
        if (sitesData.length > 0) {
          setSelectedSite(sitesData[0].id)
        }

        // Set default provider based on available keys
        if (keysData.length > 0) {
          setSelectedProvider(keysData[0].provider)
        }
      } catch (error) {
        console.error("Failed to fetch data:", error)
      }
    }

    fetchData()
  }, [])

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    if (apiKeys.length === 0) {
      alert("Please add an API key first in the API Keys section")
      return
    }

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
          message: input,
          siteId: selectedSite || undefined,
          provider: selectedProvider
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
          lastMessage.content = "Sorry, there was an error processing your request. " +
            (error.message || "Please try again.")
        }
        return newMessages
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      <div className="mb-4">
        <h1 className="text-3xl font-bold mb-2">AI Assistant</h1>
        <div className="flex gap-4">
          {sites.length > 0 && (
            <select
              value={selectedSite}
              onChange={(e) => setSelectedSite(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm"
            >
              <option value="">No site selected</option>
              {sites.map((site) => (
                <option key={site.id} value={site.id}>
                  {site.name}
                </option>
              ))}
            </select>
          )}

          {apiKeys.length > 0 && (
            <select
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value as 'OPENAI' | 'ANTHROPIC')}
              className="bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm"
            >
              {apiKeys.map((key) => (
                <option key={key.id} value={key.provider}>
                  {key.provider}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Messages */}
      <Card className="flex-1 bg-gray-900 border-gray-800 overflow-hidden flex flex-col">
        <CardContent className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-center">
              <div>
                <Bot className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Start a conversation</h3>
                <p className="text-gray-400 text-sm max-w-sm">
                  Ask me anything about your WordPress site. I can help you create posts,
                  manage users, and much more.
                </p>
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
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                      <Bot className="h-5 w-5" />
                    </div>
                  )}

                  <div
                    className={`rounded-lg px-4 py-2 max-w-2xl ${
                      message.role === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-800 text-gray-100'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>

                  {message.role === 'user' && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                      <User className="h-5 w-5" />
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex gap-3 justify-start">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                    <Bot className="h-5 w-5" />
                  </div>
                  <div className="bg-gray-800 rounded-lg px-4 py-2">
                    <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </>
          )}
        </CardContent>

        {/* Input */}
        <div className="border-t border-gray-800 p-4">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              disabled={loading || apiKeys.length === 0}
              className="flex-1"
            />
            <Button type="submit" disabled={loading || !input.trim() || apiKeys.length === 0}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
          {apiKeys.length === 0 && (
            <p className="text-xs text-yellow-500 mt-2">
              Please add an API key in the API Keys section to start chatting
            </p>
          )}
        </div>
      </Card>
    </div>
  )
}
