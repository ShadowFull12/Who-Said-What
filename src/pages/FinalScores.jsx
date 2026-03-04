import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import AnimatedTitle from '../components/AnimatedTitle';
import Scoreboard from '../components/Scoreboard';
import BackgroundEffects from '../components/BackgroundEffects';
import useGameStore from '../store/gameStore';
import { getRankings } from '../game/scoring';

export default function FinalScores() {
  const navigate = useNavigate();
  const {
    scores,
    players,
    player,
    resetGame,
  } = useGameStore();

  const rankings = getRankings(scores);
  const winner = rankings[0];
  const isWinner = winner?.playerId === player?.id;
  const winnerPlayer = winner ? players[winner.playerId] : null;

  useEffect(() => {
    // Celebration confetti
    const duration = 4000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#00ff88', '#00d4ff', '#6366f1', '#FFD700'],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#00ff88', '#00d4ff', '#6366f1', '#FFD700'],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    frame();
  }, []);

  const handlePlayAgain = () => {
    resetGame();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 relative">
      <BackgroundEffects />

      <div className="relative z-10 flex flex-col items-center gap-8 w-full max-w-md">
        <AnimatedTitle small />

        {/* Winner announcement */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, type: 'spring', damping: 10 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: [0, -5, 5, -5, 0] }}
            transition={{ delay: 1, duration: 0.5 }}
            className="text-6xl mb-4"
          >
            🏆
          </motion.div>
          <h2 className="text-3xl font-grotesk font-bold text-neon mb-2">
            {isWinner ? 'You Win!' : `${winnerPlayer?.name || 'Unknown'} Wins!`}
          </h2>
          <p className="text-white/40 text-sm">
            with <span className="text-neon font-bold">{winner?.score || 0}</span> points
          </p>
        </motion.div>

        {/* Final scoreboard */}
        <Scoreboard scores={scores} players={players} />

        {/* Play Again */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2 }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={handlePlayAgain}
          className="btn-glow w-full max-w-xs bg-neon text-dark-900 font-grotesk font-bold text-lg py-4 rounded-2xl shadow-neon hover:shadow-neon-strong transition-all"
        >
          Play Again
        </motion.button>
      </div>
    </div>
  );
}
