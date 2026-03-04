import {
  ref,
  set,
  get,
  update,
  onValue,
  push,
  remove,
  onDisconnect,
  serverTimestamp,
} from 'firebase/database';
import { db } from './firebaseConfig';
import { customAlphabet } from 'nanoid';

const generateCode = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 5);

const AVATAR_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
  '#BB8FCE', '#85C1E9',
];

// ─── Room Management ────────────────────────────────────────

export const createRoom = async (playerName, userId) => {
  const roomCode = generateCode();
  const roomRef = ref(db, `rooms/${roomCode}`);

  const color = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];

  await set(roomRef, {
    host: userId,
    createdAt: Date.now(),
    gameState: {
      phase: 'lobby',
      round: 0,
      totalRounds: 5,
      timerEnd: null,
    },
    players: {
      [userId]: {
        name: playerName,
        color,
        isHost: true,
        connected: true,
        joinedAt: Date.now(),
      },
    },
    scores: {
      [userId]: 0,
    },
  });

  // Disconnect cleanup
  const playerRef = ref(db, `rooms/${roomCode}/players/${userId}/connected`);
  onDisconnect(playerRef).set(false);

  return roomCode;
};

export const joinRoom = async (roomCode, playerName, userId) => {
  const roomRef = ref(db, `rooms/${roomCode}`);
  const snapshot = await get(roomRef);

  if (!snapshot.exists()) {
    throw new Error('Room not found');
  }

  const roomData = snapshot.val();

  if (roomData.gameState?.phase !== 'lobby') {
    throw new Error('Game already in progress');
  }

  const playerCount = roomData.players ? Object.keys(roomData.players).length : 0;
  if (playerCount >= 10) {
    throw new Error('Room is full (max 10 players)');
  }

  const usedColors = roomData.players
    ? Object.values(roomData.players).map((p) => p.color)
    : [];
  const availableColors = AVATAR_COLORS.filter((c) => !usedColors.includes(c));
  const color = availableColors.length > 0
    ? availableColors[Math.floor(Math.random() * availableColors.length)]
    : AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];

  await update(ref(db, `rooms/${roomCode}/players/${userId}`), {
    name: playerName,
    color,
    isHost: false,
    connected: true,
    joinedAt: Date.now(),
  });

  await update(ref(db, `rooms/${roomCode}/scores`), {
    [userId]: 0,
  });

  const playerRef = ref(db, `rooms/${roomCode}/players/${userId}/connected`);
  onDisconnect(playerRef).set(false);

  return roomData;
};

// ─── Game State ─────────────────────────────────────────────

export const updateGameState = async (roomCode, stateUpdate) => {
  const stateRef = ref(db, `rooms/${roomCode}/gameState`);
  await update(stateRef, stateUpdate);
};

export const setConversation = async (roomCode, round, conversation) => {
  const convRef = ref(db, `rooms/${roomCode}/conversations/${round}`);
  await set(convRef, conversation);
};

// ─── Messages ───────────────────────────────────────────────

export const submitMessage = async (roomCode, round, userId, message) => {
  const msgRef = ref(db, `rooms/${roomCode}/messages/${round}/${userId}`);
  await set(msgRef, {
    text: message,
    submittedAt: Date.now(),
  });
};

export const getMessages = async (roomCode, round) => {
  const msgRef = ref(db, `rooms/${roomCode}/messages/${round}`);
  const snapshot = await get(msgRef);
  return snapshot.exists() ? snapshot.val() : {};
};

// ─── Voting ─────────────────────────────────────────────────

export const submitVote = async (roomCode, round, voterId, votedForId) => {
  const voteRef = ref(db, `rooms/${roomCode}/votes/${round}/${voterId}`);
  await set(voteRef, {
    votedFor: votedForId,
    submittedAt: Date.now(),
  });
};

export const getVotes = async (roomCode, round) => {
  const voteRef = ref(db, `rooms/${roomCode}/votes/${round}`);
  const snapshot = await get(voteRef);
  return snapshot.exists() ? snapshot.val() : {};
};

// ─── Scores ─────────────────────────────────────────────────

export const updateScores = async (roomCode, scoreUpdates) => {
  const scoresRef = ref(db, `rooms/${roomCode}/scores`);
  const snapshot = await get(scoresRef);
  const currentScores = snapshot.exists() ? snapshot.val() : {};

  const newScores = { ...currentScores };
  for (const [playerId, points] of Object.entries(scoreUpdates)) {
    newScores[playerId] = (newScores[playerId] || 0) + points;
  }

  await set(scoresRef, newScores);
  return newScores;
};

// ─── Shuffled Options ───────────────────────────────────────

export const setShuffledOptions = async (roomCode, round, options) => {
  const optRef = ref(db, `rooms/${roomCode}/shuffledOptions/${round}`);
  await set(optRef, options);
};

// ─── Round Results ──────────────────────────────────────────

export const setRoundResults = async (roomCode, round, results) => {
  const resRef = ref(db, `rooms/${roomCode}/roundResults/${round}`);
  await set(resRef, results);
};

// ─── Listeners ──────────────────────────────────────────────

export const onRoomUpdate = (roomCode, callback) => {
  const roomRef = ref(db, `rooms/${roomCode}`);
  return onValue(roomRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val());
    }
  });
};

export const onGameStateUpdate = (roomCode, callback) => {
  const stateRef = ref(db, `rooms/${roomCode}/gameState`);
  return onValue(stateRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val());
    }
  });
};

// ─── Cleanup ────────────────────────────────────────────────

export const deleteRoom = async (roomCode) => {
  const roomRef = ref(db, `rooms/${roomCode}`);
  await remove(roomRef);
};
