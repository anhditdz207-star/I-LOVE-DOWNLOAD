const HEART = ['.XX.XX.', 'XXXXXXX', 'XXXXXXX', '.XXXXX.', '..XXX..', '...X...']
export default function Footer() {
  return (
    <footer className="copy">
      <svg width="14" height="12" viewBox="0 0 7 6" shapeRendering="crispEdges" aria-hidden>
        {HEART.flatMap((row, y) => [...row].map((c, x) => c === 'X' && <rect key={`${x}${y}`} x={x} y={y} width="1" height="1" fill="currentColor" />))}
      </svg>
      <span>by Nguyễn Trung Nguyên</span>
    </footer>
  )
}
