import React, { useState, useEffect, useRef, useCallback } from 'react';
import { sound } from '../../services/sound';
import { RotateCcw, Trophy, Play, Pause, ArrowDown } from 'lucide-react';

interface TetrisGameProps {
  onScoreUpdate?: (score: number) => void;
  highScore: number;
}

const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 24;

// 7 standard Tetromino shapes & colors
const TETROMINOES = {
  I: {
    shape: [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ],
    color: '#06B6D4' // Cyan
  },
  J: {
    shape: [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0]
    ],
    color: '#3B82F6' // Blue
  },
  L: {
    shape: [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0]
    ],
    color: '#F97316' // Orange
  },
  O: {
    shape: [
      [1, 1],
      [1, 1]
    ],
    color: '#FACC15' // Yellow
  },
  S: {
    shape: [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0]
    ],
    color: '#22C55E' // Green
  },
  T: {
    shape: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0]
    ],
    color: '#A855F7' // Purple
  },
  Z: {
    shape: [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0]
    ],
    color: '#EF4444' // Red
  }
};

type TetrominoType = keyof typeof TETROMINOES;

interface CurrentPiece {
  type: TetrominoType;
  matrix: number[][];
  x: number;
  y: number;
  color: string;
}

export const TetrisGame: React.FC<TetrisGameProps> = ({ onScoreUpdate, highScore }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const nextCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const holdCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [level, setLevel] = useState(1);
  const [gameState, setGameState] = useState<'READY' | 'PLAYING' | 'PAUSED' | 'GAME_OVER'>('READY');
  const [holdPiece, setHoldPiece] = useState<TetrominoType | null>(null);
  const [canHold, setCanHold] = useState(true);

  // 10x20 Board
  const boardRef = useRef<string[][]>(
    Array.from({ length: ROWS }, () => Array(COLS).fill(''))
  );

  // 7-bag randomizer
  const bagRef = useRef<TetrominoType[]>([]);

  const getNextPieceType = useCallback((): TetrominoType => {
    if (bagRef.current.length === 0) {
      const types = Object.keys(TETROMINOES) as TetrominoType[];
      // Fisher-Yates shuffle
      for (let i = types.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [types[i], types[j]] = [types[j], types[i]];
      }
      bagRef.current = types;
    }
    return bagRef.current.pop()!;
  }, []);

  const nextPieceTypeRef = useRef<TetrominoType>('T');
  const pieceRef = useRef<CurrentPiece>({
    type: 'T',
    matrix: TETROMINOES.T.shape,
    x: 3,
    y: 0,
    color: TETROMINOES.T.color
  });

  const spawnPiece = useCallback((type?: TetrominoType) => {
    const pieceType = type || nextPieceTypeRef.current;
    nextPieceTypeRef.current = getNextPieceType();

    const shape = TETROMINOES[pieceType].shape;
    const color = TETROMINOES[pieceType].color;
    const piece: CurrentPiece = {
      type: pieceType,
      matrix: shape.map(row => [...row]),
      x: Math.floor((COLS - shape[0].length) / 2),
      y: 0,
      color
    };

    // Check game over
    const board = boardRef.current;
    for (let r = 0; r < piece.matrix.length; r++) {
      for (let c = 0; c < piece.matrix[r].length; c++) {
        if (piece.matrix[r][c] && board[piece.y + r]?.[piece.x + c]) {
          setGameState('GAME_OVER');
          sound.playGameOver();
          return;
        }
      }
    }

    pieceRef.current = piece;
    setCanHold(true);
  }, [getNextPieceType]);

  const resetGame = () => {
    boardRef.current = Array.from({ length: ROWS }, () => Array(COLS).fill(''));
    bagRef.current = [];
    nextPieceTypeRef.current = getNextPieceType();
    setScore(0);
    setLines(0);
    setLevel(1);
    setHoldPiece(null);
    setCanHold(true);
    spawnPiece();
    setGameState('PLAYING');
    sound.playClear();
  };

  // Collision detection
  const checkCollision = (piece: CurrentPiece, offsetX = 0, offsetY = 0, newMatrix?: number[][]) => {
    const matrix = newMatrix || piece.matrix;
    const board = boardRef.current;

    for (let r = 0; r < matrix.length; r++) {
      for (let c = 0; c < matrix[r].length; c++) {
        if (!matrix[r][c]) continue;

        const newX = piece.x + c + offsetX;
        const newY = piece.y + r + offsetY;

        // Boundaries
        if (newX < 0 || newX >= COLS || newY >= ROWS) {
          return true;
        }
        // Collide with locked board piece
        if (newY >= 0 && board[newY][newX]) {
          return true;
        }
      }
    }
    return false;
  };

  // Rotate piece matrix 90 deg clockwise
  const rotateMatrix = (matrix: number[][]) => {
    const N = matrix.length;
    const result: number[][] = Array.from({ length: N }, () => Array(N).fill(0));
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        result[c][N - 1 - r] = matrix[r][c];
      }
    }
    return result;
  };

  // Rotate current piece with wall kick attempts
  const rotatePiece = () => {
    const piece = pieceRef.current;
    if (piece.type === 'O') return; // O doesn't need rotation

    const rotated = rotateMatrix(piece.matrix);
    // Wall kicks: try 0, -1, +1, -2, +2
    const kicks = [0, -1, 1, -2, 2];
    for (const kick of kicks) {
      if (!checkCollision(piece, kick, 0, rotated)) {
        piece.x += kick;
        piece.matrix = rotated;
        sound.playClick();
        return;
      }
    }
  };

  // Hard drop piece
  const hardDrop = () => {
    const piece = pieceRef.current;
    let droppedY = 0;
    while (!checkCollision(piece, 0, droppedY + 1)) {
      droppedY++;
    }
    piece.y += droppedY;
    setScore(s => {
      const next = s + droppedY * 2;
      onScoreUpdate?.(next);
      return next;
    });
    lockPiece();
    sound.playHit();
  };

  // Hold piece logic
  const handleHold = () => {
    if (!canHold || gameState !== 'PLAYING') return;

    const currentType = pieceRef.current.type;
    sound.playClick();

    if (holdPiece === null) {
      setHoldPiece(currentType);
      spawnPiece();
    } else {
      const prevHold = holdPiece;
      setHoldPiece(currentType);
      spawnPiece(prevHold);
    }
    setCanHold(false);
  };

  // Lock piece into board and clear completed lines
  const lockPiece = useCallback(() => {
    const piece = pieceRef.current;
    const board = boardRef.current;

    for (let r = 0; r < piece.matrix.length; r++) {
      for (let c = 0; c < piece.matrix[r].length; c++) {
        if (piece.matrix[r][c]) {
          const by = piece.y + r;
          const bx = piece.x + c;
          if (by >= 0 && by < ROWS && bx >= 0 && bx < COLS) {
            board[by][bx] = piece.color;
          }
        }
      }
    }

    // Check full lines
    let clearedCount = 0;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (board[r].every(cell => cell !== '')) {
        clearedCount++;
        board.splice(r, 1);
        board.unshift(Array(COLS).fill(''));
        r++; // check same index again
      }
    }

    if (clearedCount > 0) {
      sound.playClear();
      const points = [0, 100, 300, 500, 800][clearedCount] * level;
      setScore(s => {
        const next = s + points;
        onScoreUpdate?.(next);
        return next;
      });
      setLines(l => {
        const total = l + clearedCount;
        setLevel(Math.floor(total / 10) + 1);
        return total;
      });
    }

    spawnPiece();
  }, [level, onScoreUpdate, spawnPiece]);

  // Drop step
  const moveDown = useCallback(() => {
    const piece = pieceRef.current;
    if (!checkCollision(piece, 0, 1)) {
      piece.y += 1;
    } else {
      lockPiece();
    }
  }, [lockPiece]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      if (gameState !== 'PLAYING') return;

      const piece = pieceRef.current;

      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        if (!checkCollision(piece, -1, 0)) {
          piece.x -= 1;
          sound.playClick();
        }
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        if (!checkCollision(piece, 1, 0)) {
          piece.x += 1;
          sound.playClick();
        }
      } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        rotatePiece();
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        moveDown();
        setScore(s => s + 1);
      } else if (e.key === ' ') {
        hardDrop();
      } else if (e.key === 'c' || e.key === 'C' || e.key === 'Shift') {
        handleHold();
      } else if (e.key === 'p' || e.key === 'P') {
        setGameState(prev => (prev === 'PLAYING' ? 'PAUSED' : prev === 'PAUSED' ? 'PLAYING' : prev));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  // Game timer loop
  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    // Drop speed scales with level: 950ms down to 140ms
    const speed = Math.max(140, 950 - (level - 1) * 55);
    const interval = setInterval(() => {
      moveDown();
    }, speed);

    return () => clearInterval(interval);
  }, [gameState, level, moveDown]);

  // Canvas render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      // Clear board
      ctx.fillStyle = '#0B0F19';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Grid lines
      ctx.strokeStyle = '#1E293B';
      ctx.lineWidth = 0.5;
      for (let x = 0; x <= canvas.width; x += BLOCK_SIZE) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y <= canvas.height; y += BLOCK_SIZE) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Draw locked blocks
      const board = boardRef.current;
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          if (board[r][c]) {
            drawBlock(ctx, c * BLOCK_SIZE, r * BLOCK_SIZE, board[r][c]);
          }
        }
      }

      // Draw Ghost Piece (projection)
      const piece = pieceRef.current;
      let ghostY = 0;
      while (!checkCollision(piece, 0, ghostY + 1)) {
        ghostY++;
      }

      ctx.save();
      ctx.globalAlpha = 0.25;
      for (let r = 0; r < piece.matrix.length; r++) {
        for (let c = 0; c < piece.matrix[r].length; c++) {
          if (piece.matrix[r][c]) {
            const gx = (piece.x + c) * BLOCK_SIZE;
            const gy = (piece.y + ghostY + r) * BLOCK_SIZE;
            ctx.strokeStyle = piece.color;
            ctx.lineWidth = 1.5;
            ctx.strokeRect(gx + 1, gy + 1, BLOCK_SIZE - 2, BLOCK_SIZE - 2);
          }
        }
      }
      ctx.restore();

      // Draw active piece
      for (let r = 0; r < piece.matrix.length; r++) {
        for (let c = 0; c < piece.matrix[r].length; c++) {
          if (piece.matrix[r][c]) {
            const px = (piece.x + c) * BLOCK_SIZE;
            const py = (piece.y + r) * BLOCK_SIZE;
            drawBlock(ctx, px, py, piece.color);
          }
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  });

  // Render Mini Preview Canvas (Next Piece)
  useEffect(() => {
    const canvas = nextCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#0F172A';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const type = nextPieceTypeRef.current;
    const shape = TETROMINOES[type].shape;
    const color = TETROMINOES[type].color;
    const miniSize = 16;

    const offsetX = (canvas.width - shape[0].length * miniSize) / 2;
    const offsetY = (canvas.height - shape.length * miniSize) / 2;

    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c]) {
          drawBlock(ctx, offsetX + c * miniSize, offsetY + r * miniSize, color, miniSize);
        }
      }
    }
  }, [pieceRef.current.type]);

  // Render Hold Canvas
  useEffect(() => {
    const canvas = holdCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#0F172A';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (holdPiece) {
      const shape = TETROMINOES[holdPiece].shape;
      const color = canHold ? TETROMINOES[holdPiece].color : '#64748B';
      const miniSize = 16;
      const offsetX = (canvas.width - shape[0].length * miniSize) / 2;
      const offsetY = (canvas.height - shape.length * miniSize) / 2;

      for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[r].length; c++) {
          if (shape[r][c]) {
            drawBlock(ctx, offsetX + c * miniSize, offsetY + r * miniSize, color, miniSize);
          }
        }
      }
    }
  }, [holdPiece, canHold]);

  const drawBlock = (ctx: CanvasRenderingContext2D, x: number, y: number, color: string, size = BLOCK_SIZE) => {
    ctx.fillStyle = color;
    ctx.fillRect(x + 1, y + 1, size - 2, size - 2);

    // Bevel highlights
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(x + 1, y + 1, size - 2, 2);
    ctx.fillRect(x + 1, y + 1, 2, size - 2);

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(x + 1, y + size - 3, size - 2, 2);
    ctx.fillRect(x + size - 3, y + 1, 2, size - 2);
  };

  return (
    <div className="flex flex-col items-center select-none">
      {/* Top HUD */}
      <div className="w-full max-w-[440px] flex items-center justify-between px-3 py-2 bg-slate-900 border-x border-t border-slate-800 rounded-t-lg text-xs font-mono">
        <div className="flex items-center gap-3">
          <span className="text-cyan-400 font-bold">QUADRIS</span>
          <span className="text-slate-400">Level: <strong className="text-white">{level}</strong></span>
          <span className="text-slate-400">Lines: <strong className="text-white">{lines}</strong></span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-slate-300">
            <span>Score:</span>
            <span className="text-amber-400 font-bold tabular-nums">{score}</span>
          </div>
          <div className="flex items-center gap-1 text-slate-400">
            <Trophy size={13} className="text-amber-400" />
            <span className="text-slate-200 tabular-nums">{Math.max(score, highScore)}</span>
          </div>
        </div>
      </div>

      {/* Main Playing Area with Side Panels */}
      <div className="w-full max-w-[440px] flex bg-slate-950 border border-slate-800 shadow-2xl overflow-hidden crt-effect">
        {/* Left Side: HOLD Piece */}
        <div className="w-24 p-3 bg-slate-900/60 border-r border-slate-800/80 flex flex-col items-center gap-4 text-xs font-mono">
          <div className="text-slate-400 font-medium">HOLD (C)</div>
          <canvas
            ref={holdCanvasRef}
            width={72}
            height={72}
            className="rounded border border-slate-800 bg-slate-950"
          />
          <div className="text-[10px] text-slate-400 text-center leading-tight">
            Swap current piece into hold slot
          </div>
        </div>

        {/* Center: Main 10x20 Matrix */}
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={COLS * BLOCK_SIZE}
            height={ROWS * BLOCK_SIZE}
            className="block pixelated"
          />

          {/* Ready Overlay */}
          {gameState === 'READY' && (
            <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center z-30">
              <div className="w-12 h-12 rounded-lg bg-cyan-500/20 border border-cyan-400 flex items-center justify-center mb-2 text-cyan-400 font-arcade text-lg">
                ■
              </div>
              <h3 className="font-arcade text-base text-white mb-2">QUADRIS</h3>
              <p className="text-xs text-slate-300 max-w-[180px] mb-4 font-body">
                Classic 7-bag falling block puzzle. Clear lines to score points!
              </p>
              <button
                onClick={resetGame}
                className="font-arcade text-[11px] px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded transition-colors active:scale-95"
              >
                START GAME
              </button>
            </div>
          )}

          {/* Game Over */}
          {gameState === 'GAME_OVER' && (
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center z-30">
              <h3 className="font-arcade text-sm text-rose-500 mb-2">GAME OVER</h3>
              <div className="text-xs font-mono text-slate-300 mb-4 bg-slate-900 px-3 py-1.5 rounded border border-slate-800">
                Score: <span className="text-amber-400 font-bold">{score}</span>
              </div>
              <button
                onClick={resetGame}
                className="flex items-center gap-1.5 font-arcade text-[10px] px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded transition-colors active:scale-95"
              >
                <RotateCcw size={13} />
                <span>TRY AGAIN</span>
              </button>
            </div>
          )}

          {/* Paused */}
          {gameState === 'PAUSED' && (
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center z-30">
              <h3 className="font-arcade text-sm text-white mb-3">PAUSED</h3>
              <button
                onClick={() => setGameState('PLAYING')}
                className="font-arcade text-[10px] px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded transition-colors"
              >
                RESUME
              </button>
            </div>
          )}
        </div>

        {/* Right Side: NEXT Piece & Stats */}
        <div className="w-24 p-3 bg-slate-900/60 border-l border-slate-800/80 flex flex-col items-center gap-4 text-xs font-mono">
          <div className="text-slate-400 font-medium">NEXT</div>
          <canvas
            ref={nextCanvasRef}
            width={72}
            height={72}
            className="rounded border border-slate-800 bg-slate-950"
          />

          <div className="w-full pt-3 border-t border-slate-800 flex flex-col gap-2 text-[11px]">
            <div>
              <span className="text-slate-400 block text-[10px]">DROP SPEED</span>
              <span className="text-cyan-400 font-bold">{Math.max(100, 800 - (level - 1) * 65)}ms</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">TETRIS BONUS</span>
              <span className="text-amber-400 font-bold">800 × Lv</span>
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="w-full max-w-[440px] flex items-center justify-between p-3 bg-slate-900 border-x border-b border-slate-800 rounded-b-lg">
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
          <button
            onClick={handleHold}
            className="px-2 py-1 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded text-xs font-mono"
          >
            Hold (C)
          </button>
        </div>

        {/* Mobile touch buttons */}
        <div className="flex items-center gap-1.5 md:hidden">
          <button
            onClick={() => {
              if (gameState === 'PLAYING' && !checkCollision(pieceRef.current, -1, 0)) {
                pieceRef.current.x -= 1;
                sound.playClick();
              }
            }}
            className="w-9 h-9 bg-slate-800 active:bg-slate-700 text-white rounded flex items-center justify-center text-xs"
          >
            ◀
          </button>
          <button
            onClick={rotatePiece}
            className="w-9 h-9 bg-cyan-600 active:bg-cyan-500 text-white font-bold rounded flex items-center justify-center text-xs"
          >
            ↻
          </button>
          <button
            onClick={() => {
              if (gameState === 'PLAYING' && !checkCollision(pieceRef.current, 1, 0)) {
                pieceRef.current.x += 1;
                sound.playClick();
              }
            }}
            className="w-9 h-9 bg-slate-800 active:bg-slate-700 text-white rounded flex items-center justify-center text-xs"
          >
            ▶
          </button>
          <button
            onClick={hardDrop}
            className="w-9 h-9 bg-amber-600 active:bg-amber-500 text-white font-bold rounded flex items-center justify-center text-xs"
          >
            <ArrowDown size={14} />
          </button>
        </div>

        <div className="hidden md:flex items-center gap-2 text-xs text-slate-400 font-mono">
          <span>Move: <strong className="text-slate-200">Arrows</strong></span>
          <span>·</span>
          <span>Rotate: <strong className="text-slate-200">Up</strong></span>
          <span>·</span>
          <span>Drop: <strong className="text-slate-200">Space</strong></span>
        </div>
      </div>
    </div>
  );
};
