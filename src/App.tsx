import { useState, useEffect } from 'react';
import { GameId } from './types/game';
import { GAMES_METADATA } from './data/gameIdeas';
import { sound } from './services/sound';
import { BounceBallGame } from './components/games/BounceBallGame';
import { SnakeGame } from './components/games/SnakeGame';
import { TetrisGame } from './components/games/TetrisGame';
import { MarioGame } from './components/games/MarioGame';
import { BreakoutGame } from './components/games/BreakoutGame';
import { SpaceDefenderGame } from './components/games/SpaceDefenderGame';
import { FlappyBirdGame, FLAPPY_AI_STUDIO_PROMPT } from './components/games/FlappyBirdGame';
import { IdeaLab } from './components/IdeaLab';
import {
  Volume2,
  VolumeX,
  Tv,
  Gamepad2,
  Lightbulb,
  Trophy,
  Maximize2,
  Sparkles,
  Copy,
  Check
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'arcade' | 'ideas'>('arcade');
  const [selectedGame, setSelectedGame] = useState<GameId>('flappy');
  const [isMuted, setIsMuted] = useState(sound.isMuted());
  const [crtEnabled, setCrtEnabled] = useState(true);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  // Local storage high scores per game
  const [highScores, setHighScores] = useState<Record<GameId, number>>(() => {
    const saved = localStorage.getItem('retro_arcade_high_scores');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // Fallback default
      }
    }
    return {
      bounce: 1200,
      snake: 160,
      tetris: 2400,
      mario: 1850,
      breakout: 1450,
      space: 1980,
      flappy: 18
    };
  });

  const handleScoreUpdate = (gameId: GameId, currentScore: number) => {
    setHighScores(prev => {
      const prevBest = prev[gameId] || 0;
      if (currentScore > prevBest) {
        const next = { ...prev, [gameId]: currentScore };
        localStorage.setItem('retro_arcade_high_scores', JSON.stringify(next));
        return next;
      }
      return prev;
    });
  };

  const toggleSound = () => {
    const newMuted = sound.toggleMute();
    setIsMuted(newMuted);
    if (!newMuted) {
      sound.playClick();
    }
  };

  const selectGame = (id: GameId) => {
    setSelectedGame(id);
    setActiveTab('arcade');
    sound.playClick();
  };

  const currentGameMeta = GAMES_METADATA[selectedGame];

  return (
    <div className={`min-h-screen bg-slate-950 text-slate-100 flex flex-col font-body ${crtEnabled ? 'crt-effect' : ''}`}>
      {/* Top Bar (Complies with 3-Zone Contract) */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md sticky top-0 z-40">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#"
          onClick={e => {
            e.preventDefault();
            setActiveTab('arcade');
          }}
          className="text-lg font-bold tracking-tight text-white font-arcade hover:text-amber-400 transition-colors"
        >
          RetroArcade
        </a>

        {/* Zone 2: 4 Clean Text Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
          <button
            onClick={() => setActiveTab('arcade')}
            className={`transition-colors hover:text-white cursor-pointer ${
              activeTab === 'arcade' ? 'text-amber-400 font-bold' : ''
            }`}
          >
            Play Arcade
          </button>
          <button
            onClick={() => setActiveTab('ideas')}
            className={`transition-colors hover:text-white cursor-pointer ${
              activeTab === 'ideas' ? 'text-amber-400 font-bold' : ''
            }`}
          >
            Game Design Lab
          </button>
          <button
            onClick={() => {
              setActiveTab('ideas');
              setTimeout(() => {
                const el = document.getElementById('physics-sandbox');
                el?.scrollIntoView({ behavior: 'smooth' });
              }, 100);
            }}
            className="transition-colors hover:text-white cursor-pointer"
          >
            Physics Sandbox
          </button>
          <a
            href="https://aistudio.google.com"
            target="_blank"
            rel="noreferrer"
            className="transition-colors hover:text-white"
          >
            Google AI Studio
          </a>
        </nav>

        {/* Zone 3: 1-2 Primary Action Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSound}
            className={`p-2 rounded-lg border transition-colors cursor-pointer ${
              isMuted
                ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                : 'bg-amber-400/10 border-amber-400/40 text-amber-400'
            }`}
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
          <button
            onClick={() => setCrtEnabled(c => !c)}
            className={`p-2 rounded-lg border transition-colors cursor-pointer ${
              crtEnabled
                ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-400'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
            }`}
            title={crtEnabled ? 'Disable CRT Scanlines' : 'Enable CRT Scanlines'}
          >
            <Tv size={16} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 md:py-8 flex flex-col gap-6">
        {/* Navigation Mode Segmented Bar */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg">
            <button
              onClick={() => {
                setActiveTab('arcade');
                sound.playClick();
              }}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'arcade'
                  ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Gamepad2 size={14} />
              <span>PLAYABLE ARCADE</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('ideas');
                sound.playClick();
              }}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'ideas'
                  ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Lightbulb size={14} />
              <span>GAME DESIGN CODEX &amp; IDEAS</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-slate-400">
            <span>Sound: <strong className={isMuted ? 'text-slate-400' : 'text-emerald-400'}>{isMuted ? 'Muted' : '8-Bit Synth'}</strong></span>
            <span aria-hidden="true">·</span>
            <span>Display: <strong className={crtEnabled ? 'text-cyan-400' : 'text-slate-400'}>{crtEnabled ? 'CRT Scanlines' : 'Clean'}</strong></span>
          </div>
        </div>

        {activeTab === 'arcade' ? (
          <div className="flex flex-col gap-6">
            {/* Game Selector Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
              {(['flappy', 'bounce', 'snake', 'tetris', 'mario', 'breakout', 'space'] as GameId[]).map(id => {
                const meta = GAMES_METADATA[id];
                const isSelected = selectedGame === id;

                return (
                  <button
                    key={id}
                    onClick={() => selectGame(id)}
                    className={`flex flex-col text-left p-2.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 border-amber-400 shadow-lg scale-[1.02]'
                        : 'bg-slate-950 border-slate-800/80 hover:bg-slate-900 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className="text-[10px] font-mono text-slate-400 truncate">{meta.era}</span>
                      {isSelected && (
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                      )}
                    </div>
                    <span className="text-xs font-bold text-white font-body truncate">{meta.title}</span>
                    <div className="flex items-center gap-1 text-[11px] font-mono text-amber-400 mt-1.5">
                      <Trophy size={11} />
                      <span className="tabular-nums font-bold">{highScores[id] || 0}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Current Game Banner & Prompt Export Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-4 py-3 bg-slate-900/60 border border-slate-800 rounded-xl">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono text-slate-400 mb-0.5">
                  <span className="text-amber-400 font-bold">{currentGameMeta.subtitle}</span>
                  <span aria-hidden="true">·</span>
                  <span>{currentGameMeta.era}</span>
                </div>
                <p className="text-xs md:text-sm text-slate-300 font-body">
                  {currentGameMeta.tagline}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="text-xs font-mono text-slate-400 bg-slate-950/80 px-3 py-1.5 rounded border border-slate-800 shrink-0">
                  {currentGameMeta.controls}
                </div>
                {selectedGame === 'flappy' && (
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(FLAPPY_AI_STUDIO_PROMPT);
                      setCopiedPrompt(true);
                      sound.playCoin();
                      setTimeout(() => setCopiedPrompt(false), 2400);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded text-xs font-mono transition-all active:scale-95 shrink-0 shadow-sm cursor-pointer"
                  >
                    {copiedPrompt ? <Check size={13} /> : <Sparkles size={13} />}
                    <span>{copiedPrompt ? 'Copied Prompt!' : 'Copy AI Studio Prompt'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Playable Canvas Container */}
            <div className="flex justify-center w-full">
              {selectedGame === 'flappy' && (
                <FlappyBirdGame
                  onScoreUpdate={score => handleScoreUpdate('flappy', score)}
                  highScore={highScores.flappy}
                />
              )}

              {selectedGame === 'bounce' && (
                <BounceBallGame
                  onScoreUpdate={score => handleScoreUpdate('bounce', score)}
                  highScore={highScores.bounce}
                />
              )}

              {selectedGame === 'snake' && (
                <SnakeGame
                  onScoreUpdate={score => handleScoreUpdate('snake', score)}
                  highScore={highScores.snake}
                />
              )}

              {selectedGame === 'tetris' && (
                <TetrisGame
                  onScoreUpdate={score => handleScoreUpdate('tetris', score)}
                  highScore={highScores.tetris}
                />
              )}

              {selectedGame === 'mario' && (
                <MarioGame
                  onScoreUpdate={score => handleScoreUpdate('mario', score)}
                  highScore={highScores.mario}
                />
              )}

              {selectedGame === 'breakout' && (
                <BreakoutGame
                  onScoreUpdate={score => handleScoreUpdate('breakout', score)}
                  highScore={highScores.breakout}
                />
              )}

              {selectedGame === 'space' && (
                <SpaceDefenderGame
                  onScoreUpdate={score => handleScoreUpdate('space', score)}
                  highScore={highScores.space}
                />
              )}
            </div>
          </div>
        ) : (
          <IdeaLab onSelectPlayableGame={selectGame} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 mt-auto py-6 px-6 text-xs text-slate-400 font-mono">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-slate-300 font-bold">RetroArcade</span>
            <span>—</span>
            <span>Timeless browser games built with pure Canvas 2D &amp; Web Audio</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span>6 Playable Classics</span>
            <span>·</span>
            <span>14 Documented Game Loops</span>
            <span>·</span>
            <button
              onClick={() => {
                if (!document.fullscreenElement) {
                  document.documentElement.requestFullscreen().catch(() => {});
                } else {
                  document.exitFullscreen().catch(() => {});
                }
              }}
              className="flex items-center gap-1 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <Maximize2 size={12} />
              <span>Fullscreen</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
