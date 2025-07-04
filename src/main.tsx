import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { setupGlobalErrorHandling } from './lib/errorHandler';
import { performanceMonitor } from './lib/performance';

// Setup global error handling
setupGlobalErrorHandling();

// Setup performance monitoring
performanceMonitor.measurePageLoad();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);