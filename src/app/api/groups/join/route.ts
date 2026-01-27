import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db/drizzle';
import { groups, groupMembers } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export const POST = requireAuth(async (req: NextRequest, user: any) => {
    try {
        const { code } = await req.json();

        if (!code) {
            return NextResponse.json({ error: 'Group code is required' }, { status: 400 });
        }

        // Find group by code
        const [group] = await db.select().from(groups).where(eq(groups.code, code.toUpperCase())).limit(1);

        if (!group) {
            return NextResponse.json({ error: 'Invalid group code' }, { status: 404 });
        }

        // Check if already a member
        const [existingMember] = await db.select()
            .from(groupMembers)
            .where(and(eq(groupMembers.groupId, group.id), eq(groupMembers.userId, user.id)))
            .limit(1);

        if (existingMember) {
            return NextResponse.json({ error: 'You are already a member of this group' }, { status: 400 });
        }

        // Add user to group members
        await db.insert(groupMembers).values({
            groupId: group.id,
            userId: user.id,
        });

        return NextResponse.json({
            success: true,
            message: `Successfully joined ${group.name}`,
            group
        });

    } catch (error: any) {
        console.error('Error joining group:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
});
