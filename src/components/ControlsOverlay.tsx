import { useEffect, useState } from "react";
import "./ControlsOverlay.css";

export function ControlsOverlay() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "?") {
        setVisible((v) => !v);
        return;
      }
      if (visible) setVisible(false);
    };
    const onClick = () => {
      if (visible) setVisible(false);
    };

    window.addEventListener("keydown", onKey);
    window.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("click", onClick);
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="controls-overlay" onClick={() => setVisible(false)}>
      <div className="controls-overlay__content">
        <div className="controls-overlay__remote">
          <img src="/fragments/remote.svg" alt="Fire TV Remote" />
        </div>

        <div className="controls-overlay__keys">
          <h2>Keyboard Controls</h2>

          <div className="controls-overlay__grid">
            <div className="controls-key-row">
              <span className="controls-key">↑</span>
            </div>
            <div className="controls-key-row">
              <span className="controls-key">←</span>
              <span className="controls-key">↓</span>
              <span className="controls-key">→</span>
            </div>
            <div className="controls-label">Navigate</div>

            <div className="controls-key-row" style={{ marginTop: "1.5vw" }}>
              <span className="controls-key controls-key--wide">Enter</span>
            </div>
            <div className="controls-label">Select</div>

            <div className="controls-key-row" style={{ marginTop: "1.5vw" }}>
              <span className="controls-key">H</span>
            </div>
            <div className="controls-label">Home</div>

            <div className="controls-key-row" style={{ marginTop: "1.5vw" }}>
              <span className="controls-key">F</span>
            </div>
            <div className="controls-label">Fullscreen</div>

            <div className="controls-key-row" style={{ marginTop: "1.5vw" }}>
              <span className="controls-key">T</span>
            </div>
            <div className="controls-label">Toggle Theme</div>
          </div>
        </div>
      </div>

      <p className="controls-overlay__dismiss">
        Press any key or click to start · Press{" "}
        <span className="controls-key controls-key--inline">?</span> anytime to
        show controls
      </p>
    </div>
  );
}
