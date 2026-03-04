import { motion } from 'framer-motion';
import cx from 'classnames';

export default function VoteCard({
  text,
  index,
  isSelected,
  isDisabled,
  isOwn,
  onClick,
  result,       // { isReal, votes, authorName }
  showResult = false,
}) {
  const cardClass = cx(
    'relative rounded-2xl p-5 cursor-pointer transition-all duration-300 border',
    {
      'glass border-white/10 hover:border-neon/40 hover:shadow-neon': !isSelected && !showResult && !isDisabled,
      'glass-strong border-neon/60 shadow-neon-strong': isSelected && !showResult,
      'opacity-40 cursor-not-allowed': isDisabled,
      'border-neon/60 bg-neon/10': showResult && result?.isReal,
      'border-white/10 glass': showResult && !result?.isReal,
    }
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4, type: 'spring' }}
      whileHover={!isDisabled && !showResult ? { scale: 1.02 } : {}}
      whileTap={!isDisabled && !showResult ? { scale: 0.98 } : {}}
      onClick={() => !isDisabled && !showResult && onClick?.()}
      className={cardClass}
    >
      {/* Card number */}
      <div className="absolute top-3 left-3 w-6 h-6 rounded-full bg-white/5 flex items-center justify-center">
        <span className="text-[10px] text-white/40 font-mono">{index + 1}</span>
      </div>

      {/* Content */}
      <p className="text-white/90 text-sm md:text-base leading-relaxed pl-5">
        "{text}"
      </p>

      {/* Own message indicator */}
      {isOwn && !showResult && (
        <div className="mt-2 text-[10px] text-yellow-400/60 uppercase tracking-wider">
          Your message
        </div>
      )}

      {/* Result overlay */}
      {showResult && result && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-3 pt-3 border-t border-white/10"
        >
          {result.isReal ? (
            <div className="flex items-center gap-2">
              <span className="text-neon text-xs font-bold uppercase tracking-wider">
                ✦ Real Message
              </span>
              <span className="text-xs text-white/40">
                {result.votes?.length || 0} correct {result.votes?.length === 1 ? 'guess' : 'guesses'}
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/50">
                Written by <span className="text-white/80 font-medium">{result.authorName || 'Unknown'}</span>
              </span>
              {result.votes?.length > 0 && (
                <span className="text-xs text-red-400">
                  Fooled {result.votes.length} {result.votes.length === 1 ? 'player' : 'players'}
                </span>
              )}
            </div>
          )}
        </motion.div>
      )}

      {/* Selection indicator */}
      {isSelected && !showResult && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-3 right-3 w-6 h-6 rounded-full bg-neon flex items-center justify-center"
        >
          <span className="text-dark-900 text-xs font-bold">✓</span>
        </motion.div>
      )}
    </motion.div>
  );
}
