"use client";

import { motion } from "framer-motion";
import { Trophy, Medal, Github, Linkedin, Flame, ExternalLink, Activity } from "lucide-react";
import { LeaderboardEntry } from "@/types";
import { getTimeAgo } from "@/lib/utils";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";

interface LeaderboardRowProps {
    entry: LeaderboardEntry;
    index: number;
    isCurrentUser: boolean;
}

export default function LeaderboardRow({ entry, index, isCurrentUser }: LeaderboardRowProps) {
    return (
        <motion.div
            variants={{
                hidden: { opacity: 0, y: 10 },
                visible: { opacity: 1, y: 0 }
            }}
            className={`px-4 md:px-8 py-5 flex items-center gap-4 md:gap-8 transition-all duration-300 hover:bg-muted/50 relative border-b border-border last:border-0 ${isCurrentUser ? 'bg-primary/5' : ''
                }`}
        >
            {/* Rank Indicator */}
            <div className="w-8 md:w-12 flex items-center justify-center shrink-0">
                {index === 0 ? (
                    <div className="relative">
                        <Trophy className="w-6 h-6 md:w-7 md:h-7 text-yellow-500" />
                    </div>
                ) : index === 1 ? (
                    <Medal className="w-6 h-6 md:w-7 md:h-7 text-gray-400" />
                ) : index === 2 ? (
                    <Medal className="w-6 h-6 md:w-7 md:h-7 text-amber-600" />
                ) : (
                    <span className="text-xs md:text-base font-black text-muted-foreground">#{index + 1}</span>
                )}
            </div>

            {/* Avatar & User Info Group */}
            <div className="flex-1 flex items-center gap-4 min-w-0">
                <HoverCard openDelay={200}>
                    <HoverCardTrigger asChild>
                        <div className="relative shrink-0 cursor-pointer group/avatar">
                            <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl overflow-hidden bg-card shrink-0 border-2 transition-all duration-300 group-hover/avatar:scale-105 ${isCurrentUser ? 'border-primary' : 'border-border'
                                }`}>
                                {entry.avatar ? (
                                    <img src={entry.avatar} alt={entry.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground text-lg md:text-xl font-black">
                                        {entry.name.charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>
                        </div>
                    </HoverCardTrigger>

                    <HoverCardContent className="w-80 p-0 overflow-hidden rounded-2xl border-border z-100" align="start">
                        <div className="p-6 relative bg-card">
                            <div className="flex items-center gap-4 mb-6 relative z-10">
                                <div className="w-16 h-16 rounded-2xl overflow-hidden bg-muted border-2 border-border shrink-0">
                                    {entry.avatar ? (
                                        <img src={entry.avatar} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xl font-black">{entry.name.charAt(0)}</div>
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <div className="font-black text-foreground text-xl pr-4">{entry.name.split(' ')[0]}</div>
                                    <div className="text-primary font-bold text-sm">@{entry.leetcodeUsername}</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mb-6 relative z-10">
                                <div className="bg-muted rounded-2xl p-4 border border-border">
                                    <div className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] mb-1">Global Rank</div>
                                    <div className="text-xl font-black text-foreground">#{entry.ranking?.toLocaleString() || '—'}</div>
                                </div>
                                <div className="bg-primary/10 rounded-2xl p-4 border border-primary/20">
                                    <div className="text-[10px] text-primary font-black uppercase tracking-[0.2em] mb-1">Daily Pts</div>
                                    <div className="text-xl font-black text-primary">+{entry.todayPoints}</div>
                                </div>
                            </div>

                            <div className="space-y-4 relative z-10">
                                <div className="flex justify-between items-center px-1">
                                    <span className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em]">Problem Density</span>
                                    <span className="text-[10px] font-black text-foreground bg-muted px-3 py-1 rounded-full uppercase tracking-wider">{entry.totalProblems} Solved</span>
                                </div>
                                <div className="space-y-3.5 px-1">
                                    {[
                                        { label: 'Easy', count: entry.easy, color: 'bg-emerald-500', width: (entry.easy || 0) / (entry.totalProblems || 1) * 100 },
                                        { label: 'Medium', count: entry.medium, color: 'bg-amber-500', width: (entry.medium || 0) / (entry.totalProblems || 1) * 100 },
                                        { label: 'Hard', count: entry.hard, color: 'bg-rose-500', width: (entry.hard || 0) / (entry.totalProblems || 1) * 100 }
                                    ].map(stat => (
                                        <div key={stat.label} className="space-y-1.5">
                                            <div className="flex justify-between text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                                                <span>{stat.label}</span>
                                                <span>{stat.count || 0}</span>
                                            </div>
                                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                                                <div className={`h-full ${stat.color} rounded-full`} style={{ width: `${stat.width}%` }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="mt-6 pt-6 border-t border-border flex justify-end items-center relative z-10">
                                {entry.streak && entry.streak > 0 && (
                                    <div className="flex items-center gap-1.5 text-[10px] font-black text-orange-600 dark:text-orange-400 bg-orange-500/10 px-3 py-1.5 rounded-xl border border-orange-500/20">
                                        <Flame className="w-3.5 h-3.5" />
                                        {entry.streak}D STREAK
                                    </div>
                                )}
                            </div>
                        </div>
                    </HoverCardContent>
                </HoverCard>

                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 md:gap-3 mb-1">
                        <span className="font-black text-sm md:text-xl text-foreground tracking-tight whitespace-nowrap">
                            {entry.name.split(' ')[0]}
                        </span>
                        {isCurrentUser && (
                            <span className="text-[7px] md:text-[9px] font-black tracking-[0.15em] text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-lg uppercase">YOU</span>
                        )}

                        <div className="flex items-center gap-2 ml-1">
                            {entry.github && (
                                <a href={entry.github} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-all hover:scale-110">
                                    <Github className="w-4 h-4" />
                                </a>
                            )}
                            {entry.linkedin && (
                                <a href={entry.linkedin} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-[#0077b5] transition-all hover:scale-110">
                                    <Linkedin className="w-4 h-4" />
                                </a>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="text-[10px] md:text-xs font-bold text-muted-foreground">@{entry.leetcodeUsername}</span>
                    </div>
                </div>
            </div>

            {/* Stats - with improved design */}
            <div className="flex gap-4 md:gap-10 items-center shrink-0">
                <div className="hidden lg:flex flex-col items-center w-16">
                    {entry.streak && entry.streak > 0 ? (
                        <div className="flex flex-col items-center justify-center p-2 rounded-2xl bg-orange-500/10 border border-orange-500/20 w-full">
                            <span className="text-xs font-black text-orange-600 dark:text-orange-400 uppercase tracking-widest mb-0.5">Streak</span>
                            <span className="text-lg font-black text-orange-600 dark:text-orange-400 leading-none">🔥 {entry.streak}</span>
                        </div>
                    ) : (
                        <div className="h-12 w-full flex items-center justify-center opacity-30">
                            <Flame className="w-6 h-6 text-muted-foreground" />
                        </div>
                    )}
                </div>

                <div className="flex flex-col items-end w-16 md:w-24">
                    <span className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Score</span>
                    <span className="text-lg md:text-2xl font-black text-foreground leading-none tabular-nums tracking-tighter">
                        {entry.totalScore.toLocaleString()}
                    </span>
                </div>

                <div className="flex flex-col items-end w-16 md:w-24">
                    <span className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Today</span>
                    <span className={`text-lg md:text-2xl font-black leading-none tabular-nums tracking-tighter ${entry.todayPoints > 0 ? 'text-primary' : 'text-muted-foreground'
                        }`}>
                        +{entry.todayPoints}
                    </span>
                </div>
            </div>
        </motion.div>
    );
}
