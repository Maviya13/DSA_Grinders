"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/components/AuthContext";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Trophy, Target, Crown, LogOut, Github, Linkedin, Users, Plus, Hash, Copy, Settings, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea"; // Assuming it exists, if not I'll use Input or standard textarea
import PWAInstallPrompt from "@/components/PWAInstallPrompt";

interface LeaderboardEntry {
    id: string;
    name: string;
    email: string;
    leetcodeUsername: string;
    todayPoints: number;
    totalScore: number;
    totalProblems: number;
    easy?: number;
    medium?: number;
    hard?: number;
    ranking?: number;
    avatar?: string;
    country?: string;
    streak?: number;
    lastSubmission?: string;
    recentProblems?: string[];
    github?: string;
    linkedin?: string;
    rank: number;
}

interface Group {
    _id: string;
    name: string;
    code: string;
    description?: string;
    members: string[]; // IDs
    isOwner?: boolean;
}

const MOTIVATIONAL_ROASTS = [
    "Did you solve anything today or just scrolling?",
    "Your competitors are grinding right now. What are you doing?",
    "That 0 points is making recruiters cry!",
    "Bro solve at least one problem, need to impress that recruiter!",
    "Sitting idle? Try that graph question!",
    "Your struggle story will go viral on LinkedIn... for the wrong reasons!",
    "Can't even do Two Sum? Maybe engineering isn't for you!",
];

function getRandomRoast() {
    return MOTIVATIONAL_ROASTS[Math.floor(Math.random() * MOTIVATIONAL_ROASTS.length)];
}

function getTimeAgo(timestamp: string | null | undefined): string {
    if (!timestamp) return 'Never';
    const now = Date.now();
    const then = parseInt(timestamp) * 1000;
    const diff = now - then;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return 'Long ago';
}

export default function HomePage() {
    const { user, logout, isLoading: authLoading, token } = useAuth();
    const router = useRouter();
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
    const [roast] = useState(getRandomRoast());

    const [leaderboardType, setLeaderboardType] = useState<'daily' | 'allTime'>('daily');

    // Group State
    const [userGroups, setUserGroups] = useState<Group[]>([]);
    const [activeGroup, setActiveGroup] = useState<Group | null>(null);
    const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
    const [isJoinGroupOpen, setIsJoinGroupOpen] = useState(false);
    const [newGroupName, setNewGroupName] = useState("");
    const [newGroupDesc, setNewGroupDesc] = useState("");
    const [joinCode, setJoinCode] = useState("");
    const [modalError, setModalError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchUserGroups = useCallback(async () => {
        if (!token) return;
        try {
            const res = await fetch("/api/groups", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.groups) {
                setUserGroups(data.groups);
                // If we have an active group, update it only if data changed
                if (activeGroup) {
                    const updated = data.groups.find((g: Group) => g._id === activeGroup._id);
                    if (updated && JSON.stringify(updated) !== JSON.stringify(activeGroup)) {
                        setActiveGroup(updated);
                    }
                }
            }
        } catch (error) {
            console.error("Failed to fetch groups:", error);
        }
    }, [token, activeGroup]);

    const getCacheKey = useCallback(() => {
        return `leaderboard_cache_${activeGroup ? activeGroup._id : 'global'}_${leaderboardType}`;
    }, [activeGroup, leaderboardType]);

    const fetchLeaderboard = useCallback(async (forceRefresh = false) => {
        const cacheKey = getCacheKey();

        // Try to load from cache first
        if (!forceRefresh) {
            const cached = localStorage.getItem(cacheKey);
            if (cached) {
                try {
                    const parsed = JSON.parse(cached);
                    const now = Date.now();
                    // Cache duration: 5 minutes (300000 ms)
                    if (now - parsed.timestamp < 300000) {
                        console.log("Loading leaderboard from cache");
                        setLeaderboard(parsed.data);
                        setLastRefresh(new Date(parsed.timestamp)); // Show when data was actually fetched
                        setIsLoading(false);
                        return;
                    }
                } catch (e) {
                    console.error("Failed to parse cache", e);
                    localStorage.removeItem(cacheKey);
                }
            }
        }

        if (forceRefresh || isLoading) setIsLoading(true);
        setIsRefreshing(forceRefresh);

        try {
            const endpoint = activeGroup
                ? `/api/groups/${activeGroup._id}/leaderboard?type=${leaderboardType}`
                : `/api/leaderboard?type=${leaderboardType}`;

            const res = await fetch(endpoint, {
                headers: token ? { "Authorization": `Bearer ${token}` } : {}
            });
            const data = await res.json();

            let newLeaderboard = [];
            if (activeGroup) {
                if (data.leaderboard) {
                    newLeaderboard = data.leaderboard;
                }
            } else {
                if (Array.isArray(data)) {
                    newLeaderboard = data;
                }
            }

            setLeaderboard(newLeaderboard);
            const now = new Date();
            setLastRefresh(now);

            // Save to cache
            localStorage.setItem(cacheKey, JSON.stringify({
                data: newLeaderboard,
                timestamp: now.getTime()
            }));

        } catch (error) {
            console.error("Failed to fetch leaderboard:", error);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [leaderboardType, activeGroup, token, getCacheKey]);

    const refreshStats = async () => {
        if (!user || !token) return;

        // Thrift/Throttle Logic: Prevent sync if less than 60s
        if (lastRefresh) {
            const timeSinceLastRefresh = Date.now() - lastRefresh.getTime();
            if (timeSinceLastRefresh < 60000) {
                // Optional: You could add a toast here saying "Please wait X seconds"
                return;
            }
        }

        setIsRefreshing(true);
        try {
            await fetch("/api/users/refresh", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
            });
            await fetchUserGroups(); // Also update groups in case invited
            await fetchLeaderboard(true); // Force refresh
        } catch (error) {
            console.error("Failed to refresh stats:", error);
        } finally {
            setIsRefreshing(false);
        }
    };
    const handleCreateGroup = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setModalError("");

        try {
            const res = await fetch("/api/groups", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ name: newGroupName, description: newGroupDesc })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to create group");

            // Refresh groups and close modal
            await fetchUserGroups();
            setIsCreateGroupOpen(false);
            setNewGroupName("");
            setNewGroupDesc("");
            // Switch to new group
            setActiveGroup(data.group);
        } catch (error: any) {
            setModalError(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleJoinGroup = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setModalError("");

        try {
            const res = await fetch("/api/groups/join", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ code: joinCode })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to join group");

            // Refresh groups and close modal
            await fetchUserGroups();
            setIsJoinGroupOpen(false);
            setJoinCode("");
            // Switch to joined group
            setActiveGroup(data.group);
        } catch (error: any) {
            setModalError(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };
    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (user) {
            fetchUserGroups();
            fetchLeaderboard();
            // Removed auto-sync interval as requested
        }
    }, [user, fetchLeaderboard, fetchUserGroups]);

    if (authLoading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (!user) return null;

    const currentUserEntry = leaderboard.find(e => e.email === user.email);
    const myPoints = currentUserEntry?.todayPoints || 0;
    const myRank = currentUserEntry?.rank || '-';

    return (
        <div className="min-h-screen bg-white text-gray-800 font-sans">
            {/* Header - Google Style Navbar */}
            <header className="fixed top-0 inset-x-0 bg-white/90 backdrop-blur-md z-50 border-b border-gray-200">
                <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Image src="/logo.png" alt="Logo" width={40} height={40} className="object-contain" priority />
                        <span className="text-2xl font-medium tracking-tight text-gray-500">
                            DSA <span className="text-gray-900 font-semibold">Grinders</span>
                        </span>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={refreshStats}
                            disabled={isRefreshing || (lastRefresh !== null && Date.now() - lastRefresh.getTime() < 60000)}
                            className={`text-gray-600 hover:bg-gray-50 hover:text-blue-600 font-medium rounded-full px-4 ${isRefreshing || (lastRefresh !== null && Date.now() - lastRefresh.getTime() < 60000) ? 'opacity-50 cursor-not-allowed' : ''}`}
                            title={lastRefresh && Date.now() - lastRefresh.getTime() < 60000 ? "Please wait before syncing again" : "Sync Leaderboard"}
                        >
                            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                            Sync Stats
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push('/profile')}
                            className="text-gray-600 hover:bg-gray-50 hover:text-blue-600 font-medium rounded-full px-4"
                        >
                            Profile
                        </Button>
                        <div className="h-6 w-px bg-gray-200 mx-1"></div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={logout}
                            className="text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full h-9 w-9 p-0"
                            title="Logout"
                        >
                            <LogOut className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </header>

            <main className="max-w-[1000px] mx-auto pt-24 pb-12 px-6">

                {/* Minimalist Welcome/Roast - EMPHASIS principle */}
                <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700 focal-point">
                    <h1 className="text-display mb-4">
                        {myPoints === 0 ? "Zero points?" : "Keep climbing."}
                    </h1>
                    <p className="text-body max-w-2xl mx-auto">
                        {myPoints === 0 ? roast : "Great job solving problems today. Don't stop now."}
                    </p>
                </div>

                {/* Stats Grid - BALANCE & PROPORTION principles */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    {/* Today's Points - PRIMARY emphasis */}
                    <div className="bg-white rounded-3xl p-8 card-floating group group-primary">
                        <div className="h-14 w-14 bg-[#D2E3FC] rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <Target className="h-7 w-7 text-[#174EA6]" />
                        </div>
                        <p className="stat-primary mb-2">{myPoints}</p>
                        <p className="text-label text-[#174EA6]">Points Today</p>
                    </div>

                    {/* Rank - SECONDARY emphasis */}
                    <div className="bg-white rounded-3xl p-8 card-floating group group-warning">
                        <div className="h-14 w-14 bg-[#FEEFC3] rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <Crown className="h-7 w-7 text-[#E37400]" />
                        </div>
                        <p className="stat-primary mb-2">#{myRank}</p>
                        <p className="text-label text-[#E37400]">Current Rank</p>
                    </div>

                    {/* Total Problems - SUCCESS emphasis */}
                    <div className="bg-white rounded-3xl p-8 card-floating group group-success">
                        <div className="h-14 w-14 bg-[#CEEAD6] rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <Trophy className="h-7 w-7 text-[#0D652D]" />
                        </div>
                        <p className="stat-primary mb-2">{currentUserEntry?.totalProblems || 0}</p>
                        <p className="text-label text-[#0D652D]">Lifetime Solved</p>
                    </div>
                </div>

                {/* Leaderboard Table */}
                <div className="bg-white rounded-3xl overflow-hidden border border-gray-200 shadow-sm">


                    {/* Group Scope Selector */}
                    <div className="px-8 pb-0 pt-4 mb-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Button
                                variant={activeGroup === null ? "default" : "outline"}
                                onClick={() => setActiveGroup(null)}
                                className={`rounded-full px-6 ${activeGroup === null ? 'bg-gray-900 text-white hover:bg-gray-800' : 'text-gray-600 border-gray-200'}`}
                                size="sm"
                            >
                                Global
                            </Button>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant={activeGroup !== null ? "default" : "outline"}
                                        className={`rounded-full px-4 gap-2 ${activeGroup !== null ? 'bg-blue-600 text-white hover:bg-blue-700 border-blue-600' : 'text-gray-600 border-gray-200'}`}
                                        size="sm"
                                    >
                                        <Users className="w-4 h-4" />
                                        {activeGroup ? activeGroup.name : "Groups"}
                                        <ChevronRight className="w-4 h-4 rotate-90 opacity-50" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="w-56 p-2">
                                    <DropdownMenuLabel className="text-xs font-normal text-gray-500 uppercase tracking-wider px-2 py-1.5">
                                        Your Groups
                                    </DropdownMenuLabel>
                                    {userGroups.length === 0 ? (
                                        <div className="px-2 py-2 text-sm text-gray-500 italic">
                                            No groups yet
                                        </div>
                                    ) : (
                                        userGroups.map(group => (
                                            <DropdownMenuItem
                                                key={group._id}
                                                onClick={() => setActiveGroup(group)}
                                                className="cursor-pointer flex items-center justify-between"
                                            >
                                                <span className="truncate">{group.name}</span>
                                                {activeGroup?._id === group._id && (
                                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                                                )}
                                            </DropdownMenuItem>
                                        ))
                                    )}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => setIsCreateGroupOpen(true)} className="cursor-pointer gap-2 text-blue-600 focus:text-blue-700">
                                        <Plus className="w-4 h-4" />
                                        <span>Create Group</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setIsJoinGroupOpen(true)} className="cursor-pointer gap-2 text-blue-600 focus:text-blue-700">
                                        <Hash className="w-4 h-4" />
                                        <span>Join Group</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        {activeGroup && (
                            <div
                                className="flex items-center gap-2 text-sm bg-blue-50/50 px-3 py-1.5 rounded-full border border-blue-100 cursor-pointer hover:border-blue-300 transition-colors group/code animate-in fade-in zoom-in-95"
                                onClick={() => {
                                    navigator.clipboard.writeText(activeGroup.code);
                                    // TODO: Add toast
                                }}
                                title="Click to copy invite code"
                            >
                                <span className="text-blue-600 text-xs uppercase font-medium tracking-wide mr-1">Invite Code:</span>
                                <span className="font-mono font-bold text-blue-800 tracking-wider">{activeGroup.code}</span>
                                <Copy className="w-3.5 h-3.5 text-blue-400 group-hover/code:text-blue-600 ml-1" />
                            </div>
                        )}
                    </div>

                    <div className="px-8 py-3 flex items-center justify-between border-t border-gray-100 bg-gray-50/50 mt-2">
                        <div className="flex items-center gap-4">
                            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                                {activeGroup ? 'Group Rankings' : 'Global Rankings'}
                            </h2>
                            <div className="flex bg-gray-100 p-1 rounded-lg">
                                <button
                                    onClick={() => setLeaderboardType('daily')}
                                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${leaderboardType === 'daily'
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    Daily
                                </button>
                                <button
                                    onClick={() => setLeaderboardType('allTime')}
                                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${leaderboardType === 'allTime'
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    All Time
                                </button>
                            </div>
                        </div>
                        {lastRefresh && (
                            <span className="text-xs font-medium text-gray-400 bg-white px-3 py-1 rounded-full border border-gray-200">
                                Updated {lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        )}
                    </div>

                    {isLoading ? (
                        <div className="h-64 flex items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-600 opacity-50" />
                        </div>
                    ) : leaderboard.length === 0 ? (
                        <div className="h-64 flex flex-col items-center justify-center text-gray-400">
                            <p>No data available yet.</p>
                        </div>
                    ) : (
                        <>
                            {/* Header Row */}
                            <div className="px-8 py-3 flex items-center gap-6 bg-gray-50/50 border-b border-gray-100">
                                <div className="flex-1 min-w-0">
                                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Name</span>
                                </div>
                                <div className="flex gap-12 items-center">
                                    <div className="text-center w-20">
                                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Streak</span>
                                    </div>
                                    <div className="text-right w-20">
                                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total</span>
                                    </div>
                                    <div className="text-right w-20">
                                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Today</span>
                                    </div>
                                </div>
                            </div>

                            {/* Data Rows */}
                            <div className="divide-y divide-gray-100">
                                {leaderboard.map((entry, index) => (
                                    <div
                                        key={entry.id}
                                        className={`px-8 py-4 flex items-center gap-6 transition-colors hover:bg-gray-50 ${entry.email === user.email ? 'bg-blue-50/30' : ''
                                            }`}
                                    >
                                        {/* Avatar */}
                                        <div className="w-11 h-11 rounded-full overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200">
                                            {entry.avatar ? (
                                                <img src={entry.avatar} alt={entry.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-500 text-base font-semibold">
                                                    {entry.name.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0 relative group/profile">
                                            <div className="flex items-center gap-2">
                                                <a
                                                    href={`https://leetcode.com/${entry.leetcodeUsername}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="font-medium text-gray-900 hover:text-blue-600 transition-colors truncate"
                                                >
                                                    {entry.name}
                                                </a>
                                                {entry.github && (
                                                    <a
                                                        href={entry.github}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-gray-400 hover:text-gray-900 transition-colors"
                                                        title="GitHub Profile"
                                                    >
                                                        <Github className="w-3.5 h-3.5" />
                                                    </a>
                                                )}
                                                {entry.linkedin && (
                                                    <a
                                                        href={entry.linkedin}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-gray-400 hover:text-[#0077b5] transition-colors"
                                                        title="LinkedIn Profile"
                                                    >
                                                        <Linkedin className="w-3.5 h-3.5" />
                                                    </a>
                                                )}
                                                {entry.email === user.email && (
                                                    <span className="text-[10px] font-bold tracking-wide text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full uppercase">You</span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-gray-500 mt-0.5">
                                                <span className="font-normal truncate">@{entry.leetcodeUsername}</span>
                                                {entry.country && (
                                                    <span className="text-xs text-gray-400">• {entry.country}</span>
                                                )}
                                                {entry.lastSubmission && (
                                                    <span className="text-xs text-gray-400">• {getTimeAgo(entry.lastSubmission)}</span>
                                                )}
                                            </div>

                                            {/* Profile Hover Card */}
                                            <div className="absolute left-0 top-full mt-2 opacity-0 invisible group-hover/profile:opacity-100 group-hover/profile:visible transition-all duration-150 z-50 pointer-events-none">
                                                <div className="bg-white rounded-xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.15)] border border-gray-100 w-64">
                                                    <div className="flex items-center gap-3 mb-3 pb-3 border-b border-gray-100">
                                                        <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200">
                                                            {entry.avatar ? (
                                                                <img src={entry.avatar} alt={entry.name} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-gray-500 text-lg font-semibold">
                                                                    {entry.name.charAt(0).toUpperCase()}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="font-medium text-gray-900 truncate text-sm">{entry.name}</div>
                                                            <div className="text-xs text-gray-500 truncate">@{entry.leetcodeUsername}</div>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2.5 text-xs">
                                                        {(entry.ranking && entry.ranking > 0) && (
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-gray-500">Global Rank</span>
                                                                <span className="text-gray-900 font-medium">#{entry.ranking.toLocaleString()}</span>
                                                            </div>
                                                        )}
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-gray-500">Total Solved</span>
                                                            <span className="text-gray-900 font-medium">{entry.totalProblems || 0}</span>
                                                        </div>
                                                        {entry.streak > 0 && (
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-gray-500">Current Streak</span>
                                                                <span className="text-orange-600 font-medium">🔥 {entry.streak} days</span>
                                                            </div>
                                                        )}
                                                        {entry.country && (
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-gray-500">Location</span>
                                                                <span className="text-gray-900 font-medium">{entry.country}</span>
                                                            </div>
                                                        )}
                                                        {entry.lastSubmission && (
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-gray-500">Last Active</span>
                                                                <span className="text-gray-900 font-medium">{getTimeAgo(entry.lastSubmission)}</span>
                                                            </div>
                                                        )}

                                                        <div className="pt-2.5 mt-2.5 border-t border-gray-100">
                                                            <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-2 font-semibold">Points Breakdown</div>
                                                            <div className="space-y-1.5 text-xs font-mono">
                                                                <div className="flex items-center justify-between">
                                                                    <span className="text-gray-600">{entry.easy || 0} Easy × 1</span>
                                                                    <span className="text-[#0D652D] font-semibold">{(entry.easy || 0) * 1}</span>
                                                                </div>
                                                                <div className="flex items-center justify-between">
                                                                    <span className="text-gray-600">{entry.medium || 0} Med × 3</span>
                                                                    <span className="text-[#E37400] font-semibold">{(entry.medium || 0) * 3}</span>
                                                                </div>
                                                                <div className="flex items-center justify-between">
                                                                    <span className="text-gray-600">{entry.hard || 0} Hard × 6</span>
                                                                    <span className="text-[#A50E0E] font-semibold">{(entry.hard || 0) * 6}</span>
                                                                </div>
                                                                <div className="flex items-center justify-between pt-1.5 border-t border-gray-200 font-sans">
                                                                    <span className="text-gray-900 font-semibold">Total Points</span>
                                                                    <span className="text-gray-900 font-bold text-sm">{entry.totalScore}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex gap-12 items-center">
                                            <div className="text-center w-20">
                                                {entry.streak && entry.streak > 0 ? (
                                                    <span className="text-base font-medium text-orange-600 flex items-center justify-center gap-1">
                                                        🔥 {entry.streak}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-300">—</span>
                                                )}
                                            </div>
                                            <div className="text-right w-20 relative group">
                                                <span className="text-lg font-semibold text-gray-900 cursor-default">{entry.totalScore}</span>
                                                {/* Tooltip */}
                                                <div className="absolute bottom-full right-0 mb-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50 pointer-events-none">
                                                    <div className="bg-white rounded-lg px-4 py-3 shadow-[0_2px_8px_rgba(0,0,0,0.15)] border border-gray-100">
                                                        <div className="flex flex-col gap-1.5 text-xs">
                                                            <div className="flex items-center justify-between gap-4">
                                                                <span className="text-gray-500 font-normal">Easy</span>
                                                                <span className="text-gray-900 font-medium">{entry.easy || 0}</span>
                                                            </div>
                                                            <div className="flex items-center justify-between gap-4">
                                                                <span className="text-gray-500 font-normal">Medium</span>
                                                                <span className="text-gray-900 font-medium">{entry.medium || 0}</span>
                                                            </div>
                                                            <div className="flex items-center justify-between gap-4">
                                                                <span className="text-gray-500 font-normal">Hard</span>
                                                                <span className="text-gray-900 font-medium">{entry.hard || 0}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right w-20">
                                                <span className="text-lg font-medium text-blue-600">{entry.todayPoints}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </main >

            {/* Create Group Modal */}
            <Dialog open={isCreateGroupOpen} onOpenChange={setIsCreateGroupOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Create a New Group</DialogTitle>
                        <DialogDescription>
                            Create a private leaderboard for your friends or community.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateGroup}>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Group Name</Label>
                                <Input
                                    id="name"
                                    value={newGroupName}
                                    onChange={(e) => setNewGroupName(e.target.value)}
                                    placeholder="e.g., Dhurandhars Elite"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Description (Optional)</Label>
                                <Input
                                    id="description"
                                    value={newGroupDesc}
                                    onChange={(e) => setNewGroupDesc(e.target.value)}
                                    placeholder="What is this group about?"
                                />
                            </div>
                            {modalError && <p className="text-sm text-red-500">{modalError}</p>}
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsCreateGroupOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    "Create Group"
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Join Group Modal */}
            <Dialog open={isJoinGroupOpen} onOpenChange={setIsJoinGroupOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Join a Group</DialogTitle>
                        <DialogDescription>
                            Enter the 6-character code shared by the group admin.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleJoinGroup}>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="code">Group Code</Label>
                                <Input
                                    id="code"
                                    value={joinCode}
                                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                                    placeholder="e.g., X7K9P2"
                                    maxLength={6}
                                    required
                                    className="font-mono uppercase tracking-widest text-center text-lg"
                                />
                            </div>
                            {modalError && <p className="text-sm text-red-500">{modalError}</p>}
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsJoinGroupOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Joining...
                                    </>
                                ) : (
                                    "Join Group"
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
            
            {/* PWA Install Prompt */}
            <PWAInstallPrompt />
        </div>
    );
}
