'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthContext'
import Image from 'next/image'
import { MorphingText } from '@/components/ui/morphing-text'
import { Particles } from '@/components/ui/particles'

export default function Home() {
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user) {
      router.push('/home')
    }
  }, [user, router])

  if (user) return null

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-white">
      {/* Particle Background */}
      <Particles 
        className="fixed inset-0" 
        quantity={300} 
        color="#4285F4" 
        size={1.2}
        staticity={40}
        ease={40}
      />

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 md:px-10 py-5">
        <div className="flex items-center gap-2">
          <div className="relative w-10 h-10">
            <Image src="/logo.png" alt="DSA Grinders" width={40} height={40} className="object-contain" priority />
          </div>
          <span className="text-lg font-medium text-gray-900">DSA Grinders</span>
        </div>
        <a 
          href="/login"
          className="px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-full transition-colors"
        >
          Sign in
        </a>
      </nav>

      {/* Hero - Centered */}
      <main className="relative z-10 flex flex-col items-center justify-center h-[calc(100vh-88px)] px-6 -mt-16">
        <div className="max-w-3xl mx-auto text-center">
          
          {/* Logo */}
          <div className="relative w-36 h-36 mx-auto mb-5">
            <Image src="/logo.png" alt="DSA Grinders" width={144} height={144} className="object-contain" priority />
          </div>

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full shadow-sm mb-8">
            <div className="w-2 h-2 bg-[#34A853] rounded-full animate-pulse" />
            <span className="text-sm text-gray-600">Synced with LeetCode</span>
          </div>

          {/* Static Headline - HIERARCHY principle */}
          <h1 className="text-headline">
            Track progress,
          </h1>
          
          {/* Morphing Text */}
          <MorphingText 
            texts={["together", "daily", "smarter", "faster"]} 
            className="h-16 md:h-20 text-[#9AA0A6] font-normal"
          />

          {/* Subheadline */}
          <p className="text-body max-w-lg mx-auto mt-8 mb-10">
            A simple way to stay consistent with your DSA practice. 
            Connect your LeetCode, compete with friends.
          </p>

          {/* CTA - EMPHASIS with Google Blue */}
          <div className="flex items-center justify-center gap-4">
            <a 
              href="/login"
              className="interactive-primary px-8 py-3.5 text-base font-medium rounded-full"
            >
              Get started
            </a>
            <span className="text-sm text-[#9AA0A6]">Free forever</span>
          </div>

        </div>
      </main>
    </div>
  )
}
