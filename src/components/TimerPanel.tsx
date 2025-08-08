import { useTournamentStore } from '../services/adminStore';
import { getTurnInfo } from '../utils/tournamentHelpers';

export function TimerPanel() {
  const { 
    timerState, 
    timerSeconds, 
    startTimer, 
    pauseTimer, 
    resetTimer,
    actionNumber,
    firstPlayer,
    eventStarted,
    startEvent,
    lastError
  } = useTournamentStore();

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerColor = () => {
    switch (timerState) {
      case 'ready': return 'text-tokyo-teal';
      case 'running': return 'text-tokyo-orange';
      case 'paused': return 'text-tokyo-yellow';
      case 'finished': return 'text-tokyo-red';
      default: return 'text-tokyo-text-dim';
    }
  };

  const turnInfo = getTurnInfo(actionNumber, firstPlayer);

  return (
    <div className="flex flex-col h-full items-stretch space-y-3">
      <h2 className="text-lg font-semibold text-tokyo-text tracking-tight">Timer</h2>

      {/* Current Turn Summary */}
      <div className="text-xs bg-tokyo-surface-light border border-tokyo-border-light rounded p-2">
        <div className="text-tokyo-text-dim">Current:</div>
        <div className="text-tokyo-text font-medium">
          {eventStarted ? turnInfo.description : 'Not started'}
        </div>
      </div>
      
      {/* Timer Display */}
      <div 
        className={`text-4xl font-mono font-bold text-center tabular-nums pt-4 px-4 py-3 bg-tokyo-background-dark/50 rounded-lg border border-tokyo-border/30 ${getTimerColor()}`}
        style={{fontFamily: 'JetBrains Mono, ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'}}
      >
        {formatTime(timerSeconds)}
      </div>
      
      {/* Timer Status */}
      <div className="text-sm text-tokyo-text-dim capitalize text-center">
        {timerState}
      </div>
      
      {/* Timer Controls */}
      <div className="flex flex-col space-y-2 w-full">
        <button
          onClick={startTimer}
          disabled={timerState === 'running'}
          className="px-4 py-2 bg-tokyo-teal hover:bg-tokyo-green disabled:bg-tokyo-border disabled:cursor-not-allowed text-tokyo-background rounded font-medium transition-colors"
        >
          START
        </button>
        
        <button
          onClick={timerState === 'paused' ? startTimer : pauseTimer}
          disabled={timerState === 'ready' || timerState === 'finished'}
          className="px-4 py-2 bg-tokyo-yellow hover:bg-tokyo-orange disabled:bg-tokyo-border disabled:cursor-not-allowed text-tokyo-background rounded font-medium transition-colors"
        >
          {timerState === 'paused' ? 'RESUME' : 'PAUSE'}
        </button>
        
        <button
          onClick={resetTimer}
          className="px-4 py-2 bg-tokyo-red hover:bg-tokyo-pink text-white rounded font-medium transition-colors"
        >
          RESET
        </button>
      </div>

      {/* Event Control (moved from Turn Control) */}
      <div className="mt-2">
        <button
          onClick={startEvent}
          disabled={eventStarted}
          className="w-full px-4 py-2 bg-tokyo-accent hover:bg-tokyo-blue disabled:bg-tokyo-border disabled:cursor-not-allowed disabled:text-tokyo-text-dim text-white rounded font-medium transition-colors"
        >
          {eventStarted ? 'EVENT STARTED' : 'START EVENT'}
        </button>
      </div>

      {/* Error Indicator (moved here) */}
      {lastError && (
        <div className="mt-2 bg-tokyo-red/20 border border-tokyo-red text-tokyo-red text-sm rounded p-2">
          {lastError}
        </div>
      )}
    </div>
  );
}