export type Platform = 'home' | 'youtube' | 'tiktok' | 'facebook' | 'instagram'
export type Theme = 'day' | 'night'
const rawBase = import.meta.env.VITE_API_BASE_URL ?? (import.meta.env.DEV ? 'http://localhost:8000' : '')
export const API_BASE_URL: string = rawBase.replace(/\/+$/, '')
// Optional: a separate backend only for YouTube (e.g. a spare always-on device at home, whose IP YouTube accepts). Empty = same backend.
export const YT_API_BASE_URL: string = (import.meta.env.VITE_YT_API_BASE_URL || '').replace(/\/+$/, '')
export const apiBase = (platform: Platform) => (platform === 'youtube' && YT_API_BASE_URL ? YT_API_BASE_URL : API_BASE_URL)
