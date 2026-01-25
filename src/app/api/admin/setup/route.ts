import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import { User } from '@/models/User';

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

    await dbConnect();

    // Update user role to admin
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { role: 'admin' },
      { new: true }
    );

    return NextResponse.json({
      success: true,
      message: `User ${user.email} promoted to admin successfully!`,
      user: {
        id: updatedUser._id,
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