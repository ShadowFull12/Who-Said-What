/**
 * Scoring system for Who Said What?
 *
 * +100 for each player fooled by your fake message
 * +150 for correctly guessing the real message
 * +50 bonus if nobody guessed the real message (shared among fakers)
 */

export const calculateRoundScores = (votes, realMessageId, players, messages) => {
  const scoreDeltas = {};
  const voterDetails = {};

  // Initialize deltas
  for (const playerId of Object.keys(players)) {
    scoreDeltas[playerId] = 0;
  }

  // Count votes for each option
  const voteCountPerOption = {};
  let correctGuessCount = 0;

  for (const [voterId, voteData] of Object.entries(votes)) {
    const votedFor = voteData.votedFor;

    if (!voteCountPerOption[votedFor]) {
      voteCountPerOption[votedFor] = [];
    }
    voteCountPerOption[votedFor].push(voterId);

    // +150 for correct guess
    if (votedFor === realMessageId) {
      scoreDeltas[voterId] = (scoreDeltas[voterId] || 0) + 150;
      correctGuessCount++;
      voterDetails[voterId] = { correct: true, votedFor };
    } else {
      voterDetails[voterId] = { correct: false, votedFor };
    }
  }

  // +100 for each person fooled by your fake message
  for (const [optionId, voterIds] of Object.entries(voteCountPerOption)) {
    if (optionId !== realMessageId && messages[optionId]) {
      // This is a player-written fake message
      const authorId = optionId; // option IDs are player IDs for fakes
      if (scoreDeltas[authorId] !== undefined) {
        scoreDeltas[authorId] += voterIds.length * 100;
      }
    }
  }

  // +50 bonus if nobody guessed the real one
  if (correctGuessCount === 0) {
    for (const playerId of Object.keys(players)) {
      if (messages[playerId]) {
        scoreDeltas[playerId] = (scoreDeltas[playerId] || 0) + 50;
      }
    }
  }

  return {
    scoreDeltas,
    voterDetails,
    voteCountPerOption,
    correctGuessCount,
    nobodyGuessedCorrectly: correctGuessCount === 0,
  };
};

export const getRankings = (scores) => {
  return Object.entries(scores)
    .map(([playerId, score]) => ({ playerId, score }))
    .sort((a, b) => b.score - a.score);
};
