import type { Metadata, Viewport } from "next";
import "./globals.css";
import ErrorReporter from "@/components/ErrorReporter";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/components/AuthContext";
import Script from "next/script";
import SplashScreen from "@/components/SplashScreen";
import OnboardingModal from "@/components/OnboardingModal";

export const metadata: Metadata = {
  title: "DSA Grinders | Grind LeetCode Together",
  description: "Compete with friends, track your DSA progress, climb the leaderboard!",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "DSA Grinders",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/icon-152x152.png", sizes: "152x152", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#1a73e8",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* iOS Specific PWA Meta Tags */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="DSA Grinders" />

        {/* Additional PWA Meta Tags */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="DSA Grinders" />
      </head>
      <body className="antialiased bg-white text-gray-900 min-h-screen font-sans touch-manipulation">
        <SplashScreen />
        <ErrorReporter />
        <AuthProvider>
          {children}
          <OnboardingModal />
        </AuthProvider>
        <Toaster />

        {/* Service Worker Registration */}
        <Script id="sw-register" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js').then(
                  function(registration) {
                    console.log('Service Worker registered:', registration.scope);
                  },
                  function(err) {
                    console.log('Service Worker registration failed:', err);
                  }
                );
              });
            }
          `}
        </Script>
      </body>
    </html>
  );
}
