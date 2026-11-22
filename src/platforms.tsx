import type { ComponentType } from 'react'
import type { Platform } from './types'
import { FacebookIcon, InstagramIcon, TikTokIcon, YouTubeIcon } from './components/icons'

export const NAMES = { youtube: 'Yêutừbé', tiktok: 'Tíctốc', facebook: 'Phở Bò', instagram: 'Insta' } as const

export type Item = { id: Exclude<Platform, 'home'>; label: string; Icon: ComponentType<{ size?: number }> }
// Group A = horizontal pill on top (left half becomes the top end when it turns vertical). Group B = vertical pill on the left.
export const GROUP_A: [Item, Item] = [
  { id: 'youtube', label: 'yêutừbé', Icon: YouTubeIcon }, { id: 'tiktok', label: 'tíctốc', Icon: TikTokIcon }]
export const GROUP_B: [Item, Item] = [
  { id: 'facebook', label: 'phở bò', Icon: FacebookIcon }, { id: 'instagram', label: 'insta', Icon: InstagramIcon }]
