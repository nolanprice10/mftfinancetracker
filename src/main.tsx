import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import ErrorBoundary from "./components/ErrorBoundary.tsx";
import "./index.css";

console.log('🚀 MyFinanceTracker starting...');
console.log('📍 Base URL:', import.meta.env.BASE_URL);
console.log('🔧 Mode:', import.meta.env.MODE);

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
