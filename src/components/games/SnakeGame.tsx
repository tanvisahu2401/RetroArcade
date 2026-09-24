import React, { useState, useEffect, useRef, useCallback } from 'react';
import { sound } from '../../services/sound';
import { RotateCcw, Trophy, Play, Pause, Sparkles } from 'lucide-react';

interface SnakeGameProps {
  onScoreUpdate?: (score: number) => void;
  highScore: number;
}

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

interface Position {
  x: number;
  y: number;
}

const GRID_SIZE = 20;
const TILE_COUNT_X = 25;
const TILE_COUNT_Y = 20;

export const SnakeGame: React.FC<SnakeGameProps> = ({ onScoreUpdate, highScore }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [theme, setTheme] = useState<'nokia' | 'neon'>('nokia');
  const [speedMode, setSpeedMode] = useState<'relaxed' | 'classic' | 'turbo'>('relaxed');
  const [wallMode, setWallMode] = useState<'walled' | 'wrap'>('wrap');

  const [score, setScore] = useState(0);
  const [length, setLength] = useState(3);
  const [gameState, setGameState] = useState<'READY' | 'PLAYING' | 'PAUSED' | 'GAME_OVER'>('READY');
  const [bonusTimer, setBonusTimer] = useState<number>(0);

  // Snake mutable state for loop
  const snakeRef = useRef<Position[]>([
    { x: 10, y: 10 },
    { x: 9, y: 10 },
    { x: 8, y: 10 },
  ]);

  const dirRef = useRef<Direction>('RIGHT');
  const nextDirRef = useRef<Direction>('RIGHT');
  const foodRef = useRef<Position>({ x: 18, y: 10 });
  const bonusFoodRef = useRef<{ x: number; y: number; active: boolean; timer: number }>({
    x: 0,
    y: 0,
    active: false,
    timer: 0,
  });

  const getSpeedInterval = useCallback(() => {
    switch (speedMode) {
      case 'relaxed': return 120;
      case 'turbo': return 65;
      case 'classic':
      default: return 90;
    }
  }, [speedMode]);

  const generateFoodPosition = useCallback((): Position => {
    const snake = snakeRef.current;
    let newPos: Position;
    let collision: boolean;
    do {
      newPos = {
        x: Math.floor(Math.random() * TILE_COUNT_X),
        y: Math.floor(Math.random() * TILE_COUNT_Y),
      };
      // eslint-disable-next-line @typescript-eslint/no-loop-func
      collision = snake.some(seg => seg.x === newPos.x && seg.y === newPos.y);
    } while (collision);
    return newPos;
  }, []);

  const resetGame = () => {
    snakeRef.current = [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 },
    ];
    dirRef.current = 'RIGHT';
    nextDirRef.current = 'RIGHT';
    foodRef.current = generateFoodPosition();
    bonusFoodRef.current = { x: 0, y: 0, active: false, timer: 0 };
    setScore(0);
    setLength(3);
    setBonusTimer(0);
    setGameState('PLAYING');
    sound.playEat();
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      const currentDir = dirRef.current;

      if ((e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') && currentDir !== 'DOWN') {
        nextDirRef.current = 'UP';
      } else if ((e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') && currentDir !== 'UP') {
        nextDirRef.current = 'DOWN';
      } else if ((e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') && currentDir !== 'RIGHT') {
        nextDirRef.current = 'LEFT';
      } else if ((e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') && currentDir !== 'LEFT') {
        nextDirRef.current = 'RIGHT';
      } else if (e.key === 'p' || e.key === 'P') {
        setGameState(prev => (prev === 'PLAYING' ? 'PAUSED' : prev === 'PAUSED' ? 'PLAYING' : prev));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Game update tick
  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    const interval = setInterval(() => {
      // Advance snake
      dirRef.current = nextDirRef.current;
      const head = { ...snakeRef.current[0] };

      switch (dirRef.current) {
        case 'UP': head.y -= 1; break;
        case 'DOWN': head.y += 1; break;
        case 'LEFT': head.x -= 1; break;
        case 'RIGHT': head.x += 1; break;
      }

      // Check wall collision or wrap
      if (wallMode === 'walled') {
        if (head.x < 0 || head.x >= TILE_COUNT_X || head.y < 0 || head.y >= TILE_COUNT_Y) {
          sound.playGameOver();
          setGameState('GAME_OVER');
          return;
        }
      } else {
        // Wrap
        head.x = (head.x + TILE_COUNT_X) % TILE_COUNT_X;
        head.y = (head.y + TILE_COUNT_Y) % TILE_COUNT_Y;
      }

      // Check self-collision
      if (snakeRef.current.some(seg => seg.x === head.x && seg.y === head.y)) {
        sound.playGameOver();
        setGameState('GAME_OVER');
        return;
      }

      // Move snake
      const newSnake = [head, ...snakeRef.current];

      // Check food
      let ate = false;
      if (head.x === foodRef.current.x && head.y === foodRef.current.y) {
        ate = true;
        sound.playEat();
        setScore(s => {
          const next = s + 10;
          onScoreUpdate?.(next);
          return next;
        });
        setLength(l => l + 1);
        foodRef.current = generateFoodPosition();

        // 25% chance to spawn bonus star
        if (!bonusFoodRef.current.active && Math.random() < 0.25) {
          const bonusPos = generateFoodPosition();
          bonusFoodRef.current = {
            x: bonusPos.x,
            y: bonusPos.y,
            active: true,
            timer: 70, // ~6 seconds
          };
        }
      }

      // Check bonus star
      if (bonusFoodRef.current.active) {
        if (head.x === bonusFoodRef.current.x && head.y === bonusFoodRef.current.y) {
          ate = true;
          sound.playCoin();
          setScore(s => {
            const next = s + 50;
            onScoreUpdate?.(next);
            return next;
          });
          bonusFoodRef.current.active = false;
          setBonusTimer(0);
        } else {
          bonusFoodRef.current.timer -= 1;
          setBonusTimer(bonusFoodRef.current.timer);
          if (bonusFoodRef.current.timer <= 0) {
            bonusFoodRef.current.active = false;
          }
        }
      }

      if (!ate) {
        newSnake.pop();
      }

      snakeRef.current = newSnake;
    }, getSpeedInterval());

    return () => clearInterval(interval);
  }, [gameState, wallMode, getSpeedInterval, generateFoodPosition, onScoreUpdate]);

  // Render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const draw = () => {
      const isNokia = theme === 'nokia';

      // Background
      if (isNokia) {
        ctx.fillStyle = '#9bbc0f'; // Authentic Nokia 3310 greenish LCD
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Dot matrix grid texture
        ctx.fillStyle = '#8bac0f';
        for (let x = 0; x < canvas.width; x += 4) {
          for (let y = 0; y < canvas.height; y += 4) {
            ctx.fillRect(x, y, 1, 1);
          }
        }
      } else {
        ctx.fillStyle = '#090D16'; // Neon dark arcade
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Grid lines
        ctx.strokeStyle = '#1E293B';
        ctx.lineWidth = 0.5;
        for (let x = 0; x <= canvas.width; x += GRID_SIZE) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, canvas.height);
          ctx.stroke();
        }
        for (let y = 0; y <= canvas.height; y += GRID_SIZE) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(canvas.width, y);
          ctx.stroke();
        }
      }

      // Draw Wall Border if Walled
      if (wallMode === 'walled') {
        ctx.strokeStyle = isNokia ? '#0f380f' : '#EF4444';
        ctx.lineWidth = isNokia ? 3 : 2;
        ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);
      }

      // Draw Normal Food
      const food = foodRef.current;
      const fx = food.x * GRID_SIZE;
      const fy = food.y * GRID_SIZE;

      if (isNokia) {
        ctx.fillStyle = '#0f380f';
        ctx.fillRect(fx + 2, fy + 2, GRID_SIZE - 4, GRID_SIZE - 4);
      } else {
        ctx.fillStyle = '#EF4444';
        ctx.beginPath();
        ctx.arc(fx + GRID_SIZE / 2, fy + GRID_SIZE / 2, GRID_SIZE / 2 - 2, 0, Math.PI * 2);
        ctx.fill();
        // shine
        ctx.fillStyle = '#FCA5A5';
        ctx.beginPath();
        ctx.arc(fx + GRID_SIZE / 2 - 2, fy + GRID_SIZE / 2 - 2, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw Bonus Star
      if (bonusFoodRef.current.active) {
        const bx = bonusFoodRef.current.x * GRID_SIZE;
        const by = bonusFoodRef.current.y * GRID_SIZE;
        const pulse = Math.sin(Date.now() * 0.015) * 2;

        if (isNokia) {
          ctx.fillStyle = '#0f380f';
          ctx.beginPath();
          ctx.arc(bx + GRID_SIZE / 2, by + GRID_SIZE / 2, GRID_SIZE / 2 - 1, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillRect(bx + 4, by + 4, GRID_SIZE - 8, GRID_SIZE - 8);
        } else {
          ctx.fillStyle = '#FACC15';
          ctx.beginPath();
          ctx.arc(bx + GRID_SIZE / 2, by + GRID_SIZE / 2, (GRID_SIZE / 2 - 2) + pulse, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Draw Snake
      const snake = snakeRef.current;
      snake.forEach((seg, i) => {
        const sx = seg.x * GRID_SIZE;
        const sy = seg.y * GRID_SIZE;

        if (isNokia) {
          ctx.fillStyle = '#0f380f';
          ctx.fillRect(sx + 1, sy + 1, GRID_SIZE - 2, GRID_SIZE - 2);

          // Head eye dots
          if (i === 0) {
            ctx.fillStyle = '#9bbc0f';
            ctx.fillRect(sx + 4, sy + 4, 3, 3);
            ctx.fillRect(sx + 12, sy + 4, 3, 3);
          }
        } else {
          if (i === 0) {
            // Head
            ctx.fillStyle = '#84CC16';
            ctx.fillRect(sx + 1, sy + 1, GRID_SIZE - 2, GRID_SIZE - 2);
            // eyes
            ctx.fillStyle = '#0F172A';
            ctx.fillRect(sx + 4, sy + 4, 3, 3);
            ctx.fillRect(sx + GRID_SIZE - 7, sy + 4, 3, 3);
          } else {
            // Body with gradient falloff
            const alpha = Math.max(0.4, 1 - (i / snake.length) * 0.6);
            ctx.fillStyle = `rgba(101, 163, 13, ${alpha})`;
            ctx.fillRect(sx + 2, sy + 2, GRID_SIZE - 4, GRID_SIZE - 4);
          }
        }
      });

      animId = requestAnimationFrame(draw);
    };

    animId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animId);
  }, [theme, wallMode]);

  return (
    <div className="flex flex-col items-center select-none">
      {/* Top Options Bar */}
      <div className="w-full max-w-[500px] flex items-center justify-between px-3 py-2 bg-slate-900 border-x border-t border-slate-800 rounded-t-lg text-xs font-mono">
        <div className="flex items-center gap-2">
          {/* Theme switcher */}
          <button
            onClick={() => setTheme(t => (t === 'nokia' ? 'neon' : 'nokia'))}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
              theme === 'nokia' ? 'bg-lime-800 text-lime-200' : 'bg-slate-800 text-slate-300'
            }`}
          >
            {theme === 'nokia' ? 'Nokia 3310 LCD' : 'Neon Arcade'}
          </button>

          {/* Wall mode */}
          <button
            onClick={() => setWallMode(m => (m === 'walled' ? 'wrap' : 'walled'))}
            className="px-2 py-0.5 bg-slate-800 text-slate-300 hover:text-white rounded text-[11px]"
          >
            {wallMode === 'walled' ? 'Walled' : 'Wrap-around'}
          </button>
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
      <div className="relative w-full max-w-[500px] aspect-[500/400] bg-slate-950 border border-slate-800 shadow-2xl overflow-hidden crt-effect">
        <canvas
          ref={canvasRef}
          width={500}
          height={400}
          className="w-full h-full block pixelated"
        />

        {bonusTimer > 0 && (
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-amber-400/20 border border-amber-400 px-2 py-1 rounded text-amber-300 font-mono text-[11px] animate-pulse">
            <Sparkles size={12} />
            <span>Bonus: {Math.ceil(bonusTimer / 10)}s</span>
          </div>
        )}

        {/* Ready Overlay */}
        {gameState === 'READY' && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center z-30">
            <div className="w-14 h-14 rounded-lg bg-lime-500/20 border border-lime-400 flex items-center justify-center mb-3 text-lime-400 font-arcade text-xl">
              🐍
            </div>
            <h3 className="font-arcade text-base text-white mb-2">SNAKE 3310</h3>
            <p className="text-sm text-slate-300 max-w-xs mb-4 font-body">
              Eat dots to grow longer. Don&apos;t run into yourself or the perimeter walls!
            </p>
            <div className="flex items-center gap-2 mb-4">
              {(['relaxed', 'classic', 'turbo'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setSpeedMode(s)}
                  className={`px-2.5 py-1 rounded text-xs capitalize font-medium ${
                    speedMode === s ? 'bg-lime-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <button
              onClick={resetGame}
              className="font-arcade text-xs px-6 py-2.5 bg-lime-600 hover:bg-lime-500 text-slate-950 font-bold rounded transition-colors active:scale-95"
            >
              START GAME
            </button>
          </div>
        )}

        {/* Game Over */}
        {gameState === 'GAME_OVER' && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center z-30">
            <h3 className="font-arcade text-base text-rose-500 mb-2">GAME OVER</h3>
            <div className="text-xs font-mono text-slate-300 mb-4 bg-slate-900 px-4 py-2 rounded border border-slate-800">
              Score: <span className="text-amber-400 font-bold">{score}</span> · Length: <span className="text-white">{length}</span>
            </div>
            <button
              onClick={resetGame}
              className="flex items-center gap-2 font-arcade text-xs px-5 py-2.5 bg-lime-600 hover:bg-lime-500 text-slate-950 font-bold rounded transition-colors active:scale-95"
            >
              <RotateCcw size={14} />
              <span>PLAY AGAIN</span>
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

      {/* Controller & D-pad */}
      <div className="w-full max-w-[500px] flex items-center justify-between p-3 bg-slate-900 border-x border-b border-slate-800 rounded-b-lg">
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
        <div className="grid grid-cols-3 gap-1 md:hidden">
          <div />
          <button
            onClick={() => { if (dirRef.current !== 'DOWN') nextDirRef.current = 'UP'; }}
            className="w-10 h-10 bg-slate-800 active:bg-slate-700 text-white rounded flex items-center justify-center text-xs"
          >
            ▲
          </button>
          <div />
          <button
            onClick={() => { if (dirRef.current !== 'RIGHT') nextDirRef.current = 'LEFT'; }}
            className="w-10 h-10 bg-slate-800 active:bg-slate-700 text-white rounded flex items-center justify-center text-xs"
          >
            ◀
          </button>
          <button
            onClick={() => { if (dirRef.current !== 'UP') nextDirRef.current = 'DOWN'; }}
            className="w-10 h-10 bg-slate-800 active:bg-slate-700 text-white rounded flex items-center justify-center text-xs"
          >
            ▼
          </button>
          <button
            onClick={() => { if (dirRef.current !== 'LEFT') nextDirRef.current = 'RIGHT'; }}
            className="w-10 h-10 bg-slate-800 active:bg-slate-700 text-white rounded flex items-center justify-center text-xs"
          >
            ▶
          </button>
        </div>

        <div className="hidden md:flex items-center gap-2 text-xs text-slate-400 font-mono">
          <span>Controls: <strong className="text-slate-200">WASD or Arrow Keys</strong></span>
          <span>·</span>
          <span>Pause: <strong className="text-slate-200">P</strong></span>
        </div>
      </div>
    </div>
  );
};
