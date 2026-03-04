import { motion, useAnimation } from 'framer-motion';
import { useEffect, useState } from 'react';

// Mystery glitch: random letters briefly flicker to different characters
const GLITCH_CHARS = '!@#$%&?<>░▒▓█▀▄';

const letterVariants = {
  hidden: { opacity: 0, y: 60, rotateX: -90, filter: 'blur(8px)' },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    rotateX: 0,
    filter: 'blur(0px)',
    transition: {
      delay: i * 0.07,
      duration: 0.7,
      type: 'spring',
      damping: 12,
    },
  }),
};

// Suspense flicker animation per letter
const flickerVariants = {
  idle: (i) => ({
    opacity: [1, 0.3, 1, 1, 0.6, 1],
    scaleY: [1, 1.05, 0.97, 1],
    transition: {
      delay: i * 0.3 + Math.random() * 2,
      duration: 0.3,
      repeat: Infinity,
      repeatDelay: 3 + Math.random() * 5,
      ease: 'easeInOut',
    },
  }),
};

function GlitchLetter({ letter, index, small }) {
  const [displayChar, setDisplayChar] = useState(letter);

  useEffect(() => {
    if (letter === ' ') return;
    const glitch = () => {
      // Random glitch: briefly show a random character
      setDisplayChar(GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)]);
      setTimeout(() => setDisplayChar(letter), 80);
    };
    const interval = setInterval(() => {
      if (Math.random() < 0.15) glitch(); // 15% chance each tick
    }, 2000 + Math.random() * 3000);
    return () => clearInterval(interval);
  }, [letter]);

  return (
    <motion.span
      custom={index}
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
      <motion.span
        custom={index}
        variants={flickerVariants}
        animate="idle"
        className="inline-block"
      >
        {displayChar}
      </motion.span>
    </motion.span>
  );
}

export default function AnimatedTitle({ small = false }) {
  const words = ['WHO', 'SAID', 'WHAT?'];

  // Pulsing glow on the entire title
  const containerGlow = {
    animate: {
      textShadow: [
        '0 0 10px #00ff88, 0 0 20px #00ff88, 0 0 40px #00ff88',
        '0 0 4px #00ff88, 0 0 8px #00ff88, 0 0 16px #00ff88',
        '0 0 20px #00ff88, 0 0 40px #00ff88, 0 0 80px #00ff88',
        '0 0 10px #00ff88, 0 0 20px #00ff88, 0 0 40px #00ff88',
      ],
      transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
    },
  };

  let globalIndex = 0;

  return (
    <div className="flex flex-col items-center gap-2">
      <motion.div
        className="flex flex-wrap justify-center gap-x-3 md:gap-x-5 whitespace-nowrap"
        variants={containerGlow}
        animate="animate"
      >
        {words.map((word, wi) => (
          <span key={wi} className="inline-flex whitespace-nowrap">
            {word.split('').map((letter) => {
              const idx = globalIndex++;
              return <GlitchLetter key={idx} letter={letter} index={idx} small={small} />;
            })}
          </span>
        ))}
      </motion.div>

      {/* Suspense tagline */}
      {!small && (
        <motion.p
          initial={{ opacity: 0, letterSpacing: '0.5em' }}
          animate={{ opacity: 0.5, letterSpacing: '0.3em' }}
          transition={{ delay: 1.2, duration: 1.2, ease: 'easeOut' }}
          className="text-sm md:text-base text-gray-400 font-inter tracking-widest uppercase"
        >
          A Social Deduction Game
        </motion.p>
      )}
    </div>
  );
}
