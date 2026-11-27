import { useEffect, useState } from 'react'
import type { Platform, Theme } from './types'
import { API_BASE_URL, YT_API_BASE_URL } from './types'
import { MOCK } from './api'
import type { HEntry } from './history'
import Header from './components/Header'
import Landscape from './components/Landscape'
import PlatformPage from './components/PlatformPage'
import Footer from './components/Footer'
import { APPS } from './platforms'

export type Prefill = { url: string; n: number; platform: Platform }

export default function App() {
  const [platform, setPlatform] = useState<Platform>('home')
  const [prefill, setPrefill] = useState<Prefill | null>(null)
  // The chosen day/night mode is remembered on this device
  const [theme, setTheme] = useState<Theme>(() => { try { return localStorage.getItem('ild:theme') === 'night' ? 'night' : 'day' } catch { return 'day' } })
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try { localStorage.setItem('ild:theme', theme) } catch { /* storage blocked */ }
  }, [theme])
  // Wake a sleeping free-tier backend as soon as the site opens (fire and forget)
  useEffect(() => { if (!MOCK) { for (const b of new Set([API_BASE_URL, YT_API_BASE_URL].filter(Boolean))) fetch(`${b}/healthz`, { mode: 'no-cors' }).catch(() => {}) } }, [])

  const go = (p: Platform) => { setPlatform(p); if (p === 'home') setPrefill(null) }
  const pick = (e: HEntry) => { setPlatform(e.platform); setPrefill(p => ({ url: e.url, n: (p?.n ?? 0) + 1, platform: e.platform })) }

  return (
    <>
      <Landscape mode={platform === 'home' ? 'home' : 'bg'} />
      <div className="app">
        <Header platform={platform} theme={theme} onPlatform={go} onPick={pick}
          onTheme={() => setTheme(t => (t === 'day' ? 'night' : 'day'))} />

        <div className="layout-body">
          <main key={platform} className="stage-clean">
            <PlatformPage platform={platform === 'home' ? 'direct' : platform} prefill={prefill} />
          </main>

          {/* Cột 4 ô icon nền tảng cố định bên phải theo bản vẽ */}
          <aside className="sidebar-apps" aria-label="Chọn nền tảng">
            {APPS.map(app => {
              const active = platform === app.id
              return (
                <button
                  key={app.id}
                  className={`app-square-btn ${active ? 'active' : ''}`}
                  onClick={() => go(active ? 'home' : app.id)}
                  title={app.label}
                  aria-pressed={active}
                >
                  <app.Icon size={32} />
                  <span className="app-square-lbl">{app.label}</span>
                </button>
              )
            })}
          </aside>
        </div>

        <Footer />
      </div>
    </>
  )
}
