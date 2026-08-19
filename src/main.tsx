import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import ErrorBoundary from "./components/ErrorBoundary";
import { installErrorReporting } from "./lib/errors";
import { registerServiceWorker } from "./lib/pwa";
import { measureVitals } from "./lib/vitals";

// Installed before render so a crash during the first paint is still captured.
installErrorReporting();
registerServiceWorker();
measureVitals();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);
