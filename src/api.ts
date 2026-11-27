import { API_BASE_URL, apiBase, type Platform } from './types'

export type VideoOpt = { id: string; label: string; ext: string; filesize: number | null }
export type AudioOpt = { id: string; format: string; bitrate: number | null; filesize: number | null; available: boolean }
export type ImageOpt = { id: string; label: string; ext: string; thumb: string }
export type MediaInfo = { title: string; thumbnail: string | null; duration: number | null; uploader: string | null; video: VideoOpt[]; audio: AudioOpt[]; images?: ImageOpt[]; imageToken?: string; avatar?: boolean }

export class ApiError extends Error {
  constructor(msg: string, public status: number) { super(msg) }
}

export const MOCK = import.meta.env.VITE_USE_MOCK === 'true'
const NAME: Record<string, string> = { youtube: 'YouTube', tiktok: 'TikTok', facebook: 'Facebook', instagram: 'Instagram', google: 'Google / Web', direct: 'Trực tiếp' }
const HOSTS: Record<string, string[]> = {
  facebook: ['facebook.com', 'www.facebook.com', 'm.facebook.com', 'web.facebook.com', 'fb.watch'],
  instagram: ['instagram.com', 'www.instagram.com', 'm.instagram.com'],
  youtube: ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com', 'youtu.be'],
  tiktok: ['tiktok.com', 'www.tiktok.com', 'm.tiktok.com', 'vm.tiktok.com', 'vt.tiktok.com'],
  google: ['google.com', 'www.google.com', 'drive.google.com', 'docs.google.com', 'photos.google.com'],
}

/** Normalize http:// -> https:// so user pastes from older links still pass backend strict https check. */
export function normalizeUrl(raw: string): string {
  const s = raw.trim()
  return /^http:\/\//i.test(s) ? `https://${s.slice(7)}` : s
}

/** Client-side check only (UX). The backend must validate again. Returns an error message or null. */
export function checkUrl(p: Exclude<Platform, 'home'>, raw: string): string | null {
  let u: URL
  try { u = new URL(normalizeUrl(raw)) } catch { return 'Liên kết không hợp lệ. Hãy dán đầy đủ địa chỉ bắt đầu bằng https://' }
  if (u.protocol !== 'https:') return 'Vui lòng dán liên kết bảo mật https://'
  if (p === 'direct' || p === 'google') return null
  if (HOSTS[p] && !HOSTS[p].includes(u.hostname.toLowerCase())) return `Đây không phải liên kết ${NAME[p]}. Hãy kiểm tra lại.`
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
    res = await fetch(`${apiBase(p)}/api/info`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url, platform: p }) })
  } catch { throw new Error('Không kết nối được máy chủ. Hãy kiểm tra backend đang chạy và địa chỉ API.') }
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new ApiError(body?.detail ?? `Máy chủ trả về lỗi (${res.status}). Hãy thử lại sau.`, res.status)
  }
  return res.json()
}

const isYoutube = (url: string) => { try { return HOSTS.youtube.includes(new URL(url).hostname.toLowerCase()) } catch { return false } }
const baseForUrl = (url: string) => (isYoutube(url) ? apiBase('youtube') : API_BASE_URL)
export const downloadUrl = (url: string, kind: 'video' | 'audio' | 'image' | 'cover', id: string, sel?: string) =>
  `${baseForUrl(url)}/api/download?` + new URLSearchParams({ url, kind, id, ...(sel ? { sel } : {}) })

export type JobState = { status: 'downloading' | 'processing' | 'done' | 'error'; progress: number; error?: string | null }

export async function prepareDownload(
  url: string,
  kind: 'video' | 'audio' | 'image' | 'cover',
  id: string,
  sel: string | undefined,
  onProgress: (st: JobState) => void,
): Promise<string> {
  const base = baseForUrl(url)
  let res: Response
  try {
    res = await fetch(`${base}/api/prepare`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, kind, id, ...(sel ? { sel } : {}) }),
    })
  } catch {
    throw new Error('Không kết nối được máy chủ. Hãy kiểm tra backend đang chạy.')
  }
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new ApiError(body?.detail ?? `Máy chủ trả về lỗi (${res.status}). Hãy thử lại sau.`, res.status)
  }
  const { jobId } = (await res.json()) as { jobId: string }
  for (;;) {
    await new Promise(r => setTimeout(r, 450))
    let jr: Response
    try {
      jr = await fetch(`${base}/api/job/${jobId}`)
    } catch {
      throw new Error('Mất kết nối tới máy chủ trong lúc xử lý tệp.')
    }
    if (!jr.ok) {
      const body = await jr.json().catch(() => null)
      throw new ApiError(body?.detail ?? `Lỗi kiểm tra tiến trình (${jr.status}).`, jr.status)
    }
    const st = (await jr.json()) as JobState
    onProgress(st)
    if (st.status === 'done') return `${base}/api/file/${jobId}`
    if (st.status === 'error') throw new Error(st.error || 'Không thể tải tệp này.')
  }
}
