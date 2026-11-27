import type { Platform, Theme } from '../types'
import type { HEntry } from '../history'
import History from './History'
import { PlatformBadge, SunMoon } from './icons'

type P = { platform: Platform; theme: Theme; onPlatform: (p: Platform) => void; onTheme: () => void; onPick: (e: HEntry) => void }

export default function Header({ platform, theme, onPlatform, onTheme, onPick }: P) {
  return (
    <header className="hdr-clean">
      <button className="brand" onClick={() => onPlatform('home')} aria-label="Về trang chủ">
        <img src={`${import.meta.env.BASE_URL}logo.png`} alt="" width={48} height={48} />
        <span>I LOVE DOWNLOAD</span>
      </button>

      <div className="hdr-right">
        {platform !== 'home' && <PlatformBadge platform={platform} />}
        <History platform={platform} onPick={onPick} />
        <button
          className="theme-circle-btn"
          onClick={onTheme}
          title={`Đổi chế độ sáng / tối (hiện tại: ${theme === 'day' ? 'ban ngày' : 'ban đêm'})`}
          aria-label="Đổi chế độ sáng tối"
        >
          <SunMoon theme={theme} />
        </button>
      </div>
    </header>
  )
}
