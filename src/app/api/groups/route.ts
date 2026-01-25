import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import { Group } from '@/models/Group';
import { User } from '@/models/User';
import mongoose from 'mongoose';

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
        await dbConnect();

        // Fetch detailed group info for groups the user is in
        const userGroups = await Group.find({ _id: { $in: user.groups } })
            .select('name code description members owner createdAt')
            .populate('owner', 'name')
            .sort({ createdAt: -1 });

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

        await dbConnect();

        // Generate unique code
        let code = generateGroupCode();
        let isUnique = false;
        let attempts = 0;

        // Retry loop to ensure uniqueness
        while (!isUnique && attempts < 10) {
            const existing = await Group.findOne({ code });
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

        // Create group
        const group = await Group.create({
            name,
            code,
            description,
            owner: user._id,
            members: [user._id],
        });

        // Add group to user's list
        await User.findByIdAndUpdate(user._id, {
            $addToSet: { groups: group._id }
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
