import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import { Group } from '@/models/Group';
import { User } from '@/models/User';
import { DailyStat } from '@/models/DailyStat';

export const GET = requireAuth(async (req: NextRequest, user: any, { params }: { params: { id: string } }) => {
    try {
        const { id: groupId } = await params;
        await dbConnect();

        // Verify group exists
        const group = await Group.findById(groupId);
        if (!group) {
            return NextResponse.json({ error: 'Group not found' }, { status: 404 });
        }

        // Verify user is a member
        const isMember = group.members.some((memberId: any) => memberId.toString() === user._id.toString());
        if (!isMember) {
            return NextResponse.json({ error: 'You are not a member of this group' }, { status: 403 });
        }

        // Get members
        const members = await User.find({ _id: { $in: group.members } }).select('-password');

        const today = new Date().toISOString().split('T')[0];

        // Build leaderboard logic (similar to global but filtered)
        const leaderboard = [];
        for (const member of members) {
            // Get today's stat
            const todayStat = await DailyStat.findOne({ userId: member._id, date: today });
            // Get latest stat for total problems
            const latestStat = await DailyStat.findOne({ userId: member._id }).sort({ date: -1 });

            const totalScore = (latestStat?.easy || 0) * 1 + (latestStat?.medium || 0) * 3 + (latestStat?.hard || 0) * 6;

            leaderboard.push({
                id: member._id,
                name: member.name,
                email: member.email,
                leetcodeUsername: member.leetcodeUsername,
                todayPoints: todayStat?.todayPoints || 0,
                totalScore: totalScore,
                totalProblems: latestStat?.total || 0,
                easy: latestStat?.easy || 0,
                medium: latestStat?.medium || 0,
                hard: latestStat?.hard || 0,
                ranking: latestStat?.ranking || 0,
                avatar: latestStat?.avatar || '',
                country: latestStat?.country || '',
                streak: latestStat?.streak || 0,
                lastSubmission: latestStat?.lastSubmission || null,
                recentProblems: latestStat?.recentProblems || [],
                github: member.github || null,
                linkedin: member.linkedin || null,
                rank: 0,
            });
        }

        // Sort based on type
        const searchParams = new URL(req.url).searchParams;
        const type = searchParams.get('type') || 'daily';

        if (type === 'daily') {
            leaderboard.sort((a, b) => b.todayPoints - a.todayPoints || b.totalScore - a.totalScore);
        } else {
            leaderboard.sort((a, b) => b.totalScore - a.totalScore || b.todayPoints - a.todayPoints);
        }

        // Add rank
        leaderboard.forEach((entry, index) => {
            entry.rank = index + 1;
        });

        return NextResponse.json({
            groupName: group.name,
            groupCode: group.code,
            leaderboard
        });

    } catch (error: any) {
        console.error('Error fetching group leaderboard:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
});
