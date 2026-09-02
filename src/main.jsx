import React from 'react';
import ReactDOM from 'react-dom/client';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import App from './App';
import './index.css';

// Initialize Lenis for luxurious buttery-smooth momentum scrolling
const lenis = new Lenis({
  duration: 1.2,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  smoothWheel: true,
  touchMultiplier: 1.2
});

function raf(time) {
  lenis.raf(time);
  requestAnimationFrame(raf);
}
requestAnimationFrame(raf);

// Export lenis instance globally so in-page navigations can scroll smoothly
window.lenis = lenis;

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
