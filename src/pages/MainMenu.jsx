import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import AnimatedTitle from '../components/AnimatedTitle';
import BlurCard from '../components/BlurCard';
import BackgroundEffects from '../components/BackgroundEffects';
import useGameStore from '../store/gameStore';
import { signInAnon } from '../firebase/firebaseConfig';
import { createRoom, joinRoom } from '../firebase/firebaseService';

export default function MainMenu() {
  const navigate = useNavigate();
  const { setPlayer, setRoomCode, setIsHost, setPhase } = useGameStore();

  const [mode, setMode] = useState(null); // null | 'create' | 'join'
  const [name, setName] = useState(() => localStorage.getItem('wsw_playerName') || '');
  const [roomInput, setRoomInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error('Enter your name');
      return;
    }
    localStorage.setItem('wsw_playerName', name.trim());
    setLoading(true);
    try {
      const user = await signInAnon();
      const code = await createRoom(name.trim(), user.uid);
      setPlayer({ id: user.uid, name: name.trim() });
      setRoomCode(code);
      setIsHost(true);
      setPhase('lobby');
      navigate('/lobby');
      toast.success(`Room ${code} created!`);
    } catch (err) {
      toast.error(err.message || 'Failed to create room');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!name.trim()) {
      toast.error('Enter your name');
      return;
    }
    if (!roomInput.trim() || roomInput.trim().length !== 5) {
      toast.error('Enter a valid 5-character room code');
      return;
    }
    localStorage.setItem('wsw_playerName', name.trim());
    setLoading(true);
    try {
      const user = await signInAnon();
      await joinRoom(roomInput.trim().toUpperCase(), name.trim(), user.uid);
      setPlayer({ id: user.uid, name: name.trim() });
      setRoomCode(roomInput.trim().toUpperCase());
      setIsHost(false);
      setPhase('lobby');
      navigate('/lobby');
      toast.success('Joined room!');
    } catch (err) {
      toast.error(err.message || 'Failed to join room');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 relative">
      <BackgroundEffects />

      <div className="relative z-10 flex flex-col items-center gap-10 w-full max-w-md">
        {/* Title */}
        <AnimatedTitle />

        {/* Menu buttons */}
        <AnimatePresence mode="wait">
          {mode === null && (
            <motion.div
              key="buttons"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="flex flex-col gap-4 w-full max-w-xs"
            >
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setMode('create')}
                className="btn-glow glass-strong rounded-2xl py-4 px-8 text-neon font-grotesk font-semibold text-lg tracking-wide border border-neon/20 hover:border-neon/50 transition-all duration-300"
              >
                Create Room
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setMode('join')}
                className="btn-glow glass rounded-2xl py-4 px-8 text-white/80 font-grotesk font-semibold text-lg tracking-wide border border-white/10 hover:border-cyan-glow/30 hover:text-cyan-glow transition-all duration-300"
              >
                Join Room
              </motion.button>
            </motion.div>
          )}

          {mode === 'create' && (
            <motion.div
              key="create"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="w-full"
            >
              <BlurCard className="flex flex-col gap-4">
                <h2 className="text-neon font-grotesk font-bold text-xl">Create Room</h2>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value.slice(0, 20))}
                  placeholder="Your name"
                  maxLength={20}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white/90 placeholder:text-white/20 outline-none focus:border-neon/40 transition-all"
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => setMode(null)}
                    className="flex-1 glass rounded-xl py-3 text-white/60 hover:text-white/90 transition-all text-sm"
                  >
                    Back
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleCreate}
                    disabled={loading}
                    className="flex-[2] bg-neon text-dark-900 font-semibold rounded-xl py-3 hover:shadow-neon transition-all text-sm disabled:opacity-50"
                  >
                    {loading ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-dark-900/30 border-t-dark-900 rounded-full animate-spin" />
                        Creating...
                      </span>
                    ) : (
                      'Create'
                    )}
                  </motion.button>
                </div>
              </BlurCard>
            </motion.div>
          )}

          {mode === 'join' && (
            <motion.div
              key="join"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="w-full"
            >
              <BlurCard className="flex flex-col gap-4">
                <h2 className="text-cyan-glow font-grotesk font-bold text-xl">Join Room</h2>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value.slice(0, 20))}
                  placeholder="Your name"
                  maxLength={20}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white/90 placeholder:text-white/20 outline-none focus:border-cyan-glow/40 transition-all"
                />
                <input
                  type="text"
                  value={roomInput}
                  onChange={(e) => setRoomInput(e.target.value.toUpperCase().slice(0, 5))}
                  placeholder="Room code (5 chars)"
                  maxLength={5}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white/90 placeholder:text-white/20 outline-none focus:border-cyan-glow/40 transition-all font-mono tracking-[0.3em] text-center text-lg uppercase"
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => setMode(null)}
                    className="flex-1 glass rounded-xl py-3 text-white/60 hover:text-white/90 transition-all text-sm"
                  >
                    Back
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleJoin}
                    disabled={loading}
                    className="flex-[2] bg-cyan-glow text-dark-900 font-semibold rounded-xl py-3 hover:shadow-cyan transition-all text-sm disabled:opacity-50"
                  >
                    {loading ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-dark-900/30 border-t-dark-900 rounded-full animate-spin" />
                        Joining...
                      </span>
                    ) : (
                      'Join'
                    )}
                  </motion.button>
                </div>
              </BlurCard>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
