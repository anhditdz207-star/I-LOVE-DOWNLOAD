import { useState } from 'react'
import type { FormEvent } from 'react'
import type { Platform } from '../types'
import { checkUrl, fetchInfo, type MediaInfo } from '../api'
import ResultPanel from './ResultPanel'

type State = { s: 'idle' } | { s: 'loading' } | { s: 'error'; msg: string } | { s: 'done'; info: MediaInfo; url: string }

export default function PlatformPage({ platform }: { platform: Exclude<Platform, 'home'> }) {
  const name = platform === 'youtube' ? 'YouTube' : 'TikTok'
  const [url, setUrl] = useState('')
  const [st, setSt] = useState<State>({ s: 'idle' })

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!url.trim()) return setSt({ s: 'error', msg: `Hãy dán liên kết ${name} vào ô trên.` })
    const bad = checkUrl(platform, url)
    if (bad) return setSt({ s: 'error', msg: bad })
    setSt({ s: 'loading' })
    try { setSt({ s: 'done', info: await fetchInfo(platform, url.trim()), url: url.trim() }) }
    catch (err) { setSt({ s: 'error', msg: err instanceof Error ? err.message : 'Đã có lỗi xảy ra.' }) }
  }

  return (
    <section className="dl">
      <form className="searchbar" onSubmit={submit}>
        <input type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder={`Dán liên kết ${name} vào đây`} aria-label={`Liên kết ${name}`} />
        <button type="submit" disabled={st.s === 'loading'} aria-label="Lấy thông tin để tải">
          <svg viewBox="0 -1 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round"><path d="M9 3h6v8h4l-7 8-7-8h4z" /></svg>
        </button>
      </form>
      <div className="preview frame">
        {st.s === 'idle' && <p className="hint">Dán liên kết video bạn có quyền tải, rồi bấm mũi tên. Thông tin video sẽ hiện ở đây.</p>}
        {st.s === 'loading' && <div className="loader" role="status"><i /><i /><i /><span>Đang lấy thông tin…</span></div>}
        {st.s === 'error' && <p className="err" role="alert">{st.msg}</p>}
        {st.s === 'done' && <ResultPanel info={st.info} url={st.url} />}
      </div>
    </section>
  )
}
