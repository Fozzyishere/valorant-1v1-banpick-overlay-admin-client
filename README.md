# Valorant 1v1 Tournament Management System

A basic OBS overlay management for during the ban-pick phase of a friend's local Valorant tournament. Initially made for my friend, this now ended up something of a hobby project for me to mess around with stuff I want to do.

Right now, a barebone front end panel with an overlay, but will probably be expanded into a set of admin/player clients communicating with Socket.io and ngrok or Cloudflare for network exposure without any hassle.

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
- OBS Studio (if you want to test the overlay)

### Quick Setup
```bash
# Get the code
git clone <repository-url>
cd valorant-1v1-banpick-overlay

# Install everything
npm install

# Start developing
npm run dev

# Build for production
npm run build

# Run the desktop app
npm run tauri dev
```

### Useful Commands
```bash
npm run dev          # Start the dev server
npm run build        # Build for production
npm run preview      # See the production build
npm run tauri dev    # Run the desktop app
npm run tauri build  # Build the desktop app
```

## How to Use It

### Setting Up a Tournament
1. **Add players**: Put in player names and decide who goes first
2. **Start the event**: Hit the START EVENT button to begin
3. **Run the tournament**: Use the timer and selection panels to move through turns
4. **Watch progress**: Keep an eye on the preview panel to see what's happening

### Tournament Flow
1. **Map phase**: Players ban and pick maps
3. **Agent phase**: Players ban and pick agents
4. **Conclusion**: See the final results

## Project Structure

```
valorant-1v1-banpick-overlay/
├── src/
│   ├── components/          # The main UI pieces
│   │   ├── AdminDashboard.tsx
│   │   ├── TimerPanel.tsx
│   │   ├── TurnControlPanel.tsx
│   │   ├── InformationPanel.tsx
│   │   └── PreviewPanel.tsx
│   ├── services/            # How data is managed
│   │   └── adminStore.ts
│   ├── types/               # TypeScript definitions
│   │   └── admin.types.ts
│   └── utils/               # Helper functions
│       └── tournamentHelpers.ts
├── public/                  # Static files
│   ├── overlay.html         # The OBS overlay
│   ├── css/overlay.css      # Overlay styling
│   ├── js/overlay.js        # Overlay logic
│   └── img/                 # Game images
└── src-tauri/              # Desktop app config
```

## Contributing

Want to help out? Awesome!
1. Fork the repo
2. Make your changes
3. Test everything works
4. Send a pull request

## License

MIT License - feel free to use this however you want!

## Questions?

Found a bug or want a new feature? Just open an issue on GitHub!
