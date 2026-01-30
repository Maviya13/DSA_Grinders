import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getTodayDate(): string {
  // Returns YYYY-MM-DD in UTC
  return new Date().toISOString().split('T')[0];
}

export function getTimeAgo(timestamp: string | null | undefined): string {
  if (!timestamp) return 'Never';
  const now = Date.now();
  const then = parseInt(timestamp) * 1000;
  const diff = now - then;
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return 'Long ago';
}
