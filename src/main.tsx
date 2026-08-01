import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { themeClass } from './styles/theme.balaiAmihan.css';
import './styles/global.css';
import { MotionProvider } from './motion/config';
import { App } from './App';

document.documentElement.classList.add(themeClass);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MotionProvider>
      <App />
    </MotionProvider>
  </StrictMode>,
);
