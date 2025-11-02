"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  CheckCircle,
  Download,
  Key,
  TestTube,
  Loader2,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Info,
  Copy,
  Check,
  HelpCircle,
  Sparkles,
  XCircle,
  Image as ImageIcon,
  Video,
  ExternalLink
} from "lucide-react"
import { apiClient } from "@/lib/api-client"

const STEPS = [
  {
    id: 1,
    title: "Télécharger le plugin",
    description: "Installez le plugin MCP WordPress sur votre site",
    emoji: "📥"
  },
  {
    id: 2,
    title: "Générer le token JWT",
    description: "Créez un token d'authentification dans WordPress",
    emoji: "🔑"
  },
  {
    id: 3,
    title: "Configurer la connexion",
    description: "Connectez votre site à Claudeus",
    emoji: "⚙️"
  },
  {
    id: 4,
    title: "Tester et finaliser",
    description: "Vérifiez que tout fonctionne correctement",
    emoji: "✅"
  }
]

export default function SiteSetupWizard() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean, message: string } | null>(null)

  // Form data
  const [siteName, setSiteName] = useState("")
  const [siteUrl, setSiteUrl] = useState("")
  const [jwtToken, setJwtToken] = useState("")

  // Validation states
  const [urlValidation, setUrlValidation] = useState<{ valid: boolean, message: string } | null>(null)
  const [tokenValidation, setTokenValidation] = useState<{ valid: boolean, message: string } | null>(null)
  const [nameValidation, setNameValidation] = useState<{ valid: boolean, message: string } | null>(null)

  // Validate URL in real-time
  useEffect(() => {
    if (!siteUrl) {
      setUrlValidation(null)
      return
    }

    try {
      const url = new URL(siteUrl)
      if (url.protocol !== 'https:') {
        setUrlValidation({
          valid: false,
          message: "❌ L'URL doit commencer par https:// (pas http://)"
        })
      } else if (!url.hostname.includes('.')) {
        setUrlValidation({
          valid: false,
          message: "❌ L'URL semble incomplète (ex: https://monsite.com)"
        })
      } else {
        setUrlValidation({
          valid: true,
          message: "✅ URL valide !"
        })
      }
    } catch (error) {
      setUrlValidation({
        valid: false,
        message: "❌ Format d'URL invalide (doit commencer par https://)"
      })
    }
  }, [siteUrl])

  // Validate token in real-time
  useEffect(() => {
    if (!jwtToken) {
      setTokenValidation(null)
      return
    }

    // JWT format: xxx.yyy.zzz
    const parts = jwtToken.trim().split('.')
    if (parts.length !== 3) {
      setTokenValidation({
        valid: false,
        message: "❌ Le token JWT doit avoir 3 parties séparées par des points"
      })
    } else if (jwtToken.length < 50) {
      setTokenValidation({
        valid: false,
        message: "❌ Le token semble trop court, vérifiez que vous avez copié tout le token"
      })
    } else {
      setTokenValidation({
        valid: true,
        message: "✅ Format du token correct !"
      })
    }
  }, [jwtToken])

  // Validate name
  useEffect(() => {
    if (!siteName) {
      setNameValidation(null)
      return
    }

    if (siteName.length < 3) {
      setNameValidation({
        valid: false,
        message: "❌ Le nom doit contenir au moins 3 caractères"
      })
    } else {
      setNameValidation({
        valid: true,
        message: "✅ Nom valide !"
      })
    }
  }, [siteName])

  async function handleTestConnection() {
    if (!siteUrl || !jwtToken) return

    try {
      setLoading(true)
      setTestResult(null)

      const result = await apiClient.testMcpConnection(siteUrl, jwtToken)

      setTestResult({
        success: true,
        message: "🎉 Bravo ! Connexion réussie ! Votre site WordPress est prêt à être utilisé."
      })
    } catch (error: any) {
      console.error("Connection test failed:", error)
      setTestResult({
        success: false,
        message: error.response?.data?.message || "❌ Échec de la connexion. Vérifiez que le plugin MCP est bien activé et que le token est correct."
      })
    } finally {
      setLoading(false)
    }
  }

  async function handleFinish() {
    if (!siteName || !siteUrl || !jwtToken) return

    try {
      setLoading(true)

      await apiClient.createSite({
        name: siteName,
        url: siteUrl,
        mcpJwtToken: jwtToken,
        authType: 'mcp'
      })

      // Redirect to sites page
      router.push('/dashboard/sites?success=true')
    } catch (error: any) {
      console.error("Failed to create site:", error)
      setTestResult({
        success: false,
        message: error.response?.data?.message || "Erreur lors de l'ajout du site"
      })
    } finally {
      setLoading(false)
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const canProceedToStep2 = currentStep >= 2
  const canProceedToStep3 = currentStep >= 3
  const canProceedToStep4 = currentStep >= 4 || (nameValidation?.valid && urlValidation?.valid && tokenValidation?.valid)

  return (
    <TooltipProvider>
      <div className="max-w-5xl mx-auto space-y-6 py-6">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Sparkles className="h-8 w-8 text-blue-500" />
            <h1 className="text-3xl font-bold">Assistant de configuration</h1>
          </div>
          <p className="text-gray-600">
            Suivez ces étapes simples pour connecter votre site WordPress à Claudeus
          </p>
          <p className="text-sm text-blue-600 mt-2">
            ⏱️ Temps estimé : 5-10 minutes
          </p>
        </div>

        {/* Progress Steps */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              {STEPS.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-colors ${
                        currentStep > step.id
                          ? 'bg-green-500 border-green-500'
                          : currentStep === step.id
                          ? 'bg-blue-500 border-blue-500'
                          : 'bg-gray-100 border-gray-300'
                      }`}
                    >
                      {currentStep > step.id ? (
                        <CheckCircle className="h-6 w-6 text-white" />
                      ) : (
                        <span className="text-2xl">
                          {step.emoji}
                        </span>
                      )}
                    </div>
                    <div className="mt-3 text-center max-w-[120px]">
                      <p className={`text-sm font-medium ${
                        currentStep >= step.id ? 'text-gray-900' : 'text-gray-500'
                      }`}>
                        {step.title}
                      </p>
                    </div>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div
                      className={`w-16 h-0.5 mx-2 mb-16 transition-colors ${
                        currentStep > step.id ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Step Content */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">{STEPS[currentStep - 1].emoji}</span>
                  Étape {currentStep}/{STEPS.length}: {STEPS[currentStep - 1].title}
                </CardTitle>
                <CardDescription>{STEPS[currentStep - 1].description}</CardDescription>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <HelpCircle className="h-5 w-5 text-gray-400" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Besoin d'aide ? Suivez les instructions ci-dessous</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: Download Plugin */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <Alert className="bg-blue-50 border-blue-200">
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    Le plugin MCP WordPress permet à Claudeus de communiquer avec votre site de manière sécurisée.
                    C'est <strong>gratuit</strong> et <strong>facile</strong> à installer !
                  </AlertDescription>
                </Alert>

                {/* Video Tutorial */}
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Video className="h-6 w-6 text-purple-600 flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-purple-900 mb-2">📺 Vidéo tutorielle (2 min)</h4>
                      <p className="text-sm text-purple-800 mb-3">
                        Regardez cette courte vidéo pour voir comment installer le plugin étape par étape
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-white"
                        onClick={() => window.open('https://www.youtube.com/watch?v=EXAMPLE', '_blank')}
                      >
                        <Video className="h-4 w-4 mr-2" />
                        Voir la vidéo
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold mb-4 flex items-center gap-2">
                      <ImageIcon className="h-5 w-5 text-blue-500" />
                      📥 Installation du plugin
                    </h4>

                    <div className="space-y-4">
                      {/* Step 1.1 */}
                      <div className="flex items-start gap-3 bg-white rounded-lg p-3 border border-gray-200">
                        <span className="font-mono bg-blue-500 text-white rounded-full w-7 h-7 flex items-center justify-center flex-shrink-0 text-sm font-bold">
                          1
                        </span>
                        <div className="flex-1">
                          <p className="font-medium mb-2">Téléchargez le plugin WordPress MCP</p>
                          <Button
                            className="bg-blue-500 hover:bg-blue-600"
                            onClick={() => window.open('https://github.com/YOUR_REPO/wordpress-mcp-plugin/releases/latest', '_blank')}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Télécharger le plugin (.zip)
                          </Button>
                          <p className="text-xs text-gray-500 mt-2">
                            💾 Le fichier téléchargé s'appellera quelque chose comme "wordpress-mcp-plugin.zip"
                          </p>
                        </div>
                      </div>

                      {/* Step 1.2 */}
                      <div className="flex items-start gap-3 bg-white rounded-lg p-3 border border-gray-200">
                        <span className="font-mono bg-blue-500 text-white rounded-full w-7 h-7 flex items-center justify-center flex-shrink-0 text-sm font-bold">
                          2
                        </span>
                        <div className="flex-1">
                          <p className="font-medium mb-2">Connectez-vous à votre WordPress</p>
                          <p className="text-sm text-gray-600">
                            Accédez à votre tableau de bord WordPress en tant qu'<strong>administrateur</strong>
                          </p>
                          <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                            <strong>💡 Astuce:</strong> L'URL de votre tableau de bord est généralement <code>https://votre-site.com/wp-admin</code>
                          </div>
                        </div>
                      </div>

                      {/* Step 1.3 */}
                      <div className="flex items-start gap-3 bg-white rounded-lg p-3 border border-gray-200">
                        <span className="font-mono bg-blue-500 text-white rounded-full w-7 h-7 flex items-center justify-center flex-shrink-0 text-sm font-bold">
                          3
                        </span>
                        <div className="flex-1">
                          <p className="font-medium mb-2">Installez le plugin</p>
                          <ol className="text-sm text-gray-600 space-y-1 ml-4 list-decimal">
                            <li>Dans le menu de gauche, cliquez sur <strong>"Extensions"</strong></li>
                            <li>Cliquez sur <strong>"Ajouter"</strong> en haut</li>
                            <li>Cliquez sur le bouton <strong>"Téléverser une extension"</strong></li>
                            <li>Cliquez sur <strong>"Choisir un fichier"</strong> et sélectionnez le fichier .zip téléchargé</li>
                            <li>Cliquez sur <strong>"Installer maintenant"</strong></li>
                          </ol>
                          {/* Visual diagram */}
                          <div className="mt-3 p-3 bg-blue-50 border-2 border-dashed border-blue-300 rounded text-center">
                            <p className="text-xs text-blue-700 mb-2">📸 Voici où trouver le menu Extensions :</p>
                            <div className="bg-white p-2 rounded border border-blue-200">
                              <pre className="text-xs text-left">
{`┌─ WordPress ──────────┐
│ 🏠 Tableau de bord   │
│ 📝 Articles          │
│ 📄 Pages             │
│ 🎨 Apparence         │
│ 🔌 Extensions ◀━━━━  │  Cliquez ici!
│    ├─ Extensions     │
│    └─ Ajouter ◀━━━   │  Puis ici!
│ 👥 Utilisateurs      │
└──────────────────────┘`}
                              </pre>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Step 1.4 */}
                      <div className="flex items-start gap-3 bg-white rounded-lg p-3 border border-gray-200">
                        <span className="font-mono bg-blue-500 text-white rounded-full w-7 h-7 flex items-center justify-center flex-shrink-0 text-sm font-bold">
                          4
                        </span>
                        <div className="flex-1">
                          <p className="font-medium mb-2">Activez le plugin</p>
                          <p className="text-sm text-gray-600">
                            Une fois installé, cliquez sur le bouton bleu <strong>"Activer"</strong>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      <strong>✅ Comment savoir si c'est réussi ?</strong> Un nouveau menu <strong>"MCP Settings"</strong> apparaîtra
                      dans votre menu WordPress sous "Réglages". C'est là que vous irez à l'étape suivante !
                    </AlertDescription>
                  </Alert>
                </div>
              </div>
            )}

            {/* Step 2: Generate JWT */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <Alert className="bg-blue-50 border-blue-200">
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    Le token JWT est une <strong>clé d'authentification sécurisée</strong> qui permet à Claudeus d'accéder à votre WordPress.
                    C'est comme un <strong>mot de passe spécial</strong> que seul Claudeus utilisera.
                  </AlertDescription>
                </Alert>

                {/* FAQ Box */}
                <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
                  <h4 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                    <HelpCircle className="h-5 w-5" />
                    ❓ C'est quoi un token JWT ?
                  </h4>
                  <p className="text-sm text-purple-800 mb-2">
                    <strong>JWT</strong> signifie "JSON Web Token". C'est une longue suite de caractères qui prouve à WordPress
                    que Claudeus a le droit de gérer votre site.
                  </p>
                  <div className="bg-white p-2 rounded border border-purple-200 mt-2">
                    <p className="text-xs text-gray-600">
                      <strong>Exemple de token :</strong>
                    </p>
                    <code className="text-xs break-all text-purple-700">
                      eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4ifQ.SflKxwRJSMeKKF2QT
                    </code>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold mb-4 flex items-center gap-2">
                      <Key className="h-5 w-5 text-blue-500" />
                      🔑 Génération du token JWT
                    </h4>

                    <div className="space-y-4">
                      {/* Step 2.1 */}
                      <div className="flex items-start gap-3 bg-white rounded-lg p-3 border border-gray-200">
                        <span className="font-mono bg-blue-500 text-white rounded-full w-7 h-7 flex items-center justify-center flex-shrink-0 text-sm font-bold">
                          1
                        </span>
                        <div className="flex-1">
                          <p className="font-medium mb-2">Accédez aux réglages MCP</p>
                          <p className="text-sm text-gray-600">
                            Dans votre WordPress, allez dans <strong>Réglages → MCP Settings</strong>
                          </p>
                          <div className="mt-3 p-3 bg-blue-50 border-2 border-dashed border-blue-300 rounded">
                            <p className="text-xs text-blue-700 mb-2">📸 Chemin à suivre :</p>
                            <div className="bg-white p-2 rounded border border-blue-200">
                              <pre className="text-xs text-left">
{`┌─ WordPress ──────────┐
│ ...                  │
│ ⚙️  Réglages ◀━━━━━   │  Cliquez ici d'abord
│    ├─ Général        │
│    ├─ Lecture        │
│    └─ MCP Settings ◀ │  Puis ici!
└──────────────────────┘`}
                              </pre>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Step 2.2 */}
                      <div className="flex items-start gap-3 bg-white rounded-lg p-3 border border-gray-200">
                        <span className="font-mono bg-blue-500 text-white rounded-full w-7 h-7 flex items-center justify-center flex-shrink-0 text-sm font-bold">
                          2
                        </span>
                        <div className="flex-1">
                          <p className="font-medium mb-2">Générez un nouveau token</p>
                          <p className="text-sm text-gray-600 mb-2">
                            Vous verrez une page avec un gros bouton bleu <strong>"Generate New JWT Token"</strong>. Cliquez dessus !
                          </p>
                          <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                            <strong>⚠️ Note:</strong> Si vous avez déjà un token affiché, vous pouvez l'utiliser directement sans en générer un nouveau.
                          </div>
                        </div>
                      </div>

                      {/* Step 2.3 */}
                      <div className="flex items-start gap-3 bg-white rounded-lg p-3 border border-gray-200">
                        <span className="font-mono bg-blue-500 text-white rounded-full w-7 h-7 flex items-center justify-center flex-shrink-0 text-sm font-bold">
                          3
                        </span>
                        <div className="flex-1">
                          <p className="font-medium mb-2">Copiez le token</p>
                          <p className="text-sm text-gray-600 mb-2">
                            Un long texte apparaîtra à l'écran. Cliquez sur <strong>"Copy Token"</strong> pour le copier.
                          </p>
                          <div className="mt-2 p-3 bg-red-50 border-2 border-red-200 rounded">
                            <p className="text-sm text-red-800 font-semibold">
                              🚨 TRÈS IMPORTANT
                            </p>
                            <p className="text-xs text-red-700 mt-1">
                              Ce token ne sera affiché qu'<strong>UNE SEULE FOIS</strong> ! Copiez-le bien avant de fermer la page.
                              Gardez-le en sécurité (ne le partagez avec personne).
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      <strong>✅ Parfait !</strong> Une fois que vous avez copié le token, passez à l'étape suivante
                      pour le coller dans Claudeus. Gardez votre onglet WordPress ouvert au cas où !
                    </AlertDescription>
                  </Alert>
                </div>
              </div>
            )}

            {/* Step 3: Configure Connection */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <Alert className="bg-blue-50 border-blue-200">
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    Maintenant, configurons la connexion entre Claudeus et votre site WordPress.
                    Remplissez les champs ci-dessous avec attention.
                  </AlertDescription>
                </Alert>

                <div className="space-y-5">
                  {/* Site Name */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Label htmlFor="siteName">Nom du site</Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 text-gray-400 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">
                            Choisissez un nom simple pour identifier votre site.
                            Par exemple : "Mon Blog", "Boutique en ligne", etc.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Input
                      id="siteName"
                      value={siteName}
                      onChange={(e) => setSiteName(e.target.value)}
                      placeholder="Ex: Mon Site WordPress"
                      className="text-base"
                    />
                    <div className="flex items-start gap-2 mt-2">
                      {nameValidation && (
                        <p className={`text-sm ${nameValidation.valid ? 'text-green-600' : 'text-red-600'}`}>
                          {nameValidation.message}
                        </p>
                      )}
                      {!siteName && (
                        <p className="text-xs text-gray-500">
                          💡 Ce nom est juste pour vous aider à reconnaître votre site dans Claudeus
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Site URL */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Label htmlFor="siteUrl">URL du site WordPress</Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 text-gray-400 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">
                            L'adresse complète de votre site web.
                            Doit commencer par https:// (sécurisé).
                            <br /><br />
                            <strong>Exemples:</strong><br />
                            ✅ https://monsite.com<br />
                            ✅ https://www.monsite.fr<br />
                            ❌ http://monsite.com (pas sécurisé)<br />
                            ❌ monsite.com (manque https://)
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Input
                      id="siteUrl"
                      value={siteUrl}
                      onChange={(e) => setSiteUrl(e.target.value)}
                      placeholder="https://monsite.com"
                      className="text-base font-mono"
                    />
                    <div className="mt-2">
                      {urlValidation && (
                        <p className={`text-sm font-medium ${urlValidation.valid ? 'text-green-600' : 'text-red-600'}`}>
                          {urlValidation.message}
                        </p>
                      )}
                      {!siteUrl && (
                        <p className="text-xs text-gray-500">
                          💡 Commencez par taper "https://" puis le nom de votre site
                        </p>
                      )}
                    </div>
                  </div>

                  {/* JWT Token */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Label htmlFor="jwtToken">Token JWT</Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 text-gray-400 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">
                            Le token que vous avez copié à l'étape précédente.
                            C'est une longue suite de caractères avec des points.
                            <br /><br />
                            <strong>Conseil:</strong> Faites Ctrl+V (ou Cmd+V sur Mac)
                            pour coller le token copié.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <div className="relative">
                      <Input
                        id="jwtToken"
                        type="password"
                        value={jwtToken}
                        onChange={(e) => setJwtToken(e.target.value)}
                        placeholder="Collez votre token JWT ici (Ctrl+V)"
                        className="font-mono text-sm pr-10"
                      />
                      {jwtToken && (
                        <button
                          type="button"
                          onClick={() => copyToClipboard(jwtToken)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
                        >
                          {copied ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4 text-gray-400" />
                          )}
                        </button>
                      )}
                    </div>
                    <div className="mt-2">
                      {tokenValidation && (
                        <p className={`text-sm font-medium ${tokenValidation.valid ? 'text-green-600' : 'text-red-600'}`}>
                          {tokenValidation.message}
                        </p>
                      )}
                      {!jwtToken && (
                        <p className="text-xs text-gray-500">
                          💡 Faites un clic droit dans le champ et choisissez "Coller", ou utilisez Ctrl+V (Cmd+V sur Mac)
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* All valid message */}
                {nameValidation?.valid && urlValidation?.valid && tokenValidation?.valid && (
                  <Alert className="bg-green-50 border-green-200">
                    <Sparkles className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      <strong>🎉 Super !</strong> Tous les champs sont correctement remplis !
                      Vous pouvez passer à l'étape suivante pour tester la connexion.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {/* Step 4: Test and Finish */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <Alert className="bg-blue-50 border-blue-200">
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    Dernière étape ! Testons la connexion pour vérifier que tout fonctionne parfaitement.
                  </AlertDescription>
                </Alert>

                {/* Configuration Summary */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-blue-500" />
                    📋 Récapitulatif de votre configuration
                  </h4>
                  <div className="bg-white rounded p-3 space-y-2 text-sm border border-gray-200">
                    <div className="flex items-start gap-2">
                      <span className="font-semibold w-24">Nom:</span>
                      <span className="text-gray-700">{siteName || "Non défini"}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-semibold w-24">URL:</span>
                      <span className="text-gray-700 break-all">{siteUrl || "Non défini"}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-semibold w-24">Token JWT:</span>
                      <span className="text-gray-700">{jwtToken ? '••••••••••••••' : "Non défini"}</span>
                    </div>
                  </div>
                </div>

                {/* Test Button */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-lg p-5">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <TestTube className="h-5 w-5 text-blue-600" />
                    🧪 Test de connexion
                  </h4>
                  <p className="text-sm text-gray-700 mb-4">
                    Cliquez sur le bouton ci-dessous pour vérifier que Claudeus peut bien se connecter à votre WordPress.
                  </p>
                  <Button
                    onClick={handleTestConnection}
                    disabled={!siteUrl || !jwtToken || loading}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-base h-12"
                    size="lg"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Test en cours, veuillez patienter...
                      </>
                    ) : (
                      <>
                        <TestTube className="h-5 w-5 mr-2" />
                        Tester la connexion maintenant
                      </>
                    )}
                  </Button>
                </div>

                {/* Test Result */}
                {testResult && (
                  <Alert className={testResult.success ? 'bg-green-50 border-green-200 border-2' : 'bg-red-50 border-red-200 border-2'}>
                    {testResult.success ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    <AlertDescription className={testResult.success ? 'text-green-800' : 'text-red-800'}>
                      <p className="font-semibold text-base">{testResult.message}</p>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Next Steps */}
                {testResult?.success && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-5">
                    <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2 text-lg">
                      <Sparkles className="h-6 w-6" />
                      🎉 Félicitations ! Votre site est connecté !
                    </h4>
                    <p className="text-sm text-green-800 mb-3">
                      Vous pouvez maintenant profiter de toutes les fonctionnalités de Claudeus :
                    </p>
                    <ul className="list-none space-y-2 text-sm text-green-800 mb-4">
                      <li className="flex items-start gap-2">
                        <span className="text-green-600">💬</span>
                        <span><strong>Discuter avec l'assistant IA</strong> - Demandez-lui de gérer votre WordPress en langage naturel</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-600">🛡️</span>
                        <span><strong>Configurer les permissions</strong> - Décidez ce que l'assistant peut faire sur votre site</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-600">📊</span>
                        <span><strong>Consulter l'historique</strong> - Voyez toutes les actions effectuées sur votre site</span>
                      </li>
                    </ul>
                    <div className="bg-white rounded p-3 border border-green-300">
                      <p className="text-xs text-green-700">
                        <strong>💡 Conseil pour débuter :</strong> Rendez-vous dans la section "Chat" et essayez de demander :
                        <em>"Montre-moi mes derniers articles"</em> ou <em>"Combien de produits j'ai en boutique ?"</em>
                      </p>
                    </div>
                  </div>
                )}

                {/* Troubleshooting */}
                {testResult && !testResult.success && (
                  <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4">
                    <h4 className="font-semibold text-orange-900 mb-3 flex items-center gap-2">
                      <HelpCircle className="h-5 w-5" />
                      🔧 Problème de connexion ? Voici comment le résoudre :
                    </h4>
                    <ul className="space-y-2 text-sm text-orange-800">
                      <li className="flex items-start gap-2">
                        <span>1.</span>
                        <span>Vérifiez que le <strong>plugin MCP est bien activé</strong> dans WordPress (Extensions → Extensions installées)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span>2.</span>
                        <span>Vérifiez que l'<strong>URL commence bien par https://</strong> (et pas http://)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span>3.</span>
                        <span>Vérifiez que vous avez copié le <strong>token JWT complet</strong> (il doit être très long !)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span>4.</span>
                        <span>Essayez de <strong>générer un nouveau token</strong> dans WordPress et recommencez</span>
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1 || loading}
            size="lg"
          >
            <ChevronLeft className="h-5 w-5 mr-2" />
            Étape précédente
          </Button>

          <div className="text-sm text-gray-500">
            Étape {currentStep} sur {STEPS.length}
          </div>

          {currentStep < 4 ? (
            <Button
              onClick={() => setCurrentStep(Math.min(4, currentStep + 1))}
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-600"
              size="lg"
            >
              Étape suivante
              <ChevronRight className="h-5 w-5 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleFinish}
              disabled={!testResult?.success || loading}
              className="bg-green-500 hover:bg-green-600"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Finalisation en cours...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5 mr-2" />
                  Terminer la configuration
                </>
              )}
            </Button>
          )}
        </div>

        {/* Help Footer */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <HelpCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">Besoin d'aide ?</p>
                <p>
                  Si vous rencontrez des difficultés, consultez notre{" "}
                  <Button
                    variant="link"
                    className="text-blue-600 underline h-auto p-0"
                    onClick={() => router.push('/dashboard/faq')}
                  >
                    FAQ
                  </Button>
                  {" "}ou contactez le support à{" "}
                  <a href="mailto:support@claudeus.com" className="underline font-semibold">
                    support@claudeus.com
                  </a>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  )
}
