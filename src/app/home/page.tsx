"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/components/AuthContext";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Trophy, Target, Crown, LogOut, Github, Linkedin, Users, Plus, Hash, Copy, Settings, ChevronRight, Flame, Medal, Link as LinkIcon, Share2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea"; // Assuming it exists, if not I'll use Input or standard textarea
import { toast } from "sonner";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import { getRandomRoast } from "@/config/messages";
import ActivityFeed from "@/components/ActivityFeed";
import { LeaderboardEntry, LeetCodeSubmission, Group } from "@/types";
import LeaderboardRow from "@/components/LeaderboardRow";


// Utility moved to src/lib/utils.ts

export default function HomePage() {
    const { user, logout, isLoading: authLoading, token } = useAuth();
    const router = useRouter();
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [activities, setActivities] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
    const [roast, setRoast] = useState("");

    useEffect(() => {
        setRoast(getRandomRoast());
    }, []);

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
                    const updated = data.groups.find((g: Group) => g.id === activeGroup.id);
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
        return `leaderboard_cache_${activeGroup ? activeGroup.id : 'global'}_${leaderboardType}`;
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
                        const entries = Array.isArray(parsed.data) ? parsed.data : parsed.data.entries;
                        const dailyRoastData = parsed.data.dailyRoast;

                        setLeaderboard(entries);
                        if (parsed.data.activities) {
                            setActivities(parsed.data.activities);
                        }
                        if (dailyRoastData?.roast) {
                            const personalizedRoast = dailyRoastData.roast.replace(/\[NAME\]/g, user?.name?.split(' ')[0] || "Dhurandhar");
                            setRoast(personalizedRoast);
                        }
                        setLastRefresh(new Date(parsed.timestamp));
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
                ? `/api/groups/${activeGroup.id}/leaderboard?type=${leaderboardType}`
                : `/api/leaderboard?type=${leaderboardType}`;

            const res = await fetch(endpoint, {
                headers: token ? { "Authorization": `Bearer ${token}` } : {}
            });
            const data = await res.json();

            let newLeaderboard = [];
            let dailyRoastData = null;

            if (activeGroup) {
                if (data.leaderboard) {
                    newLeaderboard = data.leaderboard;
                }
                dailyRoastData = data.dailyRoast;
            } else {
                if (Array.isArray(data)) {
                    newLeaderboard = data;
                } else if (data.entries) {
                    newLeaderboard = data.entries;
                    dailyRoastData = data.dailyRoast;
                }
            }

            setLeaderboard(newLeaderboard);
            if (data.activities) {
                setActivities(data.activities);
            }
            if (dailyRoastData?.roast) {
                const personalizedRoast = dailyRoastData.roast.replace(/\[NAME\]/g, user?.name?.split(' ')[0] || "Dhurandhar");
                setRoast(personalizedRoast);
            }

            const now = new Date();
            setLastRefresh(now);

            // Save to cache
            localStorage.setItem(cacheKey, JSON.stringify({
                data: data, // Save the full response to cache AI content
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

    // Get base URL for share links (works on localhost and Vercel)
    const getBaseUrl = () => {
        if (typeof window !== 'undefined') {
            return window.location.origin;
        }
        return process.env.NEXT_PUBLIC_APP_URL || 'https://dsa-grinders.vercel.app';
    };

    // Handle share link generation and copy
    const handleShareGroup = async (group: Group) => {
        try {
            const baseUrl = getBaseUrl();
            const shareUrl = `${baseUrl}/home?join=${group.code}`;

            await navigator.clipboard.writeText(shareUrl);
            toast.success('Share link copied!', {
                description: 'Anyone with this link can join your group',
                duration: 3000,
            });
        } catch (error) {
            toast.error('Failed to copy link', {
                description: 'Please try again',
                duration: 3000,
            });
        }
    };

    // Check for join code in URL parameters
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const joinCodeParam = params.get('join');

            if (joinCodeParam) {
                setJoinCode(joinCodeParam.toUpperCase());
                setIsJoinGroupOpen(true);
                // Clean URL after opening modal
                window.history.replaceState({}, '', window.location.pathname);
            }
        }
    }, []);

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
                <div className="max-w-[1200px] mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2 md:gap-3">
                        <Image src="/logo.png" alt="Logo" width={32} height={32} className="object-contain md:w-10 md:h-10" priority />
                        <span className="text-xl md:text-2xl font-medium tracking-tight text-gray-500">
                            DSA <span className="text-gray-900 font-semibold">Grinders</span>
                        </span>
                    </div>

                    <div className="flex items-center gap-1 md:gap-3">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={refreshStats}
                            disabled={isRefreshing || (lastRefresh !== null && Date.now() - lastRefresh.getTime() < 60000)}
                            className={`text-gray-600 hover:bg-gray-50 hover:text-blue-600 font-medium rounded-full px-2 md:px-4 ${isRefreshing || (lastRefresh !== null && Date.now() - lastRefresh.getTime() < 60000) ? 'opacity-50 cursor-not-allowed' : ''}`}
                            title={lastRefresh && Date.now() - lastRefresh.getTime() < 60000 ? "Please wait before syncing again" : "Sync Leaderboard"}
                        >
                            <RefreshCw className={`h-4 w-4 md:mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                            <span className="hidden md:inline">Sync Stats</span>
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push('/profile')}
                            className="text-gray-600 hover:bg-gray-50 hover:text-blue-600 font-medium rounded-full px-2 md:px-4"
                        >
                            <span className="hidden md:inline">Profile</span>
                            <Settings className="h-4 w-4 md:hidden" />
                        </Button>
                        <div className="h-6 w-px bg-gray-200 mx-1"></div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={logout}
                            className="text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full h-8 w-8 md:h-9 md:w-9 p-0"
                            title="Logout"
                        >
                            <LogOut className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </header>

            <main className="max-w-[1200px] mx-auto pt-24 pb-12 px-6">

                {/* Personal Dashboard Overview - GROWTH & ONBOARDING focus */}
                <div className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                    <div className="bg-linear-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] p-8 md:p-12 text-white shadow-2xl shadow-blue-200 relative overflow-hidden">
                        {/* Decorative Circles */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-400/20 rounded-full -ml-24 -mb-24 blur-3xl" />

                        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                            <div className="flex items-center gap-6">
                                <div className="w-20 h-20 md:w-24 md:h-24 rounded-3xl overflow-hidden bg-white/20 backdrop-blur-md border-2 border-white/30 p-1 shrink-0">
                                    {currentUserEntry?.avatar ? (
                                        <img src={currentUserEntry.avatar} alt="" className="w-full h-full object-cover rounded-2xl" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-white text-3xl font-black">
                                            {user?.name?.charAt(0)}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-2">
                                        Hi, {user?.name?.split(' ')[0]}! 👋
                                    </h1>
                                    <p className="text-blue-100 text-lg font-medium opacity-90 max-w-sm">
                                        {myPoints === 0 ? "Start your day with a problem!" : "You're on fire! Keep that momentum going."}
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-4 md:gap-8 w-full md:w-auto">
                                <div className="flex-1 md:flex-none bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/10 text-center md:text-left min-w-[140px]">
                                    <div className="text-blue-200 text-[10px] font-black uppercase tracking-widest mb-1">Rank</div>
                                    <div className="text-3xl font-black">#{myRank}</div>
                                </div>
                                <div className="flex-1 md:flex-none bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/10 text-center md:text-left min-w-[140px]">
                                    <div className="text-blue-200 text-[10px] font-black uppercase tracking-widest mb-1">Score</div>
                                    <div className="text-3xl font-black">+{myPoints}</div>
                                </div>
                                <div className="hidden sm:block flex-1 md:flex-none bg-emerald-500/20 backdrop-blur-md rounded-3xl p-6 border border-emerald-400/20 text-center md:text-left min-w-[140px]">
                                    <div className="text-emerald-300 text-[10px] font-black uppercase tracking-widest mb-1">Streak</div>
                                    <div className="text-3xl font-black flex items-center gap-2">
                                        🔥 {currentUserEntry?.streak || 0}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Left Column: Leaderboard */}
                    <div className="lg:col-span-8 bg-white rounded-3xl border border-gray-200 shadow-sm relative overflow-hidden">


                        {/* Group Scope Selector */}
                        <div className="px-4 md:px-8 pb-0 pt-4 mb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 no-scrollbar">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" className="h-11 px-5 bg-white border-gray-100 shadow-sm hover:shadow-md hover:bg-gray-50 transition-all rounded-2xl gap-3 group">
                                            <div className="flex flex-col items-start leading-tight">
                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest group-hover:text-blue-500 transition-colors">Scope</span>
                                                <span className="text-sm font-bold text-gray-900 truncate max-w-[120px]">
                                                    {activeGroup ? activeGroup.name : 'Global'}
                                                </span>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start" className="w-56 p-2">
                                        <DropdownMenuLabel className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2.5 py-2">
                                            Your Communities
                                        </DropdownMenuLabel>
                                        <DropdownMenuItem
                                            onClick={() => setActiveGroup(null)}
                                            className={`cursor-pointer flex items-center justify-between rounded-xl mb-1 ${!activeGroup ? 'bg-blue-50 text-blue-700 font-bold' : ''}`}
                                        >
                                            <span className="truncate">Global</span>
                                            {!activeGroup && <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
                                        </DropdownMenuItem>
                                        {userGroups.length > 0 && <DropdownMenuSeparator className="opacity-50" />}
                                        <div className="max-h-[200px] overflow-y-auto pr-1">
                                            {userGroups.map(group => (
                                                <DropdownMenuItem
                                                    key={group.id}
                                                    onClick={() => setActiveGroup(group)}
                                                    className={`cursor-pointer flex items-center justify-between rounded-xl mb-1 ${activeGroup?.id === group.id ? 'bg-blue-50 text-blue-700 font-bold' : ''}`}
                                                >
                                                    <span className="truncate">{group.name}</span>
                                                    {activeGroup?.id === group.id && (
                                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                                                    )}
                                                </DropdownMenuItem>
                                            ))}
                                        </div>
                                        <DropdownMenuSeparator className="opacity-50" />
                                        <div className="grid grid-cols-2 gap-1 p-1">
                                            <DropdownMenuItem onClick={() => setIsCreateGroupOpen(true)} className="cursor-pointer gap-2 text-blue-600 focus:text-blue-700 rounded-lg justify-center border border-blue-100 bg-blue-50/30 hover:bg-blue-50">
                                                <Plus className="w-3.5 h-3.5" />
                                                <span className="text-xs font-bold">New</span>
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
                            <div className="flex items-center gap-2 animate-in fade-in zoom-in-95 self-start sm:self-auto">
                                <div
                                    className="flex items-center gap-2 text-sm bg-blue-50/50 px-3 py-1.5 rounded-full border border-blue-100 cursor-pointer hover:border-blue-300 transition-colors group/code"
                                    onClick={() => {
                                        navigator.clipboard.writeText(activeGroup.code);
                                        toast.success('Code copied!', { duration: 2000 });
                                    }}
                                    title="Click to copy invite code"
                                >
                                    <span className="text-blue-600 text-xs uppercase font-medium tracking-wide mr-1">Code:</span>
                                    <span className="font-mono font-bold text-blue-800 tracking-wider font-size-xs">{activeGroup.code}</span>
                                    <Copy className="w-3.5 h-3.5 text-blue-400 group-hover/code:text-blue-600 ml-1" />
                                </div>
                                <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => handleShareGroup(activeGroup)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-4 py-1.5 h-auto text-xs font-medium flex items-center gap-2 shadow-sm"
                                    title="Generate and copy share link"
                                >
                                    <Share2 className="w-3.5 h-3.5" />
                                    <span className="hidden sm:inline">Share Link</span>
                                </Button>
                                            <DropdownMenuItem onClick={() => setIsJoinGroupOpen(true)} className="cursor-pointer gap-2 text-indigo-600 focus:text-indigo-700 rounded-lg justify-center border border-indigo-100 bg-indigo-50/30 hover:bg-indigo-50">
                                                <Hash className="w-3.5 h-3.5" />
                                                <span className="text-xs font-bold">Join</span>
                                            </DropdownMenuItem>
                                        </div>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            {activeGroup && (
                                <div
                                    className="flex items-center gap-3 bg-indigo-50/50 px-4 py-2 rounded-2xl border border-indigo-100/50 cursor-pointer hover:bg-indigo-50 hover:border-indigo-200 transition-all group/code animate-in fade-in zoom-in-95 self-start sm:self-auto shadow-sm"
                                    onClick={() => {
                                        navigator.clipboard.writeText(activeGroup.code);
                                        // TODO: Add toast
                                    }}
                                    title="Click to copy invite code"
                                >
                                    <div className="flex flex-col">
                                        <span className="text-[9px] text-indigo-400 uppercase font-black tracking-widest leading-none mb-0.5">Invite Code</span>
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono font-bold text-indigo-700 tracking-widest text-sm">{activeGroup.code}</span>
                                            <Copy className="w-3.5 h-3.5 text-indigo-300 group-hover/code:text-indigo-600 transition-colors" />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="px-4 md:px-8 py-4 flex flex-col sm:flex-row sm:items-center justify-between border-t border-gray-100 bg-gray-50/20 mt-2 gap-4">
                            <div className="flex items-center gap-5">
                                <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] whitespace-nowrap">
                                    {activeGroup ? 'Group Arena' : 'Global Arena'}
                                </h2>
                                <div className="flex bg-gray-200/50 p-1 rounded-xl border border-gray-100">
                                    <button
                                        onClick={() => setLeaderboardType('daily')}
                                        className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${leaderboardType === 'daily'
                                            ? 'bg-white text-blue-600 shadow-md transform scale-102 ring-1 ring-black/5'
                                            : 'text-gray-400 hover:text-gray-600'
                                            }`}
                                    >
                                        Daily
                                    </button>
                                    <button
                                        onClick={() => setLeaderboardType('allTime')}
                                        className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${leaderboardType === 'allTime'
                                            ? 'bg-white text-blue-600 shadow-md transform scale-102 ring-1 ring-black/5'
                                            : 'text-gray-400 hover:text-gray-600'
                                            }`}
                                    >
                                        All Time
                                    </button>
                                </div>
                            </div>
                            {lastRefresh && (
                                <span className="text-xs font-medium text-gray-400 bg-white px-3 py-1 rounded-full border border-gray-200 self-start sm:self-auto">
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
                                {/* Header Row - Hidden on small mobile */}
                                <div className="px-4 md:px-8 py-4 bg-gray-50/20 border-b border-gray-100 flex items-center gap-4 md:gap-8">
                                    <div className="w-8 md:w-12 flex justify-center shrink-0">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Rank</span>
                                    </div>
                                    <div className="flex-1 flex items-center gap-4 min-w-0">
                                        <div className="w-12 md:w-14 shrink-0 opacity-0" />
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">User</span>
                                    </div>
                                    <div className="flex gap-4 md:gap-10 items-center shrink-0">
                                        <div className="hidden lg:flex justify-center w-16">
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Streak</span>
                                        </div>

                                        <div className="flex-1 min-w-0 relative">
                                            <div className="flex items-center gap-2">
                                                <a
                                                    href={`https://leetcode.com/${entry.leetcodeUsername}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="font-medium text-sm md:text-base text-gray-900 hover:text-blue-600 transition-colors truncate"
                                                >
                                                    {entry.name}
                                                </a>
                                                <div className="hidden sm:flex items-center gap-1">
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
                                                </div>
                                                {entry.email === user.email && (
                                                    <span className="text-[8px] md:text-[10px] font-bold tracking-wide text-blue-600 bg-blue-100 px-1.5 md:px-2 py-0.5 rounded-full uppercase">You</span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1.5 md:gap-2 text-[10px] md:text-sm text-gray-500 mt-0.5">
                                                <span className="font-normal truncate max-w-[80px] md:max-w-none">@{entry.leetcodeUsername}</span>
                                                {entry.streak && entry.streak > 0 && (
                                                    <span className="flex items-center gap-0.5 text-orange-600 font-semibold text-[8px] md:text-xs bg-orange-50 px-1 md:px-1.5 py-0.5 rounded-full whitespace-nowrap">
                                                        <Flame className="w-2.5 h-2.5 md:w-3 md:h-3" />
                                                        {entry.streak}
                                                    </span>
                                                )}
                                                <span className="hidden md:inline text-gray-400">
                                                    {entry.country && `• ${entry.country}`}
                                                    {entry.lastSubmission && ` • ${getTimeAgo(entry.lastSubmission)}`}
                                                </span>
                                            </div>

                                            {/* Profile Hover Card - Hidden on touch devices */}
                                            <AnimatePresence>
                                                <div className="absolute left-1/2 -translate-x-1/2 opacity-0 invisible md:group-hover/profile:opacity-100 md:group-hover/profile:visible transition-all duration-300 z-100 pointer-events-none md:group-hover/profile:pointer-events-auto"
                                                    style={{
                                                        [index < 3 ? 'top' : 'bottom']: '100%',
                                                        marginTop: index < 3 ? '0.5rem' : '0',
                                                        marginBottom: index < 3 ? '0' : '0.5rem',
                                                    }}
                                                >
                                                    <motion.div
                                                        initial={{ opacity: 0, scale: 0.95, y: index < 3 ? -10 : 10 }}
                                                        whileHover={{ scale: 1.02 }}
                                                        animate={{
                                                            opacity: 1,
                                                            scale: 1,
                                                            y: 0,
                                                        }}
                                                        className="bg-white/80 backdrop-blur-xl rounded-2xl p-5 shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-white/20 w-80 overflow-hidden relative"
                                                    >
                                                        {/* Decorative Background */}
                                                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none" />

                                                        <div className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-100/50 relative">
                                                            <div className="w-16 h-16 rounded-2xl overflow-hidden bg-linear-to-br from-blue-50 to-indigo-50 shrink-0 border-2 border-white shadow-sm">
                                                                {entry.avatar ? (
                                                                    <img src={entry.avatar} alt={entry.name} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center text-blue-600 text-2xl font-bold">
                                                                        {entry.name.charAt(0).toUpperCase()}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="font-bold text-gray-900 text-lg leading-tight truncate">{entry.name}</div>
                                                                <div className="text-sm text-blue-600 font-semibold truncate hover:underline cursor-pointer">
                                                                    <a href={`https://leetcode.com/${entry.leetcodeUsername}`} target="_blank" rel="noopener noreferrer">
                                                                        @{entry.leetcodeUsername}
                                                                    </a>
                                                                </div>
                                                                <div className="flex gap-1.5 mt-2">
                                                                    {entry.github && (
                                                                        <a href={entry.github} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg bg-gray-50 text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-all border border-gray-100" title="GitHub">
                                                                            <Github className="w-4 h-4" />
                                                                        </a>
                                                                    )}
                                                                    {entry.linkedin && (
                                                                        <a href={entry.linkedin} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg bg-gray-50 text-gray-400 hover:text-[#0077b5] hover:bg-blue-50 transition-all border border-gray-100" title="LinkedIn">
                                                                            <Linkedin className="w-4 h-4" />
                                                                        </a>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="space-y-4 relative">
                                                            <div className="grid grid-cols-2 gap-3">
                                                                <div className="bg-linear-to-br from-gray-50/50 to-white rounded-2xl p-3 border border-gray-100 shadow-xs">
                                                                    <div className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">Global Rank</div>
                                                                    <div className="text-base font-bold text-gray-900">
                                                                        {entry.ranking && entry.ranking > 0 ? `#${entry.ranking.toLocaleString()}` : '—'}
                                                                    </div>
                                                                </div>
                                                                <div className="bg-linear-to-br from-blue-50/50 to-blue-100/20 rounded-2xl p-3 border border-blue-50/50 shadow-xs">
                                                                    <div className="text-[10px] text-blue-400 uppercase font-black tracking-widest mb-1">Daily Gain</div>
                                                                    <div className="text-base font-bold text-blue-600">+{entry.todayPoints} pts</div>
                                                                </div>
                                                            </div>

                                                            <div className="bg-gray-50/30 backdrop-blur-sm rounded-2xl p-4 border border-gray-100/50 shadow-xs">
                                                                <div className="flex justify-between items-center mb-3">
                                                                    <span className="text-[10px] text-gray-400 uppercase font-black tracking-widest">Problem Stats</span>
                                                                    <span className="text-xs font-bold text-gray-900 bg-white px-2 py-0.5 rounded-md border border-gray-100 shadow-xs">{entry.totalProblems} Total</span>
                                                                </div>
                                                                <div className="space-y-3">
                                                                    {[
                                                                        { label: 'Easy', count: entry.easy, color: 'bg-linear-to-r from-emerald-400 to-emerald-600', textColor: 'text-emerald-600' },
                                                                        { label: 'Medium', count: entry.medium, color: 'bg-linear-to-r from-amber-400 to-amber-600', textColor: 'text-amber-600' },
                                                                        { label: 'Hard', count: entry.hard, color: 'bg-linear-to-r from-rose-500 to-rose-700', textColor: 'text-rose-600' }
                                                                    ].map((stat) => (
                                                                        <div key={stat.label} className="space-y-1.5">
                                                                            <div className="flex justify-between text-[10px] font-bold">
                                                                                <span className={stat.textColor}>{stat.label}</span>
                                                                                <span className="text-gray-500">{stat.count || 0}</span>
                                                                            </div>
                                                                            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                                                                <motion.div
                                                                                    initial={{ width: 0 }}
                                                                                    animate={{ width: `${entry.totalProblems ? ((stat.count || 0) / entry.totalProblems) * 100 : 0}%` }}
                                                                                    transition={{ duration: 0.8, ease: "easeOut" }}
                                                                                    className={`h-full ${stat.color} rounded-full`}
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center justify-between pt-1">
                                                                <div className="flex items-center gap-2 text-[10px] font-medium text-gray-400">
                                                                    <span className="relative flex h-2 w-2">
                                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                                                    </span>
                                                                    {entry.lastSubmission ? `Active ${getTimeAgo(entry.lastSubmission)}` : 'Inactive recently'}
                                                                </div>
                                                                {entry.streak && entry.streak > 0 && (
                                                                    <div className="text-[10px] font-black text-orange-600 bg-orange-100/50 backdrop-blur-sm px-2.5 py-1 rounded-full border border-orange-200/50">
                                                                        🔥 {entry.streak}D STREAK
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                </div>
                                            </AnimatePresence>
                                        <div className="text-right w-16 md:w-24">
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Score</span>
                                        </div>
                                        <div className="text-right w-16 md:w-24">
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Today</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Data Rows - key changes force re-animation when switching groups */}
                                <motion.div
                                    key={`leaderboard-${activeGroup?.id ?? 'global'}-${leaderboardType}`}
                                    className="divide-y divide-gray-100"
                                    initial="hidden"
                                    animate="visible"
                                    variants={{
                                        hidden: { opacity: 0 },
                                        visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
                                    }}
                                >
                                    {leaderboard.map((entry, index) => (
                                        <LeaderboardRow
                                            key={entry.id}
                                            entry={entry}
                                            index={index}
                                            isCurrentUser={entry.email === user.email}
                                        />
                                    ))}
                                </motion.div>
                            </>
                        )}
                    </div>

                    {/* Right Column: Activity Feed */}
                    <div className="lg:col-span-4">
                        <ActivityFeed entries={leaderboard} activities={activities} />
                    </div>
                </div>
            </main>

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
