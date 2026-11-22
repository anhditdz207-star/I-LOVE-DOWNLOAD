import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import type { Platform } from '../types'
import type { Prefill } from '../App'
import { checkUrl, fetchInfo, type MediaInfo } from '../api'
import ResultPanel from './ResultPanel'

type State = { s: 'idle' } | { s: 'loading' } | { s: 'error'; msg: string } | { s: 'done'; info: MediaInfo; url: string }
type P = { platform: Exclude<Platform, 'home'>; prefill: Prefill | null }

export default function PlatformPage({ platform, prefill }: P) {
  const name = { youtube: 'YouTube', tiktok: 'TikTok', facebook: 'Facebook', instagram: 'Instagram' }[platform]
  const mine = prefill && prefill.platform === platform ? prefill : null
  const [url, setUrl] = useState(mine?.url ?? '')
  const [st, setSt] = useState<State>({ s: 'idle' })
  const [slow, setSlow] = useState(false)
  useEffect(() => { if (mine) { setUrl(mine.url); setSt({ s: 'idle' }) } }, [mine?.n]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (st.s !== 'loading') { setSlow(false); return }
    const t = setTimeout(() => setSlow(true), 6000)
    return () => clearTimeout(t)
  }, [st.s])

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
      {st.s === 'loading' && <div className="preview frame compact"><div className="loader" role="status"><i /><i /><i /><span>{slow ? 'Máy chủ miễn phí đang thức dậy, có thể mất tới 1 phút…' : 'Đang lấy thông tin…'}</span></div></div>}
      {st.s === 'error' && <div className="preview frame compact"><p className="err" role="alert">{st.msg}</p></div>}
      {st.s === 'done' && <ResultPanel key={st.url} info={st.info} url={st.url} platform={platform} />}
    </section>
  )
}
