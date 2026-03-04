import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import MainMenu from './pages/MainMenu';
import Lobby from './pages/Lobby';
import Game from './pages/Game';
import Voting from './pages/Voting';
import Results from './pages/Results';
import FinalScores from './pages/FinalScores';

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: 'rgba(10, 22, 40, 0.95)',
            color: '#fff',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)',
            fontSize: '14px',
            fontFamily: 'Inter, sans-serif',
          },
          success: {
            iconTheme: {
              primary: '#00ff88',
              secondary: '#000',
            },
          },
          error: {
            iconTheme: {
              primary: '#ff4444',
              secondary: '#000',
            },
          },
        }}
      />
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/" element={<MainMenu />} />
          <Route path="/lobby" element={<Lobby />} />
          <Route path="/game" element={<Game />} />
          <Route path="/voting" element={<Voting />} />
          <Route path="/results" element={<Results />} />
          <Route path="/final" element={<FinalScores />} />
        </Routes>
      </AnimatePresence>
    </BrowserRouter>
  );
}
