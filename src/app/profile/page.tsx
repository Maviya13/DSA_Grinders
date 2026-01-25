"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/components/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft, Save, Phone, User, Github, Linkedin } from "lucide-react";

export default function ProfilePage() {
    const { user, token, isLoading: authLoading, updateUser } = useAuth();
    const router = useRouter();
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Form state
    const [name, setName] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [github, setGithub] = useState("");
    const [linkedin, setLinkedin] = useState("");

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (user) {
            setName(user.name || "");
            setPhoneNumber(user.phoneNumber || "");
            setGithub(user.github || "");
            setLinkedin(user.linkedin || "");
        }
    }, [user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        setIsSaving(true);

        try {
            const res = await fetch("/api/users/profile", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: name.trim(),
                    phoneNumber: phoneNumber.trim() || null,
                    github: github.trim(),
                    linkedin: linkedin.trim() || null
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to update profile");
            }

            setSuccess("Profile updated successfully!");

            setTimeout(() => {
                setSuccess(null);
            }, 3000);

        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSaving(false);
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="min-h-screen bg-white text-gray-800 font-sans">
            {/* Header */}
            <header className="fixed top-0 inset-x-0 bg-white/90 backdrop-blur-md z-50 border-b border-gray-200">
                <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push('/home')}
                            className="text-gray-600 hover:bg-gray-50 hover:text-blue-600 font-medium rounded-full px-3"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Home
                        </Button>
                        <div className="h-6 w-px bg-gray-200"></div>
                        <div className="flex items-center gap-3">
                            <Image src="/logo.png" alt="Logo" width={32} height={32} className="object-contain" priority />
                            <span className="text-xl font-medium tracking-tight text-gray-500">
                                DSA <span className="text-gray-900 font-semibold">Grinders</span>
                            </span>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-[600px] mx-auto pt-24 pb-12 px-6">

                {/* Page Title */}
                <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <h1 className="text-4xl font-normal tracking-tight text-gray-900 mb-4">
                        Profile Settings
                    </h1>
                    <p className="text-lg text-gray-500 font-light">
                        Update your profile and notification preferences
                    </p>
                </div>

                {/* Profile Form */}
                <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-[0_1px_3px_rgba(0,0,0,0.12)] mb-8">

                    {error && (
                        <div className="mb-6 bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm border border-red-100 flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-red-600 flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="mb-6 bg-green-50 text-green-600 px-4 py-3 rounded-xl text-sm border border-green-100 flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-green-600 flex-shrink-0" />
                            {success}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* Name Field */}
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-gray-700 font-medium text-sm ml-1 flex items-center gap-2">
                                <User className="h-4 w-4" />
                                Full Name
                            </Label>
                            <Input
                                id="name"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                disabled={isSaving}
                                className="h-12 px-4 bg-gray-50 border-transparent hover:bg-gray-100 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all rounded-xl text-base"
                                placeholder="Enter your full name"
                            />
                        </div>

                        {/* Email Field (Read-only) */}
                        <div className="space-y-2">
                            <Label className="text-gray-700 font-medium text-sm ml-1">Email</Label>
                            <Input
                                type="email"
                                value={user.email}
                                disabled
                                className="h-12 px-4 bg-gray-100 border-transparent text-gray-500 rounded-xl text-base cursor-not-allowed"
                            />
                            <p className="text-xs text-gray-400 ml-1">Email cannot be changed</p>
                        </div>

                        {/* LeetCode Username (Read-only) */}
                        <div className="space-y-2">
                            <Label className="text-gray-700 font-medium text-sm ml-1">LeetCode Username</Label>
                            <Input
                                type="text"
                                value={user.leetcodeUsername}
                                disabled
                                className="h-12 px-4 bg-gray-100 border-transparent text-gray-500 rounded-xl text-base cursor-not-allowed"
                            />
                            <p className="text-xs text-gray-400 ml-1">LeetCode username cannot be changed</p>
                        </div>

                        {/* GitHub Profile URL */}
                        <div className="space-y-2">
                            <Label htmlFor="github" className="text-gray-700 font-medium text-sm ml-1 flex items-center gap-2">
                                <Github className="h-4 w-4" />
                                GitHub Profile URL
                            </Label>
                            <Input
                                id="github"
                                type="url"
                                value={github}
                                onChange={(e) => setGithub(e.target.value)}
                                required
                                disabled={isSaving}
                                className="h-12 px-4 bg-gray-50 border-transparent hover:bg-gray-100 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all rounded-xl text-base"
                                placeholder="https://github.com/username"
                            />
                        </div>

                        {/* LinkedIn Profile URL */}
                        <div className="space-y-2">
                            <Label htmlFor="linkedin" className="text-gray-700 font-medium text-sm ml-1 flex items-center gap-2">
                                <Linkedin className="h-4 w-4" />
                                LinkedIn Profile URL
                                <span className="text-xs text-gray-400 font-normal">(Optional)</span>
                            </Label>
                            <Input
                                id="linkedin"
                                type="url"
                                value={linkedin}
                                onChange={(e) => setLinkedin(e.target.value)}
                                disabled={isSaving}
                                className="h-12 px-4 bg-gray-50 border-transparent hover:bg-gray-100 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all rounded-xl text-base"
                                placeholder="https://linkedin.com/in/username"
                            />
                        </div>

                        {/* Phone Number Field */}
                        <div className="space-y-2">
                            <Label htmlFor="phoneNumber" className="text-gray-700 font-medium text-sm ml-1 flex items-center gap-2">
                                <Phone className="h-4 w-4" />
                                WhatsApp Number
                                <span className="text-xs text-gray-400 font-normal">(Optional)</span>
                            </Label>
                            <Input
                                id="phoneNumber"
                                type="tel"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                disabled={isSaving}
                                className="h-12 px-4 bg-gray-50 border-transparent hover:bg-gray-100 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all rounded-xl text-base"
                                placeholder="+1234567890"
                            />
                            <p className="text-xs text-gray-500 ml-1">
                                Include country code (e.g., +1 for US, +91 for India). This will be used for WhatsApp reminders.
                            </p>
                        </div>

                        {/* Save Button */}
                        <div className="pt-4">
                            <Button
                                type="submit"
                                className="w-full h-12 bg-[#1a73e8] hover:bg-[#1557b0] text-white font-medium rounded-full text-base shadow-none transition-all flex items-center justify-center gap-2"
                                disabled={isSaving}
                            >
                                {isSaving ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <>
                                        <Save className="h-4 w-4" />
                                        Save Changes
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </div>

                {/* Info Section */}
                <div className="mt-8 bg-blue-50 rounded-3xl border border-blue-200 p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-3">About Notifications</h3>
                    <div className="space-y-2 text-sm text-gray-600">
                        <p>• Daily email reminders are sent to all users automatically</p>
                        <p>• WhatsApp reminders are only sent if you provide a phone number</p>
                        <p>• Both notifications contain motivational roasts to keep you grinding! 🔥</p>
                        <p>• Messages are sent once per day via our automated system</p>
                    </div>
                </div>
            </main>
        </div>
    );
}