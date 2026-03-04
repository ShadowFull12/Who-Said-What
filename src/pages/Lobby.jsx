import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import AnimatedTitle from '../components/AnimatedTitle';
import PlayerList from '../components/PlayerList';
import BlurCard from '../components/BlurCard';
import BackgroundEffects from '../components/BackgroundEffects';
import useGameStore from '../store/gameStore';
import { onRoomUpdate } from '../firebase/firebaseService';
import { startRound } from '../game/gameEngine';

export default function Lobby() {
  const navigate = useNavigate();
  const {
    roomCode,
    player,
    isHost,
    players,
    setPlayers,
    setPhase,
    setRound,
    setConversation,
    setTimerEnd,
    setScores,
  } = useGameStore();

  // Listen to room updates
  useEffect(() => {
    if (!roomCode) {
      navigate('/');
      return;
    }

    const unsubscribe = onRoomUpdate(roomCode, (roomData) => {
      if (roomData.players) {
        setPlayers(roomData.players);
      }
      if (roomData.scores) {
        setScores(roomData.scores);
      }

      // If host started the game, navigate all players
      const gs = roomData.gameState;
      if (gs?.phase === 'writing') {
        setPhase('writing');
        setRound(gs.round);
        setTimerEnd(gs.timerEnd);
        if (roomData.conversations?.[gs.round]) {
          setConversation(roomData.conversations[gs.round]);
        }
        navigate('/game');
      }
    });

    return () => unsubscribe();
  }, [roomCode, navigate, setPlayers, setPhase, setRound, setConversation, setTimerEnd, setScores]);

  const handleStartGame = useCallback(async () => {
    const playerCount = Object.keys(players).length;
    if (playerCount < 2) {
      toast.error('Need at least 2 players to start');
      return;
    }

    try {
      toast.loading('Generating conversation...', { id: 'start' });
      await startRound(roomCode, 1);
      toast.dismiss('start');
    } catch (err) {
      toast.dismiss('start');
      toast.error('Failed to start game');
      console.error(err);
    }
  }, [roomCode, players]);

  const copyCode = () => {
    navigator.clipboard.writeText(roomCode);
    toast.success('Room code copied!');
  };

  if (!roomCode) return null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 relative">
      <BackgroundEffects />

      <div className="relative z-10 flex flex-col items-center gap-8 w-full max-w-md">
        <AnimatedTitle small />

        {/* Room code */}
        <BlurCard className="flex flex-col items-center gap-3 w-full">
          <p className="text-xs text-white/40 uppercase tracking-widest">Room Code</p>
          <motion.button
            onClick={copyCode}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="font-mono text-4xl font-bold text-neon tracking-[0.4em] cursor-pointer hover:text-neon/80 transition-all"
            title="Click to copy"
          >
            {roomCode}
          </motion.button>
          <p className="text-[11px] text-white/30">Click to copy • Share with friends</p>
        </BlurCard>

        {/* Players */}
        <PlayerList players={players} hostId={player?.id} />

        {/* Start button (host only) */}
        {isHost && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleStartGame}
            className="btn-glow w-full max-w-xs bg-neon text-dark-900 font-grotesk font-bold text-lg py-4 rounded-2xl shadow-neon hover:shadow-neon-strong transition-all"
          >
            Start Game
          </motion.button>
        )}

        {!isHost && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <p className="text-white/40 text-sm">Waiting for host to start...</p>
            <motion.div
              animate={{ opacity: [0.3, 0.7, 0.3] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="flex justify-center gap-1 mt-3"
            >
              <span className="w-2 h-2 bg-neon/40 rounded-full" />
              <span className="w-2 h-2 bg-neon/40 rounded-full" />
              <span className="w-2 h-2 bg-neon/40 rounded-full" />
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
