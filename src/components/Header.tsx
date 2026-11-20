import type { Platform, Theme } from '../types'
import PillSwitch from './PillSwitch'
import { PlatformBadge } from './icons'

type P = { platform: Platform; theme: Theme; onPlatform: (p: Platform) => void; onTheme: () => void }
export default function Header({ platform, theme, onPlatform, onTheme }: P) {
  return (
    <header className="hdr">
      <button className="brand" onClick={() => onPlatform('home')} aria-label="Về trang chủ">
        <img src={`${import.meta.env.BASE_URL}logo.png`} alt="" width={52} height={52} />
        <span>I LOVE DOWNLOAD</span>
      </button>
      <div className="center">
        <PillSwitch platform={platform} theme={theme} onPlatform={onPlatform} onTheme={onTheme} />
        <p className="tip">bấm đúp để đổi chế độ sáng</p>
      </div>
      <div className="badge-slot">{platform !== 'home' && <PlatformBadge platform={platform} />}</div>
    </header>
  )
}
