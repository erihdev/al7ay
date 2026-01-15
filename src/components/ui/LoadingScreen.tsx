import { motion, AnimatePresence } from 'framer-motion';
import logo from '@/assets/logo.png';

interface LoadingScreenProps {
  isLoading: boolean;
}

export const LoadingScreen = ({ isLoading }: LoadingScreenProps) => {
  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        >
          {/* Background gradient animation */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10"
            animate={{
              background: [
                'radial-gradient(circle at 30% 30%, hsl(var(--primary) / 0.15) 0%, transparent 50%)',
                'radial-gradient(circle at 70% 70%, hsl(var(--primary) / 0.15) 0%, transparent 50%)',
                'radial-gradient(circle at 30% 70%, hsl(var(--primary) / 0.15) 0%, transparent 50%)',
                'radial-gradient(circle at 70% 30%, hsl(var(--primary) / 0.15) 0%, transparent 50%)',
                'radial-gradient(circle at 30% 30%, hsl(var(--primary) / 0.15) 0%, transparent 50%)',
              ],
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          />

          {/* Center content */}
          <div className="relative flex flex-col items-center">
            {/* Outer rotating ring */}
            <motion.div
              className="absolute w-32 h-32 rounded-full border-2 border-primary/20"
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            />

            {/* Inner rotating ring (opposite direction) */}
            <motion.div
              className="absolute w-28 h-28 rounded-full border-2 border-dashed border-primary/30"
              animate={{ rotate: -360 }}
              transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
            />

            {/* Pulsing glow */}
            <motion.div
              className="absolute w-24 h-24 rounded-2xl bg-primary/20 blur-2xl"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Logo container */}
            <motion.div
              className="relative w-20 h-20"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ 
                type: "spring", 
                stiffness: 200, 
                damping: 15,
                delay: 0.2 
              }}
            >
              {/* Logo with bounce animation */}
              <motion.img
                src={logo}
                alt="الحي"
                className="w-full h-full object-contain drop-shadow-2xl"
                animate={{
                  y: [0, -8, 0],
                  scale: [1, 1.05, 1],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />

              {/* Sparkle particles */}
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1.5 h-1.5 bg-primary rounded-full"
                  style={{
                    top: '50%',
                    left: '50%',
                  }}
                  animate={{
                    x: [0, Math.cos((i * Math.PI * 2) / 6) * 50],
                    y: [0, Math.sin((i * Math.PI * 2) / 6) * 50],
                    opacity: [0, 1, 0],
                    scale: [0, 1, 0],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.15,
                    ease: "easeOut",
                  }}
                />
              ))}
            </motion.div>

            {/* Brand text */}
            <motion.div
              className="mt-8 flex flex-col items-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              <motion.h1 
                className="text-3xl font-bold text-primary"
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                الحي
              </motion.h1>
              <motion.p 
                className="text-sm text-muted-foreground mt-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                منصة الخدمات المحلية
              </motion.p>
            </motion.div>

            {/* Loading dots */}
            <motion.div
              className="flex gap-1.5 mt-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 rounded-full bg-primary"
                  animate={{
                    y: [0, -6, 0],
                    opacity: [0.3, 1, 0.3],
                  }}
                  transition={{
                    duration: 0.6,
                    repeat: Infinity,
                    delay: i * 0.15,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LoadingScreen;
