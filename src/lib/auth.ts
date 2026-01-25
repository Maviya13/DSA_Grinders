import { NextRequest } from 'next/server';
import { getTokenFromHeader, verifyToken, JWTPayload } from './jwt';
import dbConnect from './mongodb';
import { User } from '@/models/User';

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
