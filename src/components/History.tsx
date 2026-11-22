import { useEffect, useRef, useState } from 'react'
import { clearHistory, getHistory, type HEntry } from '../history'
import { NAMES } from '../platforms'
import type { Platform } from '../types'

const when = (t: number) => new Date(t).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })

export default function History({ platform, onPick }: { platform: Platform; onPick: (e: HEntry) => void }) {
  const [open, setOpen] = useState(false)
  const [list, setList] = useState<HEntry[]>(getHistory)
  const box = useRef<HTMLDivElement>(null)
  const shown = list.filter(e => platform === 'home' || e.platform === platform)   // each section keeps its own history
  useEffect(() => {
    const f = () => setList(getHistory())
    window.addEventListener('ild-history', f)
    return () => window.removeEventListener('ild-history', f)
  }, [])
  useEffect(() => {
    if (!open) return
    const out = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false) }
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', out); document.addEventListener('keydown', esc)
    return () => { document.removeEventListener('mousedown', out); document.removeEventListener('keydown', esc) }
  }, [open])

  return (
    <div className="hist" ref={box}>
      <button className="hist-btn" aria-expanded={open} onClick={() => setOpen(o => !o)}>
        <svg width="16" height="16" viewBox="0 0 16 16" shapeRendering="crispEdges" fill="currentColor" aria-hidden>
          <path fillRule="evenodd" d="M2 2h5v1h1V2h6v10H8v1H7v-1H2zM3 3v8h4V3zM9 3v8h4V3z" /></svg>
        lịch sử
      </button>
      {open && (
        <div className="hist-panel frame" role="dialog" aria-label="Lịch sử">
          {shown.length === 0 && <p className="empty">Chưa có liên kết nào. Những link bạn đã tra cứu sẽ hiện ở đây (chỉ lưu trên máy này).</p>}
          {shown.map(e => (
            <button key={`${e.t}-${e.url}`} className="hist-item" onClick={() => { onPick(e); setOpen(false) }} title="Tra cứu lại liên kết này">
              <b>{e.title}</b>
              <small>{platform === 'home' ? `${NAMES[e.platform]} · ` : ''}{when(e.t)}</small>
            </button>))}
          {shown.length > 0 && <button className="mini hist-clear" onClick={clearHistory}>Xóa lịch sử</button>}
        </div>)}
    </div>
  )
}
