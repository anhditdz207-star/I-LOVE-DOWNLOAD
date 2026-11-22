import type { Platform } from './types'

export type HEntry = { t: number; platform: Exclude<Platform, 'home'>; title: string; kind: 'video' | 'audio' | 'image'; label: string; url: string }
const KEY = 'ild:history', MAX = 30   // stored only in this browser (localStorage)

export function getHistory(): HEntry[] {
  try { const v = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(v) ? v : [] } catch { return [] }
}
export function addHistory(e: HEntry) {
  try {
    const rest = getHistory().filter(x => !(x.url === e.url && x.kind === e.kind && x.label === e.label))
    localStorage.setItem(KEY, JSON.stringify([e, ...rest].slice(0, MAX)))
    window.dispatchEvent(new Event('ild-history'))
  } catch { /* storage blocked: history is optional */ }
}
export function clearHistory() {
  try { localStorage.removeItem(KEY); window.dispatchEvent(new Event('ild-history')) } catch { /* ignore */ }
}
