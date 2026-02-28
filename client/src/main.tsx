import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
// Initialize i18n before rendering
import "./lib/i18n";

createRoot(document.getElementById("root")!).render(<App />);
