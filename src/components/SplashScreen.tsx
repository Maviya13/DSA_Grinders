'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

export default function SplashScreen() {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    // Check if this is a PWA launch
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true

    // Only show splash on PWA launch
    if (!isStandalone) {
      setIsVisible(false)
      return
    }

    // Hide splash after 1.5 seconds
    const timer = setTimeout(() => {
      setIsVisible(false)
    }, 1500)

    return () => clearTimeout(timer)
  }, [])

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 z-9999 bg-white flex flex-col items-center justify-center animate-out fade-out duration-300">
      <div className="relative w-32 h-32 mb-6 animate-in zoom-in duration-500">
        <Image
          src="/logo.png"
          alt="DSA Grinders"
          width={128}
          height={128}
          className="object-contain"
          priority
        />
      </div>

      <h1 className="text-2xl font-semibold text-gray-900 mb-2 animate-in slide-in-from-bottom-4 duration-700">
        DSA Grinders
      </h1>

      <p className="text-sm text-gray-500 animate-in slide-in-from-bottom-4 duration-700 delay-100">
        Grind LeetCode Together
      </p>

      {/* Loading indicator */}
      <div className="mt-8 flex gap-1.5">
        <div className="w-2 h-2 rounded-full bg-[#1a73e8] animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="w-2 h-2 rounded-full bg-[#1a73e8] animate-bounce" style={{ animationDelay: '150ms' }}></div>
        <div className="w-2 h-2 rounded-full bg-[#1a73e8] animate-bounce" style={{ animationDelay: '300ms' }}></div>
      </div>
    </div>
  )
}
