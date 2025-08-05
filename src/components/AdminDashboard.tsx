import { HeaderBar } from './HeaderBar';
import { TimerPanel } from './TimerPanel';
import { TurnControlPanel } from './TurnControlPanel';
import { InformationPanel } from './InformationPanel';
import { PreviewPanel } from './PreviewPanel';

export function AdminDashboard() {

  return (
    <div className="tournament-dashboard text-white overflow-hidden">
      {/* Header Bar - 60px height */}
      <div className="h-[60px] border-b border-gray-700">
        <HeaderBar />
      </div>

      {/* Four-Panel Layout - CSS Grid */}
      <div className="h-[calc(100vh-60px)] grid grid-cols-[240px_240px_400px_400px] gap-1 p-1">
        {/* Timer Panel - 240px width */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <TimerPanel />
        </div>

        {/* Turn Control Panel - 240px width */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <TurnControlPanel />
        </div>

        {/* Information Panel - 400px width */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <InformationPanel />
        </div>

        {/* Preview Panel - 400px width */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <PreviewPanel />
        </div>
      </div>
    </div>
  );
}