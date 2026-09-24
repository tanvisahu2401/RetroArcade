import React, { useEffect, useRef, useState, useCallback } from 'react';
import { sound } from '../../services/sound';
import confetti from 'canvas-confetti';
import { RotateCcw, Play, Pause, ArrowRight, Trophy, Heart, Disc3 } from 'lucide-react';

interface BounceBallGameProps {
  onScoreUpdate?: (score: number) => void;
  highScore: number;
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

interface Ring {
  x: number;
  y: number;
  radius: number;
  collected: boolean;
}

interface Star {
  x: number;
  y: number;
  radius: number;
  collected: boolean;
}

interface Spike {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Bouncer {
  x: number;
  y: number;
  width: number;
  height: number;
  force: number;
}

interface LevelData {
  name: string;
  ballStart: { x: number; y: number };
  platforms: { x: number; y: number; w: number; h: number; type?: 'stone' | 'wood' }[];
  rings: Ring[];
  stars: Star[];
  spikes: Spike[];
  bouncers: Bouncer[];
  portal: { x: number; y: number; w: number; h: number };
}

const LEVELS: LevelData[] = [
  {
    name: 'Level 1: The Courtyard',
    ballStart: { x: 50, y: 380 },
    platforms: [
      { x: 0, y: 440, w: 800, h: 40, type: 'stone' }, // Floor
      { x: 180, y: 360, w: 140, h: 20, type: 'wood' },
      { x: 380, y: 290, w: 160, h: 20, type: 'wood' },
      { x: 580, y: 220, w: 180, h: 20, type: 'wood' },
      { x: 260, y: 160, w: 140, h: 20, type: 'wood' },
    ],
    rings: [
      { x: 250, y: 320, radius: 18, collected: false },
      { x: 460, y: 250, radius: 18, collected: false },
      { x: 670, y: 180, radius: 18, collected: false },
      { x: 330, y: 120, radius: 18, collected: false }
    ],
    stars: [
      { x: 210, y: 330, radius: 10, collected: false },
      { x: 420, y: 260, radius: 10, collected: false },
      { x: 620, y: 190, radius: 10, collected: false },
    ],
    spikes: [
      { x: 340, y: 425, width: 35, height: 15 },
      { x: 540, y: 425, width: 35, height: 15 }
    ],
    bouncers: [
      { x: 700, y: 430, width: 50, height: 10, force: -13 }
    ],
    portal: { x: 70, y: 390, w: 34, h: 50 }
  },
  {
    name: 'Level 2: High Trampolines',
    ballStart: { x: 50, y: 380 },
    platforms: [
      { x: 0, y: 440, w: 220, h: 40, type: 'stone' },
      { x: 290, y: 440, w: 510, h: 40, type: 'stone' },
      { x: 240, y: 340, w: 90, h: 18, type: 'wood' },
      { x: 390, y: 270, w: 100, h: 18, type: 'wood' },
      { x: 560, y: 200, w: 140, h: 18, type: 'wood' },
      { x: 220, y: 140, w: 160, h: 18, type: 'wood' },
      { x: 20, y: 220, w: 100, h: 18, type: 'wood' },
    ],
    rings: [
      { x: 285, y: 300, radius: 18, collected: false },
      { x: 440, y: 230, radius: 18, collected: false },
      { x: 630, y: 160, radius: 18, collected: false },
      { x: 300, y: 100, radius: 18, collected: false },
      { x: 70, y: 180, radius: 18, collected: false }
    ],
    stars: [
      { x: 260, y: 310, radius: 10, collected: false },
      { x: 600, y: 170, radius: 10, collected: false },
    ],
    spikes: [
      { x: 220, y: 425, width: 70, height: 15 },
      { x: 480, y: 425, width: 45, height: 15 },
      { x: 630, y: 425, width: 45, height: 15 }
    ],
    bouncers: [
      { x: 160, y: 430, width: 45, height: 10, force: -13.5 },
      { x: 720, y: 430, width: 45, height: 10, force: -14 }
    ],
    portal: { x: 40, y: 170, w: 34, h: 50 }
  },
  {
    name: 'Level 3: The Spike Gauntlet',
    ballStart: { x: 40, y: 400 },
    platforms: [
      { x: 0, y: 440, w: 800, h: 40, type: 'stone' },
      { x: 120, y: 360, w: 80, h: 18, type: 'wood' },
      { x: 250, y: 300, w: 90, h: 18, type: 'wood' },
      { x: 400, y: 240, w: 80, h: 18, type: 'wood' },
      { x: 530, y: 180, w: 100, h: 18, type: 'wood' },
      { x: 680, y: 240, w: 80, h: 18, type: 'wood' },
      { x: 380, y: 120, w: 120, h: 18, type: 'wood' },
    ],
    rings: [
      { x: 160, y: 320, radius: 18, collected: false },
      { x: 295, y: 260, radius: 18, collected: false },
      { x: 440, y: 200, radius: 18, collected: false },
      { x: 580, y: 140, radius: 18, collected: false },
      { x: 720, y: 200, radius: 18, collected: false },
      { x: 440, y: 80, radius: 18, collected: false },
    ],
    stars: [
      { x: 140, y: 330, radius: 10, collected: false },
      { x: 560, y: 150, radius: 10, collected: false },
      { x: 700, y: 210, radius: 10, collected: false },
    ],
    spikes: [
      { x: 200, y: 425, width: 45, height: 15 },
      { x: 345, y: 425, width: 50, height: 15 },
      { x: 490, y: 425, width: 40, height: 15 },
      { x: 620, y: 425, width: 55, height: 15 },
      { x: 420, y: 225, width: 30, height: 15 }
    ],
    bouncers: [
      { x: 80, y: 430, width: 35, height: 10, force: -12 },
      { x: 730, y: 430, width: 40, height: 10, force: -14 }
    ],
    portal: { x: 425, y: 70, w: 34, h: 50 }
  }
];

export const BounceBallGame: React.FC<BounceBallGameProps> = ({ onScoreUpdate, highScore }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [currentLevelIdx, setCurrentLevelIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(5);
  const [ringsLeft, setRingsLeft] = useState(4);
  const [portalOpen, setPortalOpen] = useState(false);
  const [gameState, setGameState] = useState<'READY' | 'PLAYING' | 'PAUSED' | 'LEVEL_CLEARED' | 'GAME_OVER' | 'VICTORY'>('READY');

  // Input states
  const keysRef = useRef<{ left: boolean; right: boolean; jump: boolean }>({
    left: false,
    right: false,
    jump: false
  });

  // Ball physics state
  const ballRef = useRef({
    x: 50,
    y: 380,
    vx: 0,
    vy: 0,
    radius: 14,
    rotation: 0,
    onGround: false,
    scaleY: 1, // squash/stretch
    scaleX: 1
  });

  // Cloned level state
  const levelRef = useRef<LevelData>(JSON.parse(JSON.stringify(LEVELS[0])));
  const particlesRef = useRef<Particle[]>([]);
  const animFrameIdRef = useRef<number | null>(null);

  // Initialize level
  const loadLevel = useCallback((lvlIndex: number) => {
    const raw = LEVELS[lvlIndex % LEVELS.length];
    const cloned: LevelData = JSON.parse(JSON.stringify(raw));
    levelRef.current = cloned;
    ballRef.current.x = cloned.ballStart.x;
    ballRef.current.y = cloned.ballStart.y;
    ballRef.current.vx = 0;
    ballRef.current.vy = 0;
    ballRef.current.scaleX = 1;
    ballRef.current.scaleY = 1;

    setRingsLeft(cloned.rings.length);
    setPortalOpen(false);
  }, []);

  const spawnParticles = (x: number, y: number, color: string, count = 8) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 3.5;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1,
        color,
        size: 3 + Math.random() * 3,
        life: 1.0
      });
    }
  };

  const resetGame = () => {
    setCurrentLevelIdx(0);
    setScore(0);
    setLives(5);
    loadLevel(0);
    setGameState('PLAYING');
    sound.playBounce();
  };

  const handleNextLevel = () => {
    if (currentLevelIdx + 1 < LEVELS.length) {
      const next = currentLevelIdx + 1;
      setCurrentLevelIdx(next);
      loadLevel(next);
      setGameState('PLAYING');
      sound.playLevelUp();
    } else {
      setGameState('VICTORY');
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      sound.playClear();
    }
  };

  // Keyboard listeners
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

  // Main physics & render loop
  useEffect(() => {
    loadLevel(currentLevelIdx);
  }, [currentLevelIdx, loadLevel]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastTime = performance.now();

    const loop = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;

      if (gameState === 'PLAYING') {
        updatePhysics(dt);
      }

      render(ctx);
      animFrameIdRef.current = requestAnimationFrame(loop);
    };

    animFrameIdRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  });

  const updatePhysics = (_dt: number) => {
    const ball = ballRef.current;
    const level = levelRef.current;
    const keys = keysRef.current;

    // Rolling acceleration
    const rollAccel = 0.45;
    const maxRollSpeed = 4.8;
    const airFriction = 0.98;
    const groundFriction = 0.92;
    const gravity = 0.42;

    if (keys.left) {
      ball.vx -= rollAccel;
    }
    if (keys.right) {
      ball.vx += rollAccel;
    }

    // Clamp speed
    ball.vx = Math.max(-maxRollSpeed, Math.min(maxRollSpeed, ball.vx));

    // Friction
    ball.vx *= ball.onGround ? groundFriction : airFriction;

    // Jump
    if (keys.jump && ball.onGround) {
      ball.vy = -8.8;
      ball.onGround = false;
      ball.scaleY = 1.3;
      ball.scaleX = 0.75;
      sound.playJump();
      spawnParticles(ball.x, ball.y + ball.radius, '#CBD5E1', 4);
    }

    // Gravity
    ball.vy += gravity;
    if (ball.vy > 12) ball.vy = 12;

    // Apply movement & rotation
    ball.x += ball.vx;
    ball.rotation += ball.vx * 0.08;

    // Recover squash/stretch
    ball.scaleX += (1 - ball.scaleX) * 0.15;
    ball.scaleY += (1 - ball.scaleY) * 0.15;

    // Platform collisions (Horizontal & Vertical)
    // 1. Horizontal check
    for (const p of level.platforms) {
      if (
        ball.y + ball.radius > p.y &&
        ball.y - ball.radius < p.y + p.h
      ) {
        // Hit left side
        if (ball.vx > 0 && ball.x + ball.radius > p.x && ball.x - ball.radius < p.x) {
          ball.x = p.x - ball.radius;
          ball.vx = -ball.vx * 0.3;
        }
        // Hit right side
        else if (ball.vx < 0 && ball.x - ball.radius < p.x + p.w && ball.x + ball.radius > p.x + p.w) {
          ball.x = p.x + p.w + ball.radius;
          ball.vx = -ball.vx * 0.3;
        }
      }
    }

    // 2. Vertical movement & check
    ball.y += ball.vy;
    ball.onGround = false;

    for (const p of level.platforms) {
      if (
        ball.x + ball.radius * 0.7 > p.x &&
        ball.x - ball.radius * 0.7 < p.x + p.w
      ) {
        // Landing on top
        if (ball.vy > 0 && ball.y + ball.radius >= p.y && ball.y - ball.radius < p.y) {
          ball.y = p.y - ball.radius;
          ball.onGround = true;

          // Gentle bounce or stop
          if (ball.vy > 3.0) {
            ball.vy = -ball.vy * 0.45;
            ball.scaleY = 0.75;
            ball.scaleX = 1.25;
            sound.playBounce();
          } else {
            ball.vy = 0;
          }
        }
        // Bump ceiling
        else if (ball.vy < 0 && ball.y - ball.radius <= p.y + p.h && ball.y + ball.radius > p.y + p.h) {
          ball.y = p.y + p.h + ball.radius;
          ball.vy = 1;
        }
      }
    }

    // Boundary limits
    if (ball.x - ball.radius < 0) {
      ball.x = ball.radius;
      ball.vx = -ball.vx * 0.5;
    }
    if (ball.x + ball.radius > 800) {
      ball.x = 800 - ball.radius;
      ball.vx = -ball.vx * 0.5;
    }
    if (ball.y > 480) {
      // Pit drop
      killBall('You fell into the abyss!');
      return;
    }

    // Check Trampolines / Bouncers
    for (const b of level.bouncers) {
      if (
        ball.x + ball.radius > b.x &&
        ball.x - ball.radius < b.x + b.width &&
        ball.y + ball.radius >= b.y &&
        ball.y - ball.radius < b.y + b.height &&
        ball.vy > 0
      ) {
        ball.vy = b.force;
        ball.scaleY = 1.45;
        ball.scaleX = 0.65;
        sound.playBounce();
        spawnParticles(ball.x, b.y, '#FBBF24', 10);
      }
    }

    // Check Spikes
    for (const s of level.spikes) {
      if (
        ball.x + ball.radius * 0.6 > s.x &&
        ball.x - ball.radius * 0.6 < s.x + s.width &&
        ball.y + ball.radius * 0.6 > s.y &&
        ball.y - ball.radius * 0.6 < s.y + s.height
      ) {
        killBall('Popped on sharp spikes!');
        return;
      }
    }

    // Check Rings (Hoops)
    let remainingRings = 0;
    level.rings.forEach(ring => {
      if (!ring.collected) {
        const dx = ball.x - ring.x;
        const dy = ball.y - ring.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < ring.radius + ball.radius * 0.7) {
          ring.collected = true;
          sound.playCoin();
          spawnParticles(ring.x, ring.y, '#F59E0B', 12);
          setScore(s => {
            const next = s + 100;
            onScoreUpdate?.(next);
            return next;
          });
        } else {
          remainingRings++;
        }
      }
    });

    setRingsLeft(remainingRings);
    if (remainingRings === 0 && !portalOpen) {
      setPortalOpen(true);
      sound.playClear();
    }

    // Check Stars
    level.stars.forEach(star => {
      if (!star.collected) {
        const dx = ball.x - star.x;
        const dy = ball.y - star.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < star.radius + ball.radius) {
          star.collected = true;
          sound.playEat();
          spawnParticles(star.x, star.y, '#38BDF8', 8);
          setScore(s => {
            const next = s + 50;
            onScoreUpdate?.(next);
            return next;
          });
        }
      }
    });

    // Check Exit Portal
    if (portalOpen) {
      const p = level.portal;
      if (
        ball.x > p.x &&
        ball.x < p.x + p.w &&
        ball.y > p.y &&
        ball.y < p.y + p.h
      ) {
        // Level cleared!
        sound.playClear();
        confetti({ particleCount: 60, spread: 60, origin: { y: 0.5 } });
        setScore(s => s + 500);
        setGameState('LEVEL_CLEARED');
      }
    }

    // Update particles
    for (let i = particlesRef.current.length - 1; i >= 0; i--) {
      const pt = particlesRef.current[i];
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.vy += 0.15;
      pt.life -= 0.035;
      if (pt.life <= 0) {
        particlesRef.current.splice(i, 1);
      }
    }
  };

  const killBall = (_reason: string) => {
    sound.playHit();
    spawnParticles(ballRef.current.x, ballRef.current.y, '#EF4444', 20);

    setLives(prev => {
      const nextLives = prev - 1;
      if (nextLives <= 0) {
        setGameState('GAME_OVER');
        sound.playGameOver();
      } else {
        // Respawn
        const ball = ballRef.current;
        const lvl = levelRef.current;
        ball.x = lvl.ballStart.x;
        ball.y = lvl.ballStart.y;
        ball.vx = 0;
        ball.vy = 0;
      }
      return nextLives;
    });
  };

  // Render method
  const render = (ctx: CanvasRenderingContext2D) => {
    // Clear background
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(0, 0, 800, 480);

    // Subtle sky gradient grid
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 1;
    for (let x = 0; x < 800; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 480);
      ctx.stroke();
    }
    for (let y = 0; y < 480; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(800, y);
      ctx.stroke();
    }

    const level = levelRef.current;

    // Platforms
    for (const p of level.platforms) {
      if (p.type === 'stone') {
        ctx.fillStyle = '#334155';
        ctx.fillRect(p.x, p.y, p.w, p.h);
        ctx.fillStyle = '#475569';
        ctx.fillRect(p.x, p.y, p.w, 4); // top grass/rim
      } else {
        ctx.fillStyle = '#78350F';
        ctx.fillRect(p.x, p.y, p.w, p.h);
        ctx.fillStyle = '#92400E';
        ctx.fillRect(p.x, p.y, p.w, 3);
      }
      // Edge outline
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 2;
      ctx.strokeRect(p.x, p.y, p.w, p.h);
    }

    // Spikes
    ctx.fillStyle = '#DC2626';
    for (const s of level.spikes) {
      const count = Math.max(1, Math.floor(s.width / 14));
      const spikeW = s.width / count;
      for (let i = 0; i < count; i++) {
        ctx.beginPath();
        ctx.moveTo(s.x + i * spikeW, s.y + s.height);
        ctx.lineTo(s.x + (i + 0.5) * spikeW, s.y);
        ctx.lineTo(s.x + (i + 1) * spikeW, s.y + s.height);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#7F1D1D';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }

    // Bouncers / Trampolines
    for (const b of level.bouncers) {
      ctx.fillStyle = '#EAB308';
      ctx.fillRect(b.x, b.y, b.width, b.height);
      ctx.fillStyle = '#CA8A04';
      ctx.fillRect(b.x, b.y, b.width, 2);

      // Spring coil graphic
      ctx.strokeStyle = '#713F12';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(b.x + 4, b.y + 4);
      ctx.lineTo(b.x + b.width - 4, b.y + 4);
      ctx.stroke();
    }

    // Rings (Golden Hoops)
    for (const r of level.rings) {
      if (!r.collected) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
        ctx.strokeStyle = '#F59E0B';
        ctx.lineWidth = 5;
        ctx.stroke();

        // Inner glowing core
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius - 2, 0, Math.PI * 2);
        ctx.strokeStyle = '#FEF08A';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
      }
    }

    // Stars
    for (const st of level.stars) {
      if (!st.collected) {
        ctx.fillStyle = '#38BDF8';
        ctx.beginPath();
        ctx.arc(st.x, st.y, st.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#E0F2FE';
        ctx.beginPath();
        ctx.arc(st.x - 2, st.y - 2, st.radius * 0.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Portal
    const portal = level.portal;
    ctx.save();
    if (portalOpen) {
      // Pulsing portal
      const glow = Math.sin(Date.now() * 0.008) * 0.2 + 0.8;
      ctx.fillStyle = `rgba(16, 185, 129, ${glow})`;
      ctx.fillRect(portal.x, portal.y, portal.w, portal.h);

      ctx.strokeStyle = '#6EE7B7';
      ctx.lineWidth = 3;
      ctx.strokeRect(portal.x, portal.y, portal.w, portal.h);

      // Swirling center lines
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '8px monospace';
      ctx.fillText('EXIT', portal.x + 5, portal.y + 28);
    } else {
      // Inactive portal with lock
      ctx.fillStyle = 'rgba(71, 85, 105, 0.6)';
      ctx.fillRect(portal.x, portal.y, portal.w, portal.h);
      ctx.strokeStyle = '#64748B';
      ctx.lineWidth = 2;
      ctx.strokeRect(portal.x, portal.y, portal.w, portal.h);

      ctx.fillStyle = '#94A3B8';
      ctx.font = '8px monospace';
      ctx.fillText('LOCK', portal.x + 5, portal.y + 28);
    }
    ctx.restore();

    // Render Particles
    for (const pt of particlesRef.current) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, pt.life);
      ctx.fillStyle = pt.color;
      ctx.fillRect(pt.x - pt.size / 2, pt.y - pt.size / 2, pt.size, pt.size);
      ctx.restore();
    }

    // Render Red Ball
    const ball = ballRef.current;
    ctx.save();
    ctx.translate(ball.x, ball.y);
    ctx.scale(ball.scaleX, ball.scaleY);
    ctx.rotate(ball.rotation);

    // Ball shadow/sphere
    const grad = ctx.createRadialGradient(-ball.radius * 0.3, -ball.radius * 0.3, 2, 0, 0, ball.radius);
    grad.addColorStop(0, '#FCA5A5');
    grad.addColorStop(0.3, '#EF4444');
    grad.addColorStop(0.85, '#B91C1C');
    grad.addColorStop(1, '#7F1D1D');

    ctx.beginPath();
    ctx.arc(0, 0, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // Specular highlight
    ctx.beginPath();
    ctx.arc(-ball.radius * 0.35, -ball.radius * 0.35, ball.radius * 0.28, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.fill();

    // Rubber seam ring
    ctx.strokeStyle = 'rgba(127, 29, 29, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(0, 0, ball.radius * 0.85, ball.radius * 0.2, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  };

  return (
    <div className="flex flex-col items-center select-none">
      {/* HUD Header */}
      <div className="w-full max-w-[800px] flex items-center justify-between px-4 py-2 bg-slate-900 border-x border-t border-slate-800 rounded-t-lg text-xs font-mono">
        <div className="flex items-center gap-4">
          <span className="text-amber-400 font-bold">{LEVELS[currentLevelIdx].name}</span>
          <div className="flex items-center gap-1 text-rose-400">
            <Heart size={14} className="fill-rose-500 text-rose-500" />
            <span className="font-bold tabular-nums">{lives}</span>
          </div>
          <div className="flex items-center gap-1.5 text-amber-300">
            <Disc3 size={14} className={ringsLeft === 0 ? 'text-emerald-400' : 'text-amber-400'} />
            <span className="tabular-nums">
              {ringsLeft > 0 ? `${ringsLeft} Rings Left` : 'Portal Unlocked!'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 text-slate-400">
            <span>Score:</span>
            <span className="text-white font-bold tabular-nums">{score}</span>
          </div>
          <div className="flex items-center gap-1 text-slate-400">
            <Trophy size={13} className="text-amber-400" />
            <span className="text-slate-200 tabular-nums">{Math.max(score, highScore)}</span>
          </div>
        </div>
      </div>

      {/* Main Canvas with Overlay Modals */}
      <div className="relative w-full max-w-[800px] aspect-[800/480] bg-slate-950 border border-slate-800 shadow-2xl overflow-hidden crt-effect">
        <canvas
          ref={canvasRef}
          width={800}
          height={480}
          className="w-full h-full block pixelated"
        />

        {/* Ready / Start Overlay */}
        {gameState === 'READY' && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center z-30">
            <div className="w-16 h-16 rounded-full bg-rose-600/20 border-2 border-rose-500 flex items-center justify-center mb-3 shadow-[0_0_20px_rgba(239,68,68,0.4)]">
              <div className="w-8 h-8 rounded-full bg-rose-500 shadow-inner" />
            </div>
            <h3 className="font-arcade text-lg text-white mb-2 tracking-wide">BOUNCE BALL</h3>
            <p className="text-sm text-slate-300 max-w-md mb-4 font-body">
              Guide the rubber ball through all golden rings to open the exit warp. Avoid lethal spikes and use trampolines to leap over high walls!
            </p>
            <div className="text-xs text-slate-400 font-mono mb-6 bg-slate-900/80 px-3 py-1.5 rounded border border-slate-800">
              Keys: <span className="text-amber-400">A / D or Arrow Keys</span> to Roll · <span className="text-amber-400">Space or W</span> to Jump
            </div>
            <button
              onClick={() => {
                setGameState('PLAYING');
                sound.playBounce();
              }}
              className="font-arcade text-xs px-6 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded transition-colors shadow-lg active:scale-95"
            >
              START GAME
            </button>
          </div>
        )}

        {/* Level Cleared Overlay */}
        {gameState === 'LEVEL_CLEARED' && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center z-30">
            <Trophy size={48} className="text-amber-400 mb-3 animate-bounce" />
            <h3 className="font-arcade text-base text-amber-400 mb-1">STAGE CLEARED!</h3>
            <p className="text-sm text-slate-300 mb-4 font-body">All rings collected and warp traversed safely!</p>
            <div className="text-xs font-mono text-slate-300 mb-6 bg-slate-900 px-4 py-2 rounded border border-slate-800">
              Current Score: <span className="text-amber-400 font-bold">{score}</span>
            </div>
            <button
              onClick={handleNextLevel}
              className="flex items-center gap-2 font-arcade text-xs px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded transition-colors active:scale-95"
            >
              <span>NEXT LEVEL</span>
              <ArrowRight size={14} />
            </button>
          </div>
        )}

        {/* Victory Final Screen */}
        {gameState === 'VICTORY' && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center z-30">
            <Trophy size={54} className="text-amber-400 mb-3 animate-pulse" />
            <h3 className="font-arcade text-lg text-amber-300 mb-2">CHAMPION OF BOUNCE!</h3>
            <p className="text-sm text-slate-300 max-w-md mb-4 font-body">
              Incredible rolling! You mastered every ring, obstacle, and spike gauntlet.
            </p>
            <div className="text-xs font-mono text-slate-300 mb-6 bg-slate-900 px-4 py-2 rounded border border-slate-800">
              Final Score: <span className="text-amber-400 font-bold text-sm">{score}</span>
            </div>
            <button
              onClick={resetGame}
              className="font-arcade text-xs px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded transition-colors active:scale-95"
            >
              PLAY AGAIN
            </button>
          </div>
        )}

        {/* Game Over Screen */}
        {gameState === 'GAME_OVER' && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center z-30">
            <h3 className="font-arcade text-base text-rose-500 mb-2">GAME OVER</h3>
            <p className="text-sm text-slate-300 mb-4 font-body">The red rubber ball popped!</p>
            <div className="text-xs font-mono text-slate-300 mb-6 bg-slate-900 px-4 py-2 rounded border border-slate-800">
              Final Score: <span className="text-amber-400 font-bold">{score}</span>
            </div>
            <button
              onClick={resetGame}
              className="flex items-center gap-2 font-arcade text-xs px-6 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded transition-colors active:scale-95"
            >
              <RotateCcw size={14} />
              <span>TRY AGAIN</span>
            </button>
          </div>
        )}

        {/* Paused Screen */}
        {gameState === 'PAUSED' && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center z-30">
            <h3 className="font-arcade text-base text-white mb-4">GAME PAUSED</h3>
            <button
              onClick={() => setGameState('PLAYING')}
              className="font-arcade text-xs px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded transition-colors"
            >
              RESUME
            </button>
          </div>
        )}
      </div>

      {/* Mobile Touch Controls & Controls bar */}
      <div className="w-full max-w-[800px] flex items-center justify-between p-3 bg-slate-900 border-x border-b border-slate-800 rounded-b-lg">
        <div className="flex items-center gap-2">
          {/* Pause / Play button */}
          <button
            onClick={() => setGameState(g => (g === 'PLAYING' ? 'PAUSED' : g === 'PAUSED' ? 'PLAYING' : g))}
            className="p-2 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors"
            title="Pause game"
          >
            {gameState === 'PLAYING' ? <Pause size={16} /> : <Play size={16} />}
          </button>
          <button
            onClick={resetGame}
            className="p-2 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors"
            title="Restart level"
          >
            <RotateCcw size={16} />
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
            className="w-16 h-12 bg-rose-600 active:bg-rose-500 text-white font-bold rounded flex items-center justify-center text-xs shadow ml-2"
          >
            JUMP
          </button>
        </div>

        <div className="hidden md:flex items-center gap-3 text-xs text-slate-400 font-mono">
          <span>Move: <strong className="text-slate-200">A / D / Arrows</strong></span>
          <span>·</span>
          <span>Jump: <strong className="text-slate-200">Space / W / Up</strong></span>
          <span>·</span>
          <span>Pause: <strong className="text-slate-200">P</strong></span>
        </div>
      </div>
    </div>
  );
};
