import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { windowManager } from './services/windowManager';
import { initializeTimerEventListeners } from './store/timerStore';

// Initialize window management
windowManager.initialize().catch(console.error);

// Initialize Rust timer event listeners
initializeTimerEventListeners().catch(console.error);

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
