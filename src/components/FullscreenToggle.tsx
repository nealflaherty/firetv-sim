import { useCallback, useEffect, useState } from "react";
import "./FullscreenToggle.css";

const AUTO_HIDE_MS = 3000;

export function FullscreenToggle() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [visible, setVisible] = useState(true);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen();
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setIsDark((d) => {
      const next = !d;
      document.documentElement.setAttribute(
        "data-theme",
        next ? "dark" : "light",
      );
      return next;
    });
  }, []);

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        toggleFullscreen();
      }
      if (e.key === "t" || e.key === "T") {
        e.preventDefault();
        toggleTheme();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggleFullscreen, toggleTheme]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const show = () => {
      setVisible(true);
      clearTimeout(timer);
      timer = setTimeout(() => setVisible(false), AUTO_HIDE_MS);
    };
    show();
    window.addEventListener("mousemove", show);
    return () => {
      window.removeEventListener("mousemove", show);
      clearTimeout(timer);
    };
  }, []);

  return (
    <div className={`toolbar${visible ? "" : " toolbar--hidden"}`}>
      <button
        className="toolbar__btn"
        onClick={toggleTheme}
        title={`${isDark ? "Light" : "Dark"} theme (T)`}
      >
        {isDark ? "☀" : "☾"}
      </button>
      <button
        className="toolbar__btn"
        onClick={toggleFullscreen}
        title={isFullscreen ? "Exit fullscreen (F)" : "Fullscreen (F)"}
      >
        {isFullscreen ? "⤓" : "⤢"}
      </button>
    </div>
  );
}
