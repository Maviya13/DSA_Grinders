import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const ADMIN_ID = process.env.ADMIN_ID || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'dsagrinder';
const ADMIN_SESSION_SECRET = process.env.ADMIN_SESSION_SECRET || 'fallback_secret_key';

export async function POST(req: Request) {
    try {
        const { adminId, password } = await req.json();

        if (adminId === ADMIN_ID && password === ADMIN_PASSWORD) {
            // Create a simple JWT session
            const token = jwt.sign(
                { role: 'admin', manual: true },
                ADMIN_SESSION_SECRET,
                { expiresIn: '24h' }
            );

            // Set cookie
            (await cookies()).set('admin_session', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 60 * 60 * 24 // 24 hours
            });

            return NextResponse.json({ success: true, token });
        }

        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    } catch (error: any) {
        console.error('Admin login error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
