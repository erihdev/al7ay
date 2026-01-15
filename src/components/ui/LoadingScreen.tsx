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
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          {/* Subtle background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />

          {/* Center content */}
          <div className="relative flex flex-col items-center">
            {/* Glow effect behind logo */}
            <motion.div
              className="absolute w-40 h-40 rounded-full bg-primary/20 blur-3xl"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.4, 0.6, 0.4],
              }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Logo container - LARGER */}
            <motion.div
              className="relative w-32 h-32 sm:w-40 sm:h-40"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ 
                type: "spring", 
                stiffness: 300, 
                damping: 20,
                duration: 0.4
              }}
            >
              {/* Rotating ring */}
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-primary/30 border-t-primary"
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              />

              {/* Logo - BIGGER and CLEARER */}
              <motion.img
                src={logo}
                alt="الحي"
                className="absolute inset-2 w-[calc(100%-16px)] h-[calc(100%-16px)] object-contain drop-shadow-xl"
                animate={{
                  scale: [1, 1.03, 1],
                }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </motion.div>

            {/* Brand text */}
            <motion.div
              className="mt-6 flex flex-col items-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              <h1 className="text-4xl sm:text-5xl font-bold text-primary">
                الحي
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground mt-2">
                منصة الخدمات المحلية
              </p>
            </motion.div>

            {/* Loading indicator - simple bar */}
            <motion.div
              className="mt-8 w-32 h-1 bg-muted rounded-full overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <motion.div
                className="h-full bg-primary rounded-full"
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LoadingScreen;
