import { NextRequest } from 'next/server';
import { getTokenFromHeader, verifyToken, JWTPayload } from './jwt';
import dbConnect from './mongodb';
import { User, IUser } from '@/models/User';

export async function getCurrentUser(req: NextRequest) {
    const authHeader = req.headers.get('authorization');
    const token = getTokenFromHeader(authHeader);

    if (!token) {
        return null;
    }

    const payload = verifyToken(token);
    if (!payload) {
        return null;
    }

    await dbConnect();
    const user = await User.findById(payload.userId).select('-password');
    return user;
}

// Checks admin password from environment variables - no hardcoding!
export function verifyAdminCredentials(adminId: string, adminPassword: string): boolean {
    const envAdminId = process.env.ADMIN_ID;
    const envAdminPassword = process.env.ADMIN_PASSWORD;

    if (!envAdminId || !envAdminPassword) {
        console.error('ADMIN_ID or ADMIN_PASSWORD not set in environment variables');
        return false;
    }

    return adminId === envAdminId && adminPassword === envAdminPassword;
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
        return handler(req, user, context);
    };
}

// Admin auth middleware - checks for admin session token
export function requireAdmin(handler: (req: NextRequest, user: any) => Promise<Response>) {
    return async (req: NextRequest) => {
        // Check for admin session token in cookies or Authorization header
        const adminToken = req.cookies.get('admin_session')?.value ||
            req.headers.get('X-Admin-Token');

        const expectedToken = process.env.ADMIN_SESSION_SECRET;

        if (!expectedToken) {
            console.error('ADMIN_SESSION_SECRET not set in environment variables');
            return new Response(JSON.stringify({ error: 'Server configuration error' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        if (!adminToken || adminToken !== expectedToken) {
            return new Response(JSON.stringify({ error: 'Admin access denied. Please login via /admin' }), {
                status: 403,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Admin is authenticated, proceed without needing a user object
        return handler(req, { isAdmin: true });
    };
}
