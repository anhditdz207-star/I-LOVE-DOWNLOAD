import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import type { Platform } from '../types'
import type { Prefill } from '../App'
import { ApiError, checkUrl, fetchInfo, type MediaInfo } from '../api'
import { addHistory } from '../history'
import ResultPanel from './ResultPanel'

type State = { s: 'idle' } | { s: 'loading' } | { s: 'error'; msg: string; blocked?: boolean } | { s: 'done'; info: MediaInfo; url: string }
type P = { platform: Exclude<Platform, 'home'>; prefill: Prefill | null }

export default function PlatformPage({ platform, prefill }: P) {
  const name = { youtube: 'YouTube', tiktok: 'TikTok', facebook: 'Facebook', instagram: 'Instagram' }[platform]
  const mine = prefill && prefill.platform === platform ? prefill : null
  const [url, setUrl] = useState(mine?.url ?? '')
  const [st, setSt] = useState<State>({ s: 'idle' })
  const [slow, setSlow] = useState(false)
  // Picking a history entry fills the box and looks the link up again
  useEffect(() => { if (mine) { setUrl(mine.url); void lookup(mine.url) } }, [mine?.n]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (st.s !== 'loading') { setSlow(false); return }
    const t = setTimeout(() => setSlow(true), 6000)
    return () => clearTimeout(t)
  }, [st.s])

  async function lookup(raw: string) {
    const u = raw.trim()
    if (!u) return setSt({ s: 'error', msg: `Hãy dán liên kết ${name} vào ô trên.` })
    const bad = checkUrl(platform, u)
    if (bad) return setSt({ s: 'error', msg: bad })
    setSt({ s: 'loading' })
    try {
      const info = await fetchInfo(platform, u)
      addHistory({ t: Date.now(), platform, title: info.title, url: u })
      setSt({ s: 'done', info, url: u })
    } catch (err) {
      // YouTube refuses free cloud servers (HTTP 502 from our API). On the local build the plain message is enough.
      const hosted = !['localhost', '127.0.0.1'].includes(location.hostname)
      setSt({ s: 'error', msg: err instanceof Error ? err.message : 'Đã có lỗi xảy ra.', blocked: hosted && platform === 'youtube' && err instanceof ApiError && err.status === 502 })
    }
  }
  const submit = (e: FormEvent) => { e.preventDefault(); void lookup(url) }

  return (
    <section className="dl">
      <form className="searchbar" onSubmit={submit}>
        <input type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder={`Dán liên kết ${name} vào đây`} aria-label={`Liên kết ${name}`} />
        <button type="submit" disabled={st.s === 'loading'} aria-label="Lấy thông tin để tải">
          <svg viewBox="0 -1 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round"><path d="M9 3h6v8h4l-7 8-7-8h4z" /></svg>
        </button>
      </form>
      {st.s === 'loading' && <div className="preview frame compact"><div className="loader" role="status"><i /><i /><i /><span>{slow ? 'Máy chủ miễn phí đang thức dậy, có thể mất tới 1 phút…' : 'Đang lấy thông tin…'}</span></div></div>}
      {st.s === 'error' && (
        <div className="preview frame compact">
          {st.blocked ? (
            <>
              <p className="err" role="alert"><b>YouTube đang chặn máy chủ miễn phí của web này.</b> Đây không phải lỗi của bạn: YouTube từ chối máy chủ đặt trên mạng và chỉ cho phép IP nhà dân.</p>
              <p className="hint"><b>Cách dùng yêutừbé:</b> chạy bản trên máy tính của bạn.</p>
              <ol className="help">
                <li><a href="https://github.com/anhditdz207-star/I-LOVE-DOWNLOAD/archive/refs/heads/main.zip">Tải file zip</a> rồi giải nén.</li>
                <li>Cài Python, FFmpeg, Deno một lần (hướng dẫn trong README).</li>
                <li>Bấm đúp <code>start.bat</code>, mở <code>http://localhost:8000</code> và dán link YouTube.</li>
                <li>Muốn dùng trên điện thoại cùng Wi-Fi: chạy <code>start.bat lan</code> rồi mở <code>địa-chỉ-IP:8000</code> trên điện thoại.</li>
              </ol>
              <p className="hint">Tíctốc, phở bò và insta vẫn dùng bình thường ngay trên trang này.</p>
            </>
          ) : <p className="err" role="alert">{st.msg}</p>}
        </div>)}
      {st.s === 'done' && <ResultPanel key={st.url} info={st.info} url={st.url} />}
    </section>
  )
}
