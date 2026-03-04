import { motion, AnimatePresence } from 'framer-motion';

export default function PlayerList({ players = {}, hostId = null }) {
  const playerEntries = Object.entries(players);

  return (
    <div className="w-full max-w-sm">
      <h3 className="text-sm text-gray-400 uppercase tracking-wider mb-3 font-grotesk">
        Players ({playerEntries.length}/10)
      </h3>
      <div className="space-y-2">
        <AnimatePresence>
          {playerEntries.map(([id, player], index) => (
            <motion.div
              key={id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
              className="glass rounded-xl px-4 py-3 flex items-center gap-3"
            >
              {/* Avatar */}
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-dark-900 shrink-0"
                style={{ backgroundColor: player.color || '#00ff88' }}
              >
                {player.name?.charAt(0)?.toUpperCase()}
              </div>

              {/* Name */}
              <span className="text-white/90 text-sm font-medium flex-1 truncate">
                {player.name}
              </span>

              {/* Host badge */}
              {player.isHost && (
                <span className="text-[10px] uppercase tracking-wider text-neon bg-neon/10 px-2 py-0.5 rounded-full border border-neon/20">
                  Host
                </span>
              )}

              {/* Connection status */}
              <div
                className={`w-2 h-2 rounded-full ${
                  player.connected ? 'bg-neon' : 'bg-red-500'
                }`}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
