import type { ComponentType } from 'react'
import type { Platform } from './types'
import { FacebookIcon, InstagramIcon, TikTokIcon, YouTubeIcon } from './components/icons'

export const NAMES = { youtube: 'Yêutừbé', tiktok: 'Tíctốc', facebook: 'Phở Bò', instagram: 'Insta', google: 'Google Tài liệu / Web', direct: 'Trực tiếp' } as const

export type Item = { id: Exclude<Platform, 'home'>; label: string; Icon: ComponentType<{ size?: number }> }

export const APPS: Item[] = [
  { id: 'youtube', label: 'Yêutừbé', Icon: YouTubeIcon },
  { id: 'tiktok', label: 'Tíctốc', Icon: TikTokIcon },
  { id: 'facebook', label: 'Phở Bò', Icon: FacebookIcon },
  { id: 'instagram', label: 'Insta', Icon: InstagramIcon },
]
