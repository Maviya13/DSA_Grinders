"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface User {
    id: number;
    name: string;
    email: string;
    leetcodeUsername: string;
    phoneNumber?: string;
    github: string;
    linkedin?: string;
    role: string;
    isProfileIncomplete?: boolean;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    signInWithGoogle: () => Promise<void>;
    updateUser: (userData: Partial<User>) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // Initial session check
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                setToken(session.access_token);
                await syncUserWithDB(session.access_token);
            } else {
                setIsLoading(false);
            }
        };

        checkSession();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: string, session: any) => {
            if (event === 'SIGNED_IN' && session) {
                // If we already have a user and token, don't re-sync unless session is different
                if (session.access_token !== token) {
                    setToken(session.access_token);
                    await syncUserWithDB(session.access_token);
                }
            } else if (event === 'SIGNED_OUT') {
                setUser(null);
                setToken(null);
                setIsLoading(false);
                router.push('/');
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const syncUserWithDB = async (authToken: string) => {
        try {
            const res = await fetch('/api/auth/sync', {
                method: 'POST',
                headers: { Authorization: `Bearer ${authToken}` },
            });
            if (res.ok) {
                const data = await res.json();
                setUser(data.user);

                // If profile is complete and we are on landing/login, go home
                if (!data.user.isProfileIncomplete) {
                    const path = window.location.pathname;
                    if (path === '/' || path === '/login' || path === '/register') {
                        router.push('/home');
                    }
                }
            } else {
                console.error('Failed to sync user with DB');
            }
        } catch (error) {
            console.error('Error in syncUserWithDB:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const signInWithGoogle = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });
        if (error) throw error;
    };

    const updateUser = (userData: Partial<User>) => {
        if (user) {
            setUser({ ...user, ...userData });
        }
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setToken(null);
        router.push('/');
    };

    return (
        <AuthContext.Provider value={{ user, token, isLoading, signInWithGoogle, updateUser, logout }}>
            {children}
            {/* The OnboardingModal will be placed in a higher-level component or here directly if we want it global */}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
