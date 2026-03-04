import { motion } from 'framer-motion';
import cx from 'classnames';

const variants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.4, type: 'spring', damping: 15 },
  },
};

export default function MessageBubble({
  type = 'a',       // 'a' | 'b' | 'missing'
  character = '',
  message = '',
  animate = true,
  delay = 0,
}) {
  const bubbleClass = cx(
    'rounded-2xl px-5 py-4 max-w-md w-full backdrop-blur-sm',
    {
      'bubble-a': type === 'a',
      'bubble-b': type === 'b',
      'bubble-missing': type === 'missing',
    }
  );

  const alignClass = cx('flex flex-col gap-1', {
    'items-start': type === 'a',
    'items-end': type === 'b',
    'items-center': type === 'missing',
  });

  const nameColor = cx('text-xs font-semibold tracking-wider uppercase', {
    'text-blue-400': type === 'a',
    'text-purple-400': type === 'b',
    'text-neon': type === 'missing',
  });

  return (
    <motion.div
      className={alignClass}
      variants={animate ? variants : undefined}
      initial={animate ? 'hidden' : undefined}
      animate={animate ? 'visible' : undefined}
      transition={animate ? { delay } : undefined}
    >
      {character && <span className={nameColor}>{character}</span>}
      <div className={bubbleClass}>
        <p className="text-white/90 text-sm md:text-base leading-relaxed">
          {type === 'missing' && !message ? (
            <span className="text-neon/70 italic">??? Missing Message ???</span>
          ) : (
            `"${message}"`
          )}
        </p>
      </div>
    </motion.div>
  );
}
