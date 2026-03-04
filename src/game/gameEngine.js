import {
  updateGameState,
  setConversation as fbSetConversation,
  submitMessage as fbSubmitMessage,
  getMessages,
  submitVote as fbSubmitVote,
  getVotes,
  updateScores,
  setShuffledOptions as fbSetShuffledOptions,
  setRoundResults as fbSetRoundResults,
} from '../firebase/firebaseService';
import { generateConversation } from './geminiService';
import { calculateRoundScores } from './scoring';

/**
 * Shuffle array using Fisher-Yates
 */
const shuffleArray = (arr) => {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

/**
 * Start a new round
 */
export const startRound = async (roomCode, roundNumber) => {
  // Generate conversation
  const conversation = await generateConversation();

  // Save conversation to Firebase
  await fbSetConversation(roomCode, roundNumber, conversation);

  // Set timer: 25 seconds from now
  const timerEnd = Date.now() + 25000;

  // Update game state
  await updateGameState(roomCode, {
    phase: 'writing',
    round: roundNumber,
    timerEnd,
  });

  return conversation;
};

/**
 * Transition to voting phase after writing
 */
export const transitionToVoting = async (roomCode, round, conversation, players) => {
  // Get all submitted messages
  const messages = await getMessages(roomCode, round);

  // Build options: player messages + real message
  const options = [];

  // Add player messages
  for (const [playerId, msgData] of Object.entries(messages)) {
    options.push({
      id: playerId,
      text: msgData.text,
      isReal: false,
      authorId: playerId,
    });
  }

  // Add real message
  options.push({
    id: '_real_',
    text: conversation.realMessage,
    isReal: true,
    authorId: null,
  });

  // Shuffle
  const shuffled = shuffleArray(options);

  // Save to Firebase
  await fbSetShuffledOptions(roomCode, round, shuffled);

  // Set timer: 20 seconds for voting
  const timerEnd = Date.now() + 20000;

  await updateGameState(roomCode, {
    phase: 'voting',
    timerEnd,
  });

  return shuffled;
};

/**
 * Process votes and calculate scores
 */
export const processResults = async (roomCode, round, players, messages) => {
  const votes = await getVotes(roomCode, round);

  const result = calculateRoundScores(votes, '_real_', players, messages);

  // Update scores in Firebase
  const newScores = await updateScores(roomCode, result.scoreDeltas);

  // Save round results
  const roundResults = {
    ...result,
    scores: newScores,
  };

  await fbSetRoundResults(roomCode, round, roundResults);

  await updateGameState(roomCode, {
    phase: 'results',
    timerEnd: null,
  });

  return roundResults;
};

/**
 * Move to next round or final scores
 */
export const advanceGame = async (roomCode, currentRound, totalRounds) => {
  if (currentRound >= totalRounds) {
    await updateGameState(roomCode, {
      phase: 'finalScores',
      timerEnd: null,
    });
    return 'finalScores';
  }

  return 'nextRound';
};
