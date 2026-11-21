import { useEffect, useState } from 'react'
import type { Platform, Theme } from './types'
import Header from './components/Header'
import Landscape from './components/Landscape'
import PlatformPage from './components/PlatformPage'
import Footer from './components/Footer'

export default function App() {
  const [platform, setPlatform] = useState<Platform>('home')
  const [theme, setTheme] = useState<Theme>('day')
  useEffect(() => { document.documentElement.dataset.theme = theme }, [theme])
  return (
    <>
      <Landscape mode={platform === 'home' ? 'home' : 'bg'} />
      <div className="app">
      <Header platform={platform} theme={theme} onPlatform={setPlatform}
        onTheme={() => setTheme(t => (t === 'day' ? 'night' : 'day'))} />
      <main key={platform} className="stage">
        {platform !== 'home' && <PlatformPage platform={platform} />}
      </main>
      <Footer />
      </div>
    </>
  )
}
