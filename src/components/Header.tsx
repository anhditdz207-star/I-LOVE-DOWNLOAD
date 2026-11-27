import type { Platform, Theme } from '../types'
import type { HEntry } from '../history'
import PillSwitch from './PillSwitch'
import History from './History'
import { PlatformBadge } from './icons'
import { GROUP_A, GROUP_B } from '../platforms'

type P = { platform: Platform; theme: Theme; onPlatform: (p: Platform) => void; onTheme: () => void; onPick: (e: HEntry) => void }
export default function Header({ platform, theme, onPlatform, onTheme, onPick }: P) {
  const shared = { platform, theme, onPlatform, onTheme }
  return (
    <header className="hdr" data-side={platform === 'facebook' || platform === 'instagram'}>
      <button className="brand" onClick={() => onPlatform('home')} aria-label="Về trang chủ">
        <img src={`${import.meta.env.BASE_URL}logo.png`} alt="" width={52} height={52} />
        <span>I LOVE DOWNLOAD</span>
      </button>
      <div className="center">
        <PillSwitch group="a" items={GROUP_A} {...shared} />
        <p className="tip">bấm đúp để đổi chế độ sáng</p>
      </div>
      <PillSwitch group="b" items={GROUP_B} {...shared} />
      <div className="badge-slot">
        {platform !== 'home' && <PlatformBadge platform={platform} />}
        <History platform={platform} onPick={onPick} />
      </div>
    </header>
  )
}
