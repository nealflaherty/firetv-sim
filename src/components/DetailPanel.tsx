import { useRef, useEffect } from "react";
import { motion } from "framer-motion";
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

const makeContainerVariants = (delay: number) => ({
  hidden: {},
  visible: {
    transition: {
      delayChildren: delay,
      staggerChildren: 0.08,
    },
  },
});

const lineVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] as const },
  },
};

export function DetailPanel({ item, visible }: Props) {
  const wasVisible = useRef(false);

  useEffect(() => {
    wasVisible.current = visible;
  }, [visible]);

  // If panel was already open, no delay; if just opening, wait for expand
  const delay = wasVisible.current ? 0 : 0.35;

  return (
    <div
      className={`detail-panel-wrapper${visible ? " detail-panel-wrapper--open" : ""}`}
    >
      <div className="detail-panel">
        {item?.thumbnail && (
          <div
            className="detail-panel__bg"
            style={{ backgroundImage: `url(${item.thumbnail})` }}
          />
        )}
        <motion.div
          className="detail-panel__content"
          key={item?.id}
          variants={makeContainerVariants(delay)}
          initial="hidden"
          animate={visible && item ? "visible" : "hidden"}
        >
          {item && (
            <>
              <motion.div
                className="detail-slot--title"
                variants={lineVariants}
              >
                <h1 className="detail-title">{item.title}</h1>
              </motion.div>
              <motion.div className="detail-slot--meta" variants={lineVariants}>
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
                  {item.year && (
                    <span className="detail-text">{item.year}</span>
                  )}
                  {item.maturity && (
                    <span className="detail-bordered">{item.maturity}</span>
                  )}
                  {item.features?.map((f) => (
                    <span key={f} className="detail-bordered">
                      {f}
                    </span>
                  ))}
                </div>
              </motion.div>
              <motion.div className="detail-slot--desc" variants={lineVariants}>
                {item.description && (
                  <p className="detail-desc">{item.description}</p>
                )}
              </motion.div>
              <motion.div
                className="detail-slot--action"
                variants={lineVariants}
              >
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
              </motion.div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
