import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function Timer({ endTime, onComplete, size = 80 }) {
  const [timeLeft, setTimeLeft] = useState(0);
  const [totalTime, setTotalTime] = useState(0);

  useEffect(() => {
    if (!endTime) return;

    const total = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
    setTotalTime(total);
    setTimeLeft(total);

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
      setTimeLeft(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        onComplete?.();
      }
    }, 100);

    return () => clearInterval(interval);
  }, [endTime, onComplete]);

  const progress = totalTime > 0 ? timeLeft / totalTime : 0;
  const circumference = 2 * Math.PI * 36;
  const offset = circumference * (1 - progress);

  const isUrgent = timeLeft <= 5;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 80 80" className="-rotate-90">
        {/* Background circle */}
        <circle
          cx="40"
          cy="40"
          r="36"
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="4"
        />
        {/* Progress circle */}
        <motion.circle
          cx="40"
          cy="40"
          r="36"
          fill="none"
          stroke={isUrgent ? '#ff4444' : '#00ff88'}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            filter: isUrgent
              ? 'drop-shadow(0 0 6px rgba(255, 68, 68, 0.5))'
              : 'drop-shadow(0 0 6px rgba(0, 255, 136, 0.5))',
          }}
        />
      </svg>
      <motion.span
        className={`absolute font-grotesk font-bold text-lg ${
          isUrgent ? 'text-red-400' : 'text-neon'
        }`}
        animate={isUrgent ? { scale: [1, 1.1, 1] } : {}}
        transition={{ repeat: Infinity, duration: 0.5 }}
      >
        {timeLeft}
      </motion.span>
    </div>
  );
}
