import React, { useState, useEffect, useRef } from 'react';
import { sound } from '../../services/sound';
import confetti from 'canvas-confetti';
import { RotateCcw, Trophy, Award, Copy, Check, Sparkles, Heart, Shield, Feather } from 'lucide-react';

interface FlappyBirdGameProps {
  onScoreUpdate?: (score: number) => void;
  highScore: number;
}

interface Pipe {
  x: number;
  topHeight: number;
  bottomY: number;
  width: number;
  gap: number;
  passed: boolean;
}

export const FLAPPY_AI_STUDIO_PROMPT = `Build a complete, polished, browser-ready Flappy Bird game in React, TypeScript, and HTML5 Canvas with both an Easy Casual Mode and a Classic Mode:

### Key Requirements:
1. **Easy / Accessible Mode by Default**:
   - 3 Hearts / Lives instead of instant death: Hitting a pipe consumes 1 heart, activates a temporary invincibility shield, and lets the player continue flight!
   - Extra-wide pipe gap: 175px (generous clearance).
   - Relaxed scroll speed (1.7px/frame) and floaty, gentle gravity (0.26).
   - Visual trajectory guide: Subtle glowing center flight path through upcoming pipe openings.
   - Forgiving hitboxes with 3-second invincibility flicker after getting hit.
2. **Classic Retro Mode Toggle**:
   - 1-hit KO authentic 2013 Flappy Bird difficulty (135px gap, faster gravity 0.38, 2.4px scroll speed).
3. **HTML5 2D Canvas Parallax Graphics**:
   - Sky gradient, scrolling distant skyline, fluffy floating clouds, animated green ground strip.
   - Procedurally drawn yellow 8-bit bird with animated flapping wing, white cartoon eye, orange beak, and smooth nose-dive tilt.
4. **Pure Web Audio API Sound Synthesizer**:
   - Flap wing whoosh, point ding bell, pipe bounce/damage thud, invincibility hum, and medal fanfare.
5. **Scoreboard & Medal Rewards**:
   - Bronze (10+), Silver (20+), Gold (30+), Platinum (40+) medals with confetti bursts on personal high scores.
6. **Universal Responsive Controls**:
   - Spacebar, Up Arrow, Click/Tap on canvas, plus a large tactile on-screen "FLAP" button for mobile play.`;

export const FlappyBirdGame: React.FC<FlappyBirdGameProps> = ({ onScoreUpdate, highScore }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [difficulty, setDifficulty] = useState<'easy' | 'classic'>('easy');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameState, setGameState] = useState<'READY' | 'PLAYING' | 'DYING' | 'GAME_OVER'>('READY');
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [isNewHigh, setIsNewHigh] = useState(false);

  const isEasy = difficulty === 'easy';

  // Config parameters based on difficulty
  const config = {
    gravity: isEasy ? 0.26 : 0.38,
    flapImpulse: isEasy ? -5.5 : -6.8,
    speed: isEasy ? 1.7 : 2.4,
    pipeGap: isEasy ? 175 : 135,
    maxLives: isEasy ? 3 : 1,
    hitRadius: isEasy ? 9 : 11,
  };

  const birdRef = useRef({
    x: 90,
    y: 240,
    vy: 0,
    radius: 14,
    rotation: 0,
    wingTimer: 0,
    invincibleTimer: 0,
  });

  const pipesRef = useRef<Pipe[]>([]);
  const groundOffsetRef = useRef(0);
  const bgOffsetRef = useRef(0);
  const screenFlashRef = useRef(0);
  const shakeRef = useRef(0);

  const PIPE_WIDTH = 54;
  const PIPE_SPACING = isEasy ? 220 : 200;
  const GROUND_HEIGHT = 80;
  const CANVAS_WIDTH = 400;
  const CANVAS_HEIGHT = 560;

  const resetGame = () => {
    birdRef.current = {
      x: 90,
      y: 240,
      vy: 0,
      radius: 14,
      rotation: 0,
      wingTimer: 0,
      invincibleTimer: 0,
    };
    pipesRef.current = [];
    setScore(0);
    setLives(config.maxLives);
    setIsNewHigh(false);
    screenFlashRef.current = 0;
    shakeRef.current = 0;
    setGameState('READY');
  };

  // Re-sync lives when toggling difficulty
  useEffect(() => {
    setLives(isEasy ? 3 : 1);
    if (gameState === 'READY') {
      resetGame();
    }
  }, [difficulty]);

  const triggerFlap = () => {
    if (gameState === 'READY') {
      setGameState('PLAYING');
      birdRef.current.vy = config.flapImpulse;
      birdRef.current.rotation = -0.4;
      sound.playJump();
    } else if (gameState === 'PLAYING') {
      birdRef.current.vy = config.flapImpulse;
      birdRef.current.rotation = -0.4;
      sound.playJump();
    } else if (gameState === 'GAME_OVER') {
      resetGame();
    }
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        triggerFlap();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  // Spawn pipe pair
  const spawnPipe = (startX: number) => {
    const minHeight = 50;
    const maxHeight = CANVAS_HEIGHT - GROUND_HEIGHT - config.pipeGap - minHeight;
    const topHeight = Math.floor(Math.random() * (maxHeight - minHeight + 1)) + minHeight;

    pipesRef.current.push({
      x: startX,
      topHeight,
      bottomY: topHeight + config.pipeGap,
      width: PIPE_WIDTH,
      gap: config.pipeGap,
      passed: false,
    });
  };

  // Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const loop = () => {
      update();
      render(ctx);
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  });

  const update = () => {
    const bird = birdRef.current;
    const pipes = pipesRef.current;

    // Wing flapping animation
    bird.wingTimer += 0.2;

    if (bird.invincibleTimer > 0) {
      bird.invincibleTimer -= 1;
    }

    if (gameState === 'READY') {
      bird.y = 240 + Math.sin(Date.now() * 0.005) * 8;
      bird.rotation = 0;
      groundOffsetRef.current = (groundOffsetRef.current + config.speed) % 24;
      bgOffsetRef.current = (bgOffsetRef.current + config.speed * 0.25) % CANVAS_WIDTH;
      return;
    }

    if (gameState === 'PLAYING') {
      // Float / Gravity physics
      bird.vy += config.gravity;
      if (bird.vy > 9.5) bird.vy = 9.5;
      bird.y += bird.vy;

      // Smooth rotation
      if (bird.vy < 0) {
        bird.rotation = Math.max(-0.4, bird.rotation - 0.08);
      } else {
        bird.rotation = Math.min(1.1, bird.rotation + 0.035);
      }

      // Parallax scroll
      groundOffsetRef.current = (groundOffsetRef.current + config.speed) % 24;
      bgOffsetRef.current = (bgOffsetRef.current + config.speed * 0.25) % CANVAS_WIDTH;

      // Spawn pipes
      if (pipes.length === 0 || pipes[pipes.length - 1].x < CANVAS_WIDTH - PIPE_SPACING) {
        spawnPipe(CANVAS_WIDTH + 20);
      }

      // Update Pipes
      for (let i = pipes.length - 1; i >= 0; i--) {
        const pipe = pipes[i];
        pipe.x -= config.speed;

        // Score pass detection
        if (!pipe.passed && pipe.x + pipe.width < bird.x) {
          pipe.passed = true;
          sound.playCoin();
          setScore(s => {
            const next = s + 1;
            onScoreUpdate?.(next);
            return next;
          });
        }

        // Collision Check with Forgiving Inner Hitbox
        const hitRadius = config.hitRadius;
        const inPipeX = bird.x + hitRadius > pipe.x && bird.x - hitRadius < pipe.x + pipe.width;
        const hitTopPipe = inPipeX && bird.y - hitRadius < pipe.topHeight;
        const hitBottomPipe = inPipeX && bird.y + hitRadius > pipe.bottomY;

        if ((hitTopPipe || hitBottomPipe) && bird.invincibleTimer <= 0) {
          handleCollision('pipe', pipe);
          return;
        }

        // Remove offscreen
        if (pipe.x + pipe.width < -30) {
          pipes.splice(i, 1);
        }
      }

      // Ground Collision
      if (bird.y + bird.radius >= CANVAS_HEIGHT - GROUND_HEIGHT) {
        bird.y = CANVAS_HEIGHT - GROUND_HEIGHT - bird.radius;
        if (bird.invincibleTimer <= 0) {
          handleCollision('ground');
          return;
        } else {
          // Bounce off ground safely during invincibility
          bird.vy = -5;
          sound.playBounce();
        }
      }

      // Ceiling boundary
      if (bird.y - bird.radius <= 0) {
        bird.y = bird.radius;
        bird.vy = 0;
      }
    }

    if (gameState === 'DYING') {
      bird.vy += 0.5;
      bird.y += bird.vy;
      bird.rotation = Math.min(1.5, bird.rotation + 0.1);

      if (bird.y + bird.radius >= CANVAS_HEIGHT - GROUND_HEIGHT) {
        bird.y = CANVAS_HEIGHT - GROUND_HEIGHT - bird.radius;
        setGameState('GAME_OVER');

        if (score > highScore) {
          setIsNewHigh(true);
          confetti({ particleCount: 90, spread: 80, origin: { y: 0.5 } });
        }
      }
    }

    if (screenFlashRef.current > 0) screenFlashRef.current -= 0.1;
    if (shakeRef.current > 0) shakeRef.current -= 0.5;
  };

  const handleCollision = (type: 'pipe' | 'ground', pipe?: Pipe) => {
    sound.playHit();
    screenFlashRef.current = 0.7;
    shakeRef.current = 6;

    if (isEasy && lives > 1) {
      // Forgiving Mode: Lose a heart, bounce back into safe center slot, gain invincibility shield!
      setLives(prev => prev - 1);
      birdRef.current.invincibleTimer = 75; // 1.25s shield protection

      if (pipe) {
        // Position bird in center of current pipe gap
        birdRef.current.y = pipe.topHeight + pipe.gap / 2;
        birdRef.current.vy = -2.5;
      } else {
        // Bounce up from ground
        birdRef.current.vy = -6;
      }
    } else {
      // Final life lost -> game over
      setLives(0);
      sound.playGameOver();
      setGameState('DYING');
    }
  };

  const render = (ctx: CanvasRenderingContext2D) => {
    ctx.save();

    // Camera shake
    if (shakeRef.current > 0) {
      const sx = (Math.random() - 0.5) * shakeRef.current;
      const sy = (Math.random() - 0.5) * shakeRef.current;
      ctx.translate(sx, sy);
    }

    // Sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT - GROUND_HEIGHT);
    if (isEasy) {
      skyGrad.addColorStop(0, '#38BDF8');
      skyGrad.addColorStop(0.7, '#BAE6FD');
      skyGrad.addColorStop(1, '#E0F2FE');
    } else {
      skyGrad.addColorStop(0, '#0284C7');
      skyGrad.addColorStop(0.7, '#38BDF8');
      skyGrad.addColorStop(1, '#BAE6FD');
    }
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Distant City Skyline
    ctx.fillStyle = isEasy ? '#BAE6FD' : '#93C5FD';
    for (let i = 0; i < 6; i++) {
      const cx = (i * 90 - bgOffsetRef.current * 0.4 + CANVAS_WIDTH * 2) % (CANVAS_WIDTH + 90) - 30;
      ctx.fillRect(cx, CANVAS_HEIGHT - GROUND_HEIGHT - 65, 45, 65);
      ctx.fillRect(cx + 15, CANVAS_HEIGHT - GROUND_HEIGHT - 85, 25, 85);
    }

    // Clouds
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    for (let c = 0; c < 4; c++) {
      const cloudX = (c * 130 - bgOffsetRef.current * 0.8 + CANVAS_WIDTH * 2) % (CANVAS_WIDTH + 100) - 40;
      const cloudY = 55 + (c % 2) * 50;
      ctx.beginPath();
      ctx.arc(cloudX, cloudY, 22, 0, Math.PI * 2);
      ctx.arc(cloudX + 20, cloudY - 8, 26, 0, Math.PI * 2);
      ctx.arc(cloudX + 44, cloudY, 20, 0, Math.PI * 2);
      ctx.fill();
    }

    // Safe Trajectory Center Guide (in Easy Mode)
    if (isEasy && gameState === 'PLAYING') {
      const upcomingPipe = pipesRef.current.find(p => p.x + p.width > birdRef.current.x);
      if (upcomingPipe) {
        const targetY = upcomingPipe.topHeight + upcomingPipe.gap / 2;
        ctx.save();
        ctx.strokeStyle = 'rgba(250, 204, 21, 0.4)';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.moveTo(birdRef.current.x, birdRef.current.y);
        ctx.quadraticCurveTo(
          (birdRef.current.x + upcomingPipe.x) / 2,
          targetY,
          upcomingPipe.x + upcomingPipe.width / 2,
          targetY
        );
        ctx.stroke();
        ctx.restore();
      }
    }

    // Draw Pipes
    for (const pipe of pipesRef.current) {
      drawPipe(ctx, pipe.x, 0, pipe.width, pipe.topHeight, true);
      drawPipe(ctx, pipe.x, pipe.bottomY, pipe.width, CANVAS_HEIGHT - GROUND_HEIGHT - pipe.bottomY, false);
    }

    // Ground
    const gy = CANVAS_HEIGHT - GROUND_HEIGHT;
    ctx.fillStyle = '#D97706';
    ctx.fillRect(0, gy, CANVAS_WIDTH, GROUND_HEIGHT);
    ctx.fillStyle = '#22C55E';
    ctx.fillRect(0, gy, CANVAS_WIDTH, 14);
    ctx.fillStyle = '#16A34A';
    ctx.fillRect(0, gy + 14, CANVAS_WIDTH, 4);

    // Ground stripes
    ctx.strokeStyle = '#B45309';
    ctx.lineWidth = 3;
    for (let x = -groundOffsetRef.current; x < CANVAS_WIDTH + 24; x += 24) {
      ctx.beginPath();
      ctx.moveTo(x, gy + 18);
      ctx.lineTo(x + 12, CANVAS_HEIGHT);
      ctx.stroke();
    }

    // Draw Bird
    drawBird(ctx);

    // In-game Score HUD
    if (gameState === 'PLAYING') {
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 36px monospace';
      ctx.textAlign = 'center';
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 5;
      ctx.strokeText(`${score}`, CANVAS_WIDTH / 2, 75);
      ctx.fillText(`${score}`, CANVAS_WIDTH / 2, 75);
    }

    // Screen flash
    if (screenFlashRef.current > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${screenFlashRef.current})`;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }

    ctx.restore();
  };

  const drawPipe = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, isTop: boolean) => {
    ctx.fillStyle = '#22C55E';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#86EFAC';
    ctx.fillRect(x + 4, y, 6, h);
    ctx.fillStyle = '#15803D';
    ctx.fillRect(x + w - 8, y, 6, h);
    ctx.strokeStyle = '#14532D';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(x, y, w, h);

    const collarH = 22;
    const collarY = isTop ? y + h - collarH : y;
    const collarX = x - 4;
    const collarW = w + 8;

    ctx.fillStyle = '#22C55E';
    ctx.fillRect(collarX, collarY, collarW, collarH);
    ctx.fillStyle = '#86EFAC';
    ctx.fillRect(collarX + 4, collarY, 6, collarH);
    ctx.fillStyle = '#15803D';
    ctx.fillRect(collarX + collarW - 8, collarY, 6, collarH);
    ctx.strokeRect(collarX, collarY, collarW, collarH);
  };

  const drawBird = (ctx: CanvasRenderingContext2D) => {
    const b = birdRef.current;

    // Flicker if invincible
    if (b.invincibleTimer > 0 && Math.floor(b.invincibleTimer / 4) % 2 === 0) {
      return;
    }

    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.rotate(b.rotation);

    // Invincibility Shield Bubble
    if (b.invincibleTimer > 0) {
      ctx.save();
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 2;
      ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
      ctx.beginPath();
      ctx.arc(0, 0, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // Body
    ctx.fillStyle = '#FACC15';
    ctx.beginPath();
    ctx.ellipse(0, 0, 16, 13, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#854D0E';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Belly
    ctx.fillStyle = '#FEF08A';
    ctx.beginPath();
    ctx.ellipse(-3, 3, 10, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Eye
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(6, -5, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#854D0E';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#0F172A';
    ctx.beginPath();
    ctx.arc(8, -5, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Beak
    ctx.fillStyle = '#F97316';
    ctx.beginPath();
    ctx.moveTo(10, -2);
    ctx.lineTo(20, 2);
    ctx.lineTo(10, 6);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#9A3412';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Flapping Wing
    const wingY = Math.sin(b.wingTimer) * 4;
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.ellipse(-7, wingY, 7, 4.5, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#854D0E';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.restore();
  };

  const copyPromptToClipboard = () => {
    navigator.clipboard.writeText(FLAPPY_AI_STUDIO_PROMPT);
    setCopiedPrompt(true);
    sound.playCoin();
    setTimeout(() => setCopiedPrompt(false), 2400);
  };

  const getMedalColor = (s: number) => {
    if (s >= 40) return { label: 'PLATINUM', text: 'text-cyan-200' };
    if (s >= 30) return { label: 'GOLD', text: 'text-amber-200' };
    if (s >= 20) return { label: 'SILVER', text: 'text-slate-100' };
    if (s >= 10) return { label: 'BRONZE', text: 'text-amber-100' };
    return null;
  };

  const medal = getMedalColor(score);

  return (
    <div className="flex flex-col items-center select-none w-full max-w-[420px]">
      {/* Top HUD with Difficulty Selector & Lives */}
      <div className="w-full flex items-center justify-between px-3 py-2 bg-slate-900 border-x border-t border-slate-800 rounded-t-lg text-xs font-mono">
        <div className="flex items-center gap-2">
          {/* Difficulty Segmented Toggle */}
          <div className="flex items-center bg-slate-950 p-0.5 rounded border border-slate-800 text-[11px]">
            <button
              onClick={() => {
                setDifficulty('easy');
                sound.playClick();
              }}
              className={`flex items-center gap-1 px-2 py-0.5 rounded transition-all cursor-pointer ${
                isEasy ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Feather size={11} />
              <span>Easy (3 Lives)</span>
            </button>
            <button
              onClick={() => {
                setDifficulty('classic');
                sound.playClick();
              }}
              className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                !isEasy ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Classic
            </button>
          </div>

          {/* Hearts Display */}
          {isEasy && (
            <div className="flex items-center gap-0.5 ml-1">
              {[...Array(3)].map((_, i) => (
                <Heart
                  key={i}
                  size={14}
                  className={`transition-colors ${
                    i < lives
                      ? 'fill-rose-500 text-rose-500 animate-pulse'
                      : 'fill-slate-800 text-slate-700'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-300">Score: <strong className="text-amber-400 font-bold tabular-nums">{score}</strong></span>
          <div className="flex items-center gap-1 text-slate-400">
            <Trophy size={13} className="text-amber-400" />
            <span className="text-slate-200 tabular-nums">{Math.max(score, highScore)}</span>
          </div>
        </div>
      </div>

      {/* Main Game Screen Canvas */}
      <div
        onClick={triggerFlap}
        className="relative w-full aspect-[400/560] bg-slate-950 border border-slate-800 shadow-2xl overflow-hidden cursor-pointer crt-effect"
      >
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="w-full h-full block pixelated"
        />

        {/* READY / GET READY OVERLAY */}
        {gameState === 'READY' && (
          <div className="absolute inset-0 bg-slate-950/45 backdrop-blur-2xs flex flex-col items-center justify-center p-6 text-center pointer-events-none">
            <div className="w-16 h-16 rounded-full bg-amber-400/20 border-2 border-amber-400 flex items-center justify-center mb-3 animate-bounce">
              <span className="text-2xl">🐤</span>
            </div>
            <h3 className="font-arcade text-lg text-white mb-2 drop-shadow-md">GET READY!</h3>
            <div className="bg-slate-950/85 px-4 py-2 rounded-lg border border-slate-800 mb-3 space-y-1">
              <p className="text-xs font-mono text-emerald-400 font-bold">
                {isEasy ? '✨ RELAXED MODE: 3 LIVES & WIDE GAPS' : 'CLASSIC MODE: 1 HIT KO'}
              </p>
              <p className="text-[11px] text-slate-300">
                Tap anywhere or press Space to flap smoothly
              </p>
            </div>
          </div>
        )}

        {/* GAME OVER SCOREBOARD */}
        {gameState === 'GAME_OVER' && (
          <div
            onClick={e => e.stopPropagation()}
            className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center z-30 animate-in fade-in zoom-in-95 duration-200"
          >
            <h3 className="font-arcade text-base text-rose-500 mb-3 tracking-wider">GAME OVER</h3>

            {/* Scoreboard Card */}
            <div className="w-full max-w-[260px] bg-slate-900 border-2 border-slate-700 rounded-xl p-4 shadow-xl mb-4 text-xs font-mono">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-slate-400">MEDAL</span>
                <span className="text-slate-400">SCORE</span>
              </div>

              <div className="flex items-center justify-between py-3">
                <div className="flex flex-col items-center justify-center w-14 h-14 rounded-lg bg-slate-950 border border-slate-800">
                  {medal ? (
                    <div className="flex flex-col items-center">
                      <Award size={22} className={medal.text} />
                      <span className={`text-[9px] font-bold ${medal.text}`}>{medal.label}</span>
                    </div>
                  ) : (
                    <span className="text-[10px] text-slate-500">None</span>
                  )}
                </div>

                <div className="flex flex-col items-end gap-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-[10px] text-slate-400">SCORE:</span>
                    <span className="text-lg font-bold text-amber-400 tabular-nums">{score}</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-[10px] text-slate-400">BEST:</span>
                    <span className="text-sm font-bold text-white tabular-nums">
                      {Math.max(score, highScore)}
                    </span>
                  </div>
                  {isNewHigh && (
                    <span className="text-[9px] font-bold text-emerald-400 animate-pulse">
                      ★ NEW RECORD!
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={resetGame}
              className="flex items-center gap-2 font-arcade text-xs px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg transition-all active:scale-95 shadow-lg mb-3 cursor-pointer"
            >
              <RotateCcw size={14} />
              <span>TRY AGAIN</span>
            </button>
          </div>
        )}
      </div>

      {/* Big Friendly Flap Button & Prompt Copy Bar */}
      <div className="w-full flex flex-col gap-2.5 p-3 bg-slate-900 border-x border-b border-slate-800 rounded-b-lg">
        {/* Large Tactile Flap Button */}
        <button
          onClick={triggerFlap}
          className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 active:scale-[0.98] text-slate-950 font-bold rounded-lg shadow-md flex items-center justify-center gap-2 text-sm font-arcade transition-all cursor-pointer"
        >
          <Feather size={16} />
          <span>FLAP! (SPACE / TAP)</span>
        </button>

        <div className="flex items-center justify-between text-xs font-mono text-slate-400 pt-1">
          <span className="text-[11px] text-slate-400">
            {isEasy ? '✓ Safe Trajectory Guide & 3 Lives Active' : 'Classic 1-Hit Mode'}
          </span>
          <button
            onClick={copyPromptToClipboard}
            className="flex items-center gap-1 px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 text-amber-300 rounded text-xs transition-colors cursor-pointer"
          >
            {copiedPrompt ? <Check size={12} className="text-emerald-400" /> : <Sparkles size={12} />}
            <span>{copiedPrompt ? 'Copied!' : 'Copy Prompt'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
