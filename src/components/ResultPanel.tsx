import { useState } from 'react'
import { downloadUrl, MOCK, type MediaInfo } from '../api'

const size = (n: number | null) => (n ? `${(n / 1048576).toFixed(1)} MB` : 'chưa rõ dung lượng')
const dur = (s: number | null) => (s ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` : '')

export default function ResultPanel({ info, url }: { info: MediaInfo; url: string }) {
  const [kind, setKind] = useState<'video' | 'audio'>('video')
  const [sel, setSel] = useState<string | null>(null)
  const opts = kind === 'video'
    ? info.video.map(v => ({ id: v.id, label: `${v.label} · ${v.ext}`, filesize: v.filesize, ok: true }))
    : info.audio.map(a => ({ id: a.id, label: `${a.format}${a.bitrate ? ` · ${a.bitrate} kbps` : ['WAV', 'FLAC'].includes(a.format) ? ' · lossless' : ''}`, filesize: a.filesize, ok: a.available }))
  const chosen = opts.find(o => o.id === sel)

  return (
    <section className="result" aria-live="polite">
      <div className="meta">
        {info.thumbnail && <img src={info.thumbnail} alt="" />}
        <div><h2>{info.title}</h2><p>{[info.uploader, dur(info.duration)].filter(Boolean).join(' · ')}</p></div>
      </div>
      {MOCK && <p className="mockbar">Đang ở chế độ dữ liệu giả. Các lựa chọn bên dưới không phải định dạng thật.</p>}
      <div className="tabs" role="tablist">
        {(['video', 'audio'] as const).map(k => (
          <button key={k} role="tab" aria-selected={kind === k} onClick={() => { setKind(k); setSel(null) }}>{k === 'video' ? 'VIDEO' : 'AUDIO'}</button>))}
      </div>
      {opts.length === 0 ? <p className="empty">Không có định dạng {kind === 'video' ? 'video' : 'âm thanh'} nào cho liên kết này.</p> : (
        <ul className="opts">
          {opts.map(o => (
            <li key={o.id}><button aria-pressed={sel === o.id} disabled={!o.ok} onClick={() => setSel(o.id)}>
              {o.label}{!o.ok && <small> · không khả dụng</small>}</button></li>))}
        </ul>)}
      <div className="pick">
        <span>{chosen ? `Đã chọn: ${chosen.label} · ${size(chosen.filesize)}` : 'Chọn một định dạng để tải.'}</span>
        {chosen && !MOCK
          ? <a className="go" href={downloadUrl(url, kind, chosen.id)}>Tải xuống</a>
          : <button className="go" disabled>{MOCK ? 'Tắt ở chế độ giả' : 'Tải xuống'}</button>}
      </div>
    </section>
  )
}
