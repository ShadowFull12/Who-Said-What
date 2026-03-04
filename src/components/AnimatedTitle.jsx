import { motion } from 'framer-motion';

const letterVariants = {
  hidden: { opacity: 0, y: 50, rotateX: -90 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    rotateX: 0,
    transition: {
      delay: i * 0.06,
      duration: 0.6,
      type: 'spring',
      damping: 12,
    },
  }),
};

const glowVariants = {
  animate: {
    textShadow: [
      '0 0 10px #00ff88, 0 0 20px #00ff88, 0 0 40px #00ff88',
      '0 0 5px #00ff88, 0 0 10px #00ff88, 0 0 20px #00ff88',
      '0 0 15px #00ff88, 0 0 30px #00ff88, 0 0 50px #00ff88',
      '0 0 10px #00ff88, 0 0 20px #00ff88, 0 0 40px #00ff88',
    ],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

export default function AnimatedTitle({ small = false }) {
  const title = 'WHO SAID WHAT?';
  const letters = title.split('');

  return (
    <div className="flex flex-col items-center gap-2">
      <motion.div
        className="flex flex-wrap justify-center"
        variants={glowVariants}
        animate="animate"
      >
        {letters.map((letter, i) => (
          <motion.span
            key={i}
            custom={i}
            variants={letterVariants}
            initial="hidden"
            animate="visible"
            className={`font-grotesk font-bold text-neon inline-block ${
              small ? 'text-2xl md:text-3xl' : 'text-4xl md:text-6xl lg:text-7xl'
            } ${letter === ' ' ? 'w-3 md:w-5' : ''}`}
            style={{
              textShadow: '0 0 10px rgba(0, 255, 136, 0.6), 0 0 20px rgba(0, 255, 136, 0.4), 0 0 40px rgba(0, 255, 136, 0.2)',
            }}
          >
            {letter}
          </motion.span>
        ))}
      </motion.div>
      {!small && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="text-sm md:text-base text-gray-400 font-inter tracking-widest uppercase"
        >
          A Social Deduction Game
        </motion.p>
      )}
    </div>
  );
}
