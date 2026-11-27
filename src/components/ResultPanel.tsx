import { useState } from 'react'
import { API_BASE_URL } from '../types'
import { MOCK, prepareDownload, type JobState, type MediaInfo } from '../api'

type Kind = 'video' | 'audio' | 'image'
const TAB = { video: 'VIDEO', audio: 'AUDIO', image: 'PICTURE' } as const
const size = (n: number | null) => (n ? `${(n / 1048576).toFixed(1)} MB` : 'chưa rõ dung lượng')
const dur = (s: number | null) => (s ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` : '')
const Tick = () => <svg viewBox="0 0 10 10" width="14" height="14" shapeRendering="crispEdges" fill="currentColor" aria-hidden><path d="M1 5h2v2h1V6h1V5h1V4h1V3h1V2h1v1H8v1H7v1H6v1H5v1H4v1H3V7H1z" /></svg>

type DlState = { s: 'idle' } | { s: 'busy'; pct: number; label: string } | { s: 'err'; msg: string }

export default function ResultPanel({ info, url }: { info: MediaInfo; url: string }) {
  const imgs = info.images ?? []
  const tabs: Kind[] = info.avatar ? ['image'] : imgs.length ? ['video', 'audio', 'image'] : ['video', 'audio']   // audio always; picture only when the post has photos
  const [kind, setKind] = useState<Kind>(info.video.length ? 'video' : imgs.length ? 'image' : info.audio.length ? 'audio' : 'video')
  const [sel, setSel] = useState<string | null>(null)
  const [picked, setPicked] = useState<Set<string>>(() => new Set(imgs.map(i => i.id)))
  const [dl, setDl] = useState<DlState>({ s: 'idle' })
  const toggle = (id: string) => setPicked(s => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n })

  const opts = kind === 'video'
    ? info.video.map(v => ({ id: v.id, label: `${v.label} · ${v.ext}`, filesize: v.filesize, ok: true }))
    : info.audio.map(a => ({ id: a.id, label: `${a.format}${a.bitrate ? ` · ${a.bitrate} kbps` : ['WAV', 'FLAC'].includes(a.format) ? ' · lossless' : ''}`, filesize: a.filesize, ok: a.available }))
  const chosen = opts.find(o => o.id === sel)
  const order = [...picked].sort((a, b) => Number(a) - Number(b)).join(',')

  async function startDownload(dlKind: 'video' | 'audio' | 'image' | 'cover', id: string, pickSel?: string) {
    if (dl.s === 'busy' || MOCK) return
    setDl({ s: 'busy', pct: 0, label: 'Đang chuẩn bị…' })
    try {
      const fileUrl = await prepareDownload(url, dlKind, id, pickSel, (st: JobState) => {
        if (st.status === 'processing') setDl({ s: 'busy', pct: 100, label: 'Đang xử lý FFmpeg…' })
        else setDl({ s: 'busy', pct: st.progress, label: st.progress > 0 ? `Đang tải xuống… ${st.progress}%` : 'Đang lấy dữ liệu…' })
      })
      const a = document.createElement('a')
      a.href = fileUrl
      a.download = ''
      document.body.appendChild(a)
      a.click()
      a.remove()
      setDl({ s: 'idle' })
    } catch (err) {
      setDl({ s: 'err', msg: err instanceof Error ? err.message : 'Không thể tải tệp này.' })
    }
  }

  return (
    <section className="result" aria-live="polite">
      <div className="tabs" role="tablist">
        {tabs.map(k => (
          <button key={k} className="tab" role="tab" aria-selected={kind === k} onClick={() => { setKind(k); setSel(null) }}>{TAB[k]}</button>))}
      </div>
      <div className="preview frame">
        <div className="meta">
          {info.thumbnail && <img src={info.thumbnail} alt="" referrerPolicy="no-referrer" />}
          <div><h2>{info.title}</h2><p>{[info.uploader, dur(info.duration)].filter(Boolean).join(' · ')}</p>
            {info.thumbnail && !info.avatar && !MOCK && (
              <button className="mini cover" disabled={dl.s === 'busy'} onClick={() => startDownload('cover', 'thumb')}>Tải ảnh bìa</button>
            )}</div>
        </div>
        {MOCK && <p className="mockbar">Đang ở chế độ dữ liệu giả. Các lựa chọn bên dưới không phải định dạng thật.</p>}
        {dl.s === 'busy' && (
          <div className="dl-prog" role="status">
            <div className="dl-bar"><i style={{ width: `${Math.max(6, dl.pct)}%` }} /></div>
            <span>{dl.label}</span>
          </div>
        )}
        {dl.s === 'err' && <p className="err" role="alert">{dl.msg}</p>}

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
              <button className="go" disabled={picked.size === 0 || dl.s === 'busy' || MOCK}
                onClick={() => startDownload('image', info.imageToken ?? '', picked.size === imgs.length ? undefined : order)}>
                {picked.size === 0 ? 'Tải xuống' : picked.size === 1 ? 'Tải 1 ảnh' : `Tải ${picked.size} ảnh (.zip)`}
              </button>
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
              <button className="go" disabled={!chosen || dl.s === 'busy' || MOCK}
                onClick={() => chosen && startDownload(kind, chosen.id)}>
                {MOCK ? 'Tắt ở chế độ giả' : dl.s === 'busy' ? 'Đang xử lý…' : 'Tải xuống'}
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  )
}
