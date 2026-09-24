import { GameIdea } from '../types/game';

export const GAME_IDEAS: GameIdea[] = [
  {
    id: 'bounce-ball',
    title: 'Bounce Ball (Nokia Classic)',
    originYear: 2001,
    originHardware: 'Nokia 9210 Communicator / Nokia 3310',
    genre: 'Physics Platformer / Puzzle',
    mechanicSummary: 'A red rubber ball navigating labyrinthine obstacle courses with rolling momentum, hoop gates, trampolines, and size-shifting air pumps.',
    whyItWorksInBrowser: 'Canvas 2D circle-rect physics can run at a locked 60 FPS without external physics engines. Tilemap collisions and ring sensors are lightweight and deterministic.',
    coreGameLoop: [
      'Roll and bounce across platforms using horizontal momentum & gravity',
      'Pass through all golden rings in the sector to deactivate the exit barrier',
      'Avoid static floor spikes, floating mines, and deep water traps',
      'Use trampolines to reach elevated ledges and reach the level warp'
    ],
    physicsModel: 'Verlet or semi-implicit Euler integration: Velocity += Gravity * dt; Position += Velocity * dt; Restitution coefficient ~0.78 for rubber bounce.',
    recommendedPalette: ['#DC2626', '#F59E0B', '#1E293B', '#10B981', '#38BDF8'],
    difficultyRamp: 'Level 1 teaches basic jumping and rings; Level 2 adds high trampolines and moving obstacles; Level 3 introduces narrow spike corridors and precision timing.',
    codeInsight: 'Separate collision detection into X and Y passes to cleanly resolve corner catches and ceiling bumps without glitching into tiles.',
    tags: ['Physics', 'Nokia', 'Platformer', 'Rings']
  },
  {
    id: 'snake',
    title: 'Snake (The Nokia Legend)',
    originYear: 1997,
    originHardware: 'Nokia 6110 (Based on 1976 Blockade)',
    genre: 'Grid Reflex / Spatial Constraint',
    mechanicSummary: 'A steadily elongating serpent moves on a discrete grid, eating food to grow while avoiding self-intersection and perimeter boundaries.',
    whyItWorksInBrowser: 'Entire state fits in a FIFO queue of coordinate pairs `[x, y]`. Update tick is purely timer-based (70-120ms), consuming negligible CPU while offering infinite replayability.',
    coreGameLoop: [
      'Steer continuous forward movement on a 2D tile grid',
      'Eat food items to increase body length and score',
      'Navigate increasingly cramped space as body occupies larger board percentage',
      'Avoid walls (or warp through in wrap mode) and never collide with tail'
    ],
    physicsModel: 'Discrete Cartesian Grid (Grid-step movement). Input buffering prevents 180° instant suicide reversal.',
    recommendedPalette: ['#84CC16', '#4D7C0F', '#1A2E05', '#FACC15', '#EF4444'],
    difficultyRamp: 'Tick rate accelerates logarithmically as score climbs; bonus gold fruit appears on a ticking countdown timer.',
    codeInsight: 'Always buffer the next keypress in an input queue so rapid 90° turn combos (e.g. Right then Down) execute faithfully without skipping ticks.',
    tags: ['Grid', 'Nokia', 'Minimalist', 'Reflex']
  },
  {
    id: 'tetris',
    title: 'Tetris / Quadris (Falling Blocks)',
    originYear: 1984,
    originHardware: 'Elektronika 60 (Alexey Pajitnov)',
    genre: 'Falling Block Spatial Puzzle',
    mechanicSummary: 'Random sequences of 7 geometric tetrominoes descend into a matrix; player translates and rotates them to create solid horizontal lines.',
    whyItWorksInBrowser: 'Pure 10x20 matrix state representation. Simple bitmask or 2D array matrix operations deliver instant responsiveness.',
    coreGameLoop: [
      'Inspect falling tetromino and projection ghost position on bottom floor',
      'Rotate and translate piece to fit into open slots or hold for later',
      'Hard drop or soft drop to lock piece into place',
      'Complete horizontal rows to trigger line clear clears and cascade blocks downward'
    ],
    physicsModel: 'Discrete step gravity with Lock Delay (500ms grace window before piece permanently locks after touching ground).',
    recommendedPalette: ['#06B6D4', '#3B82F6', '#F97316', '#EAB308', '#22C55E', '#A855F7', '#EF4444'],
    difficultyRamp: 'Gravity speed drops exponentially per level (Level 1: 1s drop interval -> Level 15: 0.05s drop interval).',
    codeInsight: 'Use the official "7-Bag Randomizer" (shuffle an array of all 7 tetrominoes) so players never experience 5 consecutive Z-pieces or game-breaking droughts.',
    tags: ['Puzzle', 'Spatial', 'Classic', 'Matrix']
  },
  {
    id: 'mini-mario',
    title: 'Mini Mario / Jump Knight (2D Platformer)',
    originYear: 1985,
    originHardware: 'Nintendo Entertainment System (NES)',
    genre: 'Side-Scrolling Action Platformer',
    mechanicSummary: 'Run, jump, bash mystery blocks from below for coins, stomp enemies, and leap across precarious gaps to reach the goal flag.',
    whyItWorksInBrowser: 'Camera viewport scrolling with 2D tilemaps is buttery smooth on requestAnimationFrame. Classic platformer game feel depends on snappy jump curves.',
    coreGameLoop: [
      'Accelerate across uneven terrain using smooth horizontal momentum',
      'Perform variable-height jumps (holding space extends vertical leap)',
      'Bump question mark blocks to dislodge coins or power-ups',
      'Stomp patrolling enemies from above to squish them, avoiding frontal contact',
      'Reach the flagpole at the far right of the stage'
    ],
    physicsModel: 'Platformer physics with Coyote Time (5-frame jump grace period after running off an edge) and Jump Buffering.',
    recommendedPalette: ['#EF4444', '#3B82F6', '#22C55E', '#EAB308', '#78350F', '#60A5FA'],
    difficultyRamp: 'Starts with flat ground and single Goombas; introduces moving platforms, narrow pillars, and flying/jumping hazards.',
    codeInsight: 'Implement variable jump height by applying lower gravity when the jump button is held down, switching to heavy gravity the millisecond jump is released.',
    tags: ['Platformer', 'Side-Scroller', 'Nintendo', 'Action']
  },
  {
    id: 'breakout',
    title: 'Breakout / Arkanoid (Brick Breaker)',
    originYear: 1976,
    originHardware: 'Atari Arcade (designed by Steve Wozniak)',
    genre: 'Action Reflex / Bat & Ball',
    mechanicSummary: 'A movable paddle redirects a ricocheting ball into a colorful ceiling of destructible bricks, triggering falling power-ups.',
    whyItWorksInBrowser: 'Circle-AABB collision detection and vector reflection are computationally trivial and visually satisfying.',
    coreGameLoop: [
      'Slide paddle horizontally to intercept bouncing ball',
      'Angle your hits: hitting the paddle edge slices the ball into steep angles',
      'Shatter bricks, collecting power-ups (Multi-ball, Laser blasters, Wide paddle)',
      'Prevent the ball from escaping through the bottom void'
    ],
    physicsModel: '2D elastic reflection: Vy = -Vy; Vx is adjusted by (ball.x - paddle.center) / (paddle.width / 2) to give the player strategic directional control.',
    recommendedPalette: ['#F43F5E', '#FB923C', '#FBBF24', '#34D399', '#60A5FA', '#A78BFA'],
    difficultyRamp: 'Ball velocity climbs with brick count cleared; top-row bricks dramatically accelerate ball speed upon impact.',
    codeInsight: 'Never allow purely vertical ball bounces: clamp the minimum horizontal angle to ±15° so the ball never gets stuck in a monotonous vertical loop.',
    tags: ['Arcade', 'Physics', 'Atari', 'Action']
  },
  {
    id: 'space-invaders',
    title: 'Space Invaders / Galaga (Fixed Shooter)',
    originYear: 1978,
    originHardware: 'Taito Arcade (Tomohiro Nishikado)',
    genre: 'Fixed Screen Shoot \'em Up',
    mechanicSummary: 'Defend earth from a descending grid of rhythmic extraterrestrial invaders using a single cannon behind destructible bunker barricades.',
    whyItWorksInBrowser: 'Sprite arrays with synchronized formation offsets. Alien descent creates instant psychological tension without complex 3D rendering.',
    coreGameLoop: [
      'Slide mobile gun cannon left and right behind 4 defensive bunkers',
      'Fire upward laser projectiles to thin the enemy fleet',
      'Take cover behind bunkers as alien bombs rain down and chip away shield blocks',
      'Shoot the high-speed mystery UFO saucer cruising along the top border',
      'Eliminate every invader before any alien reaches the bottom baseline'
    ],
    physicsModel: 'Marching fleet step-cycle: alien swarm moves in unison; as enemy count decreases, the march tempo accelerates to frantic speeds.',
    recommendedPalette: ['#10B981', '#38BDF8', '#F43F5E', '#FACC15', '#6366F1'],
    difficultyRamp: 'Each cleared wave starts lower and moves faster; enemy bombs become targeted rather than random drops.',
    codeInsight: 'The iconic hardware limitation where the game got faster because fewer sprites were being rendered became a core design feature: tie step interval to `remainingAliens / totalAliens`.',
    tags: ['Shooter', 'Arcade', 'Sci-Fi', 'Classic']
  },
  {
    id: 'pacman',
    title: 'Pac-Man (Maze Chase & Pellet Eater)',
    originYear: 1980,
    originHardware: 'Namco Arcade (Toru Iwatani)',
    genre: 'Maze Navigation / Predator-Prey',
    mechanicSummary: 'Navigate a symmetric neon labyrinth consuming 240 pellets while pursued by 4 distinct AI ghosts with unique personality algorithms.',
    whyItWorksInBrowser: 'Tile-based pathfinding with pre-calculated intersection decision points. Classic ghost personality AI requires zero neural networks, just elegant distance heuristics.',
    coreGameLoop: [
      'Munch pellets through maze corridors while evading 4 pursuing ghosts',
      'Consume glowing Power Pellets to turn the tables and eat flashing blue ghosts',
      'Snag bonus fruit in the center corridor for massive points',
      'Clear all pellets to advance to the next maze layout'
    ],
    physicsModel: 'Grid-snapped corner turning with turn pre-buffering (player inputs the turn before reaching the intersection, executing seamlessly).',
    recommendedPalette: ['#FACC15', '#EF4444', '#EC4899', '#06B6D4', '#F97316', '#1E3A8A'],
    difficultyRamp: 'Power pellet duration decreases from 6 seconds in early stages down to zero seconds in late stages; ghost scatter time shortens.',
    codeInsight: 'Ghost AI personalities: Blinky targets player directly; Pinky targets 4 tiles ahead of player; Inky vector-offsets from Blinky; Clyde wanders if within 8 tiles.',
    tags: ['Maze', 'AI', 'Namco', 'Pellets']
  },
  {
    id: 'frogger',
    title: 'Frogger (Traffic & River Crossing)',
    originYear: 1981,
    originHardware: 'Konami / Sega Arcade',
    genre: 'Multi-Lane Timing & Reflex',
    mechanicSummary: 'Guide a fragile frog across a treacherous multi-lane motorway packed with speeding vehicles, followed by a perilous river of logs and diving turtles.',
    whyItWorksInBrowser: 'Discrete hop movement across horizontal conveyor bands. Simple collision boxes and velocity delta offsets make it lightweight and instantly intuitive.',
    coreGameLoop: [
      'Hop forward, backward, left, and right across 5 lanes of dense highway traffic',
      'Rest safely at the central median divider',
      'Leap between floating logs, alligators, and diving turtles flowing at varying speeds',
      'Land in one of 5 home lily pad bays before the stage timer expires'
    ],
    physicsModel: 'Layered horizontal conveyor velocity: when standing on a river log, the player\'s X coordinate inherits the log\'s horizontal velocity.',
    recommendedPalette: ['#22C55E', '#EF4444', '#3B82F6', '#854D0E', '#F59E0B'],
    difficultyRamp: 'Lane speeds increase; snakes and otters appear on logs; turtles submerge more frequently; bonus flies appear briefly in home slots.',
    codeInsight: 'Snap the player to a strict 16x16 or 32x32 hop grid so players can calculate safe landing windows through spatial rhythm rather than analog drifting.',
    tags: ['Timing', 'Lanes', 'Konami', 'Arcade']
  },
  {
    id: 'asteroids',
    title: 'Asteroids (Vector Inertia Thruster)',
    originYear: 1979,
    originHardware: 'Atari Arcade (Lyle Rains & Ed Logg)',
    genre: 'Vector Physics / Toroidal Space',
    mechanicSummary: 'Pilot a triangular spacecraft in deep space using rotational steering and thrust inertia, blasting drifting asteroids into smaller fragments.',
    whyItWorksInBrowser: 'Pure vector math (cos/sin angle rotation, momentum vector addition) and toroidal screen wrapping (`x = (x + width) % width`).',
    coreGameLoop: [
      'Rotate ship heading and apply Newtonian thrust bursts',
      'Fire laser pulses to break giant space rocks into two medium rocks, then into small rocks',
      'Wrap across screen boundaries to escape danger',
      'Dodge or destroy hostile sniper alien saucers that periodically enter the sector'
    ],
    physicsModel: 'Newtonian physics with friction dampening: `vx += Math.cos(angle) * thrust; x += vx; vx *= 0.99`.',
    recommendedPalette: ['#0F172A', '#F8FAFC', '#38BDF8', '#F43F5E', '#E2E8F0'],
    difficultyRamp: 'Asteroid density multiplies; smaller fragments travel at significantly higher velocities; enemy saucers gain pinpoint accuracy.',
    codeInsight: 'Break rocks using a hierarchical tree: Big (radius 36) -> 2x Medium (radius 18) -> 2x Small (radius 9). This guarantees a predictable, satisfying score explosion.',
    tags: ['Vector', 'Physics', 'Inertia', 'Atari']
  },
  {
    id: 'sokoban',
    title: 'Sokoban (Warehouse Box Pusher)',
    originYear: 1982,
    originHardware: 'Thinking Rabbit / NEC PC-8801',
    genre: 'Grid Puzzle / Spatial Deduction',
    mechanicSummary: 'A warehouse keeper pushes crates onto designated storage goals inside a tight room without ever pulling or getting crates cornered.',
    whyItWorksInBrowser: 'Zero real-time physics required. 100% turn-based logic with an undo stack allows deep tactical contemplation on desktop or mobile.',
    coreGameLoop: [
      'Examine the room layout and identify potential deadlock corners',
      'Walk up to crates and push them forward one square at a time',
      'Carefully avoid dead-end positions (e.g. 2x2 crate clumps or wall corners)',
      'Guide all crates onto their corresponding colored target squares'
    ],
    physicsModel: 'Discrete state push logic: `if (targetCell.isCrate && cellBeyond.isEmpty) { moveCrate(); movePlayer(); }`.',
    recommendedPalette: ['#78350F', '#B45309', '#10B981', '#E2E8F0', '#475569'],
    difficultyRamp: 'Levels scale from simple 3-box rooms to mind-bending 12-box topological mazes requiring 200+ moves.',
    codeInsight: 'Always provide an unlimited Undo (`Ctrl+Z` / Undo button) state stack storing `JSON.stringify(gameState)` so a single misstep doesn\'t force a rage quit.',
    tags: ['Puzzle', 'Turn-Based', 'Logic', 'Strategy']
  },
  {
    id: 'flappy-bird',
    title: 'Flappy Bird (One-Button Impulse Flight)',
    originYear: 2013,
    originHardware: 'iOS / Android (Dong Nguyen)',
    genre: 'Hyper-Casual One-Button Reflex',
    mechanicSummary: 'A small bird constantly plummets under brutal gravity; tapping gives an upward impulse to thread through narrow vertical pipe gaps.',
    whyItWorksInBrowser: 'The ultimate single-input browser game. Touch/spacebar triggers instant negative Y acceleration. Zero instructions needed.',
    coreGameLoop: [
      'Tap screen or press spacebar to give bird an upward aerodynamic boost',
      'Balance flap cadence against heavy gravitational downward acceleration',
      'Thread through the exact vertical aperture between pipe pairs',
      'Earn 1 point per pipe pair safely passed; crash on any collision'
    ],
    physicsModel: 'Constant downward gravity (`vy += 0.45`); each flap sets `vy = -7.5`; rotation pitch tilts up on flap and points nose-down into dive.',
    recommendedPalette: ['#38BDF8', '#84CC16', '#FACC15', '#EF4444', '#FEF08A'],
    difficultyRamp: 'Gap height can gradually narrow, or horizontal gap distance between pipe columns can shrink.',
    codeInsight: 'Keep the hitboxes slightly smaller than the visual sprite (e.g. 80% inner circle for the bird) to deliver "close call" adrenaline rushes rather than unfair collisions.',
    tags: ['One-Button', 'Casual', 'Impulse', 'Gravity']
  },
  {
    id: 'lunar-lander',
    title: 'Lunar Lander (Precision Thrust Physics)',
    originYear: 1979,
    originHardware: 'Atari Arcade',
    genre: 'Simulation / Gravity Physics',
    mechanicSummary: 'Pilot a fragile lunar excursion module through a rocky canyon, managing scarce thruster fuel to touch down smoothly on landing pads.',
    whyItWorksInBrowser: 'Vector gravity and thruster particle simulation create intense micro-decisions and suspense with minimal rendering overhead.',
    coreGameLoop: [
      'Module descends steadily under simulated lunar gravity',
      'Fire main thruster and rotational attitude thrusters to arrest descent velocity',
      'Conserve limited fuel reserves for final touchdown deceleration',
      'Land flat onto designated landing zones with vertical velocity below safe landing threshold'
    ],
    physicsModel: '2D Rocket Dynamics: `Acceleration = Gravity + (Thrust / Mass) * RotationVector`. Impact tolerance checks velocity and tilt angle.',
    recommendedPalette: ['#020617', '#E2E8F0', '#F97316', '#38BDF8', '#22C55E'],
    difficultyRamp: 'Landing pads become narrower (e.g. 5x multiplier pads nestled between jagged cliffs); crosswinds and turbulence introduced.',
    codeInsight: 'Display clear telemetry bars: Descent Speed (green when safe, red when lethal), Fuel Reserve %, and Surface Radar altitude.',
    tags: ['Simulation', 'Physics', 'Space', 'Retro']
  },
  {
    id: 'minesweeper',
    title: 'Minesweeper (Deductive Number Grid)',
    originYear: 1989,
    originHardware: 'Windows Entertainment Pack (Curt Johnson)',
    genre: 'Logic Deduction / Grid Probability',
    mechanicSummary: 'Uncover grid squares displaying numbers representing adjacent concealed landmines, using pure logic to flag all explosives.',
    whyItWorksInBrowser: 'Simple 2D grid matrix with flood-fill recursion algorithm. Zero physics required, works instantly on mobile touch or mouse right-click.',
    coreGameLoop: [
      'Click or tap any square to begin (first click is guaranteed safe)',
      'Empty cells automatically trigger flood-fill reveal of adjacent empty areas',
      'Inspect numbered squares (1-8) indicating how many adjacent neighbor cells hold mines',
      'Flag suspected mines and safely reveal all 100% confirmed safe tiles'
    ],
    physicsModel: 'Recursive Depth-First Flood Fill on zero-value neighbor cells.',
    recommendedPalette: ['#94A3B8', '#3B82F6', '#16A34A', '#DC2626', '#1E1B4B', '#7F1D1D'],
    difficultyRamp: 'Grid sizes scale: Beginner (9x9, 10 mines), Intermediate (16x16, 40 mines), Expert (30x16, 99 mines).',
    codeInsight: 'Never populate mines before the first click! Generate mine positions strictly AFTER the player clicks their first cell, guaranteeing the first click is always an empty 0-tile.',
    tags: ['Logic', 'Puzzle', 'Windows', 'Classic']
  },
  {
    id: 'pong',
    title: 'Pong (The First Tennis Primitive)',
    originYear: 1972,
    originHardware: 'Atari Arcade (Allan Alcorn)',
    genre: '2-Player / AI Reflex Table Tennis',
    mechanicSummary: 'Two vertical paddles slide up and down to deflect a square ball across a simulated tennis table in the foundational video game loop.',
    whyItWorksInBrowser: 'The simplest possible interactive simulation. Can be played solo against an adaptive AI bot or 2-player local on one keyboard.',
    coreGameLoop: [
      'Position paddle vertically to intercept opponent\'s return shot',
      'Apply spin by striking the ball while the paddle is actively moving',
      'Volley back and forth as ball speed incrementally ramps up',
      'First to reach 11 points claims the match'
    ],
    physicsModel: '1D paddle translation + 2D ball bouncing with English (paddle velocity imparts spin and angle skew to the ball).',
    recommendedPalette: ['#020617', '#F8FAFC', '#22C55E', '#38BDF8'],
    difficultyRamp: 'Ball velocity climbs after every successful paddle volley; AI tracking reaction delay shortens.',
    codeInsight: 'Add a deliberate human-like reaction latency to the AI paddle (e.g. tracking target position with a 150ms delay) so the AI feels natural and beatable.',
    tags: ['Origin', 'Arcade', '2-Player', 'Atari']
  }
];

export const GAMES_METADATA: Record<string, {
  title: string;
  subtitle: string;
  era: string;
  tagline: string;
  accent: string;
  controls: string;
}> = {
  bounce: {
    title: 'Bounce Ball Classic',
    subtitle: 'Nokia 3310 Nostalgia Edition',
    era: '2001 Mobile Classic',
    tagline: 'Roll, bounce through golden hoops, and avoid lethal spikes to reach the portal.',
    accent: '#EF4444',
    controls: 'Left/Right or A/D to roll · Up or Space to jump'
  },
  snake: {
    title: 'Retro Snake 3310',
    subtitle: 'Monochrome & Neon Arcade',
    era: '1997 Grid Legend',
    tagline: 'Grow the serpent by devouring food without crashing into walls or your own tail.',
    accent: '#84CC16',
    controls: 'Arrow keys or W/A/S/D to change direction'
  },
  tetris: {
    title: 'Quadris / Tetris',
    subtitle: 'Authentic 7-Bag Falling Blocks',
    era: '1984 Spatial Masterpiece',
    tagline: 'Arrange geometric tetrominoes to clear rows, hold pieces, and rack up high-score combos.',
    accent: '#06B6D4',
    controls: 'Left/Right move · Up to rotate · Down soft drop · Space hard drop · C to hold'
  },
  mario: {
    title: 'Jump Knight (Mini Mario)',
    subtitle: 'Classic 2D Side-Scroller',
    era: '1985 8-Bit Platformer',
    tagline: 'Run across obstacles, bash question mark blocks for coins, stomp enemies, and reach the flag.',
    accent: '#F59E0B',
    controls: 'A/D or Arrows to run · Space or W to jump (hold for higher jump)'
  },
  breakout: {
    title: 'Brick Breaker Deluxe',
    subtitle: 'Arkanoid / Breakout Action',
    era: '1976 Bat & Ball Classic',
    tagline: 'Deflect the ricocheting ball with precision, destroy colored brick walls, and catch power-ups.',
    accent: '#EC4899',
    controls: 'Mouse slide or Left/Right arrows to move paddle · Space to launch ball'
  },
  space: {
    title: 'Space Defender 1980',
    subtitle: 'Fixed Invaders Fleet Shooter',
    era: '1978 Space Arcade',
    tagline: 'Command the ground laser cannon, take cover behind bunkers, and shoot down alien swarms.',
    accent: '#3B82F6',
    controls: 'Left/Right or A/D to move ship · Space to fire laser cannon'
  },
  flappy: {
    title: 'Flappy Bird Classic',
    subtitle: 'One-Tap Precision Aviator',
    era: '2013 Mobile Phenomenon',
    tagline: 'Tap or press Space to flap upward through treacherous pipe gaps without touching the ground or pipes.',
    accent: '#FACC15',
    controls: 'Spacebar / Up Arrow / Click or Tap anywhere to Flap'
  }
};
