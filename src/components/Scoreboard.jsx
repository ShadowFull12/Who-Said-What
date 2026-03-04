import { motion, AnimatePresence } from 'framer-motion';
import { getRankings } from '../game/scoring';

export default function Scoreboard({
  scores = {},
  players = {},
  roundScoreDeltas = {},
  showDeltas = false,
}) {
  const rankings = getRankings(scores);

  return (
    <div className="w-full max-w-md">
      <h3 className="text-sm text-gray-400 uppercase tracking-wider mb-4 font-grotesk text-center">
        Scoreboard
      </h3>
      <div className="space-y-2">
        <AnimatePresence>
          {rankings.map(({ playerId, score }, index) => {
            const player = players[playerId];
            if (!player) return null;
            const delta = roundScoreDeltas[playerId] || 0;

            return (
              <motion.div
                key={playerId}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1, duration: 0.4, type: 'spring' }}
                className="glass rounded-xl px-4 py-3 flex items-center gap-3"
              >
                {/* Rank */}
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    index === 0
                      ? 'bg-yellow-400 text-dark-900'
                      : index === 1
                      ? 'bg-gray-300 text-dark-900'
                      : index === 2
                      ? 'bg-amber-600 text-dark-900'
                      : 'bg-white/10 text-white/50'
                  }`}
                >
                  {index + 1}
                </div>

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

                {/* Score */}
                <div className="flex items-center gap-2">
                  <motion.span
                    className="text-neon font-grotesk font-bold text-lg"
                    key={score}
                    initial={{ scale: 1.3 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    {score}
                  </motion.span>

                  {/* Delta */}
                  {showDeltas && delta > 0 && (
                    <motion.span
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs text-green-400 font-mono"
                    >
                      +{delta}
                    </motion.span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
