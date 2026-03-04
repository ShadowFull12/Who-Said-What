import { useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import VoteCard from '../components/VoteCard';
import Timer from '../components/Timer';
import BlurCard from '../components/BlurCard';
import BackgroundEffects from '../components/BackgroundEffects';
import useGameStore from '../store/gameStore';
import {
  onRoomUpdate,
  submitVote as fbSubmitVote,
} from '../firebase/firebaseService';
import { processResults } from '../game/gameEngine';

export default function Voting() {
  const navigate = useNavigate();
  const processingRef = useRef(false);
  const {
    roomCode,
    player,
    isHost,
    round,
    totalRounds,
    timerEnd,
    players,
    shuffledOptions,
    selectedVote,
    hasSubmittedVote,
    setTimerEnd,
    setPhase,
    setPlayers,
    setSelectedVote,
    setHasSubmittedVote,
    setShuffledOptions,
    setScores,
    setRoundScoreDeltas,
    setRoundResults,
    setAllMessages,
    setAllVotes,
  } = useGameStore();

  useEffect(() => {
    if (!roomCode) {
      navigate('/');
      return;
    }

    const unsubscribe = onRoomUpdate(roomCode, (roomData) => {
      if (roomData.players) setPlayers(roomData.players);
      if (roomData.scores) setScores(roomData.scores);

      const gs = roomData.gameState;

      if (gs?.phase === 'voting') {
        setTimerEnd(gs.timerEnd);
        if (roomData.shuffledOptions?.[gs.round]) {
          setShuffledOptions(roomData.shuffledOptions[gs.round]);
        }
      }

      if (gs?.phase === 'results') {
        setPhase('results');
        if (roomData.roundResults?.[gs.round]) {
          const results = roomData.roundResults[gs.round];
          setRoundResults(results);
          setRoundScoreDeltas(results.scoreDeltas || {});
          setScores(results.scores || {});
        }
        if (roomData.messages?.[gs.round]) {
          setAllMessages(roomData.messages[gs.round]);
        }
        if (roomData.votes?.[gs.round]) {
          setAllVotes(roomData.votes[gs.round]);
        }
        navigate('/results');
      }
    });

    return () => unsubscribe();
  }, [roomCode, navigate, round, setPlayers, setTimerEnd, setPhase, setShuffledOptions, setScores, setRoundScoreDeltas, setRoundResults, setAllMessages, setAllVotes]);

  const handleVote = useCallback(async (optionId) => {
    if (hasSubmittedVote) return;
    setSelectedVote(optionId);

    try {
      await fbSubmitVote(roomCode, round, player.id, optionId);
      setHasSubmittedVote(true);
      toast.success('Vote submitted!');
    } catch (err) {
      toast.error('Failed to vote');
      setSelectedVote(null);
    }
  }, [roomCode, round, player?.id, hasSubmittedVote, setSelectedVote, setHasSubmittedVote]);

  const handleTimerComplete = useCallback(async () => {
    // Auto-vote randomly if not voted
    if (!hasSubmittedVote && shuffledOptions.length > 0) {
      const validOptions = shuffledOptions.filter((o) => o.id !== player.id);
      if (validOptions.length > 0) {
        const random = validOptions[Math.floor(Math.random() * validOptions.length)];
        try {
          await fbSubmitVote(roomCode, round, player.id, random.id);
          setSelectedVote(random.id);
          setHasSubmittedVote(true);
        } catch (e) {
          console.error(e);
        }
      }
    }

    // Host processes results
    if (isHost && !processingRef.current) {
      processingRef.current = true;
      try {
        await new Promise((r) => setTimeout(r, 2000));
        // Build messages map from shuffledOptions
        const messagesMap = {};
        for (const opt of shuffledOptions) {
          if (!opt.isReal) {
            messagesMap[opt.id] = { text: opt.text };
          }
        }
        await processResults(roomCode, round, players, messagesMap);
      } catch (err) {
        console.error('Failed to process results:', err);
      }
      processingRef.current = false;
    }
  }, [roomCode, round, player?.id, isHost, shuffledOptions, players, hasSubmittedVote, setSelectedVote, setHasSubmittedVote]);

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-8 relative">
      <BackgroundEffects />

      <div className="relative z-10 flex flex-col items-center gap-6 w-full max-w-xl">
        {/* Header */}
        <div className="flex items-center justify-between w-full">
          <div className="text-sm text-white/40 font-grotesk">
            Round <span className="text-neon font-bold">{round}</span> / {totalRounds}
          </div>
          <Timer endTime={timerEnd} onComplete={handleTimerComplete} />
        </div>

        {/* Title */}
        <BlurCard className="w-full text-center">
          <h2 className="text-xl font-grotesk font-bold text-white/90 mb-1">
            Which is the <span className="text-neon">real</span> message?
          </h2>
          <p className="text-xs text-white/40">Select the message you think was the original</p>
        </BlurCard>

        {/* Vote cards */}
        <div className="w-full space-y-3">
          {shuffledOptions.map((option, index) => {
            const isOwn = option.id === player?.id;
            return (
              <VoteCard
                key={option.id}
                text={option.text}
                index={index}
                isSelected={selectedVote === option.id}
                isDisabled={isOwn || hasSubmittedVote}
                isOwn={isOwn}
                onClick={() => handleVote(option.id)}
              />
            );
          })}
        </div>

        {hasSubmittedVote && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass rounded-xl px-4 py-3 text-center"
          >
            <p className="text-neon text-sm">Vote locked in ✓</p>
            <p className="text-white/30 text-xs mt-1">Waiting for all votes...</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
