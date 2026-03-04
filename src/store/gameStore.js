import { create } from 'zustand';

const useGameStore = create((set, get) => ({
  // ─── Player ───────────────────────────
  player: {
    id: null,
    name: '',
    color: '#00ff88',
  },
  setPlayer: (player) => set({ player: { ...get().player, ...player } }),

  // ─── Room ─────────────────────────────
  roomCode: null,
  isHost: false,
  players: {},
  setRoomCode: (code) => set({ roomCode: code }),
  setIsHost: (val) => set({ isHost: val }),
  setPlayers: (players) => set({ players }),

  // ─── Game State ───────────────────────
  phase: 'menu', // menu | lobby | writing | voting | results | finalScores
  round: 0,
  totalRounds: 5,
  setPhase: (phase) => set({ phase }),
  setRound: (round) => set({ round }),

  // ─── Conversation ─────────────────────
  conversation: null,
  setConversation: (conv) => set({ conversation: conv }),

  // ─── Messages ─────────────────────────
  playerMessage: '',
  allMessages: {},
  setPlayerMessage: (msg) => set({ playerMessage: msg }),
  setAllMessages: (msgs) => set({ allMessages: msgs }),

  // ─── Shuffled Options ─────────────────
  shuffledOptions: [],
  setShuffledOptions: (opts) => set({ shuffledOptions: opts }),

  // ─── Votes ────────────────────────────
  selectedVote: null,
  allVotes: {},
  setSelectedVote: (vote) => set({ selectedVote: vote }),
  setAllVotes: (votes) => set({ allVotes: votes }),

  // ─── Scores ───────────────────────────
  scores: {},
  roundScoreDeltas: {},
  setScores: (scores) => set({ scores }),
  setRoundScoreDeltas: (deltas) => set({ roundScoreDeltas: deltas }),

  // ─── Round Results ────────────────────
  roundResults: null,
  setRoundResults: (results) => set({ roundResults: results }),

  // ─── Timer ────────────────────────────
  timerEnd: null,
  setTimerEnd: (end) => set({ timerEnd: end }),

  // ─── Submitted State ──────────────────
  hasSubmittedMessage: false,
  hasSubmittedVote: false,
  setHasSubmittedMessage: (val) => set({ hasSubmittedMessage: val }),
  setHasSubmittedVote: (val) => set({ hasSubmittedVote: val }),

  // ─── Reset Round State ────────────────
  resetRoundState: () => set({
    conversation: null,
    playerMessage: '',
    allMessages: {},
    shuffledOptions: [],
    selectedVote: null,
    allVotes: {},
    roundScoreDeltas: {},
    roundResults: null,
    hasSubmittedMessage: false,
    hasSubmittedVote: false,
  }),

  // ─── Full Reset ───────────────────────
  resetGame: () => set({
    roomCode: null,
    isHost: false,
    players: {},
    phase: 'menu',
    round: 0,
    conversation: null,
    playerMessage: '',
    allMessages: {},
    shuffledOptions: [],
    selectedVote: null,
    allVotes: {},
    scores: {},
    roundScoreDeltas: {},
    roundResults: null,
    timerEnd: null,
    hasSubmittedMessage: false,
    hasSubmittedVote: false,
  }),
}));

export default useGameStore;
