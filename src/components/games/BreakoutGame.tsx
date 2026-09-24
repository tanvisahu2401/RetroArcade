import React, { useState, useEffect, useRef } from 'react';
import { sound } from '../../services/sound';
import confetti from 'canvas-confetti';
import { RotateCcw, Trophy, Heart, Play, Pause, Zap } from 'lucide-react';

interface BreakoutGameProps {
  onScoreUpdate?: (score: number) => void;
  highScore: number;
}

interface Brick {
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  points: number;
  hp: number;
  maxHp: number;
}

interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

interface PowerUp {
  x: number;
  y: number;
  w: number;
  h: number;
  vy: number;
  type: 'multiball' | 'laser' | 'wide' | 'shield';
  color: string;
  label: string;
}

interface Laser {
  x: number;
  y: number;
  vy: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
}

export const BreakoutGame: React.FC<BreakoutGameProps> = ({ onScoreUpdate, highScore }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(4);
  const [gameState, setGameState] = useState<'READY' | 'PLAYING' | 'PAUSED' | 'VICTORY' | 'GAME_OVER'>('READY');
  const [laserAmmo, setLaserAmmo] = useState(0);
  const [hasShield, setHasShield] = useState(true);

  const paddleRef = useRef({
    x: 245,
    y: 430,
    w: 110,
    h: 14,
    vx: 0,
    laserTimer: 0
  });

  const ballsRef = useRef<Ball[]>([
    { x: 300, y: 410, vx: 2.8, vy: -3.6, radius: 6 }
  ]);

  const bricksRef = useRef<Brick[]>([]);
  const powerUpsRef = useRef<PowerUp[]>([]);
  const lasersRef = useRef<Laser[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const keysRef = useRef<{ left: boolean; right: boolean; shoot: boolean }>({
    left: false,
    right: false,
    shoot: false,
  });

  // Initialize Bricks
  const initBricks = () => {
    const bricks: Brick[] = [];
    const rows = 5;
    const cols = 9;
    const brickW = 58;
    const brickH = 18;
    const paddingX = 7;
    const paddingY = 8;
    const startX = 28;
    const startY = 40;

    const rowConfigs = [
      { color: '#EF4444', points: 50, hp: 2 }, // Red (takes 2 hits)
      { color: '#F97316', points: 40, hp: 1 }, // Orange
      { color: '#FACC15', points: 30, hp: 1 }, // Yellow
      { color: '#22C55E', points: 20, hp: 1 }, // Green
      { color: '#38BDF8', points: 10, hp: 1 }, // Cyan
    ];

    for (let r = 0; r < rows; r++) {
      const cfg = rowConfigs[r];
      for (let c = 0; c < cols; c++) {
        bricks.push({
          x: startX + c * (brickW + paddingX),
          y: startY + r * (brickH + paddingY),
          w: brickW,
          h: brickH,
          color: cfg.color,
          points: cfg.points,
          hp: cfg.hp,
          maxHp: cfg.hp
        });
      }
    }

    bricksRef.current = bricks;
    ballsRef.current = [{ x: 300, y: 410, vx: 2.8, vy: -3.6, radius: 6 }];
    paddleRef.current = { x: 245, y: 430, w: 110, h: 14, vx: 0, laserTimer: 0 };
    powerUpsRef.current = [];
    lasersRef.current = [];
    particlesRef.current = [];
    setLaserAmmo(0);
    setHasShield(true);
  };

  const resetGame = () => {
    initBricks();
    setScore(0);
    setLives(4);
    setGameState('PLAYING');
    sound.playClear();
  };

  const spawnParticles = (x: number, y: number, color: string, count = 8) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 3.5;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: 3 + Math.random() * 3,
        life: 1.0,
      });
    }
  };

  // Keyboard and Mouse input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        keysRef.current.left = true;
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        keysRef.current.right = true;
      }
      if (e.key === ' ') {
        fireLaser();
      }
      if (e.key === 'p' || e.key === 'P') {
        setGameState(prev => (prev === 'PLAYING' ? 'PAUSED' : prev === 'PAUSED' ? 'PLAYING' : prev));
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        keysRef.current.left = false;
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        keysRef.current.right = false;
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const mouseX = (e.clientX - rect.left) * scaleX;
      paddleRef.current.x = Math.max(0, Math.min(canvas.width - paddleRef.current.w, mouseX - paddleRef.current.w / 2));
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    const cvs = canvasRef.current;
    if (cvs) {
      cvs.addEventListener('mousemove', handleMouseMove);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (cvs) {
        cvs.removeEventListener('mousemove', handleMouseMove);
      }
    };
  });

  const fireLaser = () => {
    if (laserAmmo > 0 && gameState === 'PLAYING') {
      const pad = paddleRef.current;
      lasersRef.current.push({ x: pad.x + 8, y: pad.y - 6, vy: -7 });
      lasersRef.current.push({ x: pad.x + pad.w - 12, y: pad.y - 6, vy: -7 });
      sound.playLaser();
      setLaserAmmo(a => Math.max(0, a - 1));
    }
  };

  // Main Loop
  useEffect(() => {
    initBricks();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const loop = () => {
      if (gameState === 'PLAYING') {
        updateGame();
      }
      render(ctx);
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  });

  const updateGame = () => {
    const paddle = paddleRef.current;
    const keys = keysRef.current;
    const balls = ballsRef.current;
    const bricks = bricksRef.current;
    const powerUps = powerUpsRef.current;
    const lasers = lasersRef.current;

    // Keyboard paddle move
    if (keys.left) {
      paddle.x = Math.max(0, paddle.x - 7);
    }
    if (keys.right) {
      paddle.x = Math.min(600 - paddle.w, paddle.x + 7);
    }

    // Update Balls
    for (let i = balls.length - 1; i >= 0; i--) {
      const ball = balls[i];
      ball.x += ball.vx;
      ball.y += ball.vy;

      // Wall reflections
      if (ball.x - ball.radius <= 0) {
        ball.x = ball.radius;
        ball.vx = Math.abs(ball.vx);
        sound.playBounce();
      }
      if (ball.x + ball.radius >= 600) {
        ball.x = 600 - ball.radius;
        ball.vx = -Math.abs(ball.vx);
        sound.playBounce();
      }
      if (ball.y - ball.radius <= 0) {
        ball.y = ball.radius;
        ball.vy = Math.abs(ball.vy);
        sound.playBounce();
      }

      // Bottom Void Check
      if (ball.y + ball.radius >= 470) {
        if (hasShield) {
          ball.vy = -Math.abs(ball.vy);
          setHasShield(false);
          sound.playBounce();
          spawnParticles(ball.x, 460, '#38BDF8', 12);
        } else {
          balls.splice(i, 1);
          continue;
        }
      }

      // Paddle Collision with Angle Slicing
      if (
        ball.y + ball.radius >= paddle.y &&
        ball.y - ball.radius <= paddle.y + paddle.h &&
        ball.x >= paddle.x &&
        ball.x <= paddle.x + paddle.w &&
        ball.vy > 0
      ) {
        ball.y = paddle.y - ball.radius;

        // Angle deflection based on hit position
        const hitOffset = (ball.x - (paddle.x + paddle.w / 2)) / (paddle.w / 2);
        const speed = Math.hypot(ball.vx, ball.vy);
        ball.vx = hitOffset * 5.2;
        ball.vy = -Math.sqrt(Math.max(12, speed * speed - ball.vx * ball.vx));
        sound.playBounce();
        spawnParticles(ball.x, paddle.y, '#F43F5E', 4);
      }

      // Brick Collisions
      for (let bIdx = bricks.length - 1; bIdx >= 0; bIdx--) {
        const brick = bricks[bIdx];
        if (
          ball.x + ball.radius > brick.x &&
          ball.x - ball.radius < brick.x + brick.w &&
          ball.y + ball.radius > brick.y &&
          ball.y - ball.radius < brick.y + brick.h
        ) {
          // Reflect ball
          ball.vy = -ball.vy;
          brick.hp -= 1;
          sound.playHit();
          spawnParticles(ball.x, ball.y, brick.color, 8);

          if (brick.hp <= 0) {
            setScore(s => {
              const next = s + brick.points;
              onScoreUpdate?.(next);
              return next;
            });

            // Random Power-Up drop (22% chance)
            if (Math.random() < 0.22) {
              const types: Array<{ type: PowerUp['type']; color: string; label: string }> = [
                { type: 'multiball', color: '#38BDF8', label: '3×' },
                { type: 'laser', color: '#F43F5E', label: 'LASER' },
                { type: 'wide', color: '#10B981', label: 'WIDE' },
                { type: 'shield', color: '#A855F7', label: 'SHIELD' },
              ];
              const p = types[Math.floor(Math.random() * types.length)];
              powerUps.push({
                x: brick.x + brick.w / 2 - 12,
                y: brick.y,
                w: 24,
                h: 12,
                vy: 2.2,
                ...p,
              });
            }

            bricks.splice(bIdx, 1);
          }
          break;
        }
      }
    }

    // Check ball drain
    if (balls.length === 0) {
      sound.playGameOver();
      setLives(l => {
        const next = l - 1;
        if (next <= 0) {
          setGameState('GAME_OVER');
        } else {
          // Respawn ball
          balls.push({
            x: paddle.x + paddle.w / 2,
            y: paddle.y - 12,
            vx: 3,
            vy: -4,
            radius: 6,
          });
        }
        return next;
      });
    }

    // Update Lasers
    for (let lIdx = lasers.length - 1; lIdx >= 0; lIdx--) {
      const laser = lasers[lIdx];
      laser.y += laser.vy;

      // Hit brick
      for (let bIdx = bricks.length - 1; bIdx >= 0; bIdx--) {
        const brick = bricks[bIdx];
        if (
          laser.x > brick.x &&
          laser.x < brick.x + brick.w &&
          laser.y > brick.y &&
          laser.y < brick.y + brick.h
        ) {
          brick.hp -= 1;
          sound.playHit();
          spawnParticles(laser.x, laser.y, '#F43F5E', 6);
          if (brick.hp <= 0) {
            setScore(s => s + brick.points);
            bricks.splice(bIdx, 1);
          }
          lasers.splice(lIdx, 1);
          break;
        }
      }

      if (laser.y < 0) {
        lasers.splice(lIdx, 1);
      }
    }

    // Update PowerUps
    for (let pIdx = powerUps.length - 1; pIdx >= 0; pIdx--) {
      const p = powerUps[pIdx];
      p.y += p.vy;

      // Catch powerup with paddle
      if (
        p.x + p.w > paddle.x &&
        p.x < paddle.x + paddle.w &&
        p.y + p.h > paddle.y &&
        p.y < paddle.y + paddle.h
      ) {
        sound.playCoin();
        spawnParticles(p.x, p.y, p.color, 10);

        if (p.type === 'multiball') {
          // Spawn extra balls
          const mainBall = balls[0] || { x: paddle.x, y: paddle.y - 10, vx: 2, vy: -4, radius: 6 };
          balls.push({ x: mainBall.x, y: mainBall.y, vx: mainBall.vx - 2, vy: mainBall.vy, radius: 6 });
          balls.push({ x: mainBall.x, y: mainBall.y, vx: mainBall.vx + 2, vy: mainBall.vy, radius: 6 });
        } else if (p.type === 'laser') {
          setLaserAmmo(a => a + 10);
        } else if (p.type === 'wide') {
          paddle.w = Math.min(140, paddle.w + 24);
        } else if (p.type === 'shield') {
          setHasShield(true);
        }

        powerUps.splice(pIdx, 1);
        continue;
      }

      if (p.y > 480) {
        powerUps.splice(pIdx, 1);
      }
    }

    // Check Victory
    if (bricks.length === 0) {
      sound.playClear();
      confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
      setScore(s => s + 1000);
      setGameState('VICTORY');
    }

    // Update particles
    for (let i = particlesRef.current.length - 1; i >= 0; i--) {
      const pt = particlesRef.current[i];
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.life -= 0.035;
      if (pt.life <= 0) particlesRef.current.splice(i, 1);
    }
  };

  const render = (ctx: CanvasRenderingContext2D) => {
    // Clear
    ctx.fillStyle = '#090D16';
    ctx.fillRect(0, 0, 600, 470);

    // Subtle background grid
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= 600; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 470);
      ctx.stroke();
    }

    // Draw Shield
    if (hasShield) {
      ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.fillRect(0, 465, 600, 5);
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 2;
      ctx.strokeRect(0, 465, 600, 5);
    }

    // Draw Bricks
    for (const b of bricksRef.current) {
      ctx.fillStyle = b.color;
      ctx.fillRect(b.x, b.y, b.w, b.h);

      // Bevel
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.fillRect(b.x, b.y, b.w, 2);
      ctx.fillRect(b.x, b.y, 2, b.h);

      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 1;
      ctx.strokeRect(b.x, b.y, b.w, b.h);

      // Cracked visual if damaged
      if (b.hp < b.maxHp) {
        ctx.fillStyle = '#0F172A';
        ctx.fillRect(b.x + b.w / 2 - 4, b.y + 3, 2, b.h - 6);
      }
    }

    // Draw Power-Ups
    for (const p of powerUpsRef.current) {
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.w, p.h);
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1;
      ctx.strokeRect(p.x, p.y, p.w, p.h);

      ctx.fillStyle = '#000000';
      ctx.font = 'bold 7px monospace';
      ctx.fillText(p.label, p.x + 2, p.y + 9);
    }

    // Draw Lasers
    ctx.fillStyle = '#F43F5E';
    for (const l of lasersRef.current) {
      ctx.fillRect(l.x, l.y, 4, 10);
    }

    // Draw Balls
    for (const ball of ballsRef.current) {
      ctx.fillStyle = '#F8FAFC';
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
      ctx.fill();

      // Specular dot
      ctx.fillStyle = '#38BDF8';
      ctx.beginPath();
      ctx.arc(ball.x - 1, ball.y - 1, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw Paddle
    const paddle = paddleRef.current;
    ctx.fillStyle = '#EC4899';
    ctx.fillRect(paddle.x, paddle.y, paddle.w, paddle.h);

    // Paddle trim
    ctx.fillStyle = '#F472B6';
    ctx.fillRect(paddle.x, paddle.y, paddle.w, 3);
    ctx.strokeStyle = '#831843';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(paddle.x, paddle.y, paddle.w, paddle.h);

    // Laser cannons on paddle sides
    if (laserAmmo > 0) {
      ctx.fillStyle = '#F43F5E';
      ctx.fillRect(paddle.x + 4, paddle.y - 4, 4, 6);
      ctx.fillRect(paddle.x + paddle.w - 8, paddle.y - 4, 4, 6);
    }

    // Particles
    for (const pt of particlesRef.current) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, pt.life);
      ctx.fillStyle = pt.color;
      ctx.fillRect(pt.x, pt.y, pt.size, pt.size);
      ctx.restore();
    }
  };

  return (
    <div className="flex flex-col items-center select-none">
      {/* Top HUD */}
      <div className="w-full max-w-[600px] flex items-center justify-between px-3 py-2 bg-slate-900 border-x border-t border-slate-800 rounded-t-lg text-xs font-mono">
        <div className="flex items-center gap-4">
          <span className="text-pink-400 font-bold">BRICK BREAKER</span>
          <div className="flex items-center gap-1 text-rose-400">
            <Heart size={14} className="fill-rose-500 text-rose-500" />
            <span className="font-bold tabular-nums">{lives}</span>
          </div>
          {laserAmmo > 0 && (
            <div className="flex items-center gap-1 text-rose-400 font-bold">
              <Zap size={13} className="text-rose-400" />
              <span>Laser: {laserAmmo}</span>
            </div>
          )}
          {hasShield && (
            <span className="text-cyan-400 font-bold">Shield Active</span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-slate-300">
            <span>Score:</span>
            <span className="text-white font-bold tabular-nums">{score}</span>
          </div>
          <div className="flex items-center gap-1 text-slate-400">
            <Trophy size={13} className="text-amber-400" />
            <span className="text-slate-200 tabular-nums">{Math.max(score, highScore)}</span>
          </div>
        </div>
      </div>

      {/* Main Canvas */}
      <div className="relative w-full max-w-[600px] aspect-[600/470] bg-slate-950 border border-slate-800 shadow-2xl overflow-hidden crt-effect">
        <canvas
          ref={canvasRef}
          width={600}
          height={470}
          className="w-full h-full block pixelated cursor-crosshair"
        />

        {/* Ready Overlay */}
        {gameState === 'READY' && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center z-30">
            <div className="w-14 h-14 rounded-lg bg-pink-500/20 border border-pink-400 flex items-center justify-center mb-3 text-pink-400 font-arcade text-xl">
              🧱
            </div>
            <h3 className="font-arcade text-base text-white mb-2">BRICK BREAKER</h3>
            <p className="text-sm text-slate-300 max-w-sm mb-4 font-body">
              Slide paddle with mouse or arrow keys to ricochet the ball into the bricks. Catch power-ups like multi-ball, wide paddle, and lasers!
            </p>
            <button
              onClick={resetGame}
              className="font-arcade text-xs px-6 py-2.5 bg-pink-600 hover:bg-pink-500 text-white rounded transition-colors active:scale-95"
            >
              START GAME
            </button>
          </div>
        )}

        {/* Victory */}
        {gameState === 'VICTORY' && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center z-30">
            <Trophy size={48} className="text-amber-400 mb-3 animate-bounce" />
            <h3 className="font-arcade text-base text-amber-400 mb-2">WALL DESTROYED!</h3>
            <div className="text-xs font-mono text-slate-300 mb-4 bg-slate-900 px-4 py-2 rounded border border-slate-800">
              Score: <span className="text-amber-400 font-bold">{score}</span>
            </div>
            <button
              onClick={resetGame}
              className="font-arcade text-xs px-6 py-2.5 bg-pink-600 hover:bg-pink-500 text-white rounded transition-colors active:scale-95"
            >
              PLAY AGAIN
            </button>
          </div>
        )}

        {/* Game Over */}
        {gameState === 'GAME_OVER' && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center z-30">
            <h3 className="font-arcade text-base text-rose-500 mb-2">GAME OVER</h3>
            <div className="text-xs font-mono text-slate-300 mb-4 bg-slate-900 px-4 py-2 rounded border border-slate-800">
              Final Score: <span className="text-amber-400 font-bold">{score}</span>
            </div>
            <button
              onClick={resetGame}
              className="flex items-center gap-2 font-arcade text-xs px-5 py-2.5 bg-pink-600 hover:bg-pink-500 text-white rounded transition-colors active:scale-95"
            >
              <RotateCcw size={14} />
              <span>TRY AGAIN</span>
            </button>
          </div>
        )}

        {/* Paused */}
        {gameState === 'PAUSED' && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center z-30">
            <h3 className="font-arcade text-base text-white mb-3">PAUSED</h3>
            <button
              onClick={() => setGameState('PLAYING')}
              className="font-arcade text-xs px-5 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded transition-colors"
            >
              RESUME
            </button>
          </div>
        )}
      </div>

      {/* Control Bar */}
      <div className="w-full max-w-[600px] flex items-center justify-between p-3 bg-slate-900 border-x border-b border-slate-800 rounded-b-lg">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setGameState(g => (g === 'PLAYING' ? 'PAUSED' : g === 'PAUSED' ? 'PLAYING' : g))}
            className="p-2 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors"
          >
            {gameState === 'PLAYING' ? <Pause size={15} /> : <Play size={15} />}
          </button>
          <button
            onClick={resetGame}
            className="p-2 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors"
          >
            <RotateCcw size={15} />
          </button>
        </div>

        {/* Touch D-Pad for Mobile */}
        <div className="flex items-center gap-2 md:hidden">
          <button
            onTouchStart={() => (keysRef.current.left = true)}
            onTouchEnd={() => (keysRef.current.left = false)}
            className="w-12 h-10 bg-slate-800 active:bg-slate-700 text-white rounded flex items-center justify-center text-xs"
          >
            ◀
          </button>
          <button
            onTouchStart={() => (keysRef.current.right = true)}
            onTouchEnd={() => (keysRef.current.right = false)}
            className="w-12 h-10 bg-slate-800 active:bg-slate-700 text-white rounded flex items-center justify-center text-xs"
          >
            ▶
          </button>
          <button
            onClick={fireLaser}
            className="w-14 h-10 bg-pink-600 active:bg-pink-500 text-white rounded flex items-center justify-center text-xs font-bold"
          >
            FIRE
          </button>
        </div>

        <div className="hidden md:flex items-center gap-2 text-xs text-slate-400 font-mono">
          <span>Move: <strong className="text-slate-200">Mouse or A / D / Arrows</strong></span>
          <span>·</span>
          <span>Fire Laser: <strong className="text-slate-200">Space</strong></span>
          <span>·</span>
          <span>Pause: <strong className="text-slate-200">P</strong></span>
        </div>
      </div>
    </div>
  );
};
