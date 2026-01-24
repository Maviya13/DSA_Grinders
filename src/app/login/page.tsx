"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowRight } from "lucide-react";
import { useAuth } from "@/components/AuthContext";
import Image from "next/image";

export default function AuthPage() {
    const { login, register } = useAuth();
    const [isLogin, setIsLogin] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [leetcode, setLeetcode] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            if (isLogin) {
                await login(email, password);
            } else {
                await register(name, email, password, leetcode);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4 font-sans text-[#202124]">
            
            <div className="w-full max-w-[400px] animate-in fade-in zoom-in-95 duration-500">
                {/* Minimal Logo */}
                <div className="flex flex-col items-center justify-center mb-2">
                    <div className="relative w-32 h-32 mb-0">
                         <Image src="/logo.png" alt="DSA Grinders" width={128} height={128} className="object-contain" priority />
                    </div>
                    <span className="text-2xl font-normal text-gray-500 tracking-tight text-center">
                        DSA <span className="font-medium text-gray-900">Grinders</span>
                    </span>
                </div>

                <div className="bg-white rounded-[28px] border border-gray-200 p-6 sm:p-8 shadow-[0_1px_2px_0_rgba(60,64,67,0.3),0_1px_3px_1px_rgba(60,64,67,0.15)]">
                    <h2 className="text-2xl font-normal text-center mb-2">
                        {isLogin ? "Sign in" : "Create account"}
                    </h2>
                    <p className="text-center text-gray-500 mb-8 text-sm">
                        {isLogin ? "to continue to DSA Grinders" : "to start competing with friends"}
                    </p>

                    {error && (
                        <div className="mb-6 bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm border border-red-100 flex items-center gap-2">
                             <span className="h-1.5 w-1.5 rounded-full bg-red-600 flex-shrink-0" />
                             {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {!isLogin && (
                            <div className="space-y-1.5">
                                <Label htmlFor="name" className="text-gray-700 font-medium text-sm ml-1">Full Name</Label>
                                <Input
                                    id="name"
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required={!isLogin}
                                    disabled={isLoading}
                                    className="h-12 px-4 bg-gray-50 border-transparent hover:bg-gray-100 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all rounded-xl text-base"
                                    placeholder="John Doe"
                                />
                            </div>
                        )}
                        
                        <div className="space-y-1.5">
                            <Label htmlFor="email" className="text-gray-700 font-medium text-sm ml-1">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={isLoading}
                                className="h-12 px-4 bg-gray-50 border-transparent hover:bg-gray-100 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all rounded-xl text-base"
                                placeholder="name@example.com"
                            />
                        </div>

                        {!isLogin && (
                            <div className="space-y-1.5">
                                <Label htmlFor="leetcode" className="text-gray-700 font-medium text-sm ml-1">LeetCode Username</Label>
                                <Input
                                    id="leetcode"
                                    type="text"
                                    value={leetcode}
                                    onChange={(e) => setLeetcode(e.target.value)}
                                    required={!isLogin}
                                    disabled={isLoading}
                                    className="h-12 px-4 bg-gray-50 border-transparent hover:bg-gray-100 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all rounded-xl text-base"
                                    placeholder="leetcode_user"
                                />
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <Label htmlFor="password" className="text-gray-700 font-medium text-sm ml-1">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                                disabled={isLoading}
                                className="h-12 px-4 bg-gray-50 border-transparent hover:bg-gray-100 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all rounded-xl text-base"
                                placeholder="Min. 6 characters"
                            />
                        </div>

                        <div className="pt-2">
                            <Button
                                type="submit"
                                className="w-full h-12 bg-[#1a73e8] hover:bg-[#1557b0] text-white font-medium rounded-full text-base shadow-none transition-all flex items-center justify-center gap-2"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <>
                                        {isLogin ? "Sign in" : "Create Account"}
                                        <ArrowRight className="h-4 w-4" />
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                    
                    <div className="mt-8 text-center pt-6 border-t border-gray-100">
                        <button 
                            onClick={() => {
                                setIsLogin(!isLogin);
                                setError(null);
                            }}
                            className="text-[#1a73e8] hover:text-[#1557b0] text-sm font-medium hover:underline px-2 py-1 rounded-md"
                        >
                            {isLogin 
                                ? "Create an account" 
                                : "Already have an account? Sign in"
                            }
                        </button>
                    </div>
                </div>
                
                <div className="mt-8 flex justify-center gap-6 text-xs text-gray-400">
                    <span className="hover:text-gray-600 cursor-pointer">Help</span>
                    <span className="hover:text-gray-600 cursor-pointer">Privacy</span>
                    <span className="hover:text-gray-600 cursor-pointer">Terms</span>
                </div>
            </div>
        </div>
    );
}
