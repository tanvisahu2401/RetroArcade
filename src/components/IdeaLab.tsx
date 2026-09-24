import React, { useState, useEffect, useRef } from 'react';
import { GAME_IDEAS } from '../data/gameIdeas';
import { GameIdea } from '../types/game';
import { sound } from '../services/sound';
import {
  Sparkles,
  Sliders,
  Copy,
  Check,
  Gamepad2,
  Cpu,
  Layers,
  Flame,
  Search
} from 'lucide-react';

interface IdeaLabProps {
  onSelectPlayableGame?: (gameId: 'bounce' | 'snake' | 'tetris' | 'mario' | 'breakout' | 'space' | 'flappy') => void;
}

export const IdeaLab: React.FC<IdeaLabProps> = ({ onSelectPlayableGame }) => {
  const [selectedTag, setSelectedTag] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeIdea, setActiveIdea] = useState<GameIdea>(GAME_IDEAS[0]);

  // Physics Sandbox State
  const [gravityVal, setGravityVal] = useState<number>(0.45);
  const [bounceVal, setBounceVal] = useState<number>(0.75);
  const [frictionVal, setFrictionVal] = useState<number>(0.92);
  const [jumpForceVal, setJumpForceVal] = useState<number>(9.5);
  const sandboxCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Sandbox ball physics
  const sbBallRef = useRef({
    x: 180,
    y: 100,
    vx: 3,
    vy: 0,
    radius: 12,
    isDragging: false
  });

  // Prompt Generator State
  const [genGenre, setGenGenre] = useState('Physics Platformer');
  const [genVerb, setGenVerb] = useState('Bounce & Hoop Gates');
  const [genTwist, setGenTwist] = useState('Gravity reverses on every 5th bounce');
  const [genTheme, setGenTheme] = useState('Nokia 3310 LCD Monochrome');
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  // Tags filter
  const allTags = ['All', 'Physics', 'Platformer', 'Grid', 'Puzzle', 'Shooter', 'Arcade', 'Nokia', 'Reflex'];

  const filteredIdeas = GAME_IDEAS.filter(idea => {
    const matchesTag = selectedTag === 'All' || idea.tags.includes(selectedTag);
    const matchesSearch =
      idea.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      idea.genre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      idea.mechanicSummary.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTag && matchesSearch;
  });

  // Sandbox Animation Loop
  useEffect(() => {
    const canvas = sandboxCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const loop = () => {
      const b = sbBallRef.current;

      if (!b.isDragging) {
        b.vy += gravityVal;
        b.vx *= frictionVal;
        b.x += b.vx;
        b.y += b.vy;

        // Floor bounce
        if (b.y + b.radius >= canvas.height - 10) {
          b.y = canvas.height - 10 - b.radius;
          b.vy = -b.vy * bounceVal;
          if (Math.abs(b.vy) < 0.8) b.vy = 0;
          if (Math.abs(b.vy) > 1.5) sound.playBounce();
        }

        // Walls
        if (b.x - b.radius <= 10) {
          b.x = 10 + b.radius;
          b.vx = -b.vx * bounceVal;
          if (Math.abs(b.vx) > 1.5) sound.playBounce();
        }
        if (b.x + b.radius >= canvas.width - 10) {
          b.x = canvas.width - 10 - b.radius;
          b.vx = -b.vx * bounceVal;
          if (Math.abs(b.vx) > 1.5) sound.playBounce();
        }
      }

      // Draw sandbox
      ctx.fillStyle = '#0B0F19';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Floor & Wall boundaries
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

      // Obstacle pin
      ctx.fillStyle = '#F59E0B';
      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height / 2 + 20, 16, 0, Math.PI * 2);
      ctx.fill();

      // Pin bounce collision
      const pinX = canvas.width / 2;
      const pinY = canvas.height / 2 + 20;
      const dist = Math.hypot(b.x - pinX, b.y - pinY);
      if (dist < b.radius + 16 && !b.isDragging) {
        const nx = (b.x - pinX) / dist;
        const ny = (b.y - pinY) / dist;
        b.x = pinX + nx * (b.radius + 16);
        b.y = pinY + ny * (b.radius + 16);
        const dot = b.vx * nx + b.vy * ny;
        b.vx = (b.vx - 2 * dot * nx) * bounceVal;
        b.vy = (b.vy - 2 * dot * ny) * bounceVal;
        sound.playBounce();
      }

      // Draw Ball
      ctx.fillStyle = '#EF4444';
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.beginPath();
      ctx.arc(b.x - 3, b.y - 3, 3, 0, Math.PI * 2);
      ctx.fill();

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [gravityVal, bounceVal, frictionVal]);

  const handleSandboxMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = sandboxCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
    const my = (e.clientY - rect.top) * (canvas.height / rect.height);

    const b = sbBallRef.current;
    if (Math.hypot(mx - b.x, my - b.y) <= b.radius * 2) {
      b.isDragging = true;
    } else {
      // Launch ball towards click
      b.vx = (mx - b.x) * 0.12;
      b.vy = (my - b.y) * 0.12;
      sound.playJump();
    }
  };

  const handleSandboxMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!sbBallRef.current.isDragging) return;
    const canvas = sandboxCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    sbBallRef.current.x = (e.clientX - rect.left) * (canvas.width / rect.width);
    sbBallRef.current.y = (e.clientY - rect.top) * (canvas.height / rect.height);
    sbBallRef.current.vx = 0;
    sbBallRef.current.vy = 0;
  };

  const handleSandboxMouseUp = () => {
    if (sbBallRef.current.isDragging) {
      sbBallRef.current.isDragging = false;
      sbBallRef.current.vy = -3;
    }
  };

  const handleSandboxJump = () => {
    sbBallRef.current.vy = -jumpForceVal;
    sbBallRef.current.vx = (Math.random() - 0.5) * 6;
    sound.playJump();
  };

  // Generated AI Studio Prompt string
  const generatedPrompt = `Build a complete, polished mini classical browser game in HTML5 Canvas and React with high-fidelity juice:
- Genre: ${genGenre}
- Core Verb: ${genVerb}
- Distinctive Twist Mechanic: ${genTwist}
- Aesthetic Theme: ${genTheme}
- Requirements:
  1. Pure client-side Canvas 2D running at locked 60 FPS without external physics engine lag.
  2. Synthesized 8-bit sound effects using browser Web Audio API (jumps, hits, score chimes).
  3. Responsive controls: Arrow keys, WASD, Space, plus on-screen touch virtual buttons for mobile.
  4. State machine: TITLE_MENU -> PLAYING -> PAUSED -> GAME_OVER / VICTORY with instant restart.
  5. High-score tracking with localStorage persistence.`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedPrompt);
    setCopiedPrompt(true);
    sound.playCoin();
    setTimeout(() => setCopiedPrompt(false), 2200);
  };

  const isDirectlyPlayable = (id: string): 'bounce' | 'snake' | 'tetris' | 'mario' | 'breakout' | 'space' | 'flappy' | null => {
    if (id === 'bounce-ball') return 'bounce';
    if (id === 'snake') return 'snake';
    if (id === 'tetris') return 'tetris';
    if (id === 'mini-mario') return 'mario';
    if (id === 'breakout') return 'breakout';
    if (id === 'space-invaders') return 'space';
    if (id === 'flappy-bird') return 'flappy';
    return null;
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-10 py-4">
      {/* Hero Intro */}
      <div className="border border-slate-800 bg-slate-900/60 rounded-xl p-6 md:p-8 backdrop-blur-xs shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-2 text-xs font-mono text-amber-400">
              <Cpu size={14} />
              <span>RETRO GAME ARCHITECTURE &amp; DESIGN CODEX</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white font-body">
              Mini Classical Games: The Anatomy of Timeless Browser Play
            </h2>
            <p className="text-slate-300 text-sm md:text-base leading-relaxed font-body">
              Classical games like <strong className="text-rose-400">Bounce Ball</strong>, <strong className="text-lime-400">Snake</strong>, <strong className="text-cyan-400">Tetris</strong>, and <strong className="text-amber-400">Mini Mario</strong> captivate millions because their core mechanics rely on pure spatial mathematics and immediate tactile feedback. Explore deep breakdowns below, test real-time physics in the live sandbox, or generate your next AI Studio game blueprint!
            </p>
          </div>

          <div className="flex flex-wrap md:flex-col gap-2 shrink-0">
            <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-lg text-xs font-mono">
              <span className="text-slate-400 block text-[10px]">DOCUMENTED CLASSICS</span>
              <span className="text-amber-400 text-lg font-bold tabular-nums">14 Games</span>
            </div>
            <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-lg text-xs font-mono">
              <span className="text-slate-400 block text-[10px]">PLAYABLE ENGINES</span>
              <span className="text-emerald-400 text-lg font-bold tabular-nums">6 Playable Now</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Physics Sandbox */}
      <div className="border border-slate-800 bg-slate-900/50 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sliders size={18} className="text-amber-400" />
            <h3 className="text-base font-bold text-white font-body">Interactive Physics &amp; Game Feel Sandbox</h3>
          </div>
          <span className="text-xs font-mono text-slate-400">Click canvas to launch or press jump</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Sandbox Canvas */}
          <div className="lg:col-span-7 flex flex-col items-center">
            <div className="relative w-full aspect-[480/280] bg-slate-950 rounded-lg border border-slate-800 overflow-hidden shadow-inner">
              <canvas
                ref={sandboxCanvasRef}
                width={480}
                height={280}
                onMouseDown={handleSandboxMouseDown}
                onMouseMove={handleSandboxMouseMove}
                onMouseUp={handleSandboxMouseUp}
                className="w-full h-full block cursor-pointer"
              />
              <div className="absolute top-2 left-3 text-[10px] font-mono text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800">
                Drag ball or click anywhere to propel
              </div>
            </div>

            <div className="flex items-center gap-3 mt-3 w-full justify-between">
              <button
                onClick={handleSandboxJump}
                className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded text-xs font-arcade transition-colors active:scale-95 shadow"
              >
                <Flame size={14} />
                <span>BOUNCE JUMP!</span>
              </button>
              <span className="text-xs text-slate-400 font-mono">
                Observe how restitution and gravity alter player sensation
              </span>
            </div>
          </div>

          {/* Physics Sliders */}
          <div className="lg:col-span-5 space-y-4 bg-slate-950/70 p-4 rounded-lg border border-slate-800/80 text-xs font-mono">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-300">Gravity:</span>
                <span className="text-amber-400 font-bold">{gravityVal.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.2"
                step="0.05"
                value={gravityVal}
                onChange={e => setGravityVal(parseFloat(e.target.value))}
                className="w-full accent-amber-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Moon Floaty</span>
                <span>Earth</span>
                <span>Heavy Retro</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-300">Elasticity / Bounce (Restitution):</span>
                <span className="text-emerald-400 font-bold">{bounceVal.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="0.95"
                step="0.05"
                value={bounceVal}
                onChange={e => setBounceVal(parseFloat(e.target.value))}
                className="w-full accent-emerald-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Clay / Putty</span>
                <span>Rubber Ball</span>
                <span>Superball</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-300">Air / Surface Friction:</span>
                <span className="text-cyan-400 font-bold">{frictionVal.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.80"
                max="0.99"
                step="0.01"
                value={frictionVal}
                onChange={e => setFrictionVal(parseFloat(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Sluggish Mud</span>
                <span>Standard</span>
                <span>Ice Skating</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-300">Jump Impulse Force:</span>
                <span className="text-rose-400 font-bold">{jumpForceVal.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="5"
                max="16"
                step="0.5"
                value={jumpForceVal}
                onChange={e => setJumpForceVal(parseFloat(e.target.value))}
                className="w-full accent-rose-400 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Game Ideas Explorer */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-white font-body">14 Iconic Classical Game Archetypes</h3>
            <p className="text-slate-400 text-xs font-mono">
              Complete mechanics, physics models, browser optimization secrets, and difficulty ramps
            </p>
          </div>

          {/* Search bar */}
          <div className="relative w-full md:w-64">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search classical ideas..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-hidden focus:border-amber-400 font-body"
            />
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-colors ${
                selectedTag === tag
                  ? 'bg-amber-400 text-slate-950 font-bold shadow'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Ideas Grid & Active Detail Split View */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* List of Game Cards */}
          <div className="lg:col-span-5 space-y-3 max-h-[640px] overflow-y-auto pr-1">
            {filteredIdeas.map(idea => {
              const playableId = isDirectlyPlayable(idea.id);
              const isActive = activeIdea.id === idea.id;

              return (
                <div
                  key={idea.id}
                  onClick={() => {
                    setActiveIdea(idea);
                    sound.playClick();
                  }}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isActive
                      ? 'bg-slate-800/80 border-amber-400 shadow-md'
                      : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/40 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="text-sm font-bold text-white font-body">{idea.title}</h4>
                    <span className="text-[10px] font-mono text-slate-400 whitespace-nowrap">
                      {idea.originYear}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 line-clamp-2 mb-3 font-body">
                    {idea.mechanicSummary}
                  </p>

                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-400">{idea.genre}</span>
                    {playableId && (
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <Gamepad2 size={12} />
                        Playable
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Active Idea Deep Dive Inspector */}
          <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-xl p-6 space-y-6">
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono text-amber-400 mb-1">
                  <span>{activeIdea.genre}</span>
                  <span>·</span>
                  <span>{activeIdea.originHardware}</span>
                </div>
                <h3 className="text-xl font-bold text-white font-body">{activeIdea.title}</h3>
              </div>

              {isDirectlyPlayable(activeIdea.id) && (
                <button
                  onClick={() => {
                    const pid = isDirectlyPlayable(activeIdea.id);
                    if (pid && onSelectPlayableGame) {
                      onSelectPlayableGame(pid);
                      sound.playClear();
                    }
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-arcade transition-colors active:scale-95 whitespace-nowrap shadow"
                >
                  <Gamepad2 size={14} />
                  <span>PLAY NOW</span>
                </button>
              )}
            </div>

            {/* Core Game Loop */}
            <div className="space-y-2">
              <h5 className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
                <Layers size={13} className="text-cyan-400" />
                <span>CORE GAMEPLAY LOOP</span>
              </h5>
              <div className="grid grid-cols-1 gap-2">
                {activeIdea.coreGameLoop.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-200 bg-slate-950/60 p-2.5 rounded border border-slate-800/80 font-body">
                    <span className="w-5 h-5 rounded bg-slate-800 text-amber-400 font-mono font-bold flex items-center justify-center shrink-0 text-[10px]">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed">{step}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Physics Model & Browser Optimization */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div className="bg-slate-950/70 p-3.5 rounded-lg border border-slate-800">
                <span className="text-rose-400 block font-bold mb-1 text-[11px]">PHYSICS MODEL</span>
                <p className="text-slate-300 font-code text-[11px] leading-relaxed">
                  {activeIdea.physicsModel}
                </p>
              </div>

              <div className="bg-slate-950/70 p-3.5 rounded-lg border border-slate-800">
                <span className="text-emerald-400 block font-bold mb-1 text-[11px]">WHY IT SHINES IN BROWSER</span>
                <p className="text-slate-300 font-body text-[11px] leading-relaxed">
                  {activeIdea.whyItWorksInBrowser}
                </p>
              </div>
            </div>

            {/* Difficulty Curve & Code Insight */}
            <div className="space-y-3 bg-slate-950/80 p-4 rounded-lg border border-slate-800 text-xs">
              <div>
                <span className="text-amber-400 font-mono font-bold block mb-1 text-[11px]">DIFFICULTY RAMP DESIGN</span>
                <p className="text-slate-300 font-body leading-relaxed">{activeIdea.difficultyRamp}</p>
              </div>
              <div className="pt-2 border-t border-slate-800/80">
                <span className="text-cyan-400 font-mono font-bold block mb-1 text-[11px]">ENGINEERING ARCHITECTURE SECRET</span>
                <p className="text-slate-300 font-code text-[11px] leading-relaxed">{activeIdea.codeInsight}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Studio Game Blueprint Prompt Generator */}
      <div className="border border-slate-800 bg-slate-900/60 rounded-xl p-6 md:p-8 space-y-6">
        <div className="flex items-center gap-2">
          <Sparkles size={20} className="text-amber-400" />
          <div>
            <h3 className="text-lg font-bold text-white font-body">Google AI Studio Game Blueprint Generator</h3>
            <p className="text-xs font-mono text-slate-400">
              Combine classic verbs, physics loops, and unique twists to build your custom game
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-mono">
          <div>
            <label className="text-slate-400 block mb-1.5 font-bold">1. GENRE</label>
            <select
              value={genGenre}
              onChange={e => setGenGenre(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-body focus:border-amber-400 focus:outline-hidden"
            >
              <option value="Physics Platformer">Physics Platformer</option>
              <option value="Grid Spatial Puzzle">Grid Spatial Puzzle</option>
              <option value="Reflex Shooter">Reflex Fixed Shooter</option>
              <option value="Falling Blocks Puzzle">Falling Blocks Puzzle</option>
              <option value="Multi-Lane Hop Crossing">Multi-Lane Hop Crossing</option>
              <option value="Inertia Vector Space Thruster">Inertia Vector Thruster</option>
            </select>
          </div>

          <div>
            <label className="text-slate-400 block mb-1.5 font-bold">2. PRIMARY VERB</label>
            <select
              value={genVerb}
              onChange={e => setGenVerb(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-body focus:border-amber-400 focus:outline-hidden"
            >
              <option value="Bounce & Hoop Gates (Bounce Ball)">Bounce &amp; Hoop Gates (Bounce)</option>
              <option value="Eat & Elongate (Snake)">Eat &amp; Elongate (Snake)</option>
              <option value="Rotate & Clear Rows (Tetris)">Rotate &amp; Clear Rows (Tetris)</option>
              <option value="Run, Jump & Stomp (Mini Mario)">Run, Jump &amp; Stomp (Mario)</option>
              <option value="Deflect Angle Ricochet (Breakout)">Deflect Angle Ricochet (Breakout)</option>
              <option value="Thrust & Drift Newton Inertia">Thrust &amp; Drift (Asteroids)</option>
            </select>
          </div>

          <div>
            <label className="text-slate-400 block mb-1.5 font-bold">3. TWIST MECHANIC</label>
            <select
              value={genTwist}
              onChange={e => setGenTwist(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-body focus:border-amber-400 focus:outline-hidden"
            >
              <option value="Gravity reverses on every 5th bounce">Gravity reverses on every 5th bounce</option>
              <option value="Time only moves when the player moves">Time moves only when player moves</option>
              <option value="Arena walls slowly shrink inward">Arena walls slowly shrink inward</option>
              <option value="Ball changes color to match target blocks">Ball color matches target blocks</option>
              <option value="Ghost trails clone player actions from 3s ago">Ghost trails clone actions from 3s ago</option>
            </select>
          </div>

          <div>
            <label className="text-slate-400 block mb-1.5 font-bold">4. RETRO THEME</label>
            <select
              value={genTheme}
              onChange={e => setGenTheme(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-body focus:border-amber-400 focus:outline-hidden"
            >
              <option value="Nokia 3310 LCD Monochrome">Nokia 3310 LCD Monochrome</option>
              <option value="Neon 80s Cyber Arcade">Neon 80s Cyber Arcade</option>
              <option value="NES 8-Bit Vibrant Pixel Art">NES 8-Bit Vibrant Pixel</option>
              <option value="Game Boy 4-Shade Green Pocket">Game Boy 4-Shade Green</option>
            </select>
          </div>
        </div>

        {/* Prompt Output Box */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-amber-400">READY-TO-USE AI STUDIO BUILD PROMPT</span>
            <button
              onClick={copyToClipboard}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-mono transition-colors"
            >
              {copiedPrompt ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              <span>{copiedPrompt ? 'Copied to Clipboard!' : 'Copy Prompt'}</span>
            </button>
          </div>
          <pre className="text-xs font-code text-slate-300 whitespace-pre-wrap leading-relaxed bg-slate-900/60 p-3 rounded border border-slate-800/80">
            {generatedPrompt}
          </pre>
        </div>
      </div>
    </div>
  );
};
