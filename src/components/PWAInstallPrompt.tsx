'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { X, Download, Smartphone } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    // Check if running as PWA
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true

    setIsStandalone(isInStandaloneMode)

    // Don't show prompt if already installed
    if (isInStandaloneMode) return

    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    setIsIOS(iOS)

    // Listen for beforeinstallprompt event (Android/Desktop)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      
      // Show prompt after user has been on site for 30 seconds
      setTimeout(() => {
        const hasSeenPrompt = localStorage.getItem('pwa-install-prompt-dismissed')
        if (!hasSeenPrompt) {
          setShowPrompt(true)
        }
      }, 30000)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // For iOS, show after 30 seconds if not dismissed before
    if (iOS) {
      setTimeout(() => {
        const hasSeenPrompt = localStorage.getItem('pwa-install-prompt-dismissed')
        if (!hasSeenPrompt) {
          setShowPrompt(true)
        }
      }, 30000)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    // Show the install prompt
    deferredPrompt.prompt()

    // Wait for the user to respond
    const { outcome } = await deferredPrompt.userChoice
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt')
    }

    // Clear the deferredPrompt
    setDeferredPrompt(null)
    setShowPrompt(false)
    localStorage.setItem('pwa-install-prompt-dismissed', 'true')
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem('pwa-install-prompt-dismissed', 'true')
  }

  // Don't render if already installed
  if (isStandalone || !showPrompt) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 animate-in slide-in-from-bottom-5 md:left-auto md:right-4 md:max-w-sm">
      <div className="relative bg-white border border-gray-200 rounded-2xl shadow-lg p-4 card-elevated">
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Content */}
        <div className="flex items-start gap-3 pr-6">
          <div className="shrink-0 w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
            <Smartphone className="h-6 w-6 text-[#1a73e8]" />
          </div>
          
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 text-sm mb-1">
              Install DSA Grinders
            </h3>
            <p className="text-xs text-gray-600 mb-3">
              {isIOS 
                ? 'Install our app for a better experience. Tap Share → Add to Home Screen'
                : 'Get quick access and work offline. Install our app in one tap!'
              }
            </p>

            {!isIOS && deferredPrompt && (
              <Button
                onClick={handleInstallClick}
                className="w-full h-9 bg-[#1a73e8] hover:bg-[#1557b0] text-white rounded-full text-sm font-medium"
              >
                <Download className="h-4 w-4 mr-2" />
                Install App
              </Button>
            )}

            {isIOS && (
              <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded-lg">
                <strong>How to install:</strong>
                <ol className="mt-1 ml-4 space-y-0.5 list-decimal">
                  <li>Tap the Share button (⬆️)</li>
                  <li>Scroll and tap "Add to Home Screen"</li>
                  <li>Tap "Add"</li>
                </ol>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
