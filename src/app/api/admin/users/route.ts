import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/db/drizzle';
import { users } from '@/db/schema';
import { desc } from 'drizzle-orm';

export const GET = requireAdmin(async (req, user) => {
  try {
    // Get all users without passwords
    const allUsers = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      leetcodeUsername: users.leetcodeUsername,
      phoneNumber: users.phoneNumber,
      role: users.role,
      createdAt: users.createdAt,
    }).from(users).orderBy(desc(users.createdAt));

    const userStats = {
      total: allUsers.length,
      withWhatsApp: allUsers.filter(u => u.phoneNumber).length,
      withoutWhatsApp: allUsers.filter(u => !u.phoneNumber).length,
      admins: allUsers.filter(u => u.role === 'admin' || u.email.includes('admin')).length,
    };

    return NextResponse.json({
      users: allUsers,
      stats: userStats,
    });
  } catch (error: any) {
    console.error('Admin users fetch error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});
