import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { startPrewarmQuiz } from './hooks/prewarmQuiz';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// Kick off 2 background question fetches as soon as the app boots so the
// rolling buffer is already warm by the time the user clicks into quiz.
startPrewarmQuiz();
