"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
    const router = useRouter();

    useEffect(() => {
        const handleAuth = async () => {
            // Supabase client automatically handles the hash/code in the URL
            const { data: { session }, error } = await supabase.auth.getSession();

            if (session) {
                router.push('/home');
            } else {
                console.error('No session found in callback', error);
                router.push('/login');
            }
        };

        handleAuth();
    }, [router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-white">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-500 font-medium animate-pulse">Authenticating with Google...</p>
            </div>
        </div>
    );
}
