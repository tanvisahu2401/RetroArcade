/**
 * Types and definitions for RetroArcade games and Idea Codex
 */

export type GameId = 'bounce' | 'snake' | 'tetris' | 'mario' | 'breakout' | 'space' | 'flappy';

export interface GameMetadata {
  id: GameId;
  title: string;
  subtitle: string;
  era: string;
  originalPlatform: string;
  accentColor: string;
  iconName: string;
  description: string;
  controlsSummary: string;
  tips: string[];
}

export interface HighScoreRecord {
  gameId: GameId;
  score: number;
  date: string;
  level?: number;
}

export interface GameIdea {
  id: string;
  title: string;
  originYear: number;
  originHardware: string;
  genre: string;
  mechanicSummary: string;
  whyItWorksInBrowser: string;
  coreGameLoop: string[];
  physicsModel: string;
  recommendedPalette: string[];
  difficultyRamp: string;
  codeInsight: string;
  tags: string[];
}
