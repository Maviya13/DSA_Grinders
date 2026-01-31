'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthContext'
import Image from 'next/image'
import { MorphingText } from '@/components/ui/morphing-text'
import { Particles } from '@/components/ui/particles'
import { Loader2, Github, Star } from 'lucide-react'
import { AnimatedThemeToggler } from '@/components/ui/animated-theme-toggler'
import Link from 'next/link'
import { useTheme } from 'next-themes'

export default function Home() {
  const { user, signInWithGoogle, isLoading } = useAuth()
  const router = useRouter()
  const { resolvedTheme } = useTheme()

  useEffect(() => {
    if (!isLoading && user) {
      router.push('/home')
    }
  }, [user, isLoading, router])

  if (isLoading || user) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
  }

  const particleColor = resolvedTheme === 'dark' ? '#ffffff' : '#000000'

  return (
    <div className="h-screen w-screen overflow-hidden bg-background flex flex-col">
      {/* Particle Background */}
      <Particles
        className="fixed inset-0 pointer-events-none"
        quantity={60}
        color={particleColor}
        size={0.4}
        staticity={70}
        ease={70}
      />

      {/* Sticky Banner - Always Blue */}
      <div className="bg-blue-600 text-white shrink-0 py-2 relative z-50">
        <div className="flex items-center justify-center gap-4 w-full px-4">
          <Github className="w-5 h-5 text-blue-100 hidden sm:block" />
          <p className="text-sm font-semibold tracking-tight">
            Help us grow! <span className="hidden sm:inline">Star our repo on GitHub</span>
          </p>
          <a
            href="https://github.com/piyushdhoka/DSA_Grinders"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 py-1 px-3 bg-white text-blue-600 hover:bg-blue-50 rounded-full transition-colors font-bold text-xs active:scale-95"
          >
            <Star className="w-3 h-3 fill-current" />
            <span>Star</span>
          </a>
        </div>
      </div>

      {/* Navigation */}
      <nav className="shrink-0 z-50 bg-background border-b border-border">
        <div className="max-w-7xl mx-auto px-4 md:px-10 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative w-8 h-8 md:w-10 md:h-10">
              <Image src="/logo.png" alt="DSA Grinders" width={40} height={40} className="object-contain" priority />
            </div>
            <span className="text-base md:text-lg font-semibold text-foreground">DSA Grinders</span>
          </div>
          <AnimatedThemeToggler />
        </div>
      </nav>

      {/* Hero - Centered with proper flex layout */}
      <main className="flex-1 flex items-center justify-center px-4 relative z-10">
        <div className="text-center">
          {/* Logo */}
          <div className="relative w-16 h-16 md:w-20 md:h-20 mx-auto mb-3">
            <Image src="/logo.png" alt="DSA Grinders" width={80} height={80} className="object-contain" priority />
          </div>

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-muted border border-border rounded-full mb-4">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs text-muted-foreground">Synced with LeetCode</span>
          </div>

          {/* Static Headline */}
          <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-0">
            Track progress,
          </h1>

          {/* Morphing Text - has built-in h-16 md:h-24 */}
          <MorphingText
            texts={["together", "daily", "smarter", "faster"]}
            className="text-muted-foreground font-normal! text-2xl! md:text-4xl! h-12! md:h-16!"
          />

          {/* Subheadline */}
          <p className="text-sm md:text-base text-muted-foreground max-w-md mx-auto mt-2 mb-5">
            A simple way to stay consistent with your DSA practice.
            Connect your LeetCode, compete with friends.
          </p>

          {/* CTA Button */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/login"
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white text-base font-semibold rounded-full transition-colors"
            >
              Get started
            </Link>
            <span className="text-xs text-muted-foreground">Free forever</span>
          </div>
        </div>
      </main>
    </div>
  )
}
