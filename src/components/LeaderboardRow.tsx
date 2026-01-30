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
            className={`px-4 md:px-8 py-5 flex items-center gap-4 md:gap-8 transition-all duration-300 hover:bg-gray-50/50 relative border-b border-gray-50 last:border-0 ${isCurrentUser ? 'bg-blue-50/30' : ''
                }`}
        >
            {/* Rank Indicator */}
            <div className="w-8 md:w-12 flex items-center justify-center shrink-0">
                {index === 0 ? (
                    <div className="relative">
                        <Trophy className="w-6 h-6 md:w-7 md:h-7 text-yellow-500 drop-shadow-[0_0_12px_rgba(234,179,8,0.5)]" />
                        <motion.div
                            animate={{ opacity: [0.4, 0.8, 0.4] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="absolute inset-0 bg-yellow-400 blur-xl rounded-full -z-10"
                        />
                    </div>
                ) : index === 1 ? (
                    <Medal className="w-6 h-6 md:w-7 md:h-7 text-gray-400 drop-shadow-[0_0_8px_rgba(156,163,175,0.3)]" />
                ) : index === 2 ? (
                    <Medal className="w-6 h-6 md:w-7 md:h-7 text-amber-600 drop-shadow-[0_0_8px_rgba(180,83,9,0.3)]" />
                ) : (
                    <span className="text-xs md:text-base font-black text-gray-300">#{index + 1}</span>
                )}
            </div>

            {/* Avatar & User Info Group */}
            <div className="flex-1 flex items-center gap-4 min-w-0">
                <HoverCard openDelay={200}>
                    <HoverCardTrigger asChild>
                        <div className="relative shrink-0 cursor-pointer group/avatar">
                            <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl overflow-hidden bg-white shrink-0 border-2 transition-all duration-300 group-hover/avatar:scale-105 group-hover/avatar:shadow-lg ${isCurrentUser ? 'border-blue-400 shadow-blue-100' : 'border-gray-100 shadow-sm'
                                }`}>
                                {entry.avatar ? (
                                    <img src={entry.avatar} alt={entry.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-gray-50 to-gray-100 text-gray-400 text-lg md:text-xl font-black">
                                        {entry.name.charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>
                        </div>
                    </HoverCardTrigger>

                    <HoverCardContent className="w-80 p-0 overflow-hidden rounded-4xl border-gray-100 shadow-2xl z-100" align="start">
                        <div className="p-6 relative">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 blur-2xl" />

                            <div className="flex items-center gap-4 mb-6 relative z-10">
                                <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gray-50 border-2 border-white shadow-md shrink-0">
                                    {entry.avatar ? (
                                        <img src={entry.avatar} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xl font-black">{entry.name.charAt(0)}</div>
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <div className="font-black text-gray-900 text-xl pr-4">{entry.name.split(' ')[0]}</div>
                                    <div className="text-blue-600 font-bold text-sm">@{entry.leetcodeUsername}</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mb-6 relative z-10">
                                <div className="bg-gray-50/80 backdrop-blur-sm rounded-2xl p-4 border border-gray-100">
                                    <div className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mb-1">Global Rank</div>
                                    <div className="text-xl font-black text-gray-900">#{entry.ranking?.toLocaleString() || '—'}</div>
                                </div>
                                <div className="bg-blue-50/80 backdrop-blur-sm rounded-2xl p-4 border border-blue-100">
                                    <div className="text-[10px] text-blue-400 font-black uppercase tracking-[0.2em] mb-1">Daily Pts</div>
                                    <div className="text-xl font-black text-blue-600">+{entry.todayPoints}</div>
                                </div>
                            </div>

                            <div className="space-y-4 relative z-10">
                                <div className="flex justify-between items-center px-1">
                                    <span className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em]">Problem Density</span>
                                    <span className="text-[10px] font-black text-gray-900 bg-gray-100 px-3 py-1 rounded-full uppercase tracking-wider">{entry.totalProblems} Solved</span>
                                </div>
                                <div className="space-y-3.5 px-1">
                                    {[
                                        { label: 'Easy', count: entry.easy, color: 'bg-emerald-500', width: (entry.easy || 0) / (entry.totalProblems || 1) * 100 },
                                        { label: 'Medium', count: entry.medium, color: 'bg-amber-500', width: (entry.medium || 0) / (entry.totalProblems || 1) * 100 },
                                        { label: 'Hard', count: entry.hard, color: 'bg-rose-500', width: (entry.hard || 0) / (entry.totalProblems || 1) * 100 }
                                    ].map(stat => (
                                        <div key={stat.label} className="space-y-1.5">
                                            <div className="flex justify-between text-[9px] font-black text-gray-500 uppercase tracking-widest">
                                                <span>{stat.label}</span>
                                                <span>{stat.count || 0}</span>
                                            </div>
                                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                                <div className={`h-full ${stat.color} rounded-full shadow-sm`} style={{ width: `${stat.width}%` }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="mt-6 pt-6 border-t border-gray-100 flex justify-end items-center relative z-10">
                                {entry.streak && entry.streak > 0 && (
                                    <div className="flex items-center gap-1.5 text-[10px] font-black text-orange-600 bg-orange-50 px-3 py-1.5 rounded-xl border border-orange-100 shadow-sm">
                                        <Flame className="w-3.5 h-3.5 saturate-150" />
                                        {entry.streak}D STREAK
                                    </div>
                                )}
                            </div>
                        </div>
                    </HoverCardContent>
                </HoverCard>

                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 md:gap-3 mb-1">
                        <span className="font-black text-sm md:text-xl text-gray-900 tracking-tight whitespace-nowrap">
                            {entry.name.split(' ')[0]}
                        </span>
                        {isCurrentUser && (
                            <span className="text-[7px] md:text-[9px] font-black tracking-[0.15em] text-blue-600 bg-blue-100/50 border border-blue-200/50 px-2 py-0.5 rounded-lg uppercase">YOU</span>
                        )}

                        <div className="flex items-center gap-2 ml-1">
                            {entry.github && (
                                <a href={entry.github} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-gray-900 transition-all hover:scale-110">
                                    <Github className="w-4 h-4" />
                                </a>
                            )}
                            {entry.linkedin && (
                                <a href={entry.linkedin} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-[#0077b5] transition-all hover:scale-110">
                                    <Linkedin className="w-4 h-4" />
                                </a>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="text-[10px] md:text-xs font-bold text-gray-400">@{entry.leetcodeUsername}</span>
                    </div>
                </div>
            </div>

            {/* Stats - with improved design */}
            <div className="flex gap-4 md:gap-10 items-center shrink-0">
                <div className="hidden lg:flex flex-col items-center w-16">
                    {entry.streak && entry.streak > 0 ? (
                        <div className="flex flex-col items-center justify-center p-2 rounded-2xl bg-orange-50 border border-orange-100 w-full">
                            <span className="text-xs font-black text-orange-400 uppercase tracking-widest mb-0.5">Dhurandhar</span>
                            <span className="text-lg font-black text-orange-600 leading-none">🔥 {entry.streak}</span>
                        </div>
                    ) : (
                        <div className="h-12 w-full flex items-center justify-center grayscale opacity-30">
                            <Flame className="w-6 h-6 text-gray-300" />
                        </div>
                    )}
                </div>

                <div className="flex flex-col items-end w-16 md:w-24">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Score</span>
                    <span className="text-lg md:text-2xl font-black text-gray-900 leading-none tabular-nums tracking-tighter">
                        {entry.totalScore.toLocaleString()}
                    </span>
                </div>

                <div className="flex flex-col items-end w-16 md:w-24">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Today</span>
                    <span className={`text-lg md:text-2xl font-black leading-none tabular-nums tracking-tighter ${entry.todayPoints > 0 ? 'text-blue-600' : 'text-gray-300'
                        }`}>
                        +{entry.todayPoints}
                    </span>
                </div>
            </div>
        </motion.div>
    );
}
