import { useEffect, useState } from 'react'
import { ScreenOverlay } from '../components/ScreenOverlay'
import { parseUIDump, type UINode } from '../lib/parseUIDump'
import './OverlayPage.css'

interface Capture {
  timestamp: string
  screenshotUrl: string
  nodes: UINode[]
}

const screenshots = import.meta.glob<string>('/capture/screenshot_*.png', { eager: true, query: '?url', import: 'default' })
const xmlFiles = import.meta.glob<string>('/capture/uidump_*.xml', { eager: true, query: '?raw', import: 'default' })

function buildCaptures(): Capture[] {
  const tsRe = /(\d{8}_\d{6})/
  const byTs = new Map<string, { screenshot?: string; xml?: string }>()

  for (const [path, url] of Object.entries(screenshots)) {
    const m = path.match(tsRe)
    if (!m) continue
    const entry = byTs.get(m[1]) ?? {}
    entry.screenshot = url
    byTs.set(m[1], entry)
  }
  for (const [path, raw] of Object.entries(xmlFiles)) {
    const m = path.match(tsRe)
    if (!m) continue
    const entry = byTs.get(m[1]) ?? {}
    entry.xml = raw
    byTs.set(m[1], entry)
  }

  const captures: Capture[] = []
  for (const [ts, { screenshot, xml }] of byTs) {
    if (screenshot && xml) {
      captures.push({ timestamp: ts, screenshotUrl: screenshot, nodes: parseUIDump(xml) })
    }
  }
  return captures.sort((a, b) => a.timestamp.localeCompare(b.timestamp))
}

export function OverlayPage() {
  const [captures] = useState(buildCaptures)
  const [index, setIndex] = useState(0)
  const current = captures[index]

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') setIndex((i) => Math.max(0, i - 1))
      if (e.key === 'ArrowRight') setIndex((i) => Math.min(captures.length - 1, i + 1))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [captures.length])

  if (!current) return <div className="overlay-page">No capture pairs found</div>

  return (
    <div className="overlay-page">
      <div className="overlay-page__toolbar">
        <a href="/">← Back</a>
        <button disabled={index === 0} onClick={() => setIndex(index - 1)}>← Prev</button>
        <span className="overlay-page__info">
          {index + 1} / {captures.length} — {current.timestamp}
        </span>
        <button disabled={index === captures.length - 1} onClick={() => setIndex(index + 1)}>Next →</button>
      </div>
      <ScreenOverlay screenshotUrl={current.screenshotUrl} nodes={current.nodes} width={960} height={540} />
    </div>
  )
}
