import { useTournamentStore } from '../services/adminStore';
import { useState } from 'react';

export function HeaderBar() {
  const { currentPhase, currentPlayer, actionNumber, eventStarted } = useTournamentStore();
  const [overlayCreated, setOverlayCreated] = useState(false);

  const showOverlay = async () => {
    if (typeof window !== 'undefined' && window.__TAURI__) {
      try {
        const { WebviewWindow } = await import('@tauri-apps/api/webviewWindow');
        
        if (!overlayCreated) {
          // Create new borderless overlay window
          const overlay = new WebviewWindow('obs-overlay', {
            url: '/overlay.html',
            title: 'OBS Overlay',
            minWidth: 1920,
            minHeight: 1080,
          });

          // Listen for overlay window events
          overlay.once('tauri://created', () => {
            console.log('Overlay window created successfully');
            setOverlayCreated(true);
          });

          overlay.once('tauri://error', (e) => {
            console.error('Error creating overlay window:', e);
          });

          // Listen for window close to reset state
          overlay.once('tauri://close-requested', () => {
            console.log('Overlay window closed');
            setOverlayCreated(false);
          });
        } else {
          // Try to show existing overlay window
          try {
            const overlay = await WebviewWindow.getByLabel('obs-overlay');
            if (overlay) {
              await overlay.show();
              await overlay.setFocus();
            } else {
              // Window no longer exists, reset state and create new one
              console.log('Overlay window no longer exists, creating new one');
              setOverlayCreated(false);
              // Recursively call to create new window
              showOverlay();
            }
          } catch (error) {
            // Window was closed, reset state and create new one
            console.log('Error showing overlay, creating new one:', error);
            setOverlayCreated(false);
            showOverlay();
          }
        }
      } catch (error) {
        console.error('Error with Tauri overlay:', error);
        // Fallback to browser tab
        window.open('/overlay.html', '_blank');
      }
    } else {
      // Fallback for non-Tauri environment
      window.open('/overlay.html', '_blank');
    }
  };

  return (
    <div className="flex items-center justify-between h-full px-6 bg-tokyo-surface">
      <div className="flex items-center space-x-6">
        <h1 className="text-xl font-semibold text-tokyo-text tracking-tight">Tournament Admin</h1>
        <div className="text-sm text-tokyo-text-muted">
          Phase: <span className="text-tokyo-blue font-medium">{currentPhase}</span>
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        <button
          onClick={showOverlay}
          className="px-4 py-2 rounded text-sm font-medium transition-colors bg-tokyo-accent hover:bg-tokyo-blue text-white tracking-wide"
        >
          Show Overlay
        </button>
        
        <div className="text-sm text-tokyo-text-muted">
          Current Turn: <span className="text-tokyo-teal font-medium">
            {eventStarted ? `Turn ${actionNumber}: ${currentPlayer || '—'}` : 'Not started'}
          </span>
        </div>
      </div>
    </div>
  );
}