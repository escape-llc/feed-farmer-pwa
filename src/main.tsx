import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ToolcribProvider } from '#toolcrib';
import App from './App';
import './index.css';

/**
 * Feed Farmer theme — green "farmer" accent in dark mode.
 * HSV hue 145 ≈ a rich, earthy green; analogous harmony
 * spreads into teals and lime-greens.
 */
const farmerTheme = {
  initialParameters: {
    baseColor: { h: 145, s: 72, v: 68 },
    harmonyMode: 'analogous',
    hueSpread: 25,
    isDarkMode: true,
  },
} as const;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ToolcribProvider theme={farmerTheme}>
      <App />
    </ToolcribProvider>
  </StrictMode>,
);
