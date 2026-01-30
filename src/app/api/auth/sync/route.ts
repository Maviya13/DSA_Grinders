import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { supabase } from '@/lib/supabase';
import { isProfileIncomplete } from '@/lib/auth';

export async function POST(req: Request) {
    try {
        const authHeader = req.headers.get('authorization');

        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
            console.error('CRITICAL: Supabase environment variables missing on server!');
        }

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

        const [existingUser] = await db.select().from(users).where(eq(users.email, email)).limit(1);

        if (!existingUser) {

            try {
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
            } catch (insertError: any) {
                // If it's a unique constraint violation, it means the user was created concurrently.
                // We should fetch the user again.
                // details: Postgres error 23505 is unique_violation
                const errorCode = insertError.code || insertError.cause?.code;

                if (errorCode === '23505') {
                    const [retryUser] = await db.select().from(users).where(eq(users.email, email)).limit(1);
                    if (retryUser) {
                        // Proceed to handle as existing user (fall through to existing logic below isn't easy here, so return immediately)
                        return NextResponse.json({
                            user: {
                                ...retryUser,
                                isProfileIncomplete: isProfileIncomplete(retryUser),
                            },
                        });
                    }
                }
                throw insertError; // Re-throw if it's not the unique constraint error
            }
        }

        return NextResponse.json({
            user: {
                ...existingUser,
                isProfileIncomplete: isProfileIncomplete(existingUser),
            },
        });

    } catch (error: any) {
        console.error('Auth sync error:', error);
        return NextResponse.json({
            error: error.message || 'Internal Server Error',
            details: error.toString()
        }, { status: 500 });
    }
}
