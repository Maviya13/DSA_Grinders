"use client";

import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { Loader2, Github, Linkedin, User, Phone, Send, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const COUNTRY_CODES = [
    { code: '+91', country: 'India' },
    { code: '+1', country: 'USA/Canada' },
    { code: '+44', country: 'UK' },
    { code: '+81', country: 'Japan' },
    { code: '+61', country: 'Australia' },
    { code: '+49', country: 'Germany' },
    { code: '+33', country: 'France' },
    { code: '+971', country: 'UAE' },
    { code: '+65', country: 'Singapore' },
];

export default function OnboardingModal() {
    const { user, token, updateUser } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isValidatingLeetCode, setIsValidatingLeetCode] = useState(false);
    const [countryCode, setCountryCode] = useState('+91');
    const [formData, setFormData] = useState({
        leetcodeUsername: user?.leetcodeUsername?.startsWith('pending_') ? '' : user?.leetcodeUsername || '',
        github: user?.github === 'pending' ? '' : user?.github || '',
        linkedin: user?.linkedin || '',
        phoneNumber: user?.phoneNumber ? user.phoneNumber.replace(/^\+\d+/, '') : '',
    });

    if (!user || !user.isProfileIncomplete) return null;

    const validateLeetCode = async (username: string) => {
        if (!username) return false;
        setIsValidatingLeetCode(true);
        try {
            // Simple check: LeetCode usernames are usually alphanumeric + underscores/hyphens
            const isValidFormat = /^[a-zA-Z0-9_-]+$/.test(username);
            if (!isValidFormat) {
                toast.error('Invalid LeetCode username format');
                return false;
            }
            // We could attempt a fetch to a proxy or our own API, 
            // but for now, we'll stick to format validation to keep it fast.
            return true;
        } finally {
            setIsValidatingLeetCode(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Basic validation
        if (!formData.leetcodeUsername || !formData.github || !formData.linkedin || !formData.phoneNumber) {
            toast.error('All fields are mandatory');
            return;
        }

        const isLCValid = await validateLeetCode(formData.leetcodeUsername);
        if (!isLCValid) return;

        const fullPhoneNumber = `${countryCode}${formData.phoneNumber.replace(/\s/g, '')}`;

        // WhatsApp number validation (simple)
        if (!/^\+?[1-9]\d{1,14}$/.test(fullPhoneNumber)) {
            toast.error('Invalid WhatsApp number format');
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch('/api/users/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    ...formData,
                    phoneNumber: fullPhoneNumber
                }),
            });

            const data = await res.json();
            if (res.ok) {
                toast.success('Welcome to DSA Grinders! Profile completed.');
                updateUser({ ...data.user, isProfileIncomplete: false });
            } else {
                toast.error(data.error || 'Failed to update profile');
            }
        } catch (error) {
            console.error('Onboarding error:', error);
            toast.error('Something went wrong. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 30 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="w-full max-w-lg bg-white/90 backdrop-blur-2xl rounded-3xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] overflow-hidden border border-white/20 relative"
                >
                    {/* Background Accents */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/5 rounded-full -ml-32 -mb-32 blur-3xl pointer-events-none" />

                    <div className="bg-linear-to-br from-gray-900 to-blue-900 p-8 text-white relative">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-md border border-white/10 shadow-inner">
                                <span className="text-2xl">🚀</span>
                            </div>
                            <div>
                                <h2 className="text-3xl font-bold tracking-tight">Level Up</h2>
                                <p className="text-blue-200/80 text-sm font-medium">Complete your profile to start the grind</p>
                            </div>
                        </div>
                        <p className="text-blue-100/60 mt-4 text-sm leading-relaxed max-w-sm">
                            Fill in all the mandatory details below. We need these to track your progress and send you those daily roasts.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="p-8 space-y-6 relative">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                    <User className="w-3.5 h-3.5 text-blue-500" /> LeetCode
                                </label>
                                <div className="relative group">
                                    <input
                                        type="text"
                                        required
                                        value={formData.leetcodeUsername}
                                        onChange={(e) => setFormData({ ...formData, leetcodeUsername: e.target.value })}
                                        placeholder="piyush_dhoka"
                                        className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all text-gray-900 font-medium"
                                    />
                                    {isValidatingLeetCode && (
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                            <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                    <Github className="w-3.5 h-3.5 text-blue-500" /> GitHub
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.github}
                                    onChange={(e) => setFormData({ ...formData, github: e.target.value })}
                                    placeholder="piyushdhoka"
                                    className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all text-gray-900 font-medium"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                <Linkedin className="w-3.5 h-3.5 text-blue-500" /> LinkedIn handle
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.linkedin}
                                onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                                placeholder="piyushdhoka27"
                                className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all text-gray-900 font-medium"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                <Phone className="w-3.5 h-3.5 text-blue-500" /> WhatsApp
                            </label>
                            <div className="flex gap-3">
                                <div className="relative min-w-[120px]">
                                    <select
                                        value={countryCode}
                                        onChange={(e) => setCountryCode(e.target.value)}
                                        className="w-full h-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all appearance-none text-sm font-bold text-gray-700"
                                    >
                                        {COUNTRY_CODES.map((c) => (
                                            <option key={c.code} value={c.code}>
                                                {c.code} {c.country}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                        <Globe className="w-4 h-4" />
                                    </div>
                                </div>
                                <input
                                    type="tel"
                                    required
                                    value={formData.phoneNumber}
                                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                                    placeholder="9876543210"
                                    className="flex-1 px-5 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all text-gray-900 font-medium tracking-wide"
                                />
                            </div>
                            <p className="text-[11px] text-gray-400 mt-2 flex items-center gap-1.5 ml-1">
                                <span className="w-1 h-1 rounded-full bg-blue-400 animate-pulse" />
                                We'll use this for daily roasts and motivational pings!
                            </p>
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={isSubmitting || isValidatingLeetCode}
                                className="w-full bg-gray-900 hover:bg-black text-white font-bold py-4 rounded-2xl shadow-xl shadow-gray-200 flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-70 disabled:grayscale group"
                            >
                                {isSubmitting ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                        <span>Start Grinding</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
