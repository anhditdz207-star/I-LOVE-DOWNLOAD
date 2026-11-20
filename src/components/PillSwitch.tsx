import { useRef, useState } from 'react'
import type { CSSProperties, KeyboardEvent, PointerEvent } from 'react'
import type { Platform, Theme } from '../types'
import { SunMoon, YouTubeIcon, TikTokIcon } from './icons'

const MAX = 90      // max knob travel (px)
const COMMIT = 40   // travel needed to switch platform
const SLOP = 8      // below this it is a click, not a drag

type P = { platform: Platform; theme: Theme; onPlatform: (p: Platform) => void; onTheme: () => void }
export default function PillSwitch({ platform, theme, onPlatform, onTheme }: P) {
  const [dx, setDx] = useState(0)
  const [drag, setDrag] = useState(false)
  const x0 = useRef(0), moved = useRef(false)

  const down = (e: PointerEvent<HTMLButtonElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    x0.current = e.clientX; moved.current = false; setDrag(true)
  }
  const move = (e: PointerEvent<HTMLButtonElement>) => {
    if (!drag) return
    const d = e.clientX - x0.current
    if (Math.abs(d) > SLOP) moved.current = true
    if (moved.current) setDx(Math.max(-MAX, Math.min(MAX, d)))
  }
  const up = () => {
    setDrag(false)
    if (moved.current) {
      if (dx <= -COMMIT) onPlatform('youtube')
      else if (dx >= COMMIT) onPlatform('tiktok')
    }
    setDx(0)
  }
  const key = (e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft') onPlatform('youtube')
    else if (e.key === 'ArrowRight') onPlatform('tiktok')
    else if (e.key === 'Enter') onTheme()
  }

  return (
    <div className={`pill${platform !== 'home' ? ' compact' : ''}${drag ? ' dragging' : ''}`} role="group" aria-label="Chọn nền tảng">
      <button className="half left" data-active={platform === 'youtube'} data-dim={platform === 'tiktok'}
        onClick={() => onPlatform('youtube')}><YouTubeIcon size={22} /> yêutừbé</button>
      <button className="half right" data-active={platform === 'tiktok'} data-dim={platform === 'youtube'}
        onClick={() => onPlatform('tiktok')}>tíctốc <TikTokIcon size={22} /></button>
      <button className="knob" style={{ '--dx': `${dx}px` } as CSSProperties}
        aria-label={theme === 'day' ? 'Đang ban ngày. Nhấp đúp để chuyển sang ban đêm' : 'Đang ban đêm. Nhấp đúp để chuyển sang ban ngày'}
        onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}
        onClick={e => e.stopPropagation()} onDoubleClick={onTheme} onKeyDown={key}>
        <SunMoon theme={theme} />
      </button>
    </div>
  )
}
