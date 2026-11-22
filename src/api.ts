import { API_BASE_URL, type Platform } from './types'

export type VideoOpt = { id: string; label: string; ext: string; filesize: number | null }
export type AudioOpt = { id: string; format: string; bitrate: number | null; filesize: number | null; available: boolean }
export type ImageOpt = { id: string; label: string; ext: string; thumb: string }
export type MediaInfo = { title: string; thumbnail: string | null; duration: number | null; uploader: string | null; video: VideoOpt[]; audio: AudioOpt[]; images?: ImageOpt[]; imageToken?: string }

export const MOCK = import.meta.env.VITE_USE_MOCK === 'true'
const NAME = { youtube: 'YouTube', tiktok: 'TikTok', facebook: 'Facebook', instagram: 'Instagram' } as const
const HOSTS: Record<Exclude<Platform, 'home'>, string[]> = {
  facebook: ['facebook.com', 'www.facebook.com', 'm.facebook.com', 'web.facebook.com', 'fb.watch'],
  instagram: ['instagram.com', 'www.instagram.com', 'm.instagram.com'],
  youtube: ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com', 'youtu.be'],
  tiktok: ['tiktok.com', 'www.tiktok.com', 'm.tiktok.com', 'vm.tiktok.com', 'vt.tiktok.com'],
}

/** Client-side check only (UX). The backend must validate again. Returns an error message or null. */
export function checkUrl(p: Exclude<Platform, 'home'>, raw: string): string | null {
  let u: URL
  try { u = new URL(raw.trim()) } catch { return 'Liên kết không hợp lệ. Hãy dán đầy đủ địa chỉ bắt đầu bằng https://' }
  if (!/^https?:$/.test(u.protocol) || !HOSTS[p].includes(u.hostname.toLowerCase())) return `Đây không phải liên kết ${NAME[p]}. Hãy kiểm tra lại.`
  return null
}

const MOCK_INFO: MediaInfo = {
  title: 'Video mẫu (dữ liệu giả để thử giao diện)', thumbnail: null, duration: 213, uploader: 'Kênh mẫu',
  video: ['144p', '360p', '720p HD', '1080p Full HD'].map(l => ({ id: l, label: l, ext: 'mp4', filesize: null })),
  audio: [['MP3', 128], ['MP3', 320], ['M4A', 128], ['OPUS', 160], ['WAV', null], ['FLAC', null]].map(([f, b]) => ({
    id: `${f}-${b}`, format: f as string, bitrate: b as number | null, filesize: null, available: f !== 'FLAC' })),
}

export async function fetchInfo(p: Exclude<Platform, 'home'>, url: string): Promise<MediaInfo> {
  if (MOCK) { await new Promise(r => setTimeout(r, 900)); return MOCK_INFO }
  let res: Response
  try {
    res = await fetch(`${API_BASE_URL}/api/info`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url, platform: p }) })
  } catch { throw new Error('Không kết nối được máy chủ. Hãy kiểm tra backend đang chạy và địa chỉ API.') }
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.detail ?? `Máy chủ trả về lỗi (${res.status}). Hãy thử lại sau.`)
  }
  return res.json()
}

export const downloadUrl = (url: string, kind: 'video' | 'audio' | 'image', id: string, sel?: string) =>
  `${API_BASE_URL}/api/download?` + new URLSearchParams({ url, kind, id, ...(sel ? { sel } : {}) })
