import { User, DailyStat, Group, Setting } from '@/db/schema';

export type { User, DailyStat, Group, Setting };

// ============================================================
// User Types
// ============================================================

export interface AuthenticatedUser {
    id: number;
    name: string;
    email: string;
    leetcodeUsername: string;
    github: string;
    linkedin: string | null;
    phoneNumber: string | null;
    role: string;
    isProfileIncomplete: boolean;
}

export interface PublicUserProfile {
    id: number;
    name: string;
    leetcodeUsername: string;
    github?: string;
    linkedin?: string;
    avatar?: string;
    country?: string;
}

// ============================================================
// LeetCode Types
// ============================================================

export interface LeetCodeSubmission {
    id: string;
    title: string;
    titleSlug: string;
    timestamp: string;
}

export interface LeetCodeStats {
    easy: number;
    medium: number;
    hard: number;
    total: number;
    ranking: number;
    avatar: string;
    country: string;
    recentSubmissions: LeetCodeSubmission[];
    streak: number;
    lastSubmission: string | null;
}

export interface LeetCodeAPIError {
    code: 'USER_NOT_FOUND' | 'PROFILE_PRIVATE' | 'RATE_LIMITED' | 'NETWORK_ERROR' | 'API_ERROR';
    message: string;
    retryable: boolean;
}

// ============================================================
// Leaderboard Types
// ============================================================

export interface LeaderboardEntry {
    id: number;
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
    recentProblems?: LeetCodeSubmission[];
    github?: string;
    linkedin?: string;
    rank: number;
}

// ============================================================
// Group Types
// ============================================================

export interface GroupWithMembership extends Group {
    isOwner: boolean;
    memberCount?: number;
}

// ============================================================
// API Response Types
// ============================================================

export interface ApiSuccessResponse<T> {
    data: T;
    message?: string;
}

export interface ApiErrorResponse {
    error: string;
    code?: string;
    details?: string;
    retryable?: boolean;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// Type guard to check if response is an error
export function isApiError(response: ApiResponse<unknown>): response is ApiErrorResponse {
    return 'error' in response;
}

// ============================================================
// Auth Sync Response
// ============================================================

export interface AuthSyncResponse {
    user: AuthenticatedUser;
}

// ============================================================
// Profile Update Types
// ============================================================

export interface ProfileUpdateRequest {
    name?: string;
    phoneNumber?: string | null;
    github?: string;
    linkedin?: string | null;
    leetcodeUsername?: string;
}

export interface ProfileUpdateResponse {
    user: AuthenticatedUser;
}

// ============================================================
// Cron Job Types
// ============================================================

export interface CronJobResult {
    username: string;
    email: string;
    phoneNumber: string | null;
    statsUpdate: { success: boolean; error?: string };
    emailSent: { success: boolean; skipped?: boolean; error?: string; reason?: string };
    whatsappSent: { success: boolean; skipped?: boolean; error?: string; reason?: string };
}

export interface CronJobSummary {
    totalUsers: number;
    statsUpdated: number;
    emailsSent: number;
    whatsappSent: number;
    emailsSkipped: number;
    whatsappSkipped: number;
}

// ============================================================
// Settings Types (extends schema)
// ============================================================

export interface AutomationSettings extends Setting {
    emailSchedule: string[];
    whatsappSchedule: string[];
    customSkipDates: string[];
}

// ============================================================
// Message Types
// ============================================================

export interface SendMessageResult {
    success: boolean;
    error?: string;
    data?: unknown;
}
