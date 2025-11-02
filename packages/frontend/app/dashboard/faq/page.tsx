"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Search,
  Lightbulb,
  Shield,
  Zap,
  MessageSquare,
  Settings,
  ExternalLink
} from "lucide-react"

interface FAQItem {
  question: string
  answer: string
  category: string
  icon: any
}

const FAQ_ITEMS: FAQItem[] = [
  {
    category: "Démarrage",
    icon: Zap,
    question: "Comment connecter mon site WordPress à Claudeus ?",
    answer: "C'est très simple ! Suivez notre assistant de configuration guidée en cliquant sur 'Sites' puis 'Configuration guidée'. En 4 étapes simples, vous allez : 1) Télécharger et installer le plugin MCP WordPress gratuit, 2) Générer un token JWT dans votre WordPress, 3) Configurer la connexion dans Claudeus, 4) Tester que tout fonctionne. L'assistant vous guide pas à pas avec des explications claires."
  },
  {
    category: "Démarrage",
    icon: Zap,
    question: "C'est quoi un token JWT ? C'est compliqué ?",
    answer: "Pas du tout ! Un token JWT, c'est simplement un \"mot de passe spécial\" qui permet à Claudeus de se connecter à votre WordPress en toute sécurité. Vous n'avez pas besoin de comprendre comment ça marche techniquement. Le plugin MCP génère ce token automatiquement pour vous en un clic. Il suffit de le copier-coller dans Claudeus."
  },
  {
    category: "Démarrage",
    icon: Zap,
    question: "Dois-je savoir programmer pour utiliser Claudeus ?",
    answer: "Absolument pas ! C'est justement tout l'intérêt de Claudeus. Vous parlez à l'assistant en langage naturel, en français, comme si vous parliez à un collègue. Par exemple : 'Montre-moi mes derniers articles' ou 'Ajoute un produit T-shirt à 25€'. Aucune connaissance technique n'est requise !"
  },
  {
    category: "Utilisation",
    icon: MessageSquare,
    question: "Quels types de questions puis-je poser à l'assistant ?",
    answer: "Vous pouvez demander n'importe quoi concernant votre site WordPress ! Exemples : consulter vos articles/produits, créer du contenu, gérer vos commandes WooCommerce, voir vos statistiques, modérer les commentaires, gérer vos utilisateurs, etc. Parlez naturellement comme si vous parliez à un employé qui gère votre site."
  },
  {
    category: "Utilisation",
    icon: MessageSquare,
    question: "L'assistant peut-il créer des articles pour moi ?",
    answer: "Oui ! Demandez-lui simplement : 'Crée-moi un article sur [sujet]' ou 'Rédige un article de blog sur les tendances 2025'. L'assistant va générer le contenu et le publier (ou en faire un brouillon selon vos permissions). Vous pouvez ensuite le modifier dans votre WordPress si besoin."
  },
  {
    category: "Utilisation",
    icon: MessageSquare,
    question: "Comment voir ce que l'assistant a fait sur mon site ?",
    answer: "Rendez-vous dans la section 'Journal' (Audit) du dashboard. Vous y verrez toutes les actions effectuées par l'assistant : création d'articles, ajout de produits, modifications, etc. Chaque action est enregistrée avec la date, l'heure et les détails."
  },
  {
    category: "Sécurité",
    icon: Shield,
    question: "Est-ce que mes données sont en sécurité ?",
    answer: "Oui, totalement ! Toutes vos données sensibles (tokens, clés API) sont chiffrées avec l'algorithme AES-256 (niveau militaire) avant d'être stockées. De plus, VOUS décidez ce que l'assistant peut faire grâce aux permissions que vous configurez. L'assistant ne peut rien faire que vous n'avez pas autorisé."
  },
  {
    category: "Sécurité",
    icon: Shield,
    question: "Comment contrôler ce que l'assistant peut faire ?",
    answer: "Allez dans 'Permissions & Politiques' dans le menu. Vous y trouverez 7 catégories simples (Articles, WooCommerce, Médias, etc.). Pour chaque catégorie, vous pouvez activer/désactiver les permissions et définir des limites (exemple : max 10 publications par jour, produits entre 5€ et 100€ uniquement, etc.)."
  },
  {
    category: "Sécurité",
    icon: Shield,
    question: "L'assistant peut-il supprimer tout mon site par erreur ?",
    answer: "Non ! Par défaut, les actions de suppression nécessitent une confirmation. De plus, vous pouvez désactiver complètement les permissions de suppression si vous préférez. L'assistant est conçu pour être prudent et vous demande toujours confirmation pour les actions importantes."
  },
  {
    category: "Problèmes courants",
    icon: Settings,
    question: "L'assistant me dit qu'il ne peut pas se connecter à mon WordPress",
    answer: "Vérifiez ces points : 1) Le plugin MCP WordPress est bien installé ET activé (Extensions → Extensions installées). 2) L'URL de votre site commence par https:// (pas http://). 3) Vous avez bien copié le token JWT au complet (il est très long !). 4) Votre site WordPress est bien accessible en ligne (pas en local). Si le problème persiste, générez un nouveau token JWT."
  },
  {
    category: "Problèmes courants",
    icon: Settings,
    question: "Je n'arrive pas à générer le token JWT dans WordPress",
    answer: "Assurez-vous que : 1) Le plugin MCP est bien activé (vérifiez dans Extensions → Extensions installées). 2) Vous êtes connecté en tant qu'Administrateur WordPress (pas Éditeur ou autre rôle). 3) Vous allez bien dans Réglages → MCP Settings (pas un autre menu). Si le menu MCP Settings n'apparaît pas, réinstallez le plugin."
  },
  {
    category: "Problèmes courants",
    icon: Settings,
    question: "L'assistant répond lentement ou ne répond pas",
    answer: "Plusieurs raisons possibles : 1) Votre site WordPress est lent ou surchargé. 2) Vous avez fait beaucoup de demandes en peu de temps (limite API). 3) Problème temporaire avec OpenAI. Attendez quelques secondes et réessayez. Si le problème persiste, vérifiez l'état de votre connexion dans 'Sites'."
  },
  {
    category: "Abonnement",
    icon: Lightbulb,
    question: "Dois-je payer pour utiliser Claudeus ?",
    answer: "Claudeus propose plusieurs formules : une version gratuite avec des fonctionnalités limitées, et des abonnements PRO et ENTERPRISE pour plus de sites et d'actions. Consultez la page 'Abonnement' dans le menu pour voir les détails de chaque formule et choisir celle qui vous convient."
  },
  {
    category: "Abonnement",
    icon: Lightbulb,
    question: "Quelle est la différence entre les différents abonnements ?",
    answer: "FREE : 1 site, 50 actions/mois. PRO : 5 sites, 500 actions/mois, support prioritaire. ENTERPRISE : sites illimités, actions illimitées, support dédié 24/7, fonctionnalités avancées. Consultez la page 'Abonnement' pour tous les détails et choisir votre formule."
  }
]

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set())

  const toggleItem = (index: number) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedItems(newExpanded)
  }

  // Filter FAQ items based on search
  const filteredItems = FAQ_ITEMS.filter(item =>
    item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Group by category
  const categories = Array.from(new Set(FAQ_ITEMS.map(item => item.category)))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-3">
          <HelpCircle className="h-10 w-10 text-blue-500" />
          <h1 className="text-4xl font-bold">Foire aux Questions (FAQ)</h1>
        </div>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
          Trouvez rapidement des réponses à vos questions sur Claudeus
        </p>
      </div>

      {/* Search */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher une question... (ex: token JWT, connexion, sécurité)"
              className="pl-10 bg-white text-base h-12"
            />
          </div>
          <p className="text-xs text-gray-600 mt-2 text-center">
            💡 Tapez quelques mots-clés pour trouver la réponse rapidement
          </p>
        </CardContent>
      </Card>

      {/* Quick Help */}
      <Alert className="bg-green-50 border-green-200">
        <Lightbulb className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          <strong>🚀 Vous débutez ?</strong> Commencez par les questions de la catégorie "Démarrage" ci-dessous,
          puis suivez notre{' '}
          <a href="/dashboard/sites/setup" className="underline font-semibold">
            assistant de configuration guidée
          </a>
          .
        </AlertDescription>
      </Alert>

      {/* FAQ Items by Category */}
      {searchQuery ? (
        // Search results
        <div className="space-y-3">
          {filteredItems.length > 0 ? (
            <>
              <p className="text-sm text-gray-600">
                {filteredItems.length} résultat{filteredItems.length > 1 ? 's' : ''} trouvé{filteredItems.length > 1 ? 's' : ''}
              </p>
              {filteredItems.map((item, index) => {
                const Icon = item.icon
                const globalIndex = FAQ_ITEMS.indexOf(item)
                const isExpanded = expandedItems.has(globalIndex)

                return (
                  <Card key={index} className="hover:shadow-md transition-shadow">
                    <CardHeader
                      className="cursor-pointer"
                      onClick={() => toggleItem(globalIndex)}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          <Icon className="h-5 w-5 text-blue-500 flex-shrink-0 mt-1" />
                          <div>
                            <div className="text-xs text-gray-500 mb-1">{item.category}</div>
                            <CardTitle className="text-base">{item.question}</CardTitle>
                          </div>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="h-5 w-5 text-gray-400 flex-shrink-0" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0" />
                        )}
                      </div>
                    </CardHeader>
                    {isExpanded && (
                      <CardContent>
                        <p className="text-gray-700 leading-relaxed">{item.answer}</p>
                      </CardContent>
                    )}
                  </Card>
                )
              })}
            </>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <HelpCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  Aucun résultat trouvé pour "{searchQuery}"
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Essayez avec d'autres mots-clés ou parcourez les catégories ci-dessous
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        // Category view
        <div className="space-y-8">
          {categories.map((category) => {
            const categoryItems = FAQ_ITEMS.filter(item => item.category === category)
            const Icon = categoryItems[0].icon

            return (
              <div key={category}>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Icon className="h-6 w-6 text-blue-500" />
                  {category}
                </h2>
                <div className="space-y-3">
                  {categoryItems.map((item, index) => {
                    const globalIndex = FAQ_ITEMS.indexOf(item)
                    const isExpanded = expandedItems.has(globalIndex)
                    const ItemIcon = item.icon

                    return (
                      <Card key={index} className="hover:shadow-md transition-shadow">
                        <CardHeader
                          className="cursor-pointer"
                          onClick={() => toggleItem(globalIndex)}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3 flex-1">
                              <ItemIcon className="h-5 w-5 text-blue-500 flex-shrink-0 mt-1" />
                              <CardTitle className="text-base">{item.question}</CardTitle>
                            </div>
                            {isExpanded ? (
                              <ChevronUp className="h-5 w-5 text-gray-400 flex-shrink-0" />
                            ) : (
                              <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0" />
                            )}
                          </div>
                        </CardHeader>
                        {isExpanded && (
                          <CardContent>
                            <p className="text-gray-700 leading-relaxed">{item.answer}</p>
                          </CardContent>
                        )}
                      </Card>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Contact Support */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-blue-500" />
            Vous ne trouvez pas votre réponse ?
          </CardTitle>
          <CardDescription className="text-gray-700">
            Notre équipe support est là pour vous aider !
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="bg-blue-100 rounded-full p-2">
              <span className="text-xl">📧</span>
            </div>
            <div>
              <p className="font-semibold">Email</p>
              <a href="mailto:support@claudeus.com" className="text-blue-600 hover:underline">
                support@claudeus.com
              </a>
              <p className="text-xs text-gray-600 mt-1">Réponse sous 24h</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="bg-blue-100 rounded-full p-2">
              <span className="text-xl">📚</span>
            </div>
            <div>
              <p className="font-semibold">Documentation</p>
              <a
                href="https://docs.claudeus.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline flex items-center gap-1"
              >
                Consulter la documentation complète
                <ExternalLink className="h-3 w-3" />
              </a>
              <p className="text-xs text-gray-600 mt-1">Guides détaillés et tutoriels</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="bg-blue-100 rounded-full p-2">
              <span className="text-xl">💬</span>
            </div>
            <div>
              <p className="font-semibold">Chat en direct</p>
              <p className="text-sm text-gray-700">
                Disponible pour les abonnés PRO et ENTERPRISE
              </p>
              <p className="text-xs text-gray-600 mt-1">Lun-Ven 9h-18h (heure de Paris)</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
