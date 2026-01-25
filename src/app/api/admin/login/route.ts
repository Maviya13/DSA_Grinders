import { NextResponse, NextRequest } from 'next/server';
import { verifyAdminCredentials } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
    try {
        const { adminId, adminPassword } = await req.json();

        if (!adminId || !adminPassword) {
            return NextResponse.json(
                { error: 'Admin ID and Password are required' },
                { status: 400 }
            );
        }

        // Verify credentials against environment variables
        if (!verifyAdminCredentials(adminId, adminPassword)) {
            return NextResponse.json(
                { error: 'Invalid admin credentials' },
                { status: 401 }
            );
        }

        // Set a session cookie for admin
        const sessionSecret = process.env.ADMIN_SESSION_SECRET;
        if (!sessionSecret) {
            return NextResponse.json(
                { error: 'Server configuration error: ADMIN_SESSION_SECRET not set' },
                { status: 500 }
            );
        }

        // Set the admin session cookie (valid for 24 hours)
        const cookieStore = await cookies();
        cookieStore.set('admin_session', sessionSecret, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24, // 24 hours
            path: '/',
        });

        return NextResponse.json({
            success: true,
            message: 'Admin login successful',
        });
    } catch (error: any) {
        console.error('Admin login error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
