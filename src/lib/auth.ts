import { NextRequest } from 'next/server';
import { db } from '@/db/drizzle';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { supabase } from './supabase';
import jwt from 'jsonwebtoken';

const ADMIN_SESSION_SECRET = process.env.ADMIN_SESSION_SECRET || 'fallback_secret_key';

export async function getCurrentUser(req: NextRequest) {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }

    const token = authHeader.split(' ')[1];

    try {
        // 1. Try manual admin token first
        try {
            const decoded = jwt.verify(token, ADMIN_SESSION_SECRET) as any;
            if (decoded && decoded.role === 'admin' && decoded.manual) {
                return { id: 'manual_admin', name: 'Manual Admin', role: 'admin', isProfileIncomplete: false };
            }
        } catch (e) {
            // Not a manual token, continue to Supabase
        }

        // 2. Try Supabase token
        const { data: { user: supabaseUser }, error } = await supabase.auth.getUser(token);
        if (error || !supabaseUser) return null;

        const email = supabaseUser.email?.toLowerCase();
        if (!email) return null;

        const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

        if (!user) return null;

        // Verify profile is complete for regular routes
        const isProfileIncomplete =
            !user.leetcodeUsername ||
            user.leetcodeUsername.startsWith('pending_') ||
            !user.github ||
            user.github === 'pending' ||
            !user.phoneNumber ||
            !user.linkedin;

        return { ...user, isProfileIncomplete };
    } catch (error) {
        console.error('Auth error:', error);
        return null;
    }
}

export function requireAuth(handler: (req: NextRequest, user: any, context?: any) => Promise<Response>) {
    return async (req: NextRequest, context?: any) => {
        const user = await getCurrentUser(req);
        if (!user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Block actions if profile is incomplete (except for profile update route)
        const isProfileUpdate = req.nextUrl.pathname === '/api/users/profile';
        if (user.isProfileIncomplete && !isProfileUpdate) {
            return new Response(JSON.stringify({ error: 'Profile completion required', isProfileIncomplete: true }), {
                status: 403,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        return handler(req, user, context);
    };
}

// Admin auth middleware - checks for admin role in database
export function requireAdmin(handler: (req: NextRequest, user: any) => Promise<Response>) {
    return async (req: NextRequest) => {
        const user = await getCurrentUser(req);

        if (!user || user.role !== 'admin') {
            return new Response(JSON.stringify({ error: 'Admin access denied' }), {
                status: 403,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        return handler(req, user);
    };
}
