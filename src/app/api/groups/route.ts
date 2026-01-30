import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db/drizzle';
import { groups, groupMembers, users } from '@/db/schema';
import { eq, or, and, desc } from 'drizzle-orm';

// Generate a random 6-character alphanumeric code
function generateGroupCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// GET: List groups for the current user
export const GET = requireAuth(async (req: NextRequest, user: any) => {
    try {
        // Fetch detailed group info for groups the user is in
        const userGroups = await db.select({
            id: groups.id,
            name: groups.name,
            code: groups.code,
            description: groups.description,
            owner: groups.owner,
            createdAt: groups.createdAt,
            ownerName: users.name,
        })
            .from(groups)
            .innerJoin(groupMembers, eq(groupMembers.groupId, groups.id))
            .leftJoin(users, eq(groups.owner, users.id))
            .where(eq(groupMembers.userId, user.id))
            .orderBy(desc(groups.createdAt));

        return NextResponse.json({ groups: userGroups });
    } catch (error: any) {
        console.error('Error fetching groups:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
});

// POST: Create a new group
export const POST = requireAuth(async (req: NextRequest, user: any) => {
    try {
        const { name, description } = await req.json();

        if (!name) {
            return NextResponse.json({ error: 'Group name is required' }, { status: 400 });
        }

        // Generate unique code
        let code = generateGroupCode();
        let isUnique = false;
        let attempts = 0;

        // Retry loop to ensure uniqueness
        while (!isUnique && attempts < 10) {
            const [existing] = await db.select().from(groups).where(eq(groups.code, code)).limit(1);
            if (!existing) {
                isUnique = true;
            } else {
                code = generateGroupCode();
                attempts++;
            }
        }

        if (!isUnique) {
            throw new Error('Failed to generate unique group code. Please try again.');
        }

        // Create group and add owner as member in a transaction
        const { group, member } = await db.transaction(async (tx) => {
            const [newGroup] = await tx.insert(groups).values({
                name,
                code,
                description,
                owner: user.id,
            }).returning();

            const [newMember] = await tx.insert(groupMembers).values({
                groupId: newGroup.id,
                userId: user.id,
            }).returning();

            return { group: newGroup, member: newMember };
        });

        return NextResponse.json({
            group,
            message: 'Group created successfully'
        });

    } catch (error: any) {
        console.error('Error creating group:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
});
