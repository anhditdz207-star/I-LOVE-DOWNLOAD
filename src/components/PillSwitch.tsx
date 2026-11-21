import { useRef, useState } from 'react'
import type { CSSProperties, KeyboardEvent, MouseEvent, PointerEvent } from 'react'
import type { Platform, Theme } from '../types'
import type { Item } from '../platforms'
import { SunMoon } from './icons'

const MAX = 90      // max knob travel (px)
const COMMIT = 40   // travel needed to switch platform
const SLOP = 8      // below this it is a click, not a drag

type P = { group: 'a' | 'b'; items: [Item, Item]; platform: Platform; theme: Theme; onPlatform: (p: Platform) => void; onTheme: () => void }
export default function PillSwitch({ group, items, platform, theme, onPlatform, onTheme }: P) {
  const [l, r] = items
  const inGroup = platform === l.id || platform === r.id
  const hidden = platform !== 'home' && !inGroup     // the other group's pill hides while one is in use
  const vertical = group === 'b'   // each pill keeps its own place: A stays horizontal on top, B stays vertical on the left
  const [dx, setDx] = useState(0)
  const [drag, setDrag] = useState(false)
  const x0 = useRef(0), moved = useRef(false)
  const timer = useRef<number>(), last = useRef(0)
  const pos = (e: PointerEvent) => (vertical ? e.clientY : e.clientX)

  const down = (e: PointerEvent<HTMLButtonElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    x0.current = pos(e); moved.current = false; setDrag(true)
  }
  const move = (e: PointerEvent<HTMLButtonElement>) => {
    if (!drag) return
    const d = pos(e) - x0.current
    if (Math.abs(d) > SLOP) moved.current = true
    if (moved.current) setDx(Math.max(-MAX, Math.min(MAX, d)))
  }
  const up = () => {
    setDrag(false)
    if (moved.current) {
      if (dx <= -COMMIT) onPlatform(l.id)
      else if (dx >= COMMIT) onPlatform(r.id)
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
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') onPlatform(l.id)
    else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') onPlatform(r.id)
    else if (e.key === 't' || e.key === 'T') onTheme()
  }

  return (
    <div className={`pill${vertical ? ' vertical' : ''}${inGroup ? ' compact' : ''}${hidden ? ' hidden' : ''}${drag ? ' dragging' : ''}`}
      role="group" aria-label={`Chọn nền tảng: ${l.label} hoặc ${r.label}`} aria-hidden={hidden}>
      <button className="half left" data-active={platform === l.id} data-dim={platform === r.id} onClick={() => onPlatform(l.id)}>
        <l.Icon size={22} /><span className="lbl">{l.label}</span></button>
      <button className="half right" data-active={platform === r.id} data-dim={platform === l.id} onClick={() => onPlatform(r.id)}>
        <span className="lbl">{r.label}</span><r.Icon size={22} /></button>
      <button className="knob" style={{ '--dx': `${dx}px` } as CSSProperties}
        aria-label={`Bấm một lần để về trang chủ, bấm đúp để đổi sáng tối (đang ${theme === 'day' ? 'ban ngày' : 'ban đêm'})`}
        onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onClick={click} onKeyDown={key}>
        <SunMoon theme={theme} />
      </button>
    </div>
  )
}
