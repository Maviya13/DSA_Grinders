import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db/drizzle';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const GET = requireAuth(async (req, user) => {
  try {
    // Secret key check to prevent unauthorized use (optional but recommended)
    const url = new URL(req.url);
    const secret = url.searchParams.get('secret');

    // In production, you should use a strong secret env variable
    // For now, checking if secret is 'dsa-admin-claim'
    if (secret !== 'dsa-admin-claim') {
      return NextResponse.json({ error: 'Invalid secret key' }, { status: 403 });
    }

    // Update user role to admin
    const [updatedUser] = await db.update(users)
      .set({ role: 'admin' })
      .where(eq(users.id, user.id))
      .returning();

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `User ${updatedUser.email} promoted to admin successfully!`,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role
      }
    });
  } catch (error: any) {
    console.error('Admin claim error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});
