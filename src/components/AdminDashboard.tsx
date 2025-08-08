import { HeaderBar } from './HeaderBar';
import { TimerPanel } from './TimerPanel';
import { TurnControlPanel } from './TurnControlPanel';
import { InformationPanel } from './InformationPanel';
import { PreviewPanel } from './PreviewPanel';

export function AdminDashboard() {

  return (
    <div className="w-screen h-screen min-w-[1280px] min-h-[720px] flex flex-col bg-tokyo-background text-tokyo-text overflow-hidden antialiased" style={{fontFamily: 'Geist, -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif'}}>
      {/* Header Bar - 60px height */}
      <div className="h-[60px] border-b border-tokyo-border">
        <HeaderBar />
      </div>

      {/* Four-Panel Layout - CSS Grid */}
      <div className="h-[calc(100vh-60px)] grid grid-cols-[minmax(220px,_3fr)_minmax(220px,_3.5fr)_minmax(360px,_4.5fr)_minmax(360px,_4.5fr)] gap-1 p-1">
        {/* Timer Panel - 240px width */}
        <div className="bg-tokyo-surface border border-tokyo-border rounded-lg p-3 overflow-hidden">
          <TimerPanel />
        </div>

        {/* Turn Control Panel - 240px width */}
        <div className="bg-tokyo-surface border border-tokyo-border rounded-lg p-3 overflow-auto">
          <TurnControlPanel />
        </div>

        {/* Information Panel - 400px width */}
        <div className="bg-tokyo-surface border border-tokyo-border rounded-lg p-3 overflow-auto">
          <InformationPanel />
        </div>

        {/* Preview Panel - 400px width */}
        <div className="bg-tokyo-surface border border-tokyo-border rounded-lg p-3 overflow-auto">
          <PreviewPanel />
        </div>
      </div>
    </div>
  );
}