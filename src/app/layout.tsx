import type { Metadata, Viewport } from "next";
import "./globals.css";
import ErrorReporter from "@/components/ErrorReporter";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/components/AuthContext";
import Script from "next/script";
import SplashScreen from "@/components/SplashScreen";
import OnboardingModal from "@/components/OnboardingModal";

export const metadata: Metadata = {
  metadataBase: new URL('https://dsa-grinders.vercel.app'),
  title: "DSA Grinders | Track LeetCode & Compete with Friends",
  description: "The ultimate DSA tracking tool. Compete with friends, track your LeetCode progress, and stay motivated with automated roasts!",
  keywords: ["DSA", "LeetCode", "Data Structures", "Algorithms", "Coding Competition", "Placement Preparation"],
  authors: [{ name: "DSA Grinders Team" }],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "DSA Grinders",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/logo.ico", type: "image/x-icon" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/icon-152x152.png", sizes: "152x152", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
  },
  openGraph: {
    title: "DSA Grinders | Track LeetCode & Compete with Friends",
    description: "Compete with friends, track your DSA progress, and stay motivated!",
    url: "https://dsa-grinders.vercel.app",
    siteName: "DSA Grinders",
    images: [
      {
        url: "/logo.png",
        width: 800,
        height: 800,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "DSA Grinders | Track LeetCode & Compete with Friends",
    description: "Compete with friends, track your DSA progress, and stay motivated!",
    images: ["/logo.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#ef4444",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
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
