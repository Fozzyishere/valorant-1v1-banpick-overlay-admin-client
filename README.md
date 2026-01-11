# THIS REPO HAS BEEN (KINDA) ABANDONED

This project was initially created to help a friend run his own local tournament smoothly, but due to the tournament cancelation and my own lack of time to continue development, I have decided to archive this repository. I'll probably continue working on it when I have some more free time. The admin client right now will only works locally without player client communication through Socket.io.

# Valorant 1v1 Tournament Management System

A Tauri-based desktop application for managing the ban-pick phase of Valorant 1v1 tournaments with real-time OBS overlay integration. Built as a personal hobby project to explore desktop app development with modern web technologies.

The application features a comprehensive admin dashboard that controls a separate overlay window for OBS streaming, handling both map and agent selection phases with turn-based logic and timer management.

## Tech Stack

- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Desktop**: Tauri 2.0 (turns web app into desktop app with fewer headaches and bloats than Electron)
- **State**: Zustand with selector subscriptions (single-responsibility stores)
- **Timer Backend**: Rust-native timer with Tokio async runtime
- **Build**: Vite
- **Testing**: Vitest + Testing Library
- **Code Quality**: ESLint + Prettier
- **Styling**: Tailwind CSS with Tokyo Night theme

## Getting Started

### What You Need

- Node.js 18+
- Rust (for Tauri - the desktop framework)
- OBS Studio (for capturing the overlay window)

### Quick Setup

```bash
# Clone the repository
git clone <repository-url>
cd valorant-1v1-banpick-overlay-admin-client

# Install dependencies
npm install

# Run the Tauri desktop app (development)
npm run tauri dev

# Build the desktop application
npm run tauri build
```

### Available Commands

```bash
# Development
npm run dev          # Start Vite dev server (frontend only)
npm run tauri dev    # Run full desktop app in development

# Build
npm run build        # Build production bundle
npm run tauri build  # Build desktop application
npm run preview      # Preview production build

# Testing
npm run test         # Run tests in watch mode
npm run test:run     # Run tests once
npm run test:coverage # Run tests with coverage report

# Code Quality
npm run lint         # Run ESLint
npm run lint:fix     # Run ESLint with auto-fix
npm run format       # Format code with Prettier
npm run format:check # Check code formatting
```

## Features

### Admin Dashboard

- **Four-panel layout**: Timer control, turn management, information display, and live preview
- **Player setup**: Configure player names and starting player
- **Phase management**: Handles MAP_PHASE → AGENT_PHASE → CONCLUSION flow
- **Turn tracking**: Automatic turn progression with visual indicators
- **Timer system**: Rust-native countdown timer with start/pause/reset controls
- **Asset selection**: Click-to-select interface for maps and agents
- **Live preview**: Real-time preview of what appears on the overlay
- **Undo support**: Ability to undo the last action

### OBS Overlay Window

- **Separate window**: Programmatically managed overlay window (1920x1080)
- **Real-time updates**: Instant synchronization with admin dashboard via Tauri events
- **Asset animations**: Reveal animations for bans, picks, and selections
- **Phase transitions**: Smooth transitions between map and agent phases
- **Tournament state**: Displays team names, banned/picked assets, and current phase
- **TypeScript-based**: Modular overlay rendering system with dedicated renderers

## How to Use It

### Setting Up a Tournament

1. **Configure players**: Enter player names for P1 and P2
2. **Select first player**: Choose which player starts the tournament
3. **Start event**: Click the START EVENT button to begin
4. **Open overlay**: Use the "Show Overlay" button to launch the OBS overlay window
5. **Add to OBS**: Capture the overlay window in OBS Studio using Window Capture

### Tournament Flow

1. **Map Phase**:
   - 6 map bans (3 per player, alternating)
   - 2 map picks (1 per player)
   - 1 decider map selection
2. **Agent Phase**:
   - 6 agent bans (3 per player, alternating)
   - 2 agent picks (1 per player)
3. **Conclusion**: View final results

### Timer Controls

- Use the timer to limit player decision time
- Timer is independent and can be started/paused/reset at any time
- Timer doesn't automatically advance turns - it's a visual aid only

## Architecture

This project follows a clean architecture with separation of concerns:

### Core Layer (`src/core/`)

Pure business logic with no framework dependencies:

- **TournamentEngine**: Pure state machine for tournament logic (immutable state transitions)
- **TimerEngine**: Timer utility functions and state transformations
- **Selectors**: Derived state calculations (turn info, available assets, phase progress)
- **Constants**: Tournament configuration (17-action sequence, phase boundaries)

### Store Layer (`src/store/`)

Zustand stores with single responsibilities:

- **tournamentStore**: Tournament state management, delegates logic to TournamentEngine
- **timerStore**: Rust backend integration via Tauri commands
- **uiStore**: UI-specific state (modals, loading states)

### Services Layer (`src/services/`)

External integrations:

- **overlayBridge**: Transforms state and emits Tauri events to overlay window
- **windowManager**: Tauri window lifecycle management
- **adminStore**: Legacy facade (being phased out)

### Overlay System (`src/overlay/`)

Modular TypeScript overlay with dedicated renderers:

- **rendering/**: AssetRenderer, BackgroundManager, TeamNameRenderer, TimerRenderer
- **animation/**: RevealAnimator, TransitionController
- **state/**: OverlayState management
- **events/**: TauriEventListener for real-time updates

### Rust Backend (`src-tauri/src/timer/`)

Native timer implementation:

- **state.rs**: Timer state with Tokio watch channels
- **service.rs**: Async timer loop with 1-second ticks
- **commands.rs**: Tauri command handlers (start, pause, reset)

## Project Structure

```text
valorant-1v1-banpick-overlay-admin-client/
├── src/
│   ├── components/          # React UI components
│   │   ├── AdminDashboard.tsx    # Main dashboard layout
│   │   ├── HeaderBar.tsx         # Top bar with overlay controls
│   │   ├── TimerPanel.tsx        # Timer control panel
│   │   ├── TurnControlPanel.tsx  # Turn and phase management
│   │   ├── InformationPanel.tsx  # Current state information
│   │   └── PreviewPanel.tsx      # Live overlay preview
│   ├── core/                # Pure business logic (framework-agnostic)
│   │   ├── tournament/           # Tournament state machine
│   │   │   ├── TournamentEngine.ts   # Pure state transitions
│   │   │   ├── selectors.ts          # Derived state calculations
│   │   │   ├── constants.ts          # Action sequence config
│   │   │   └── types.ts              # TypeScript interfaces
│   │   └── timer/                # Timer utilities
│   │       ├── TimerEngine.ts        # Timer state helpers
│   │       └── types.ts              # Timer types
│   ├── store/               # Zustand state management
│   │   ├── tournamentStore.ts    # Tournament state + actions
│   │   ├── timerStore.ts         # Rust timer integration
│   │   └── uiStore.ts            # UI state
│   ├── hooks/               # React hooks
│   │   ├── useTournament.ts      # Tournament selectors hook
│   │   └── useTimer.ts           # Timer state hook
│   ├── services/            # External integrations
│   │   ├── overlayBridge.ts      # Overlay event emission
│   │   └── windowManager.ts      # Tauri window management
│   ├── overlay/             # TypeScript overlay system
│   │   ├── main.ts               # Overlay entry point
│   │   ├── rendering/            # Asset/timer/team renderers
│   │   ├── animation/            # Reveal and transition controllers
│   │   ├── state/                # Overlay state management
│   │   └── events/               # Tauri event listener
│   └── types/               # Shared TypeScript definitions
├── public/                  # Static overlay assets
│   └── img/                      # Game assets (maps, agents)
└── src-tauri/              # Rust desktop backend
    └── src/
        ├── lib.rs                # Tauri app setup
        ├── main.rs               # Entry point
        └── timer/                # Native timer module
            ├── state.rs          # Timer state + channels
            ├── service.rs        # Async timer loop
            └── commands.rs       # Tauri commands
```

## Contributing

Want to help out? Contributions are welcome!

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests (`npm run test:run`)
5. Ensure code quality (`npm run lint && npm run format:check`)
6. Submit a pull request

## Future Plans

- Socket.io integration for networked tournaments
- Player client applications
- Remote tournament management via ngrok/Cloudflare tunnels
- Additional game modes and tournament formats
- Enhanced overlay animations and themes

## License

MIT License - feel free to use this however you want!

## Questions?

Found a bug or want a new feature? Just open an issue on GitHub!
