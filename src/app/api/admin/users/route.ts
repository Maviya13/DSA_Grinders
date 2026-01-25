import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import { User } from '@/models/User';

export const GET = requireAdmin(async (req, user) => {
  try {
    await dbConnect();

    // Get all users without passwords
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });

    const userStats = {
      total: users.length,
      withWhatsApp: users.filter(u => u.phoneNumber).length,
      withoutWhatsApp: users.filter(u => !u.phoneNumber).length,
      admins: users.filter(u => u.role === 'admin' || u.email.includes('admin')).length,
    };

    return NextResponse.json({
      users: users.map(user => ({
        id: user._id,
        name: user.name,
        email: user.email,
        leetcodeUsername: user.leetcodeUsername,
        phoneNumber: user.phoneNumber,
        role: user.role || 'user',
        createdAt: user.createdAt,
      })),
      stats: userStats,
    });
  } catch (error: any) {
    console.error('Admin users fetch error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});