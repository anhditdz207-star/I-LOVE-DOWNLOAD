import { useEffect, useState } from 'react'
import type { Platform, Theme } from './types'
import Header from './components/Header'
import Landscape from './components/Landscape'
import PlatformPage from './components/PlatformPage'
import Footer from './components/Footer'
import { MOCK } from './api'
import { API_BASE_URL } from './types'

export default function App() {
  const [platform, setPlatform] = useState<Platform>('home')
  const [theme, setTheme] = useState<Theme>('day')
  useEffect(() => { document.documentElement.dataset.theme = theme }, [theme])
  // Wake a sleeping free-tier backend as soon as the site opens (fire and forget)
  useEffect(() => { if (!MOCK) fetch(`${API_BASE_URL}/healthz`, { mode: 'no-cors' }).catch(() => {}) }, [])
  return (
    <>
      <Landscape mode={platform === 'home' ? 'home' : 'bg'} />
      <div className="app">
      <Header platform={platform} theme={theme} onPlatform={setPlatform}
        onTheme={() => setTheme(t => (t === 'day' ? 'night' : 'day'))} />
      <main key={platform} className="stage" data-side={platform === 'facebook' || platform === 'instagram'}>
        {platform !== 'home' && <PlatformPage platform={platform} />}
      </main>
      <Footer />
      </div>
    </>
  )
}
