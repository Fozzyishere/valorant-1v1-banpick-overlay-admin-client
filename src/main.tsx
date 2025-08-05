import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { windowManager } from "./services/windowManager";

// Initialize window management
windowManager.initialize().catch(console.error);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
