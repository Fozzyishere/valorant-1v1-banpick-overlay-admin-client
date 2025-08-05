import { useTournamentStore } from '../services/adminStore';

export function TimerPanel() {
  const { 
    timerState, 
    timerSeconds, 
    startTimer, 
    pauseTimer, 
    resetTimer 
  } = useTournamentStore();

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerColor = () => {
    switch (timerState) {
      case 'ready': return 'text-green-400';
      case 'running': return 'text-orange-400';
      case 'paused': return 'text-yellow-400';
      case 'finished': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <h2 className="text-lg font-semibold text-white mb-2">Timer</h2>
      
      {/* Timer Display */}
      <div className={`text-4xl font-mono font-bold ${getTimerColor()}`}>
        {formatTime(timerSeconds)}
      </div>
      
      {/* Timer Status */}
      <div className="text-sm text-gray-400 capitalize">
        {timerState}
      </div>
      
      {/* Timer Controls */}
      <div className="flex flex-col space-y-2 w-full">
        <button
          onClick={startTimer}
          disabled={timerState === 'running'}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded font-medium transition-colors"
        >
          START
        </button>
        
        <button
          onClick={pauseTimer}
          disabled={timerState === 'ready' || timerState === 'finished'}
          className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded font-medium transition-colors"
        >
          {timerState === 'paused' ? 'RESUME' : 'PAUSE'}
        </button>
        
        <button
          onClick={resetTimer}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-medium transition-colors"
        >
          RESET
        </button>
      </div>
    </div>
  );
}