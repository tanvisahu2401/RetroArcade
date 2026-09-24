import React, { useState, useEffect, useRef } from 'react';
import { sound } from '../../services/sound';
import confetti from 'canvas-confetti';
import { RotateCcw, Trophy, Heart, Play, Pause, Coins } from 'lucide-react';

interface MarioGameProps {
  onScoreUpdate?: (score: number) => void;
  highScore: number;
}

interface Block {
  x: number;
  y: number;
  w: number;
  h: number;
  type: 'ground' | 'brick' | 'question' | 'pipe';
  bumpTimer?: number;
  hit?: boolean;
}

interface Enemy {
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  alive: boolean;
  squishTimer: number;
}

interface Coin {
  x: number;
  y: number;
  w: number;
  h: number;
  collected: boolean;
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

export const MarioGame: React.FC<MarioGameProps> = ({ onScoreUpdate, highScore }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [score, setScore] = useState(0);
  const [coinsCount, setCoinsCount] = useState(0);
  const [lives, setLives] = useState(5);
  const [gameState, setGameState] = useState<'READY' | 'PLAYING' | 'PAUSED' | 'VICTORY' | 'GAME_OVER'>('READY');

  const keysRef = useRef<{ left: boolean; right: boolean; jump: boolean }>({
    left: false,
    right: false,
    jump: false,
  });

  const playerRef = useRef({
    x: 60,
    y: 350,
    vx: 0,
    vy: 0,
    w: 24,
    h: 32,
    facing: 'RIGHT' as 'LEFT' | 'RIGHT',
    onGround: false,
    isJumping: false,
    invincibleTimer: 0
  });

  const cameraXRef = useRef(0);
  const blocksRef = useRef<Block[]>([]);
  const enemiesRef = useRef<Enemy[]>([]);
  const coinsRef = useRef<Coin[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const flagpoleX = 2200;

  // Initialize level geometry
  const initLevel = () => {
    playerRef.current = {
      x: 60,
      y: 350,
      vx: 0,
      vy: 0,
      w: 24,
      h: 32,
      facing: 'RIGHT',
      onGround: false,
      isJumping: false,
      invincibleTimer: 0
    };
    cameraXRef.current = 0;

    // Ground segments with some pits
    const blocks: Block[] = [
      { x: 0, y: 400, w: 700, h: 80, type: 'ground' },
      { x: 780, y: 400, w: 550, h: 80, type: 'ground' }, // Pit between 700-780
      { x: 1400, y: 400, w: 1000, h: 80, type: 'ground' }, // Pit between 1330-1400

      // Low/mid platforms and blocks
      { x: 200, y: 280, w: 32, h: 32, type: 'question' },
      { x: 232, y: 280, w: 32, h: 32, type: 'brick' },
      { x: 264, y: 280, w: 32, h: 32, type: 'question' },
      { x: 296, y: 280, w: 32, h: 32, type: 'brick' },
      { x: 328, y: 280, w: 32, h: 32, type: 'question' },

      // Pipes
      { x: 450, y: 340, w: 50, h: 60, type: 'pipe' },
      { x: 620, y: 310, w: 50, h: 90, type: 'pipe' },

      // Mid section
      { x: 860, y: 270, w: 32, h: 32, type: 'question' },
      { x: 892, y: 270, w: 32, h: 32, type: 'brick' },
      { x: 980, y: 200, w: 96, h: 24, type: 'brick' },
      { x: 1140, y: 330, w: 50, h: 70, type: 'pipe' },

      // High stair steps leading to flagpole
      { x: 1650, y: 368, w: 32, h: 32, type: 'brick' },
      { x: 1682, y: 336, w: 32, h: 64, type: 'brick' },
      { x: 1714, y: 304, w: 32, h: 96, type: 'brick' },
      { x: 1746, y: 272, w: 32, h: 128, type: 'brick' },
      { x: 1778, y: 240, w: 32, h: 160, type: 'brick' },
      { x: 1810, y: 240, w: 32, h: 160, type: 'brick' },

      // Final questions
      { x: 1950, y: 260, w: 32, h: 32, type: 'question' },
      { x: 2020, y: 260, w: 32, h: 32, type: 'question' },
    ];

    blocksRef.current = blocks;

    // Patrolling Goomba enemies
    enemiesRef.current = [
      { x: 360, y: 372, w: 26, h: 28, vx: -1.2, alive: true, squishTimer: 0 },
      { x: 550, y: 372, w: 26, h: 28, vx: -1.2, alive: true, squishTimer: 0 },
      { x: 920, y: 372, w: 26, h: 28, vx: -1.4, alive: true, squishTimer: 0 },
      { x: 1050, y: 372, w: 26, h: 28, vx: 1.2, alive: true, squishTimer: 0 },
      { x: 1480, y: 372, w: 26, h: 28, vx: -1.4, alive: true, squishTimer: 0 },
      { x: 1600, y: 372, w: 26, h: 28, vx: -1.4, alive: true, squishTimer: 0 },
      { x: 1900, y: 372, w: 26, h: 28, vx: -1.5, alive: true, squishTimer: 0 },
    ];

    // Floating Coins
    coinsRef.current = [
      { x: 212, y: 230, w: 16, h: 20, collected: false },
      { x: 276, y: 230, w: 16, h: 20, collected: false },
      { x: 340, y: 230, w: 16, h: 20, collected: false },
      { x: 1000, y: 160, w: 16, h: 20, collected: false },
      { x: 1030, y: 160, w: 16, h: 20, collected: false },
      { x: 1060, y: 160, w: 16, h: 20, collected: false },
    ];

    particlesRef.current = [];
  };

  const resetGame = () => {
    initLevel();
    setScore(0);
    setCoinsCount(0);
    setLives(5);
    setGameState('PLAYING');
    sound.playClear();
  };

  // Keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        keysRef.current.left = true;
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        keysRef.current.right = true;
      }
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === ' ') {
        keysRef.current.jump = true;
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
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === ' ') {
        keysRef.current.jump = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const spawnParticles = (x: number, y: number, color: string, count = 8) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 4;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        color,
        size: 3 + Math.random() * 3,
        life: 1.0,
      });
    }
  };

  // Main game tick & physics loop
  useEffect(() => {
    initLevel();
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
    const player = playerRef.current;
    const keys = keysRef.current;
    const blocks = blocksRef.current;
    const enemies = enemiesRef.current;
    const coins = coinsRef.current;

    // Horizontal acceleration
    const accel = 0.55;
    const maxSpeed = 4.6;
    const friction = 0.88;

    if (keys.left) {
      player.vx -= accel;
      player.facing = 'LEFT';
    } else if (keys.right) {
      player.vx += accel;
      player.facing = 'RIGHT';
    } else {
      player.vx *= friction;
    }

    player.vx = Math.max(-maxSpeed, Math.min(maxSpeed, player.vx));

    // Variable Jump
    const gravity = player.isJumping && keys.jump && player.vy < 0 ? 0.38 : 0.65;

    if (keys.jump && player.onGround) {
      player.vy = -11.5;
      player.onGround = false;
      player.isJumping = true;
      sound.playJump();
    }

    if (!keys.jump) {
      player.isJumping = false;
    }

    player.vy += gravity;
    if (player.vy > 12) player.vy = 12;

    // Apply horizontal movement & collide
    player.x += player.vx;
    for (const b of blocks) {
      if (
        player.x + player.w > b.x &&
        player.x < b.x + b.w &&
        player.y + player.h > b.y &&
        player.y < b.y + b.h
      ) {
        if (player.vx > 0) {
          player.x = b.x - player.w;
        } else if (player.vx < 0) {
          player.x = b.x + b.w;
        }
        player.vx = 0;
      }
    }

    // Apply vertical movement & collide
    player.y += player.vy;
    player.onGround = false;

    for (const b of blocks) {
      if (
        player.x + player.w > b.x &&
        player.x < b.x + b.w &&
        player.y + player.h >= b.y &&
        player.y <= b.y + b.h
      ) {
        // Landing on block top
        if (player.vy > 0 && player.y + player.h - player.vy <= b.y + 4) {
          player.y = b.y - player.h;
          player.vy = 0;
          player.onGround = true;
          player.isJumping = false;
        }
        // Hitting block ceiling from bottom
        else if (player.vy < 0) {
          player.y = b.y + b.h;
          player.vy = 1.5;

          // Bump mystery question block or brick
          if (b.type === 'question' && !b.hit) {
            b.hit = true;
            b.bumpTimer = 8;
            sound.playCoin();
            setCoinsCount(c => c + 1);
            setScore(s => {
              const next = s + 100;
              onScoreUpdate?.(next);
              return next;
            });
            spawnParticles(b.x + b.w / 2, b.y, '#FACC15', 10);
          } else if (b.type === 'brick') {
            b.bumpTimer = 6;
            sound.playHit();
            spawnParticles(b.x + b.w / 2, b.y, '#B45309', 4);
          }
        }
      }
    }

    // Block bump animation decay
    for (const b of blocks) {
      if (b.bumpTimer && b.bumpTimer > 0) {
        b.bumpTimer -= 1;
      }
    }

    // Fell into abyss pit
    if (player.y > 500) {
      damagePlayer('Fell into pit!');
      return;
    }

    // Check Coin pickups
    for (const c of coins) {
      if (!c.collected) {
        if (
          player.x + player.w > c.x &&
          player.x < c.x + c.w &&
          player.y + player.h > c.y &&
          player.y < c.y + c.h
        ) {
          c.collected = true;
          sound.playCoin();
          setCoinsCount(count => count + 1);
          setScore(s => {
            const next = s + 50;
            onScoreUpdate?.(next);
            return next;
          });
          spawnParticles(c.x + c.w / 2, c.y + c.h / 2, '#FDE047', 8);
        }
      }
    }

    // Update Enemies & Stomp Logic
    for (const en of enemies) {
      if (!en.alive) {
        if (en.squishTimer > 0) en.squishTimer -= 1;
        continue;
      }

      en.x += en.vx;

      // Patrol turn on platform bounds or pipe walls
      for (const b of blocks) {
        if (
          en.x + en.w > b.x &&
          en.x < b.x + b.w &&
          en.y + en.h > b.y &&
          en.y < b.y + b.h
        ) {
          if (b.type === 'pipe' || b.type === 'brick') {
            en.vx = -en.vx;
            en.x += en.vx * 2;
          }
        }
      }

      // Player collision with enemy
      if (
        player.x + player.w > en.x &&
        player.x < en.x + en.w &&
        player.y + player.h > en.y &&
        player.y < en.y + en.h
      ) {
        // Stomp from above!
        if (player.vy > 0 && player.y + player.h - player.vy <= en.y + 12) {
          en.alive = false;
          en.squishTimer = 30;
          player.vy = -7.5; // bounce up
          sound.playHit();
          setScore(s => {
            const next = s + 200;
            onScoreUpdate?.(next);
            return next;
          });
          spawnParticles(en.x + en.w / 2, en.y + en.h / 2, '#991B1B', 12);
        } else if (player.invincibleTimer <= 0) {
          // Frontal hit
          damagePlayer('Touched enemy!');
          return;
        }
      }
    }

    // Invincibility flicker
    if (player.invincibleTimer > 0) {
      player.invincibleTimer -= 1;
    }

    // Camera follow player smoothly
    const targetCamX = Math.max(0, player.x - 300);
    cameraXRef.current += (targetCamX - cameraXRef.current) * 0.12;

    // Flagpole Victory Check
    if (player.x >= flagpoleX) {
      sound.playClear();
      confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
      setScore(s => s + 1000);
      setGameState('VICTORY');
    }

    // Particles update
    for (let i = particlesRef.current.length - 1; i >= 0; i--) {
      const pt = particlesRef.current[i];
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.vy += 0.2;
      pt.life -= 0.03;
      if (pt.life <= 0) particlesRef.current.splice(i, 1);
    }
  };

  const damagePlayer = (_reason: string) => {
    sound.playGameOver();
    setLives(prev => {
      const next = prev - 1;
      if (next <= 0) {
        setGameState('GAME_OVER');
      } else {
        // Respawn near current camera
        const player = playerRef.current;
        player.x = Math.max(60, cameraXRef.current + 50);
        player.y = 200;
        player.vx = 0;
        player.vy = 0;
        player.invincibleTimer = 60;
      }
      return next;
    });
  };

  // Render method
  const render = (ctx: CanvasRenderingContext2D) => {
    const camX = cameraXRef.current;

    // Sky
    ctx.fillStyle = '#60A5FA';
    ctx.fillRect(0, 0, 750, 440);

    // Distant hills and clouds
    ctx.fillStyle = '#93C5FD';
    ctx.beginPath();
    ctx.arc(150 - (camX * 0.2) % 600, 80, 40, 0, Math.PI * 2);
    ctx.arc(190 - (camX * 0.2) % 600, 70, 50, 0, Math.PI * 2);
    ctx.arc(240 - (camX * 0.2) % 600, 80, 40, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(550 - (camX * 0.2) % 600, 110, 40, 0, Math.PI * 2);
    ctx.arc(590 - (camX * 0.2) % 600, 100, 50, 0, Math.PI * 2);
    ctx.arc(640 - (camX * 0.2) % 600, 110, 40, 0, Math.PI * 2);
    ctx.fill();

    // Hills
    ctx.fillStyle = '#4ADE80';
    for (let h = 0; h < 2600; h += 400) {
      const hillX = h - camX * 0.4;
      ctx.beginPath();
      ctx.ellipse(hillX, 410, 120, 80, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.save();
    ctx.translate(-camX, 0);

    // Draw Blocks
    for (const b of blocksRef.current) {
      const bumpY = b.bumpTimer ? Math.sin(b.bumpTimer * 0.5) * -6 : 0;

      if (b.type === 'ground') {
        ctx.fillStyle = '#78350F'; // dirt
        ctx.fillRect(b.x, b.y, b.w, b.h);
        ctx.fillStyle = '#22C55E'; // grass
        ctx.fillRect(b.x, b.y, b.w, 10);
      } else if (b.type === 'brick') {
        ctx.fillStyle = '#B45309';
        ctx.fillRect(b.x, b.y + bumpY, b.w, b.h);
        ctx.strokeStyle = '#78350F';
        ctx.lineWidth = 2;
        ctx.strokeRect(b.x, b.y + bumpY, b.w, b.h);
      } else if (b.type === 'question') {
        if (b.hit) {
          ctx.fillStyle = '#92400E';
          ctx.fillRect(b.x, b.y + bumpY, b.w, b.h);
          ctx.strokeStyle = '#78350F';
          ctx.lineWidth = 2;
          ctx.strokeRect(b.x, b.y + bumpY, b.w, b.h);
        } else {
          ctx.fillStyle = '#EAB308';
          ctx.fillRect(b.x, b.y + bumpY, b.w, b.h);
          ctx.strokeStyle = '#713F12';
          ctx.lineWidth = 2;
          ctx.strokeRect(b.x, b.y + bumpY, b.w, b.h);

          // [?] text
          ctx.fillStyle = '#713F12';
          ctx.font = 'bold 16px monospace';
          ctx.fillText('?', b.x + 10, b.y + bumpY + 22);
        }
      } else if (b.type === 'pipe') {
        ctx.fillStyle = '#16A34A';
        ctx.fillRect(b.x, b.y, b.w, b.h);
        // Pipe rim
        ctx.fillRect(b.x - 4, b.y, b.w + 8, 16);
        ctx.strokeStyle = '#14532D';
        ctx.lineWidth = 2;
        ctx.strokeRect(b.x - 4, b.y, b.w + 8, 16);
        ctx.strokeRect(b.x, b.y, b.w, b.h);
      }
    }

    // Draw Coins
    for (const c of coinsRef.current) {
      if (!c.collected) {
        ctx.fillStyle = '#FACC15';
        ctx.beginPath();
        ctx.ellipse(c.x + c.w / 2, c.y + c.h / 2, c.w / 2, c.h / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#CA8A04';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }

    // Draw Enemies (Goombas)
    for (const en of enemiesRef.current) {
      if (en.alive) {
        ctx.fillStyle = '#991B1B';
        ctx.beginPath();
        ctx.arc(en.x + en.w / 2, en.y + 12, 12, Math.PI, 0, false);
        ctx.lineTo(en.x + en.w, en.y + en.h);
        ctx.lineTo(en.x, en.y + en.h);
        ctx.closePath();
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(en.x + 5, en.y + 12, 4, 6);
        ctx.fillRect(en.x + en.w - 9, en.y + 12, 4, 6);
        ctx.fillStyle = '#000000';
        ctx.fillRect(en.x + 6, en.y + 14, 2, 3);
        ctx.fillRect(en.x + en.w - 8, en.y + 14, 2, 3);
      } else if (en.squishTimer > 0) {
        // Squished flat
        ctx.fillStyle = '#991B1B';
        ctx.fillRect(en.x, en.y + en.h - 8, en.w, 8);
      }
    }

    // Flagpole and Castle
    ctx.fillStyle = '#94A3B8';
    ctx.fillRect(flagpoleX, 120, 6, 280); // pole
    ctx.fillStyle = '#F59E0B';
    ctx.beginPath();
    ctx.arc(flagpoleX + 3, 120, 10, 0, Math.PI * 2); // finial
    ctx.fill();

    // Flag
    ctx.fillStyle = '#EF4444';
    ctx.beginPath();
    ctx.moveTo(flagpoleX + 6, 130);
    ctx.lineTo(flagpoleX + 50, 150);
    ctx.lineTo(flagpoleX + 6, 170);
    ctx.closePath();
    ctx.fill();

    // Castle
    ctx.fillStyle = '#64748B';
    ctx.fillRect(flagpoleX + 100, 260, 140, 140);
    ctx.fillStyle = '#1E293B';
    ctx.fillRect(flagpoleX + 150, 320, 40, 80); // Door

    // Render Particles
    for (const pt of particlesRef.current) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, pt.life);
      ctx.fillStyle = pt.color;
      ctx.fillRect(pt.x, pt.y, pt.size, pt.size);
      ctx.restore();
    }

    // Draw Player (Jump Knight / Mario character)
    const player = playerRef.current;
    if (player.invincibleTimer % 4 < 2) {
      ctx.save();
      ctx.translate(player.x, player.y);

      // Overalls (Blue)
      ctx.fillStyle = '#1D4ED8';
      ctx.fillRect(4, 14, player.w - 8, 14);

      // Shirt (Red)
      ctx.fillStyle = '#EF4444';
      ctx.fillRect(2, 8, player.w - 4, 8);

      // Hat / Face
      ctx.fillStyle = '#FCA5A5'; // skin
      ctx.fillRect(6, 4, player.w - 12, 8);

      ctx.fillStyle = '#EF4444'; // red cap
      ctx.fillRect(2, 0, player.w - 4, 5);

      // Eyes & Mustache
      ctx.fillStyle = '#0F172A';
      if (player.facing === 'RIGHT') {
        ctx.fillRect(16, 6, 3, 3);
        ctx.fillRect(14, 10, 7, 3); // mustache
      } else {
        ctx.fillRect(5, 6, 3, 3);
        ctx.fillRect(3, 10, 7, 3);
      }

      // Boots
      ctx.fillStyle = '#78350F';
      ctx.fillRect(2, 28, 8, 4);
      ctx.fillRect(player.w - 10, 28, 8, 4);

      ctx.restore();
    }

    ctx.restore();
  };

  return (
    <div className="flex flex-col items-center select-none">
      {/* Top HUD */}
      <div className="w-full max-w-[750px] flex items-center justify-between px-3 py-2 bg-slate-900 border-x border-t border-slate-800 rounded-t-lg text-xs font-mono">
        <div className="flex items-center gap-4">
          <span className="text-amber-400 font-bold">JUMP KNIGHT</span>
          <div className="flex items-center gap-1 text-rose-400">
            <Heart size={14} className="fill-rose-500 text-rose-500" />
            <span className="font-bold tabular-nums">{lives}</span>
          </div>
          <div className="flex items-center gap-1 text-amber-300">
            <Coins size={14} className="text-amber-400" />
            <span className="tabular-nums font-bold">{coinsCount}</span>
          </div>
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
      <div className="relative w-full max-w-[750px] aspect-[750/440] bg-slate-950 border border-slate-800 shadow-2xl overflow-hidden crt-effect">
        <canvas
          ref={canvasRef}
          width={750}
          height={440}
          className="w-full h-full block pixelated"
        />

        {/* Ready Overlay */}
        {gameState === 'READY' && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center z-30">
            <div className="w-14 h-14 rounded-lg bg-amber-500/20 border border-amber-400 flex items-center justify-center mb-3 text-amber-400 font-arcade text-xl">
              🍄
            </div>
            <h3 className="font-arcade text-base text-white mb-2">JUMP KNIGHT (MINI MARIO)</h3>
            <p className="text-sm text-slate-300 max-w-sm mb-4 font-body">
              Run across platforms, bash <strong className="text-amber-300">[?]</strong> blocks for coins, stomp enemies from above, and slide down the flagpole!
            </p>
            <div className="text-xs text-slate-400 font-mono mb-6 bg-slate-900/80 px-3 py-1.5 rounded border border-slate-800">
              Keys: <span className="text-amber-400">A / D or Arrow Keys</span> to Run · <span className="text-amber-400">Space or W</span> to Jump
            </div>
            <button
              onClick={resetGame}
              className="font-arcade text-xs px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded transition-colors active:scale-95"
            >
              START GAME
            </button>
          </div>
        )}

        {/* Victory */}
        {gameState === 'VICTORY' && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center z-30">
            <Trophy size={48} className="text-amber-400 mb-3 animate-bounce" />
            <h3 className="font-arcade text-base text-amber-400 mb-2">STAGE CLEAR!</h3>
            <p className="text-sm text-slate-300 mb-4 font-body">You reached the castle and captured the flagpole!</p>
            <div className="text-xs font-mono text-slate-300 mb-4 bg-slate-900 px-4 py-2 rounded border border-slate-800">
              Score: <span className="text-amber-400 font-bold">{score}</span> · Coins: <span className="text-white">{coinsCount}</span>
            </div>
            <button
              onClick={resetGame}
              className="font-arcade text-xs px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded transition-colors active:scale-95"
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
              className="flex items-center gap-2 font-arcade text-xs px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded transition-colors active:scale-95"
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
      <div className="w-full max-w-[750px] flex items-center justify-between p-3 bg-slate-900 border-x border-b border-slate-800 rounded-b-lg">
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
            onMouseDown={() => (keysRef.current.left = true)}
            onMouseUp={() => (keysRef.current.left = false)}
            className="w-12 h-12 bg-slate-800 active:bg-slate-700 text-white font-bold rounded flex items-center justify-center text-sm shadow"
          >
            ◀
          </button>
          <button
            onTouchStart={() => (keysRef.current.right = true)}
            onTouchEnd={() => (keysRef.current.right = false)}
            onMouseDown={() => (keysRef.current.right = true)}
            onMouseUp={() => (keysRef.current.right = false)}
            className="w-12 h-12 bg-slate-800 active:bg-slate-700 text-white font-bold rounded flex items-center justify-center text-sm shadow"
          >
            ▶
          </button>
          <button
            onTouchStart={() => (keysRef.current.jump = true)}
            onTouchEnd={() => (keysRef.current.jump = false)}
            onMouseDown={() => (keysRef.current.jump = true)}
            onMouseUp={() => (keysRef.current.jump = false)}
            className="w-16 h-12 bg-amber-600 active:bg-amber-500 text-white font-bold rounded flex items-center justify-center text-xs shadow ml-2"
          >
            JUMP
          </button>
        </div>

        <div className="hidden md:flex items-center gap-2 text-xs text-slate-400 font-mono">
          <span>Run: <strong className="text-slate-200">A / D / Arrows</strong></span>
          <span>·</span>
          <span>Jump: <strong className="text-slate-200">Space / W</strong> (Hold for high jump)</span>
          <span>·</span>
          <span>Pause: <strong className="text-slate-200">P</strong></span>
        </div>
      </div>
    </div>
  );
};
