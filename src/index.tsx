import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Desktop } from "./screens/Desktop/Desktop";
import { AuthProvider } from "./lib/auth/AuthContext";
import { App } from "./App";

createRoot(document.getElementById("app") as HTMLElement).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
);
