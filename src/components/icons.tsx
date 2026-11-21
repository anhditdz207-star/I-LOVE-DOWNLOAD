import type { Platform, Theme } from '../types'

export const YouTubeIcon = ({ size = 28 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden><rect x="1" y="5" width="22" height="14" rx="4" fill="#f00"/><path d="M10 9l5 3-5 3z" fill="#fff"/></svg>
)
// Simplified TikTok-style mark; replace with the official asset when available.
export const TikTokIcon = ({ size = 28 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden><rect width="24" height="24" rx="5" fill="#000"/>
    {([['#25f4ee', -0.8], ['#fe2c55', 0.8], ['#fff', 0]] as const).map(([c, o]) => (
      <path key={c} transform={`translate(${o} 0)`} d="M13 5v9a3 3 0 1 1-3-3M13 5c0 2.5 1.8 4 4 4" stroke={c} strokeWidth="2" fill="none" strokeLinecap="square"/>))}
  </svg>
)
export const SunMoon = ({ theme }: { theme: Theme }) => theme === 'day'
  ? <svg viewBox="0 0 24 24" width="34" height="34" aria-hidden><circle cx="12" cy="12" r="5" fill="#ffb02e"/>{[0,45,90,135,180,225,270,315].map(a=><rect key={a} x="11" y="1.5" width="2" height="4" fill="#ffb02e" transform={`rotate(${a} 12 12)`}/>)}</svg>
  : <svg viewBox="0 0 24 24" width="34" height="34" aria-hidden><path d="M16 3a9 9 0 1 0 5 13A7 7 0 0 1 16 3z" fill="none" stroke="currentColor" strokeWidth="2"/></svg>

export const FacebookIcon = ({ size = 28 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden><rect width="24" height="24" rx="5" fill="#1877f2"/>
    <path d="M16.5 24v-8.8h2.9l.5-3.5h-3.4V9.5c0-1 .3-1.7 1.8-1.7H20V4.7c-.3 0-1.4-.1-2.6-.1-2.6 0-4.3 1.6-4.3 4.4v2.7h-2.9v3.5h2.9V24z" fill="#fff"/></svg>
)
// Simplified marks for Facebook/Instagram; swap in official assets if you have them.
export const InstagramIcon = ({ size = 28 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
    <defs><linearGradient id={`ig${size}`} x1="0" y1="1" x2="1" y2="0"><stop offset="0" stopColor="#fdc468"/><stop offset=".5" stopColor="#df4996"/><stop offset="1" stopColor="#4f5bd5"/></linearGradient></defs>
    <rect width="24" height="24" rx="6" fill={`url(#ig${size})`}/>
    <rect x="5" y="5" width="14" height="14" rx="4" fill="none" stroke="#fff" strokeWidth="1.8"/>
    <circle cx="12" cy="12" r="3.3" fill="none" stroke="#fff" strokeWidth="1.8"/><circle cx="16.3" cy="7.7" r="1" fill="#fff"/>
  </svg>
)

const BADGE = {
  youtube: { Icon: YouTubeIcon, name: 'Yêutừbé' }, tiktok: { Icon: TikTokIcon, name: 'Tíctốc' },
  facebook: { Icon: FacebookIcon, name: 'Phở Bò' }, instagram: { Icon: InstagramIcon, name: 'Insta' },
} as const

export const PlatformBadge = ({ platform }: { platform: Exclude<Platform, 'home'> }) => {
  const { Icon, name } = BADGE[platform]
  return <div className="badge"><Icon size={44} /><span>{name}</span></div>
}
