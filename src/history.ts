import type { Platform } from './types'

// Search history: every link successfully looked up, kept in this browser only (localStorage), so it survives a page reload.
export type HEntry = { t: number; platform: Exclude<Platform, 'home'>; title: string; url: string }
const KEY = 'ild:history', MAX = 40

export function getHistory(): HEntry[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || '[]')
    return Array.isArray(v) ? v.filter(e => e && typeof e.url === 'string' && typeof e.title === 'string' && typeof e.platform === 'string') : []
  } catch { return [] }
}
export function addHistory(e: HEntry) {
  try {
    const rest = getHistory().filter(x => !(x.url === e.url && x.platform === e.platform))
    localStorage.setItem(KEY, JSON.stringify([e, ...rest].slice(0, MAX)))
    window.dispatchEvent(new Event('ild-history'))
  } catch { /* storage blocked: history is optional */ }
}
export function clearHistory() {
  try { localStorage.removeItem(KEY); window.dispatchEvent(new Event('ild-history')) } catch { /* ignore */ }
}
