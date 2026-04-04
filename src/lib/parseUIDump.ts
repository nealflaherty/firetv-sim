export interface UINode {
  className: string
  resourceId: string
  contentDesc: string
  text: string
  bounds: { left: number; top: number; right: number; bottom: number }
  clickable: boolean
  focused: boolean
  selected: boolean
  children: UINode[]
}

const BOUNDS_RE = /\[(\d+),(\d+)\]\[(\d+),(\d+)\]/

function parseBounds(s: string) {
  const m = s.match(BOUNDS_RE)
  if (!m) return { left: 0, top: 0, right: 0, bottom: 0 }
  return { left: +m[1], top: +m[2], right: +m[3], bottom: +m[4] }
}

function parseNode(el: Element): UINode {
  const children: UINode[] = []
  for (const child of el.children) {
    if (child.tagName === 'node') children.push(parseNode(child))
  }
  return {
    className: el.getAttribute('class') ?? '',
    resourceId: el.getAttribute('resource-id') ?? '',
    contentDesc: el.getAttribute('content-desc') ?? '',
    text: el.getAttribute('text') ?? '',
    bounds: parseBounds(el.getAttribute('bounds') ?? ''),
    clickable: el.getAttribute('clickable') === 'true',
    focused: el.getAttribute('focused') === 'true',
    selected: el.getAttribute('selected') === 'true',
    children,
  }
}

export function parseUIDump(xml: string): UINode[] {
  const doc = new DOMParser().parseFromString(xml, 'text/xml')
  const hierarchy = doc.querySelector('hierarchy')
  if (!hierarchy) return []
  return Array.from(hierarchy.children)
    .filter((el) => el.tagName === 'node')
    .map(parseNode)
}

/** Flatten tree, keeping only nodes that have a label (text or content-desc) or are clickable */
export function extractVisibleNodes(roots: UINode[]): UINode[] {
  const result: UINode[] = []
  function walk(node: UINode) {
    const hasLabel = node.text || node.contentDesc
    const { left, top, right, bottom } = node.bounds
    const hasSize = right > left && bottom > top
    if (hasLabel && hasSize) result.push(node)
    node.children.forEach(walk)
  }
  roots.forEach(walk)
  return result
}

export function getLabel(node: UINode): string {
  return node.text || node.contentDesc
}
