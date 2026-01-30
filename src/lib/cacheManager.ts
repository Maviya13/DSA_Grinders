// Cache management utilities for leaderboard
// This allows manual cache invalidation when user syncs their stats

let leaderboardCacheMap: Map<string, any> | null = null;

export function setLeaderboardCache(cache: Map<string, any>) {
    leaderboardCacheMap = cache;
}

export function clearLeaderboardCache() {
    if (leaderboardCacheMap) {
        leaderboardCacheMap.clear();
        console.log('Server cache cleared');

        // Also clear service worker cache if available
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
            navigator.serviceWorker.controller?.postMessage({
                type: 'CLEAR_LEADERBOARD_CACHE'
            });
        }
    }
}
