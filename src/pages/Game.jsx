import { useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import MessageBubble from '../components/MessageBubble';
import Timer from '../components/Timer';
import TypingBox from '../components/TypingBox';
import BlurCard from '../components/BlurCard';
import BackgroundEffects from '../components/BackgroundEffects';
import useGameStore from '../store/gameStore';
import { onRoomUpdate, submitMessage as fbSubmitMessage } from '../firebase/firebaseService';
import { transitionToVoting } from '../game/gameEngine';

export default function Game() {
  const navigate = useNavigate();
  const transitioningRef = useRef(false);
  const {
    roomCode,
    player,
    isHost,
    round,
    totalRounds,
    conversation,
    timerEnd,
    players,
    hasSubmittedMessage,
    setConversation,
    setTimerEnd,
    setPhase,
    setRound,
    setPlayers,
    setHasSubmittedMessage,
    setShuffledOptions,
    setScores,
  } = useGameStore();

  // Listen to room updates
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
        setRound(gs.round);
        setTimerEnd(gs.timerEnd);
        if (roomData.conversations?.[gs.round]) {
          setConversation(roomData.conversations[gs.round]);
        }
      }

      if (gs?.phase === 'voting') {
        setPhase('voting');
        setTimerEnd(gs.timerEnd);
        if (roomData.shuffledOptions?.[gs.round]) {
          setShuffledOptions(roomData.shuffledOptions[gs.round]);
        }
        navigate('/voting');
      }
    });

    return () => unsubscribe();
  }, [roomCode, navigate, setPlayers, setConversation, setTimerEnd, setPhase, setRound, setShuffledOptions, setScores]);

  const handleSubmitMessage = useCallback(async (text) => {
    if (hasSubmittedMessage) return;
    try {
      await fbSubmitMessage(roomCode, round, player.id, text);
      setHasSubmittedMessage(true);
      toast.success('Message submitted!');
    } catch (err) {
      toast.error('Failed to submit');
    }
  }, [roomCode, round, player?.id, hasSubmittedMessage, setHasSubmittedMessage]);

  const handleTimerComplete = useCallback(async () => {
    // Auto-submit empty if not submitted
    if (!hasSubmittedMessage) {
      try {
        await fbSubmitMessage(roomCode, round, player.id, '...');
        setHasSubmittedMessage(true);
      } catch (e) {
        console.error(e);
      }
    }

    // Host transitions to voting
    if (isHost && !transitioningRef.current) {
      transitioningRef.current = true;
      try {
        // Small delay to let last-second submissions arrive
        await new Promise((r) => setTimeout(r, 2000));
        await transitionToVoting(roomCode, round, conversation, players);
      } catch (err) {
        console.error('Failed to transition to voting:', err);
      }
      transitioningRef.current = false;
    }
  }, [roomCode, round, player?.id, isHost, conversation, players, hasSubmittedMessage, setHasSubmittedMessage]);

  if (!conversation) {
    return (
      <div className="min-h-screen flex items-center justify-center relative">
        <BackgroundEffects />
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="text-white/40 text-lg font-grotesk relative z-10"
        >
          Loading conversation...
        </motion.div>
      </div>
    );
  }

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

        {/* Conversation */}
        <BlurCard className="w-full flex flex-col gap-4">
          <div className="text-[10px] text-white/30 uppercase tracking-widest text-center mb-2">
            Intercepted Conversation
          </div>

          {/* Character A */}
          <MessageBubble
            type="a"
            character={conversation.characterA?.name || 'Character A'}
            message={conversation.characterA?.message || conversation.characterA}
            delay={0.2}
          />

          {/* Missing Message */}
          <MessageBubble
            type="missing"
            character="???"
            delay={0.5}
          />

          {/* Character B */}
          <MessageBubble
            type="b"
            character={conversation.characterB?.name || 'Character B'}
            message={conversation.characterB?.message || conversation.characterB}
            delay={0.8}
          />
        </BlurCard>

        {/* Input */}
        <AnimatePresence mode="wait">
          {hasSubmittedMessage ? (
            <motion.div
              key="submitted"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass rounded-2xl px-6 py-4 text-center"
            >
              <p className="text-neon text-sm font-semibold">Message Submitted ✓</p>
              <p className="text-white/30 text-xs mt-1">Waiting for other players...</p>
              <motion.div
                animate={{ opacity: [0.3, 0.7, 0.3] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="flex justify-center gap-1 mt-3"
              >
                <span className="w-1.5 h-1.5 bg-neon/40 rounded-full" />
                <span className="w-1.5 h-1.5 bg-neon/40 rounded-full" />
                <span className="w-1.5 h-1.5 bg-neon/40 rounded-full" />
              </motion.div>
            </motion.div>
          ) : (
            <motion.div key="input" className="w-full">
              <TypingBox
                onSubmit={handleSubmitMessage}
                placeholder="Type what you think the missing message is..."
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
