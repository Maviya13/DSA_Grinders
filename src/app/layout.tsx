import type { Metadata } from "next";
import "./globals.css";
import ErrorReporter from "@/components/ErrorReporter";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/components/AuthContext";

export const metadata: Metadata = {
  title: "DSA Grinders | Grind LeetCode Together",
  description: "Compete with friends, track your DSA progress, climb the leaderboard!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-white text-gray-900 min-h-screen font-sans">
        <ErrorReporter />
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
