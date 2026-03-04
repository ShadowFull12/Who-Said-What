import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function TypingBox({
  onSubmit,
  disabled = false,
  maxLength = 150,
  placeholder = 'Type the missing message...',
}) {
  const [text, setText] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = () => {
    if (text.trim() && !disabled) {
      onSubmit(text.trim());
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`w-full max-w-lg mx-auto rounded-2xl p-[1px] ${
        isFocused ? 'bg-gradient-to-r from-neon/50 to-cyan-glow/50' : 'bg-white/10'
      } transition-all duration-300`}
    >
      <div className="glass-strong rounded-2xl p-4">
        <textarea
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, maxLength))}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          disabled={disabled}
          placeholder={placeholder}
          rows={2}
          className="w-full bg-transparent text-white/90 text-sm md:text-base resize-none outline-none placeholder:text-white/20 font-inter leading-relaxed"
        />

        <div className="flex items-center justify-between mt-2">
          <span className="text-[11px] text-white/30 font-mono">
            {text.length}/{maxLength}
          </span>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSubmit}
            disabled={!text.trim() || disabled}
            className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${
              text.trim() && !disabled
                ? 'bg-neon text-dark-900 shadow-neon hover:shadow-neon-strong'
                : 'bg-white/5 text-white/20 cursor-not-allowed'
            }`}
          >
            {disabled ? 'Submitted ✓' : 'Submit'}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
