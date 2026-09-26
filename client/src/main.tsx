import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
// Patch fetch to attach the CSRF header before any request can fire
import "./lib/csrf";
// Initialize i18n before rendering
import "./lib/i18n";

createRoot(document.getElementById("root")!).render(<App />);
