import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db/drizzle';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { updateDailyStatsForUser } from '@/lib/leetcode';

export const PUT = requireAuth(async (req: NextRequest, user: any) => {
  try {
    const { name, phoneNumber, github, linkedin, leetcodeUsername } = await req.json();

    // Validate phone number format if provided
    if (phoneNumber && !/^\+?[1-9]\d{1,14}$/.test(phoneNumber.replace(/\s/g, ''))) {
      return NextResponse.json(
        { error: 'Invalid phone number format. Use international format (e.g., +1234567890)' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (name) updateData.name = name;

    // Attach links if only usernames are provided
    if (github) {
      updateData.github = github.startsWith('http') ? github : `https://github.com/${github.replace('@', '')}`;
    }

    if (linkedin !== undefined) {
      if (!linkedin) {
        updateData.linkedin = null;
      } else {
        updateData.linkedin = linkedin.startsWith('http') ? linkedin : `https://linkedin.com/in/${linkedin.replace('@', '')}`;
      }
    }

    if (leetcodeUsername) updateData.leetcodeUsername = leetcodeUsername;

    if (phoneNumber !== undefined) {
      updateData.phoneNumber = phoneNumber ? phoneNumber.replace(/\s/g, '') : null;
    }

    const [updatedUser] = await db.update(users)
      .set(updateData)
      .where(eq(users.id, user.id))
      .returning();

    if (!updatedUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Trigger immediate LeetCode sync if username was set
    if (leetcodeUsername) {
      try {
        await updateDailyStatsForUser(updatedUser.id, updatedUser.leetcodeUsername);
      } catch (syncError) {
        console.error('Initial LeetCode sync failed:', syncError);
        // We don't fail the whole request, but we log it
      }
    }

    return NextResponse.json({
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        leetcodeUsername: updatedUser.leetcodeUsername,
        github: updatedUser.github,
        linkedin: updatedUser.linkedin,
        phoneNumber: updatedUser.phoneNumber,
      },
    });
  } catch (error: any) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});
