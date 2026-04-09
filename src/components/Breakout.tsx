import { useCallback, useEffect, useRef, useState } from "react";
import "./Breakout.css";

// Konami: ↑↑↓↓←→←→BA
const KONAMI = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "b",
  "a",
];

export function useKonamiCode(): readonly [boolean, () => void] {
  const [activated, setActivated] = useState(false);
  const pos = useRef(0);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (activated) return;
      if (
        e.key === KONAMI[pos.current] ||
        e.key === KONAMI[pos.current]?.toUpperCase()
      ) {
        pos.current++;
        if (pos.current === KONAMI.length) {
          setActivated(true);
          pos.current = 0;
        }
      } else {
        pos.current = 0;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activated]);

  const close = useCallback(() => {
    setActivated(false);
    pos.current = 0;
  }, []);
  return [activated, close] as const;
}

// ---------------------------------------------------------------------------
// Game constants
// ---------------------------------------------------------------------------

const COLS = 10;
const ROWS = 5;
const BRICK_GAP = 4;
const BALL_R = 8;
const PADDLE_W = 120;
const PADDLE_H = 24;
const BALL_SPEED = 5;

const BRICK_COLORS = ["#e74c3c", "#e67e22", "#f1c40f", "#2ecc71", "#3498db"];

interface Brick {
  x: number;
  y: number;
  w: number;
  h: number;
  alive: boolean;
  color: string;
}

// ---------------------------------------------------------------------------
// Breakout component
// ---------------------------------------------------------------------------

interface Props {
  onClose: () => void;
}

export function Breakout({ onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const remoteImg = useRef<HTMLImageElement | null>(null);
  const raf = useRef(0);
  const keys = useRef(new Set<string>());

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Size canvas to window
    const W = window.innerWidth;
    const H = window.innerHeight;
    canvas.width = W;
    canvas.height = H;

    // Load remote SVG as image
    const img = new Image();
    img.src = "/fragments/remote.svg";
    remoteImg.current = img;

    // Bricks
    const brickW = (W - BRICK_GAP * (COLS + 1)) / COLS;
    const brickH = 28;
    const brickTop = 60;
    const bricks: Brick[] = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        bricks.push({
          x: BRICK_GAP + c * (brickW + BRICK_GAP),
          y: brickTop + r * (brickH + BRICK_GAP),
          w: brickW,
          h: brickH,
          alive: true,
          color: BRICK_COLORS[r % BRICK_COLORS.length],
        });
      }
    }

    // Paddle
    let paddleX = W / 2 - PADDLE_W / 2;
    const paddleY = H - 60;

    // Ball
    let bx = W / 2;
    let by = paddleY - BALL_R - 2;
    let bdx = BALL_SPEED * (Math.random() > 0.5 ? 1 : -1);
    let bdy = -BALL_SPEED;
    let launched = false;
    let score = 0;
    let lives = 3;
    let gameOver = false;

    // Key handlers
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "b" || e.key === "B") {
        e.preventDefault();
        e.stopPropagation();
        onClose();
        return;
      }
      keys.current.add(e.key);
      if (!launched && e.key === "Enter") {
        launched = true;
      }
      if (gameOver && e.key === "Enter") {
        // Reset
        bricks.forEach((b) => (b.alive = true));
        score = 0;
        lives = 3;
        gameOver = false;
        launched = false;
        paddleX = W / 2 - PADDLE_W / 2;
        bx = W / 2;
        by = paddleY - BALL_R - 2;
        bdx = BALL_SPEED * (Math.random() > 0.5 ? 1 : -1);
        bdy = -BALL_SPEED;
      }
    };
    const onKeyUp = (e: KeyboardEvent) => keys.current.delete(e.key);

    window.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("keyup", onKeyUp, true);

    function loop() {
      if (!ctx) return;

      // Move paddle
      const speed = 8;
      if (keys.current.has("ArrowLeft")) paddleX = Math.max(0, paddleX - speed);
      if (keys.current.has("ArrowRight"))
        paddleX = Math.min(W - PADDLE_W, paddleX + speed);

      if (!launched) {
        bx = paddleX + PADDLE_W / 2;
        by = paddleY - BALL_R - 2;
      }

      if (launched && !gameOver) {
        bx += bdx;
        by += bdy;

        // Wall collisions
        if (bx - BALL_R <= 0 || bx + BALL_R >= W) bdx = -bdx;
        if (by - BALL_R <= 0) bdy = -bdy;

        // Paddle collision
        if (
          by + BALL_R >= paddleY &&
          by + BALL_R <= paddleY + PADDLE_H &&
          bx >= paddleX &&
          bx <= paddleX + PADDLE_W
        ) {
          bdy = -Math.abs(bdy);
          // Angle based on where ball hits paddle
          const hit = (bx - paddleX) / PADDLE_W - 0.5;
          bdx = hit * BALL_SPEED * 2;
        }

        // Brick collisions
        for (const brick of bricks) {
          if (!brick.alive) continue;
          if (
            bx + BALL_R > brick.x &&
            bx - BALL_R < brick.x + brick.w &&
            by + BALL_R > brick.y &&
            by - BALL_R < brick.y + brick.h
          ) {
            brick.alive = false;
            bdy = -bdy;
            score += 10;
            break;
          }
        }

        // Ball lost
        if (by > H) {
          lives--;
          if (lives <= 0) {
            gameOver = true;
          } else {
            launched = false;
            bx = paddleX + PADDLE_W / 2;
            by = paddleY - BALL_R - 2;
            bdx = BALL_SPEED * (Math.random() > 0.5 ? 1 : -1);
            bdy = -BALL_SPEED;
          }
        }

        // Win check
        if (bricks.every((b) => !b.alive)) {
          gameOver = true;
        }
      }

      // --- Draw ---
      ctx.fillStyle = "#0a0a12";
      ctx.fillRect(0, 0, W, H);

      // Bricks
      for (const brick of bricks) {
        if (!brick.alive) continue;
        ctx.fillStyle = brick.color;
        ctx.beginPath();
        ctx.roundRect(brick.x, brick.y, brick.w, brick.h, 4);
        ctx.fill();
      }

      // Ball
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(bx, by, BALL_R, 0, Math.PI * 2);
      ctx.fill();

      // Paddle — draw remote SVG rotated 90°
      ctx.save();
      ctx.translate(paddleX + PADDLE_W / 2, paddleY + PADDLE_H / 2);
      ctx.rotate(Math.PI / 2);
      if (remoteImg.current?.complete) {
        const imgH = PADDLE_W;
        const imgW = PADDLE_H;
        ctx.globalAlpha = 0.9;
        ctx.drawImage(remoteImg.current, -imgW / 2, -imgH / 2, imgW, imgH);
        ctx.globalAlpha = 1;
      } else {
        ctx.fillStyle = "#444";
        ctx.fillRect(-PADDLE_H / 2, -PADDLE_W / 2, PADDLE_H, PADDLE_W);
      }
      ctx.restore();

      // HUD
      ctx.fillStyle = "#fff";
      ctx.font = "16px 'Amazon Ember', sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(`Score: ${score}`, 16, 30);
      ctx.textAlign = "right";
      ctx.fillText(`Lives: ${"♥".repeat(lives)}`, W - 16, 30);

      // Messages
      ctx.textAlign = "center";
      if (!launched && !gameOver) {
        ctx.font = "20px 'Amazon Ember', sans-serif";
        ctx.fillStyle = "rgba(255,255,255,0.7)";
        ctx.fillText("Press Enter to launch", W / 2, H / 2);
        ctx.font = "14px 'Amazon Ember', sans-serif";
        ctx.fillStyle = "rgba(255,255,255,0.4)";
        ctx.fillText("← → to move · Esc to exit", W / 2, H / 2 + 30);
      }
      if (gameOver) {
        ctx.font = "32px 'Amazon Ember', sans-serif";
        ctx.fillStyle = "#fff";
        const won = bricks.every((b) => !b.alive);
        ctx.fillText(won ? "You Win!" : "Game Over", W / 2, H / 2 - 10);
        ctx.font = "18px 'Amazon Ember', sans-serif";
        ctx.fillStyle = "rgba(255,255,255,0.6)";
        ctx.fillText(`Score: ${score}`, W / 2, H / 2 + 25);
        ctx.font = "14px 'Amazon Ember', sans-serif";
        ctx.fillStyle = "rgba(255,255,255,0.4)";
        ctx.fillText(
          "Press Enter to play again · Esc to exit",
          W / 2,
          H / 2 + 55,
        );
      }

      raf.current = requestAnimationFrame(loop);
    }

    raf.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf.current);
      window.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("keyup", onKeyUp, true);
    };
  }, [onClose]);

  return (
    <div className="breakout-overlay">
      <canvas ref={canvasRef} />
    </div>
  );
}
