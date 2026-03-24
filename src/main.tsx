import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Buffer } from 'buffer';
import App from './App.tsx';
import './index.css';
import SolanaProvider from './components/SolanaProvider';

// Initialize Buffer globally for Solana libraries
window.Buffer = Buffer;
if (typeof window.global === 'undefined') {
  (window as any).global = window;
}
if (typeof window.process === 'undefined') {
  (window as any).process = { env: {} };
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SolanaProvider>
      <App />
    </SolanaProvider>
  </StrictMode>,
);
