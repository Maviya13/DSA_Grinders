"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/components/AuthContext";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Trophy, Target, Crown, LogOut, Github, Linkedin, Users, Plus, Hash, Copy, Settings, ChevronRight, Flame, Medal, Link as LinkIcon, Share2 } from "lucide-react";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
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
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (!user) return null;

    const currentUserEntry = leaderboard.find(e => e.email === user.email);
    const myPoints = currentUserEntry?.todayPoints || 0;
    const myRank = currentUserEntry?.rank || '-';

    return (
        <div className="min-h-screen bg-background text-foreground font-sans">
            {/* Header - Google Style Navbar */}
            <header className="fixed top-0 inset-x-0 bg-background/90 backdrop-blur-md z-50 border-b border-border">
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
                            className={`text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-blue-600 font-medium rounded-full px-2 md:px-4 ${isRefreshing || (lastRefresh !== null && Date.now() - lastRefresh.getTime() < 60000) ? 'opacity-50 cursor-not-allowed' : ''}`}
                            title={lastRefresh && Date.now() - lastRefresh.getTime() < 60000 ? "Please wait before syncing again" : "Sync Leaderboard"}
                        >
                            <RefreshCw className={`h-4 w-4 md:mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                            <span className="hidden md:inline">Sync Stats</span>
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push('/profile')}
                            className="text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-blue-600 font-medium rounded-full px-2 md:px-4"
                        >
                            <span className="hidden md:inline">Profile</span>
                            <Settings className="h-4 w-4 md:hidden" />
                        </Button>
                        <AnimatedThemeToggler className="h-8 w-8 md:h-9 md:w-9" />
                        <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-1"></div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={logout}
                            className="text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 rounded-full h-8 w-8 md:h-9 md:w-9 p-0"
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
                    <div className="bg-linear-to-br from-primary to-primary/80 rounded-[2.5rem] p-8 md:p-12 text-primary-foreground relative overflow-hidden">
                        {/* Decorative Circles - removed blur for cleaner look */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32" />
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24" />

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
                    <div className="lg:col-span-8 bg-card rounded-3xl border border-border relative overflow-hidden">


                        {/* Group Scope Selector */}
                        <div className="px-4 md:px-8 pb-0 pt-4 mb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 no-scrollbar">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" className="h-11 px-5 bg-card border-border hover:bg-muted transition-all rounded-2xl gap-3 group">
                                            <div className="flex flex-col items-start leading-tight">
                                                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest group-hover:text-primary transition-colors">Scope</span>
                                                <span className="text-sm font-bold text-foreground truncate max-w-[120px]">
                                                    {activeGroup ? activeGroup.name : 'Global'}
                                                </span>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
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
                                            <DropdownMenuItem onClick={() => setIsJoinGroupOpen(true)} className="cursor-pointer gap-2 text-blue-600 focus:text-blue-700 rounded-lg justify-center border border-blue-100 bg-blue-50/30 hover:bg-blue-50">
                                                <Hash className="w-3.5 h-3.5" />
                                                <span className="text-xs font-bold">Join</span>
                                            </DropdownMenuItem>
                                        </div>
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
                                </div>
                            )}
                        </div>

                        <div className="px-4 md:px-8 py-4 flex flex-col sm:flex-row sm:items-center justify-between border-t border-border bg-muted/20 mt-2 gap-4">
                            <div className="flex items-center gap-5">
                                <h2 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] whitespace-nowrap">
                                    {activeGroup ? 'Group Arena' : 'Global Arena'}
                                </h2>
                                <div className="flex bg-muted p-1 rounded-xl border border-border">
                                    <button
                                        onClick={() => setLeaderboardType('daily')}
                                        className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${leaderboardType === 'daily'
                                            ? 'bg-card text-primary ring-1 ring-border'
                                            : 'text-muted-foreground hover:text-foreground'
                                            }`}
                                    >
                                        Daily
                                    </button>
                                    <button
                                        onClick={() => setLeaderboardType('allTime')}
                                        className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${leaderboardType === 'allTime'
                                            ? 'bg-card text-primary ring-1 ring-border'
                                            : 'text-muted-foreground hover:text-foreground'
                                            }`}
                                    >
                                        All Time
                                    </button>
                                </div>
                            </div>
                            {lastRefresh && (
                                <span className="text-xs font-medium text-muted-foreground bg-card px-3 py-1 rounded-full border border-border self-start sm:self-auto">
                                    Updated {lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            )}
                        </div>

                        {isLoading ? (
                            <div className="animate-pulse">
                                {/* Skeleton Header */}
                                <div className="px-4 md:px-8 py-4 bg-gray-50/20 border-b border-gray-100 flex items-center gap-4 md:gap-8">
                                    <div className="w-8 md:w-12 flex justify-center shrink-0">
                                        <div className="h-3 w-8 bg-gray-200 rounded" />
                                    </div>
                                    <div className="flex-1 flex items-center gap-4 min-w-0">
                                        <div className="w-12 md:w-14 h-12 md:h-14 rounded-2xl bg-gray-200 shrink-0" />
                                        <div className="h-3 w-16 bg-gray-200 rounded" />
                                    </div>
                                    <div className="flex gap-4 md:gap-10 items-center shrink-0">
                                        <div className="hidden lg:block h-3 w-12 bg-gray-200 rounded" />
                                        <div className="h-3 w-12 bg-gray-200 rounded" />
                                        <div className="h-3 w-12 bg-gray-200 rounded" />
                                    </div>
                                </div>
                                {/* Skeleton Rows */}
                                {[...Array(6)].map((_, i) => (
                                    <div key={i} className="px-4 md:px-8 py-5 flex items-center gap-4 md:gap-8 border-b border-gray-50">
                                        <div className="w-8 md:w-12 flex justify-center shrink-0">
                                            {i < 3 ? (
                                                <div className="w-6 h-6 md:w-7 md:h-7 rounded-full bg-gray-200" />
                                            ) : (
                                                <div className="h-4 w-6 bg-gray-200 rounded" />
                                            )}
                                        </div>
                                        <div className="flex-1 flex items-center gap-4 min-w-0">
                                            <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gray-200 shrink-0" />
                                            <div className="space-y-2 flex-1">
                                                <div className="h-4 w-24 md:w-32 bg-gray-200 rounded" />
                                                <div className="h-3 w-16 md:w-20 bg-gray-150 rounded" style={{ backgroundColor: '#f0f0f0' }} />
                                            </div>
                                        </div>
                                        <div className="flex gap-4 md:gap-10 items-center shrink-0">
                                            <div className="hidden lg:block w-16">
                                                <div className="h-10 w-full bg-gray-200 rounded-2xl" />
                                            </div>
                                            <div className="w-16 md:w-24 space-y-1">
                                                <div className="h-2 w-10 bg-gray-200 rounded ml-auto" />
                                                <div className="h-5 w-12 bg-gray-200 rounded ml-auto" />
                                            </div>
                                            <div className="w-16 md:w-24 space-y-1">
                                                <div className="h-2 w-10 bg-gray-200 rounded ml-auto" />
                                                <div className="h-5 w-8 bg-gray-200 rounded ml-auto" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : leaderboard.length === 0 ? (
                            <div className="h-64 flex flex-col items-center justify-center text-muted-foreground">
                                <p>No data available yet.</p>
                            </div>
                        ) : (
                            <>
                                {/* Header Row - Hidden on small mobile */}
                                <div className="px-4 md:px-8 py-4 bg-muted/20 border-b border-border flex items-center gap-4 md:gap-8">
                                    <div className="w-8 md:w-12 flex justify-center shrink-0">
                                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Rank</span>
                                    </div>
                                    <div className="flex-1 flex items-center gap-4 min-w-0">
                                        <div className="w-12 md:w-14 shrink-0 opacity-0" />
                                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">User</span>
                                    </div>
                                    <div className="flex gap-4 md:gap-10 items-center shrink-0">
                                        <div className="hidden lg:flex justify-center w-16">
                                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Streak</span>
                                        </div>
                                        <div className="text-right w-16 md:w-24">
                                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Score</span>
                                        </div>
                                        <div className="text-right w-16 md:w-24">
                                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Today</span>
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
                                            isCurrentUser={entry.email === user?.email}
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
