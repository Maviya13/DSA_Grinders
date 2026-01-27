import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db/drizzle';
import { users as usersTable, messageTemplates } from '@/db/schema';
import { eq, ne, notLike, and } from 'drizzle-orm';

// Simple admin check
function isAdmin(user: any): boolean {
  return user.role === 'admin';
}

export const GET = requireAuth(async (req, user) => {
  try {
    // Check if user is admin
    if (!isAdmin(user)) {
      return NextResponse.json(
        { error: 'Access denied. Admin privileges required.' },
        { status: 403 }
      );
    }

    // Get all users
    const allUsers = await db.select({
      id: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
      leetcodeUsername: usersTable.leetcodeUsername,
      phoneNumber: usersTable.phoneNumber,
      role: usersTable.role,
    }).from(usersTable);

    // Get non-admin users
    const regularUsers = allUsers.filter(u => u.role !== 'admin');

    // Get templates
    const templates = await db.select().from(messageTemplates);

    // Environment check
    const envCheck = {
      SMTP_EMAIL: !!process.env.SMTP_EMAIL,
      SMTP_PASSWORD: !!process.env.SMTP_PASSWORD,
      DATABASE_URL: !!process.env.DATABASE_URL,
    };

    return NextResponse.json({
      debug: {
        totalUsers: allUsers.length,
        regularUsers: regularUsers.length,
        adminUsers: allUsers.length - regularUsers.length,
        usersWithPhone: regularUsers.filter(u => u.phoneNumber && u.phoneNumber.trim()).length,
        templates: templates.length,
        environment: envCheck
      },
      users: regularUsers.map(u => ({
        name: u.name,
        email: u.email,
        leetcodeUsername: u.leetcodeUsername,
        hasPhone: !!u.phoneNumber,
        phonePreview: u.phoneNumber ? u.phoneNumber.substring(0, 5) + '***' : null
      })),
      templates: templates.map(t => ({
        id: t.id,
        type: t.type,
        name: t.name,
        isActive: t.isActive,
        hasContent: !!t.content,
        contentLength: t.content?.length || 0
      })),
      adminUser: {
        name: user.name,
        email: user.email
      }
    });

  } catch (error: any) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});
