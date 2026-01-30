"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/components/AuthContext";
import Image from "next/image";
import { motion } from "framer-motion";

export default function AuthPage() {
    const { user, signInWithGoogle, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [isRedirecting, setIsRedirecting] = useState(false);

    // Redirect logged-in users to home
    useEffect(() => {
        if (!authLoading && user) {
            router.push('/home');
        }
    }, [user, authLoading, router]);

    const handleGoogleSignIn = async () => {
        setIsRedirecting(true);
        try {
            await signInWithGoogle();
        } catch (error) {
            console.error("Sign in error:", error);
            setIsRedirecting(false);
        }
    };

    // Show loading while checking auth or if user is logged in (redirecting)
    if (authLoading || user) {
        return (
            <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#fafafa] flex flex-col items-center justify-center p-4 font-sans selection:bg-blue-100">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="w-full max-w-[420px]"
            >
                {/* Logo Section */}
                <div className="flex flex-col items-center justify-center mb-10 text-center">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                        className="relative w-24 h-24 mb-4"
                    >
                        <Image src="/logo.png" alt="DSA Grinders" width={96} height={96} className="object-contain" priority />
                    </motion.div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                        DSA <span className="text-blue-600 font-extrabold">Grinders</span>
                    </h1>
                    <p className="text-gray-500 mt-2 text-sm font-medium">
                        Log in to track your LeetCode progress and compete.
                    </p>
                </div>

                <div className="bg-white rounded-[32px] border border-gray-100 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                    <div className="space-y-6">
                        <div className="text-center space-y-2">
                            <h2 className="text-xl font-semibold text-gray-800">Welcome Back</h2>
                            <p className="text-xs text-gray-400">Please sign in with your Google account</p>
                        </div>

                        {/* Primary Button: Choose Account */}
                        <Button
                            onClick={() => handleGoogleSignIn()}
                            disabled={isRedirecting || authLoading}
                            className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white border-0 rounded-2xl shadow-md transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-70 group"
                        >
                            {isRedirecting || authLoading ? (
                                <Loader2 className="h-5 w-5 animate-spin text-white" />
                            ) : (
                                <>
                                    <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                                        <path fill="#FFFFFF" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                        <path fill="#FFFFFF" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path fill="#FFFFFF" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                                        <path fill="#FFFFFF" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                    </svg>
                                    <span className="font-semibold text-base">Continue with Google</span>
                                </>
                            )}
                        </Button>


                        <div className="flex items-center gap-4 py-2">
                            <div className="h-px bg-gray-100 flex-1"></div>
                            <span className="text-[10px] uppercase font-bold text-gray-300 tracking-widest">Secure Login</span>
                            <div className="h-px bg-gray-100 flex-1"></div>
                        </div>

                        <p className="text-[11px] text-gray-400 text-center px-4 leading-relaxed">
                            By continuing, you agree to our <span className="text-gray-600 font-medium hover:underline cursor-pointer">Terms of Service</span> and <span className="text-gray-600 font-medium hover:underline cursor-pointer">Privacy Policy</span>.
                        </p>
                    </div>
                </div>

                <div className="mt-12 flex justify-center gap-8 text-[11px] font-bold text-gray-300 uppercase tracking-widest">
                    <span className="hover:text-gray-500 cursor-pointer transition-colors">Help</span>
                    <span className="hover:text-gray-500 cursor-pointer transition-colors">Community</span>
                    <span className="hover:text-gray-500 cursor-pointer transition-colors">Github</span>
                </div>
            </motion.div>
        </div>
    );
}
