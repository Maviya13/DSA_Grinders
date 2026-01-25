"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Shield, LogIn } from "lucide-react";

interface AdminLoginProps {
    onLoginSuccess: () => void;
}

export default function AdminLogin({ onLoginSuccess }: AdminLoginProps) {
    const [adminId, setAdminId] = useState("");
    const [adminPassword, setAdminPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            const res = await fetch("/api/admin/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ adminId, adminPassword }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Login failed");
            }

            // Login successful, trigger callback
            onLoginSuccess();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-3xl p-8 shadow-2xl">
                    <div className="text-center mb-8">
                        <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Shield className="h-8 w-8 text-red-600" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
                        <p className="text-gray-500 mt-2">Enter your admin credentials to continue</p>
                    </div>

                    {error && (
                        <div className="mb-6 bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm border border-red-100">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="adminId" className="text-gray-700 font-medium">
                                Admin ID
                            </Label>
                            <Input
                                id="adminId"
                                type="text"
                                value={adminId}
                                onChange={(e) => setAdminId(e.target.value)}
                                required
                                disabled={isLoading}
                                className="h-12 px-4 bg-gray-50 border-gray-200"
                                placeholder="Enter admin ID"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="adminPassword" className="text-gray-700 font-medium">
                                Password
                            </Label>
                            <Input
                                id="adminPassword"
                                type="password"
                                value={adminPassword}
                                onChange={(e) => setAdminPassword(e.target.value)}
                                required
                                disabled={isLoading}
                                className="h-12 px-4 bg-gray-50 border-gray-200"
                                placeholder="Enter password"
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <>
                                    <LogIn className="h-4 w-4 mr-2" />
                                    Login to Admin Panel
                                </>
                            )}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
}
