/** Match screenshot/uidump pairs by timestamp in filename */
export function pairCaptures(files: string[]): { timestamp: string; screenshot: string; uidump: string }[] {
  const screenshots = new Map<string, string>()
  const dumps = new Map<string, string>()

  for (const f of files) {
    const name = f.split('/').pop() ?? ''
    const match = name.match(/(\d{8}_\d{6})/)
    if (!match) continue
    const ts = match[1]
    if (name.startsWith('screenshot_') && name.endsWith('.png')) screenshots.set(ts, f)
    else if (name.startsWith('uidump_') && name.endsWith('.xml')) dumps.set(ts, f)
  }

  const pairs: { timestamp: string; screenshot: string; uidump: string }[] = []
  for (const [ts, screenshot] of screenshots) {
    const uidump = dumps.get(ts)
    if (uidump) pairs.push({ timestamp: ts, screenshot, uidump })
  }
  return pairs.sort((a, b) => a.timestamp.localeCompare(b.timestamp))
}
