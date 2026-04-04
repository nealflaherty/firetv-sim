import { type UINode, extractVisibleNodes, getLabel } from '../lib/parseUIDump'
import './ScreenOverlay.css'

interface Props {
  screenshotUrl: string
  nodes: UINode[]
  width?: number
  height?: number
}

const SOURCE_W = 1920
const SOURCE_H = 1080

export function ScreenOverlay({ screenshotUrl, nodes, width = 960, height = 540 }: Props) {
  const scaleX = width / SOURCE_W
  const scaleY = height / SOURCE_H
  const visible = extractVisibleNodes(nodes)

  return (
    <div className="screen-overlay" style={{ width, height }}>
      <img className="screen-overlay__img" src={screenshotUrl} alt="" width={width} height={height} />
      <div className="screen-overlay__nodes">
        {visible.map((node, i) => {
          const { left, top, right, bottom } = node.bounds
          const style = {
            left: left * scaleX,
            top: top * scaleY,
            width: (right - left) * scaleX,
            height: (bottom - top) * scaleY,
          }
          return (
            <div
              key={i}
              className={`screen-overlay__node${node.clickable ? ' screen-overlay__node--clickable' : ''}${node.focused ? ' screen-overlay__node--focused' : ''}`}
              style={style}
              title={getLabel(node)}
            >
              <span className="screen-overlay__label">{getLabel(node)}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
