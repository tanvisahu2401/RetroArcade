import React, { useState, useEffect, useRef } from 'react';
import { sound } from '../../services/sound';
import confetti from 'canvas-confetti';
import { RotateCcw, Trophy, Heart, Play, Pause } from 'lucide-react';

interface SpaceDefenderProps {
  onScoreUpdate?: (score: number) => void;
  highScore: number;
}

interface Alien {
  x: number;
  y: number;
  w: number;
  h: number;
  row: number;
  points: number;
  alive: boolean;
  color: string;
}

interface Bullet {
  x: number;
  y: number;
  vy: number;
}

interface Bomb {
  x: number;
  y: number;
  vy: number;
}

interface BunkerBlock {
  x: number;
  y: number;
  w: number;
  h: number;
  hp: number;
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

export const SpaceDefenderGame: React.FC<SpaceDefenderProps> = ({ onScoreUpdate, highScore }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(4);
  const [wave, setWave] = useState(1);
  const [gameState, setGameState] = useState<'READY' | 'PLAYING' | 'PAUSED' | 'WAVE_CLEARED' | 'GAME_OVER'>('READY');

  const playerRef = useRef({
    x: 280,
    y: 430,
    w: 32,
    h: 18,
    vx: 0,
    shootCooldown: 0
  });

  const aliensRef = useRef<Alien[]>([]);
  const bulletsRef = useRef<Bullet[]>([]);
  const bombsRef = useRef<Bomb[]>([]);
  const bunkersRef = useRef<BunkerBlock[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const ufoRef = useRef<{ x: number; y: number; active: boolean; points: number } | null>(null);

  const fleetDirectionRef = useRef<number>(1);
  const fleetStepIntervalRef = useRef<number>(45); // frames between fleet steps
  const fleetStepTimerRef = useRef<number>(0);

  const keysRef = useRef<{ left: boolean; right: boolean; shoot: boolean }>({
    left: false,
    right: false,
    shoot: false,
  });

  const initWave = (wNum = 1) => {
    // Generate Aliens
    const aliens: Alien[] = [];
    const rows = 4;
    const cols = 9;
    const startX = 60;
    const startY = 60;

    const rowColors = ['#F43F5E', '#EC4899', '#38BDF8', '#10B981'];
    const rowPoints = [40, 30, 20, 10];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        aliens.push({
          x: startX + c * 48,
          y: startY + r * 34,
          w: 24,
          h: 18,
          row: r,
          points: rowPoints[r],
          alive: true,
          color: rowColors[r]
        });
      }
    }
    aliensRef.current = aliens;

    // Generate Bunkers (3 defensive forts)
    const bunkers: BunkerBlock[] = [];
    const bunkerXPositions = [110, 270, 430];
    for (const bx of bunkerXPositions) {
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 5; c++) {
          if (r === 2 && (c === 2)) continue; // arch cutout
          bunkers.push({
            x: bx + c * 10,
            y: 370 + r * 10,
            w: 10,
            h: 10,
            hp: 3
          });
        }
      }
    }
    bunkersRef.current = bunkers;

    bulletsRef.current = [];
    bombsRef.current = [];
    particlesRef.current = [];
    ufoRef.current = null;
    fleetDirectionRef.current = 1;
    fleetStepIntervalRef.current = Math.max(20, 52 - (wNum - 1) * 6);
    fleetStepTimerRef.current = 0;
  };

  const resetGame = () => {
    setScore(0);
    setLives(4);
    setWave(1);
    initWave(1);
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
        size: 3 + Math.random() * 2,
        life: 1.0,
      });
    }
  };

  // Input listeners
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
        shootLaser();
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

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  });

  const shootLaser = () => {
    if (gameState !== 'PLAYING') return;
    const player = playerRef.current;
    if (player.shootCooldown <= 0) {
      bulletsRef.current.push({
        x: player.x + player.w / 2 - 2,
        y: player.y - 6,
        vy: -9
      });
      player.shootCooldown = 15;
      sound.playLaser();
    }
  };

  useEffect(() => {
    initWave(1);
  }, []);

  // Main Loop
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
    const player = playerRef.current;
    const keys = keysRef.current;
    const aliens = aliensRef.current;
    const bullets = bulletsRef.current;
    const bombs = bombsRef.current;
    const bunkers = bunkersRef.current;

    // Player move
    if (keys.left) {
      player.x = Math.max(10, player.x - 4.5);
    }
    if (keys.right) {
      player.x = Math.min(590 - player.w, player.x + 4.5);
    }

    if (player.shootCooldown > 0) {
      player.shootCooldown -= 1;
    }

    // Alien Fleet March Step
    fleetStepTimerRef.current += 1;
    const aliveAliens = aliens.filter(a => a.alive);

    if (fleetStepTimerRef.current >= fleetStepIntervalRef.current) {
      fleetStepTimerRef.current = 0;

      // Check boundary hit
      let shiftDown = false;
      for (const a of aliveAliens) {
        if (fleetDirectionRef.current > 0 && a.x + a.w >= 570) {
          shiftDown = true;
          break;
        } else if (fleetDirectionRef.current < 0 && a.x <= 30) {
          shiftDown = true;
          break;
        }
      }

      if (shiftDown) {
        fleetDirectionRef.current = -fleetDirectionRef.current;
        for (const a of aliveAliens) {
          a.y += 16;
          // Check ground breach
          if (a.y + a.h >= player.y) {
            sound.playGameOver();
            setGameState('GAME_OVER');
            return;
          }
        }
      } else {
        const stepX = fleetDirectionRef.current * 10;
        for (const a of aliveAliens) {
          a.x += stepX;
        }
      }

      // Fleet step click sound
      sound.playClick();
    }

    // Alien Bomb drop (3% chance per step)
    if (aliveAliens.length > 0 && Math.random() < 0.04) {
      const shooter = aliveAliens[Math.floor(Math.random() * aliveAliens.length)];
      bombs.push({
        x: shooter.x + shooter.w / 2,
        y: shooter.y + shooter.h,
        vy: 3.5
      });
    }

    // UFO Mothership spawn (0.3% chance)
    if (!ufoRef.current && Math.random() < 0.004) {
      ufoRef.current = {
        x: -40,
        y: 25,
        active: true,
        points: 300
      };
      sound.playCoin();
    }

    // Update UFO
    if (ufoRef.current) {
      ufoRef.current.x += 2.5;
      if (ufoRef.current.x > 620) {
        ufoRef.current = null;
      }
    }

    // Update Player Bullets
    for (let bIdx = bullets.length - 1; bIdx >= 0; bIdx--) {
      const b = bullets[bIdx];
      b.y += b.vy;

      // Check UFO hit
      if (ufoRef.current && b.y < 45 && b.x > ufoRef.current.x && b.x < ufoRef.current.x + 36) {
        sound.playClear();
        spawnParticles(ufoRef.current.x + 18, 25, '#EF4444', 16);
        setScore(s => s + ufoRef.current!.points);
        ufoRef.current = null;
        bullets.splice(bIdx, 1);
        continue;
      }

      // Check Alien hit
      let bulletHit = false;
      for (const a of aliveAliens) {
        if (
          b.x >= a.x &&
          b.x <= a.x + a.w &&
          b.y >= a.y &&
          b.y <= a.y + a.h
        ) {
          a.alive = false;
          bulletHit = true;
          sound.playHit();
          spawnParticles(a.x + a.w / 2, a.y + a.h / 2, a.color, 10);
          setScore(s => {
            const next = s + a.points;
            onScoreUpdate?.(next);
            return next;
          });

          // Accelerate remaining aliens
          fleetStepIntervalRef.current = Math.max(6, Math.floor(fleetStepIntervalRef.current * 0.96));
          break;
        }
      }

      if (bulletHit) {
        bullets.splice(bIdx, 1);
        continue;
      }

      // Check Bunker hit
      for (let bkIdx = bunkers.length - 1; bkIdx >= 0; bkIdx--) {
        const bk = bunkers[bkIdx];
        if (
          b.x >= bk.x &&
          b.x <= bk.x + bk.w &&
          b.y >= bk.y &&
          b.y <= bk.y + bk.h
        ) {
          bk.hp -= 1;
          if (bk.hp <= 0) bunkers.splice(bkIdx, 1);
          bullets.splice(bIdx, 1);
          bulletHit = true;
          break;
        }
      }

      if (bulletHit) continue;

      if (b.y < 0) {
        bullets.splice(bIdx, 1);
      }
    }

    // Update Alien Bombs
    for (let bmIdx = bombs.length - 1; bmIdx >= 0; bmIdx--) {
      const bomb = bombs[bmIdx];
      bomb.y += bomb.vy;

      // Check Player hit
      if (
        bomb.x >= player.x &&
        bomb.x <= player.x + player.w &&
        bomb.y >= player.y &&
        bomb.y <= player.y + player.h
      ) {
        sound.playGameOver();
        spawnParticles(player.x + player.w / 2, player.y, '#EF4444', 16);
        bombs.splice(bmIdx, 1);

        setLives(l => {
          const next = l - 1;
          if (next <= 0) {
            setGameState('GAME_OVER');
          } else {
            player.x = 280;
          }
          return next;
        });
        continue;
      }

      // Check Bunker hit
      let bombHit = false;
      for (let bkIdx = bunkers.length - 1; bkIdx >= 0; bkIdx--) {
        const bk = bunkers[bkIdx];
        if (
          bomb.x >= bk.x &&
          bomb.x <= bk.x + bk.w &&
          bomb.y >= bk.y &&
          bomb.y <= bk.y + bk.h
        ) {
          bk.hp -= 1;
          if (bk.hp <= 0) bunkers.splice(bkIdx, 1);
          bombs.splice(bmIdx, 1);
          bombHit = true;
          break;
        }
      }

      if (bombHit) continue;

      if (bomb.y > 470) {
        bombs.splice(bmIdx, 1);
      }
    }

    // Check Wave Cleared
    if (aliveAliens.length === 0) {
      sound.playClear();
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.5 } });
      setScore(s => s + 500);
      setWave(w => {
        const nextWave = w + 1;
        initWave(nextWave);
        setGameState('WAVE_CLEARED');
        return nextWave;
      });
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
    // Clear Deep Space
    ctx.fillStyle = '#050811';
    ctx.fillRect(0, 0, 600, 460);

    // Starfield twinkle
    ctx.fillStyle = '#FFFFFF';
    for (let i = 0; i < 40; i++) {
      const sx = (i * 73) % 600;
      const sy = (i * 97) % 460;
      ctx.fillRect(sx, sy, 1, 1);
    }

    // Draw Bunkers
    for (const bk of bunkersRef.current) {
      ctx.fillStyle = bk.hp === 3 ? '#10B981' : bk.hp === 2 ? '#34D399' : '#059669';
      ctx.fillRect(bk.x, bk.y, bk.w, bk.h);
      ctx.strokeStyle = '#064E3B';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(bk.x, bk.y, bk.w, bk.h);
    }

    // Draw Aliens
    for (const a of aliensRef.current) {
      if (!a.alive) continue;
      ctx.fillStyle = a.color;

      // Alien 8-bit glyph shape
      ctx.fillRect(a.x + 4, a.y, a.w - 8, 4);
      ctx.fillRect(a.x + 2, a.y + 4, a.w - 4, 8);
      ctx.fillRect(a.x, a.y + 12, a.w, 4);

      // Eye cutouts
      ctx.fillStyle = '#050811';
      ctx.fillRect(a.x + 5, a.y + 5, 3, 3);
      ctx.fillRect(a.x + a.w - 8, a.y + 5, 3, 3);
    }

    // Draw UFO
    if (ufoRef.current) {
      ctx.fillStyle = '#EF4444';
      ctx.beginPath();
      ctx.ellipse(ufoRef.current.x + 18, ufoRef.current.y + 8, 18, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FDE047';
      ctx.beginPath();
      ctx.arc(ufoRef.current.x + 18, ufoRef.current.y + 5, 6, Math.PI, 0);
      ctx.fill();
    }

    // Draw Bullets
    ctx.fillStyle = '#38BDF8';
    for (const b of bulletsRef.current) {
      ctx.fillRect(b.x, b.y, 3, 8);
    }

    // Draw Alien Bombs
    ctx.fillStyle = '#EF4444';
    for (const bm of bombsRef.current) {
      ctx.fillRect(bm.x - 1, bm.y, 3, 7);
    }

    // Draw Player Ship
    const p = playerRef.current;
    ctx.fillStyle = '#38BDF8';
    // Hull
    ctx.fillRect(p.x, p.y + 8, p.w, 10);
    // Cabin
    ctx.fillRect(p.x + 8, p.y + 3, p.w - 16, 5);
    // Cannon tip
    ctx.fillStyle = '#F8FAFC';
    ctx.fillRect(p.x + p.w / 2 - 2, p.y, 4, 4);

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
          <span className="text-blue-400 font-bold">SPACE DEFENDER</span>
          <div className="flex items-center gap-1 text-rose-400">
            <Heart size={14} className="fill-rose-500 text-rose-500" />
            <span className="font-bold tabular-nums">{lives}</span>
          </div>
          <span className="text-slate-400">Wave: <strong className="text-white">{wave}</strong></span>
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
      <div className="relative w-full max-w-[600px] aspect-[600/460] bg-slate-950 border border-slate-800 shadow-2xl overflow-hidden crt-effect">
        <canvas
          ref={canvasRef}
          width={600}
          height={460}
          className="w-full h-full block pixelated"
        />

        {/* Ready Overlay */}
        {gameState === 'READY' && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center z-30">
            <div className="w-14 h-14 rounded-lg bg-blue-500/20 border border-blue-400 flex items-center justify-center mb-3 text-blue-400 font-arcade text-xl">
              👾
            </div>
            <h3 className="font-arcade text-base text-white mb-2">SPACE DEFENDER</h3>
            <p className="text-sm text-slate-300 max-w-sm mb-4 font-body">
              Command the ground cannon, take cover behind defensive bunkers, and destroy descending alien swarms before they reach the ground!
            </p>
            <button
              onClick={resetGame}
              className="font-arcade text-xs px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors active:scale-95"
            >
              START MISSION
            </button>
          </div>
        )}

        {/* Wave Cleared */}
        {gameState === 'WAVE_CLEARED' && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center z-30">
            <Trophy size={48} className="text-amber-400 mb-3 animate-bounce" />
            <h3 className="font-arcade text-base text-amber-400 mb-2">WAVE REPULSED!</h3>
            <div className="text-xs font-mono text-slate-300 mb-4 bg-slate-900 px-4 py-2 rounded border border-slate-800">
              Score: <span className="text-amber-400 font-bold">{score}</span>
            </div>
            <button
              onClick={() => setGameState('PLAYING')}
              className="font-arcade text-xs px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded transition-colors"
            >
              NEXT WAVE
            </button>
          </div>
        )}

        {/* Game Over */}
        {gameState === 'GAME_OVER' && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center z-30">
            <h3 className="font-arcade text-base text-rose-500 mb-2">EARTH OVERRUN</h3>
            <div className="text-xs font-mono text-slate-300 mb-4 bg-slate-900 px-4 py-2 rounded border border-slate-800">
              Final Score: <span className="text-amber-400 font-bold">{score}</span>
            </div>
            <button
              onClick={resetGame}
              className="flex items-center gap-2 font-arcade text-xs px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors active:scale-95"
            >
              <RotateCcw size={14} />
              <span>RETRY DEFENSE</span>
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
            onClick={shootLaser}
            className="w-16 h-10 bg-blue-600 active:bg-blue-500 text-white font-bold rounded flex items-center justify-center text-xs shadow"
          >
            FIRE
          </button>
        </div>

        <div className="hidden md:flex items-center gap-2 text-xs text-slate-400 font-mono">
          <span>Move: <strong className="text-slate-200">A / D / Arrows</strong></span>
          <span>·</span>
          <span>Fire: <strong className="text-slate-200">Space</strong></span>
          <span>·</span>
          <span>Pause: <strong className="text-slate-200">P</strong></span>
        </div>
      </div>
    </div>
  );
};
