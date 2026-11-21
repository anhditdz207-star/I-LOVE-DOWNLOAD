import { useRef, useState } from 'react'
import type { CSSProperties, KeyboardEvent, MouseEvent, PointerEvent } from 'react'
import type { Platform, Theme } from '../types'
import { SunMoon, YouTubeIcon, TikTokIcon } from './icons'

const MAX = 90      // max knob travel (px)
const COMMIT = 40   // travel needed to switch platform
const SLOP = 8      // below this it is a click, not a drag

type P = { platform: Platform; theme: Theme; onPlatform: (p: Platform) => void; onTheme: () => void }
export default function PillSwitch({ platform, theme, onPlatform, onTheme }: P) {
  const [dx, setDx] = useState(0)
  const [drag, setDrag] = useState(false)
  const vertical = platform !== 'home'
  const x0 = useRef(0), moved = useRef(false)
  const timer = useRef<number>(), last = useRef(0)

  const down = (e: PointerEvent<HTMLButtonElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    x0.current = vertical ? e.clientY : e.clientX; moved.current = false; setDrag(true)
  }
  const move = (e: PointerEvent<HTMLButtonElement>) => {
    if (!drag) return
    const d = (vertical ? e.clientY : e.clientX) - x0.current
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
  // One tap = back to home (after a short wait), two quick taps = toggle day/night. Works for mouse and touch.
  const click = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    if (moved.current) { moved.current = false; return }
    const now = Date.now()
    if (now - last.current < 300) { clearTimeout(timer.current); last.current = 0; onTheme(); return }
    last.current = now
    timer.current = window.setTimeout(() => onPlatform('home'), 300)
  }
  const key = (e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft') onPlatform('youtube')
    else if (e.key === 'ArrowRight') onPlatform('tiktok')
    else if (e.key === 't' || e.key === 'T') onTheme()
  }

  return (
    <div className={`pill${vertical ? ' compact vertical' : ''}${drag ? ' dragging' : ''}`} role="group" aria-label="Chọn nền tảng">
      <button className="half left" data-active={platform === 'youtube'} data-dim={platform === 'tiktok'}
        onClick={() => onPlatform('youtube')}><YouTubeIcon size={22} /><span className="lbl">yêutừbé</span></button>
      <button className="half right" data-active={platform === 'tiktok'} data-dim={platform === 'youtube'}
        onClick={() => onPlatform('tiktok')}><span className="lbl">tíctốc</span><TikTokIcon size={22} /></button>
      <button className="knob" style={{ '--dx': `${dx}px` } as CSSProperties}
        aria-label={`Bấm một lần để về trang chủ, bấm đúp để đổi sáng tối (đang ${theme === 'day' ? 'ban ngày' : 'ban đêm'})`}
        onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}
        onClick={click} onKeyDown={key}>
        <SunMoon theme={theme} />
      </button>
    </div>
  )
}
