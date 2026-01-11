import { useTournamentStore } from '../services/adminStore';
import { forceEmit } from '../services/overlayBridge';
import { useEffect, useState } from 'react';

export function HeaderBar() {
  const { currentPhase, currentPlayer, actionNumber, eventStarted } = useTournamentStore();
  const [overlayOpen, setOverlayOpen] = useState(false);

  // Keep local state in sync with actual overlay window presence
  useEffect(() => {
    let interval: any;
    async function checkOverlay() {
      if (typeof window === 'undefined' || !(window as any).__TAURI__) return;
      try {
        const { WebviewWindow } = await import('@tauri-apps/api/webviewWindow');
        const win =
          (await WebviewWindow.getByLabel('overlay')) ||
          (await WebviewWindow.getByLabel('obs-overlay'));
        if (win) {
          try {
            const visible = await win.isVisible();
            setOverlayOpen(visible);
          } catch {
            setOverlayOpen(true);
          }
        } else {
          setOverlayOpen(false);
        }
      } catch (_) {
        setOverlayOpen(false);
      }
    }
    // Initial check and periodic heartbeat
    checkOverlay();
    interval = setInterval(checkOverlay, 1000);
    return () => interval && clearInterval(interval);
  }, []);

  async function getOverlayWindow() {
    const { WebviewWindow } = await import('@tauri-apps/api/webviewWindow');
    return (
      (await WebviewWindow.getByLabel('overlay')) || (await WebviewWindow.getByLabel('obs-overlay'))
    );
  }

  const showOverlay = async () => {
    if (typeof window !== 'undefined' && (window as any).__TAURI__) {
      try {
        const { WebviewWindow } = await import('@tauri-apps/api/webviewWindow');

        // Prefer the configured window label 'overlay'
        let overlay = await getOverlayWindow();
        if (!overlay) {
          overlay = new WebviewWindow('overlay', {
            url: '/src/overlay/index.html',
            title: 'OBS Overlay',
            width: 1920,
            height: 1080,
            resizable: false,
            decorations: true,
          });
        }
        try {
          await overlay.setDecorations(true);
        } catch (_) {}
        await overlay.show();
        await overlay.setFocus();
        setOverlayOpen(true);

        // Emit current state to overlay after it initializes
        setTimeout(() => forceEmit(), 500);
      } catch (error) {
        console.error('Error with Tauri overlay:', error);
        // Fallback to browser tab
        window.open('/src/overlay/index.html', '_blank');
      }
    } else {
      // Fallback for non-Tauri environment
      window.open('/src/overlay/index.html', '_blank');
    }
  };

  const closeOverlay = async () => {
    if (typeof window === 'undefined' || !(window as any).__TAURI__) {
      return;
    }
    try {
      const { WebviewWindow } = await import('@tauri-apps/api/webviewWindow');
      const overlay =
        (await WebviewWindow.getByLabel('overlay')) ||
        (await WebviewWindow.getByLabel('obs-overlay'));
      if (overlay) await overlay.close();
      // Ensure any stray window is also closed
      const stray = await WebviewWindow.getByLabel('obs-overlay');
      if (stray) await stray.close();
      setOverlayOpen(false);
    } catch (error) {
      console.warn('Failed to close overlay:', error);
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
          onClick={overlayOpen ? closeOverlay : showOverlay}
          className={`px-4 py-2 rounded text-sm font-medium transition-colors text-white tracking-wide ${overlayOpen ? 'bg-tokyo-red hover:bg-tokyo-pink' : 'bg-tokyo-accent hover:bg-tokyo-blue'}`}
          title={overlayOpen ? 'Close the overlay window' : 'Open the overlay window'}
        >
          {overlayOpen ? 'Close Overlay' : 'Show Overlay'}
        </button>

        <div className="text-sm text-tokyo-text-muted">
          Current Turn:{' '}
          <span className="text-tokyo-teal font-medium">
            {eventStarted ? `Turn ${actionNumber}: ${currentPlayer || '—'}` : 'Not started'}
          </span>
        </div>
      </div>
    </div>
  );
}
