"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  CheckCircle,
  Circle,
  Download,
  Upload,
  Key,
  TestTube,
  Loader2,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Info,
  ExternalLink,
  Copy,
  Check
} from "lucide-react"
import { apiClient } from "@/lib/api-client"

const STEPS = [
  {
    id: 1,
    title: "Télécharger le plugin",
    description: "Installez le plugin MCP WordPress sur votre site"
  },
  {
    id: 2,
    title: "Générer le token JWT",
    description: "Créez un token d'authentification dans WordPress"
  },
  {
    id: 3,
    title: "Configurer la connexion",
    description: "Connectez votre site à Claudeus"
  },
  {
    id: 4,
    title: "Tester et finaliser",
    description: "Vérifiez que tout fonctionne correctement"
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

  async function handleTestConnection() {
    if (!siteUrl || !jwtToken) return

    try {
      setLoading(true)
      setTestResult(null)

      const result = await apiClient.testMcpConnection(siteUrl, jwtToken)

      setTestResult({
        success: true,
        message: "Connexion réussie! Votre site WordPress est prêt."
      })
    } catch (error: any) {
      console.error("Connection test failed:", error)
      setTestResult({
        success: false,
        message: error.response?.data?.message || "Échec de la connexion. Vérifiez l'URL et le token."
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
      router.push('/dashboard/sites')
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

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Assistant de configuration</h1>
        <p className="text-gray-600 mt-2">
          Suivez ces étapes pour connecter votre site WordPress à Claudeus
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
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
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
                      <span
                        className={`text-sm font-semibold ${
                          currentStep === step.id ? 'text-white' : 'text-gray-500'
                        }`}
                      >
                        {step.id}
                      </span>
                    )}
                  </div>
                  <div className="mt-2 text-center">
                    <p className={`text-sm font-medium ${
                      currentStep >= step.id ? 'text-gray-900' : 'text-gray-500'
                    }`}>
                      {step.title}
                    </p>
                  </div>
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={`w-20 h-0.5 mx-4 mb-12 transition-colors ${
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
          <CardTitle>Étape {currentStep}: {STEPS[currentStep - 1].title}</CardTitle>
          <CardDescription>{STEPS[currentStep - 1].description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1: Download Plugin */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <Alert className="bg-blue-50 border-blue-200">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  Le plugin MCP WordPress permet à Claudeus de communiquer avec votre site de manière sécurisée.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold mb-3">📥 Installation du plugin</h4>

                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-3">
                      <span className="font-mono bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs">
                        1
                      </span>
                      <div>
                        <p className="font-medium">Téléchargez le plugin</p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() => window.open('https://github.com/YOUR_REPO/wordpress-mcp-plugin/releases/latest', '_blank')}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Télécharger le plugin (.zip)
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <span className="font-mono bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs">
                        2
                      </span>
                      <div>
                        <p className="font-medium">Connectez-vous à votre WordPress</p>
                        <p className="text-gray-600 mt-1">
                          Accédez à votre tableau de bord WordPress en tant qu'administrateur
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <span className="font-mono bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs">
                        3
                      </span>
                      <div>
                        <p className="font-medium">Installez le plugin</p>
                        <p className="text-gray-600 mt-1">
                          Allez dans <strong>Extensions → Ajouter</strong>, cliquez sur <strong>Téléverser une extension</strong>,
                          sélectionnez le fichier .zip téléchargé, puis cliquez sur <strong>Installer maintenant</strong>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <span className="font-mono bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs">
                        4
                      </span>
                      <div>
                        <p className="font-medium">Activez le plugin</p>
                        <p className="text-gray-600 mt-1">
                          Cliquez sur <strong>Activer</strong> après l'installation
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    Une fois le plugin activé, un nouveau menu <strong>"MCP Settings"</strong> apparaîtra dans votre tableau de bord WordPress.
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
                  Le token JWT est une clé d'authentification sécurisée qui permet à Claudeus d'accéder à votre WordPress.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold mb-3">🔑 Génération du token JWT</h4>

                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-3">
                      <span className="font-mono bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs">
                        1
                      </span>
                      <div>
                        <p className="font-medium">Accédez aux réglages MCP</p>
                        <p className="text-gray-600 mt-1">
                          Dans votre WordPress, allez dans <strong>Réglages → MCP Settings</strong>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <span className="font-mono bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs">
                        2
                      </span>
                      <div>
                        <p className="font-medium">Générez un nouveau token</p>
                        <p className="text-gray-600 mt-1">
                          Cliquez sur le bouton <strong>"Generate New JWT Token"</strong>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <span className="font-mono bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs">
                        3
                      </span>
                      <div>
                        <p className="font-medium">Copiez le token</p>
                        <p className="text-gray-600 mt-1">
                          Un token unique sera généré. Cliquez sur <strong>"Copy Token"</strong> pour le copier dans votre presse-papier.
                        </p>
                        <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                          ⚠️ <strong>Important:</strong> Conservez ce token en sécurité. Il ne sera affiché qu'une seule fois!
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-4">
                  <p className="text-sm font-medium mb-2">Exemple de token JWT:</p>
                  <div className="bg-white border border-gray-200 rounded p-3 font-mono text-xs break-all text-gray-600">
                    eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Configure Connection */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <Alert className="bg-blue-50 border-blue-200">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  Configurez maintenant la connexion entre Claudeus et votre site WordPress.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="siteName">Nom du site</Label>
                  <Input
                    id="siteName"
                    value={siteName}
                    onChange={(e) => setSiteName(e.target.value)}
                    placeholder="Mon Site WordPress"
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Nom d'affichage pour identifier votre site
                  </p>
                </div>

                <div>
                  <Label htmlFor="siteUrl">URL du site WordPress</Label>
                  <Input
                    id="siteUrl"
                    value={siteUrl}
                    onChange={(e) => setSiteUrl(e.target.value)}
                    placeholder="https://monsite.com"
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    URL complète de votre site WordPress (avec https://)
                  </p>
                </div>

                <div>
                  <Label htmlFor="jwtToken">Token JWT</Label>
                  <div className="relative mt-1">
                    <Input
                      id="jwtToken"
                      type="password"
                      value={jwtToken}
                      onChange={(e) => setJwtToken(e.target.value)}
                      placeholder="Collez votre token JWT ici"
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
                  <p className="text-xs text-gray-500 mt-1">
                    Token JWT généré dans l'étape précédente
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Test and Finish */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <Alert className="bg-blue-50 border-blue-200">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  Testons maintenant la connexion à votre site WordPress.
                </AlertDescription>
              </Alert>

              {/* Configuration Summary */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2">
                <h4 className="font-semibold">Récapitulatif de la configuration</h4>
                <div className="space-y-1 text-sm">
                  <p><strong>Nom:</strong> {siteName || "Non défini"}</p>
                  <p><strong>URL:</strong> {siteUrl || "Non défini"}</p>
                  <p><strong>Token JWT:</strong> {jwtToken ? '••••••••' : "Non défini"}</p>
                </div>
              </div>

              {/* Test Button */}
              <Button
                onClick={handleTestConnection}
                disabled={!siteUrl || !jwtToken || loading}
                className="w-full bg-blue-500 hover:bg-blue-600"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Test en cours...
                  </>
                ) : (
                  <>
                    <TestTube className="h-4 w-4 mr-2" />
                    Tester la connexion
                  </>
                )}
              </Button>

              {/* Test Result */}
              {testResult && (
                <Alert className={testResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}>
                  {testResult.success ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  )}
                  <AlertDescription className={testResult.success ? 'text-green-800' : 'text-red-800'}>
                    {testResult.message}
                  </AlertDescription>
                </Alert>
              )}

              {/* Next Steps */}
              {testResult?.success && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold text-green-900 mb-2">🎉 Félicitations!</h4>
                  <p className="text-sm text-green-800">
                    Votre site WordPress est maintenant connecté à Claudeus. Vous pouvez:
                  </p>
                  <ul className="list-disc list-inside text-sm text-green-800 mt-2 space-y-1">
                    <li>Discuter avec l'assistant IA dans la section Chat</li>
                    <li>Configurer les permissions dans Permissions & Politiques</li>
                    <li>Consulter l'historique des actions dans le Journal</li>
                  </ul>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
          disabled={currentStep === 1 || loading}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Précédent
        </Button>

        {currentStep < 4 ? (
          <Button
            onClick={() => setCurrentStep(Math.min(4, currentStep + 1))}
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-600"
          >
            Suivant
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button
            onClick={handleFinish}
            disabled={!testResult?.success || loading}
            className="bg-green-500 hover:bg-green-600"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Finalisation...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Terminer
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  )
}
