import { useState } from 'react'
import { API_BASE_URL } from '../types'
import { downloadUrl, MOCK, type MediaInfo } from '../api'

type Kind = 'video' | 'audio' | 'image'
const TAB = { video: 'VIDEO', audio: 'AUDIO', image: 'PICTURE' } as const
const size = (n: number | null) => (n ? `${(n / 1048576).toFixed(1)} MB` : 'chưa rõ dung lượng')
const dur = (s: number | null) => (s ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` : '')
const Tick = () => <svg viewBox="0 0 10 10" width="14" height="14" shapeRendering="crispEdges" fill="currentColor" aria-hidden><path d="M1 5h2v2h1V6h1V5h1V4h1V3h1V2h1v1H8v1H7v1H6v1H5v1H4v1H3V7H1z" /></svg>

export default function ResultPanel({ info, url }: { info: MediaInfo; url: string }) {
  const imgs = info.images ?? []
  const tabs: Kind[] = imgs.length ? ['video', 'audio', 'image'] : ['video', 'audio']   // audio always; picture only when the post has photos
  const [kind, setKind] = useState<Kind>(info.video.length ? 'video' : imgs.length ? 'image' : info.audio.length ? 'audio' : 'video')
  const [sel, setSel] = useState<string | null>(null)
  const [picked, setPicked] = useState<Set<string>>(() => new Set(imgs.map(i => i.id)))
  const toggle = (id: string) => setPicked(s => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n })

  const opts = kind === 'video'
    ? info.video.map(v => ({ id: v.id, label: `${v.label} · ${v.ext}`, filesize: v.filesize, ok: true }))
    : info.audio.map(a => ({ id: a.id, label: `${a.format}${a.bitrate ? ` · ${a.bitrate} kbps` : ['WAV', 'FLAC'].includes(a.format) ? ' · lossless' : ''}`, filesize: a.filesize, ok: a.available }))
  const chosen = opts.find(o => o.id === sel)
  const order = [...picked].sort((a, b) => Number(a) - Number(b)).join(',')

  return (
    <section className="result" aria-live="polite">
      <div className="tabs" role="tablist">
        {tabs.map(k => (
          <button key={k} className="tab" role="tab" aria-selected={kind === k} onClick={() => { setKind(k); setSel(null) }}>{TAB[k]}</button>))}
      </div>
      <div className="preview frame">
        <div className="meta">
          {info.thumbnail && <img src={info.thumbnail} alt="" />}
          <div><h2>{info.title}</h2><p>{[info.uploader, dur(info.duration)].filter(Boolean).join(' · ')}</p></div>
        </div>
        {MOCK && <p className="mockbar">Đang ở chế độ dữ liệu giả. Các lựa chọn bên dưới không phải định dạng thật.</p>}

        {kind === 'image' ? (
          <>
            <div className="grid">
              {imgs.map(i => (
                <button key={i.id} className="thumb" role="checkbox" aria-checked={picked.has(i.id)} aria-label={i.label} onClick={() => toggle(i.id)}>
                  <img src={`${API_BASE_URL}${i.thumb}`} alt="" loading="lazy" />
                  <span className="chk">{picked.has(i.id) && <Tick />}</span>
                </button>))}
            </div>
            <div className="pick">
              <span>Đã chọn {picked.size}/{imgs.length} ảnh
                <button className="mini" onClick={() => setPicked(new Set(imgs.map(i => i.id)))}>Chọn tất cả</button>
                <button className="mini" onClick={() => setPicked(new Set())}>Bỏ chọn</button></span>
              {picked.size === 0 ? <button className="go" disabled>Tải xuống</button>
                : <a className="go" href={downloadUrl(url, 'image', info.imageToken ?? '', picked.size === imgs.length ? undefined : order)}
                    >{picked.size === 1 ? 'Tải 1 ảnh' : `Tải ${picked.size} ảnh (.zip)`}</a>}
            </div>
          </>
        ) : opts.length === 0 ? (
          <p className="empty">{kind === 'video' ? 'Bài đăng này không có video.' : 'Không có âm thanh cho liên kết này.'}</p>
        ) : (
          <>
            <ul className="opts">
              {opts.map(o => (
                <li key={o.id}><button aria-pressed={sel === o.id} disabled={!o.ok} onClick={() => setSel(o.id)}>
                  {o.label}{!o.ok && <small> · không khả dụng</small>}</button></li>))}
            </ul>
            <div className="pick">
              <span>{chosen ? `Đã chọn: ${chosen.label} · ${size(chosen.filesize)}` : 'Chọn một định dạng để tải.'}</span>
              {chosen && !MOCK
                ? <a className="go" href={downloadUrl(url, kind, chosen.id)}>Tải xuống</a>
                : <button className="go" disabled>{MOCK ? 'Tắt ở chế độ giả' : 'Tải xuống'}</button>}
            </div>
          </>
        )}
      </div>
    </section>
  )
}
