import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
    try {
        const authHeader = req.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 });
        }

        const token = authHeader.split(' ')[1];
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            return NextResponse.json({ error: 'Invalid Supabase session' }, { status: 401 });
        }

        // Email is guaranteed by Google Auth
        const email = user.email?.toLowerCase();
        if (!email) {
            return NextResponse.json({ error: 'Email not found in Google profile' }, { status: 400 });
        }

        // Check if user exists in our DB
        const [existingUser] = await db.select().from(users).where(eq(users.email, email)).limit(1);

        if (!existingUser) {
            // Create a placeholder user
            // leetcodeUsername and github are marked as .notNull() in schema, 
            // so we need to provide defaults or change schema.
            // Since it's mandatory onboarding, we'll use a placeholder and then the modal will update it.

            const [newUser] = await db.insert(users).values({
                name: user.user_metadata?.full_name || user.user_metadata?.name || 'New User',
                email: email,
                leetcodeUsername: `pending_${Math.random().toString(36).substring(7)}`,
                github: 'pending',
                role: 'user',
            }).returning();

            return NextResponse.json({
                user: {
                    id: newUser.id,
                    name: newUser.name,
                    email: newUser.email,
                    leetcodeUsername: newUser.leetcodeUsername,
                    github: newUser.github,
                    role: newUser.role,
                    isProfileIncomplete: true,
                },
                message: 'User created. Profile completion required.',
            });
        }

        // User exists, check if profile is incomplete
        const isProfileIncomplete =
            !existingUser.leetcodeUsername ||
            existingUser.leetcodeUsername.startsWith('pending_') ||
            !existingUser.github ||
            existingUser.github === 'pending' ||
            !existingUser.phoneNumber ||
            !existingUser.linkedin;

        return NextResponse.json({
            user: {
                id: existingUser.id,
                name: existingUser.name,
                email: existingUser.email,
                leetcodeUsername: existingUser.leetcodeUsername,
                github: existingUser.github,
                linkedin: existingUser.linkedin,
                phoneNumber: existingUser.phoneNumber,
                role: existingUser.role,
                isProfileIncomplete,
            },
        });

    } catch (error: any) {
        console.error('Auth sync error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
