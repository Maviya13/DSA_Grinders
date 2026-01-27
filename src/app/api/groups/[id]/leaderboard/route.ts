import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db/drizzle';
import { groups, groupMembers, users, dailyStats } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';

export const GET = requireAuth(async (req: NextRequest, user: any, { params }: { params: { id: string } }) => {
    try {
        const { id: groupIdStr } = await params;
        const groupId = parseInt(groupIdStr);

        if (isNaN(groupId)) {
            return NextResponse.json({ error: 'Invalid group ID' }, { status: 400 });
        }

        // Verify group exists
        const [group] = await db.select().from(groups).where(eq(groups.id, groupId)).limit(1);
        if (!group) {
            return NextResponse.json({ error: 'Group not found' }, { status: 404 });
        }

        // Verify user is a member
        const [isMember] = await db.select().from(groupMembers).where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, user.id))).limit(1);
        if (!isMember) {
            return NextResponse.json({ error: 'You are not a member of this group' }, { status: 403 });
        }

        // Get members
        const members = await db.select({
            id: users.id,
            name: users.name,
            email: users.email,
            leetcodeUsername: users.leetcodeUsername,
            github: users.github,
            linkedin: users.linkedin,
        })
            .from(users)
            .innerJoin(groupMembers, eq(groupMembers.userId, users.id))
            .where(eq(groupMembers.groupId, groupId));

        const today = new Date().toISOString().split('T')[0];

        const leaderboard = [];
        for (const member of members) {
            // Get today's stat
            const [todayStat] = await db.select()
                .from(dailyStats)
                .where(and(eq(dailyStats.userId, member.id), eq(dailyStats.date, today)))
                .limit(1);

            // Get latest stat for other data points
            const [latestStat] = await db.select()
                .from(dailyStats)
                .where(eq(dailyStats.userId, member.id))
                .orderBy(desc(dailyStats.date))
                .limit(1);

            const easy = latestStat?.easy ?? 0;
            const medium = latestStat?.medium ?? 0;
            const hard = latestStat?.hard ?? 0;
            const totalScore = easy * 1 + medium * 3 + hard * 6;

            leaderboard.push({
                id: member.id,
                name: member.name,
                email: member.email,
                leetcodeUsername: member.leetcodeUsername,
                todayPoints: todayStat?.todayPoints || 0,
                totalScore: totalScore,
                totalProblems: latestStat?.total || 0,
                easy: easy,
                medium: medium,
                hard: hard,
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
