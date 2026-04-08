import { useCallback, useEffect, useRef, useState } from "react";
import { ALL_NAV } from "../layout";
import { HOME_NAV_INDEX } from "./constants";
const INITIAL: [number, number] = [0, HOME_NAV_INDEX];

export interface NavigationState {
  pos: [number, number];
  row: number;
  col: number;
  expanded: boolean;
  trailerIndex: number;
  selectedNavIndex: number;
  activeNavIndex: number;
  inContent: boolean;
}

export interface NavigationActions {
  setPos: (
    pos: [number, number] | ((prev: [number, number]) => [number, number]),
  ) => void;
  setExpanded: (v: boolean) => void;
  setTrailerIndex: (v: number | ((prev: number) => number)) => void;
  setSelectedNavIndex: (v: number) => void;
  goHome: () => void;
  clickNav: (idx: number) => void;
  clickTile: (rowIdx: number, colIdx: number) => void;
  advanceTrailer: () => void;
}

export function useNavigation(
  rowLengths: number[],
  trailerCount: number,
): NavigationState & NavigationActions {
  const [pos, setPos] = useState(INITIAL);
  const [expanded, setExpandedState] = useState(true);
  const expandedRef = useRef(true);
  const [trailerIndex, setTrailerIndex] = useState(0);
  const [selectedNavIndex, setSelectedNavIndex] = useState(HOME_NAV_INDEX);

  const setExpanded = useCallback((v: boolean) => {
    expandedRef.current = v;
    setExpandedState(v);
  }, []);

  const [row, col] = pos;
  const activeNavIndex = row === 0 ? col : selectedNavIndex;
  const inContent = row >= 1;

  const advanceTrailer = useCallback(() => {
    setTrailerIndex((i) => (i + 1) % Math.max(1, trailerCount));
  }, [trailerCount]);

  const goHome = useCallback(() => {
    setExpanded(false);
    setPos([0, HOME_NAV_INDEX]);
    setSelectedNavIndex(HOME_NAV_INDEX);
  }, [setExpanded]);

  const clickNav = useCallback(
    (idx: number) => {
      setExpanded(false);
      setSelectedNavIndex(idx);
      setPos([0, idx]);
    },
    [setExpanded],
  );

  const clickTile = useCallback(
    (rowIdx: number, colIdx: number) => {
      setExpanded(false);
      setPos((prev) => {
        // Preserve selectedNavIndex from current state
        return [rowIdx + 1, colIdx];
      });
    },
    [setExpanded],
  );

  // Keyboard navigation
  useEffect(() => {
    const ROWS = rowLengths;

    const move = (e: KeyboardEvent) => {
      const key = e.key;

      if (key === "h" || key === "H") {
        e.preventDefault();
        goHome();
        return;
      }

      if (key === "Enter") {
        e.preventDefault();
        if (expandedRef.current) {
          setExpanded(false);
          return;
        }
        if (pos[0] === 0) {
          setSelectedNavIndex(pos[1]);
          setPos([1, 0]);
        }
        return;
      }

      if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(key))
        return;
      e.preventDefault();

      if (key === "ArrowUp") {
        if (expandedRef.current) return;
        setPos(([r, c]) => {
          if (r === 0) {
            setExpanded(true);
            return [r, c];
          }
          if (r === 1) return [0, selectedNavIndex];
          return [r - 1, 0];
        });
        return;
      }

      if (key === "ArrowDown") {
        if (expandedRef.current) {
          setExpanded(false);
          return;
        }
        setPos(([r, c]) => {
          if (r === 0) {
            setSelectedNavIndex(c);
            return [1, 0];
          }
          return r < ROWS.length - 1 ? [r + 1, 0] : [r, c];
        });
        return;
      }

      if (expandedRef.current) {
        if (key === "ArrowLeft")
          setTrailerIndex((i) => (i - 1 + trailerCount) % trailerCount);
        else if (key === "ArrowRight")
          setTrailerIndex((i) => (i + 1) % trailerCount);
        return;
      }

      setPos(([r, c]) => {
        if (key === "ArrowLeft") {
          const next = Math.max(0, c - 1);
          if (r === 0 && next !== c) setSelectedNavIndex(next);
          return [r, next];
        }
        if (key === "ArrowRight") {
          const next = Math.min(ROWS[r] - 1, c + 1);
          if (r === 0 && next !== c) setSelectedNavIndex(next);
          return [r, next];
        }
        return [r, c];
      });
    };

    window.addEventListener("keydown", move);
    return () => window.removeEventListener("keydown", move);
  }, [rowLengths, trailerCount, selectedNavIndex, goHome, setExpanded, pos]);

  return {
    pos,
    row,
    col,
    expanded,
    trailerIndex,
    selectedNavIndex,
    activeNavIndex,
    inContent,
    setPos,
    setExpanded,
    setTrailerIndex,
    setSelectedNavIndex,
    goHome,
    clickNav,
    clickTile,
    advanceTrailer,
  };
}

export { HOME_NAV_INDEX } from "./constants";
