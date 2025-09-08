import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { ensurePushSubscription } from "./lib/push";

function Main() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      // Attempt registration immediately in dev; no need to wait for 'load'
      navigator.serviceWorker
        .register('/service-worker.js')
        .then((registration) => {
          console.log('SW registered:', registration.scope);
          if (Notification.permission === 'granted') {
            ensurePushSubscription().catch(() => {});
          }
        })
        .catch((error) => {
          console.log('SW registration failed:', error);
        });
    } else {
      console.log('Service worker not supported in this browser.');
    }
  }, []);

  return (
    <StrictMode>
      <App />
    </StrictMode>
  );
}

createRoot(document.getElementById("root")!).render(<Main />);
