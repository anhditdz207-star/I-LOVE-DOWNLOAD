import { useMemo } from 'react'
const W = 160, H = 90

// Stepped (pixel) ridge line: one 1px column per x
function ridge(base: number, amp: number, f: number, seed: number) {
  let d = `M0 ${H}`
  for (let x = 0; x < W; x++) {
    const h = Math.round(base - amp * (0.5 + 0.5 * Math.sin(x * f + seed)) - amp * 0.35 * Math.sin(x * f * 2.7 + seed * 2))
    d += `V${h}h1`
  }
  return d + `V${H}Z`
}
function disc(cx: number, cy: number, r: number) {
  const out: [number, number, number][] = []
  for (let y = -r; y <= r; y++) { const w = Math.round(Math.sqrt(r * r - y * y)); out.push([cx - w, cy + y, w * 2]) }
  return out
}
const rnd = (i: number) => { const s = Math.sin(i * 127.1) * 43758.5453; return s - Math.floor(s) }

export default function Landscape() {
  const g = useMemo(() => ({
    m1: ridge(58, 14, 0.07, 1), m2: ridge(66, 12, 0.1, 4), m3: ridge(76, 5, 0.16, 9),
    stars: Array.from({ length: 34 }, (_, i) => [Math.floor(rnd(i) * W), Math.floor(rnd(i + 50) * 40), i] as const),
    flies: Array.from({ length: 9 }, (_, i) => [8 + Math.floor(rnd(i + 90) * 144), 66 + Math.floor(rnd(i + 130) * 16), i] as const),
  }), [])
  const houses = [[22, 71, 9], [38, 72, 7], [96, 71, 10], [114, 72, 8], [130, 70, 9]]
  return (
    <div className="frame landscape">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" shapeRendering="crispEdges" role="img"
        aria-label="Phong cảnh pixel: làng nhỏ dưới núi, đổi giữa bình minh và đêm trăng">
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style={{ stopColor: 'var(--sky-top)' }} /><stop offset="1" style={{ stopColor: 'var(--sky-bot)' }} /></linearGradient>
          <mask id="crescent"><rect width={W} height={H} fill="#fff" />{disc(124, 20, 8).map(([x, y, w], i) => <rect key={i} x={x} y={y} width={w} height="1" fill="#000" />)}</mask>
        </defs>
        <rect width={W} height={H} fill="url(#sky)" />
        <g className="stars">{g.stars.map(([x, y, i]) => <rect key={i} x={x} y={y} width="1" height="1" fill="#fff" style={{ animationDelay: `${(i % 5) * 0.5}s` }} />)}</g>
        <g className="sun">{disc(80, 52, 11).map(([x, y, w], i) => <rect key={i} x={x} y={y} width={w} height="1" fill="#ffd35c" />)}</g>
        <g className="moon" mask="url(#crescent)">{disc(118, 20, 9).map(([x, y, w], i) => <rect key={i} x={x} y={y} width={w} height="1" fill="#fff3c4" />)}</g>
        <g fill="var(--cloud)">
          {[[8, 14, 52], [60, 26, 70], [30, 8, 90]].map(([x, y, d]) => (
            <g key={x} style={{ animationDuration: `${d}s`, animationDelay: `-${d / 2}s` }} className="cloud"><rect x={x} y={y + 1} width="12" height="2" /><rect x={x + 2} y={y} width="6" height="1" /></g>))}
        </g>
        <path d={g.m1} fill="var(--m1)" /><path d={g.m2} fill="var(--m2)" />
        {houses.map(([x, y, w]) => (
          <g key={x}>
            <rect x={x} y={y} width={w} height="8" fill="var(--wall)" />
            {Array.from({ length: Math.ceil(w / 2) }, (_, r) => <rect key={r} x={x - 1 + r} y={y - 1 - r} width={w + 2 - 2 * r} height="1" fill="var(--roof)" />)}
            <rect x={x + 2} y={y + 2} width="1" height="2" fill="var(--win)" className="win" />
            {w > 8 && <rect x={x + w - 3} y={y + 2} width="1" height="2" fill="var(--win)" className="win" />}
          </g>))}
        <path d={g.m3} fill="var(--ground)" />
        <g className="flies">{g.flies.map(([x, y, i]) => <rect key={i} x={x} y={y} width="1" height="1" fill="#e8ff8a" style={{ animationDelay: `${i * 0.7}s` }} />)}</g>
      </svg>
    </div>
  )
}
