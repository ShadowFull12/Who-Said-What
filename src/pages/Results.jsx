import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import VoteCard from '../components/VoteCard';
import Scoreboard from '../components/Scoreboard';
import BlurCard from '../components/BlurCard';
import BackgroundEffects from '../components/BackgroundEffects';
import useGameStore from '../store/gameStore';
import {
  onRoomUpdate,
  updateGameState,
} from '../firebase/firebaseService';
import { startRound, advanceGame } from '../game/gameEngine';

export default function Results() {
  const navigate = useNavigate();
  const {
    roomCode,
    player,
    isHost,
    round,
    totalRounds,
    players,
    scores,
    roundScoreDeltas,
    roundResults,
    shuffledOptions,
    conversation,
    setPhase,
    setRound,
    setPlayers,
    setScores,
    setConversation,
    setTimerEnd,
    setShuffledOptions,
    setRoundResults,
    setRoundScoreDeltas,
    resetRoundState,
    setHasSubmittedMessage,
    setHasSubmittedVote,
    setSelectedVote,
  } = useGameStore();

  // Fire confetti if player scored this round
  useEffect(() => {
    const delta = roundScoreDeltas[player?.id] || 0;
    if (delta > 0) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#00ff88', '#00d4ff', '#6366f1'],
      });
    }
  }, [roundScoreDeltas, player?.id]);

  useEffect(() => {
    if (!roomCode) {
      navigate('/');
      return;
    }

    const unsubscribe = onRoomUpdate(roomCode, (roomData) => {
      if (roomData.players) setPlayers(roomData.players);
      if (roomData.scores) setScores(roomData.scores);

      const gs = roomData.gameState;

      if (gs?.phase === 'writing') {
        // New round started
        resetRoundState();
        setRound(gs.round);
        setTimerEnd(gs.timerEnd);
        setPhase('writing');
        if (roomData.conversations?.[gs.round]) {
          setConversation(roomData.conversations[gs.round]);
        }
        navigate('/game');
      }

      if (gs?.phase === 'finalScores') {
        setPhase('finalScores');
        navigate('/final');
      }
    });

    return () => unsubscribe();
  }, [roomCode, navigate, setPlayers, setScores, setRound, setTimerEnd, setPhase, setConversation, resetRoundState]);

  // Build results for cards
  const buildCardResult = useCallback((option) => {
    if (!roundResults) return null;

    const votesForThis = [];
    if (roundResults.voteCountPerOption?.[option.id]) {
      for (const voterId of roundResults.voteCountPerOption[option.id]) {
        votesForThis.push(players[voterId]?.name || voterId);
      }
    }

    return {
      isReal: option.isReal,
      authorName: option.authorId ? players[option.authorId]?.name : null,
      votes: votesForThis,
    };
  }, [roundResults, players]);

  const handleNextRound = useCallback(async () => {
    try {
      const result = await advanceGame(roomCode, round, totalRounds);
      if (result === 'finalScores') {
        await updateGameState(roomCode, { phase: 'finalScores' });
      } else {
        await startRound(roomCode, round + 1);
      }
    } catch (err) {
      console.error(err);
    }
  }, [roomCode, round, totalRounds]);

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-8 relative">
      <BackgroundEffects />

      <div className="relative z-10 flex flex-col items-center gap-6 w-full max-w-xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h2 className="text-2xl font-grotesk font-bold text-white/90">
            Round {round} Results
          </h2>
          {roundResults?.nobodyGuessedCorrectly && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-red-400 text-sm mt-2"
            >
              Nobody guessed the real message! +50 bonus to all fakers
            </motion.p>
          )}
        </motion.div>

        {/* Real message reveal */}
        {conversation && (
          <BlurCard className="w-full text-center">
            <p className="text-[10px] text-white/30 uppercase tracking-widest mb-2">
              The Real Message Was
            </p>
            <p className="text-neon text-lg font-medium">
              "{conversation.realMessage}"
            </p>
          </BlurCard>
        )}

        {/* Vote results */}
        <div className="w-full space-y-3">
          {shuffledOptions.map((option, index) => (
            <VoteCard
              key={option.id}
              text={option.text}
              index={index}
              showResult
              result={buildCardResult(option)}
            />
          ))}
        </div>

        {/* Scoreboard */}
        <Scoreboard
          scores={scores}
          players={players}
          roundScoreDeltas={roundScoreDeltas}
          showDeltas
        />

        {/* Next Round button (host only) */}
        {isHost && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleNextRound}
            className="btn-glow w-full max-w-xs bg-neon text-dark-900 font-grotesk font-bold text-lg py-4 rounded-2xl shadow-neon hover:shadow-neon-strong transition-all"
          >
            {round >= totalRounds ? 'Final Scores' : `Next Round (${round + 1}/${totalRounds})`}
          </motion.button>
        )}

        {!isHost && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-white/30 text-sm"
          >
            Waiting for host to continue...
          </motion.p>
        )}
      </div>
    </div>
  );
}
