# THIS REPO HAS BEEN (KINDA) ABANDONED

This project was initially created to help a friend run his own local tournament smoothly, but due to the tournament cancelation and my own lack of time to continue development, I have decided to archive this repository. I'll probably continue working on it when I have some more free time. The admin client right now will only works locally without player client communication through Socket.io.

# Valorant 1v1 Tournament Management System

A Tauri-based desktop application for managing the ban-pick phase of Valorant 1v1 tournaments with real-time OBS overlay integration. Built as a personal hobby project to explore desktop app development with modern web technologies.

The application features a comprehensive admin dashboard that controls a separate overlay window for OBS streaming, handling both map and agent selection phases with turn-based logic and timer management.

## Tech Stack

- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Desktop**: Tauri 2.0 (turns web app into desktop app with fewer headaches and bloats than Electron)
- **State**: Zustand (simple state management)
- **Build**: Vite
- **Styling**: Tailwind CSS with Tokyo Night theme (subject to change in the future)

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

# Start development server
npm run dev

# Build for production
npm run build

# Run the Tauri desktop app
npm run tauri dev

# Build the desktop application
npm run tauri build
```

### Useful Commands

```bash
npm run dev          # Start Vite dev server
npm run build        # Build production bundle
npm run preview      # Preview production build
npm run tauri dev    # Run desktop app in development
npm run tauri build  # Build desktop application
```

## Features

### Admin Dashboard

- **Four-panel layout**: Timer control, turn management, information display, and live preview
- **Player setup**: Configure player names and starting player
- **Phase management**: Handles MAP_PHASE → AGENT_PHASE → CONCLUSION flow
- **Turn tracking**: Automatic turn progression with visual indicators
- **Timer system**: Independent countdown timer with start/pause/reset controls
- **Asset selection**: Click-to-select interface for maps and agents
- **Live preview**: Real-time preview of what appears on the overlay

### OBS Overlay Window

- **Separate window**: Programmatically managed overlay window (1920x1080)
- **Real-time updates**: Instant synchronization with admin dashboard via Tauri events
- **Asset animations**: Reveal animations for bans, picks, and selections
- **Phase transitions**: Smooth transitions between map and agent phases
- **Tournament state**: Displays team names, banned/picked assets, and current phase

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

## Project Structure

```
valorant-1v1-banpick-overlay-admin-client/
├── src/
│   ├── components/          # React UI components
│   │   ├── AdminDashboard.tsx    # Main dashboard layout
│   │   ├── HeaderBar.tsx         # Top bar with overlay controls
│   │   ├── TimerPanel.tsx        # Timer control panel
│   │   ├── TurnControlPanel.tsx  # Turn and phase management
│   │   ├── InformationPanel.tsx  # Current state information
│   │   └── PreviewPanel.tsx      # Live overlay preview
│   ├── services/            # State and window management
│   │   ├── adminStore.ts         # Zustand tournament state store
│   │   └── windowManager.ts      # Tauri window management
│   ├── types/               # TypeScript type definitions
│   │   └── admin.types.ts        # Tournament state types
│   └── utils/               # Helper functions
│       ├── tournamentHelpers.ts  # Turn/phase logic
│       └── overlayPositioning.ts # Overlay asset coordinates
├── public/                  # Static overlay files
│   ├── overlay.html         # OBS overlay page
│   ├── css/overlay.css      # Overlay styling
│   ├── js/overlay.js        # Overlay logic and animations
│   └── img/                 # Game assets (maps, agents)
└── src-tauri/              # Tauri desktop configuration
    ├── src/                # Rust source code
    └── tauri.conf.json     # Tauri app configuration
```

## Contributing

Want to help out? Contributions are welcome!

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Future Plans

- Socket.io integration for networked tournaments
- Player client applications
- Remote tournament management via ngrok/Cloudflare tunnels
- Additional game modes and tournament formats

## License

MIT License - feel free to use this however you want!

## Questions?

Found a bug or want a new feature? Just open an issue on GitHub!
