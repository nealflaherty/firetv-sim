import type { ContentItem } from "../lib/types";
import "./DetailPanel.css";

interface Props {
  item: ContentItem | null;
  visible: boolean;
}

function formatRuntime(minutes: number): string {
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs === 0) return `${mins} min`;
  if (mins === 0) return `${hrs} hr`;
  return `${hrs} hr ${mins} min`;
}

function formatCount(n: number): string {
  if (n >= 1_000_000)
    return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
  return String(n);
}

export function DetailPanel({ item, visible }: Props) {
  return (
    <div
      className={`detail-panel-wrapper${visible ? " detail-panel-wrapper--open" : ""}`}
    >
      <div className="detail-panel">
        {item && (
          <>
            <h1 className="detail-title">{item.title}</h1>
            <div className="detail-meta">
              {item.rating && (
                <span className="detail-text">★ {item.rating}</span>
              )}
              {item.ratingCount != null && (
                <span className="detail-text">
                  ({formatCount(item.ratingCount)})
                </span>
              )}
              {item.runtime != null && (
                <span className="detail-text">
                  {formatRuntime(item.runtime)}
                </span>
              )}
              {item.year && <span className="detail-text">{item.year}</span>}
              {item.maturity && (
                <span className="detail-bordered">{item.maturity}</span>
              )}
              {item.features?.map((f) => (
                <span key={f} className="detail-bordered">
                  {f}
                </span>
              ))}
            </div>
            {item.description && (
              <p className="detail-desc">{item.description}</p>
            )}
            {item.entitlement && (
              <p className="detail-entitlement">
                <img
                  className="detail-entitlement__check"
                  src="/fragments/blue_check.svg"
                  alt=""
                />
                {item.entitlement}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
