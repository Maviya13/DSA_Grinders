import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import { Group } from '@/models/Group';
import { User } from '@/models/User';

export const POST = requireAuth(async (req: NextRequest, user: any) => {
    try {
        const { code } = await req.json();

        if (!code) {
            return NextResponse.json({ error: 'Group code is required' }, { status: 400 });
        }

        await dbConnect();

        // Find group by code (case insensitive)
        const group = await Group.findOne({ code: code.toUpperCase() });

        if (!group) {
            return NextResponse.json({ error: 'Invalid group code' }, { status: 404 });
        }

        // Check if already a member
        if (group.members.some((memberId: any) => memberId.toString() === user._id.toString())) {
            return NextResponse.json({ error: 'You are already a member of this group' }, { status: 400 });
        }

        // Add user to group members
        group.members.push(user._id);
        await group.save();

        // Add group to user's groups list
        await User.findByIdAndUpdate(user._id, {
            $addToSet: { groups: group._id }
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
