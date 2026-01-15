import { useState } from 'react';
import { motion } from 'framer-motion';
import logo from '@/assets/logo.png';
import { cn } from '@/lib/utils';

interface AnimatedLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
  textClassName?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-14 h-14',
  xl: 'w-20 h-20',
};

const textSizeClasses = {
  sm: 'text-lg',
  md: 'text-xl',
  lg: 'text-2xl',
  xl: 'text-3xl',
};

export const AnimatedLogo = ({ 
  size = 'md', 
  showText = true,
  className,
  textClassName
}: AnimatedLogoProps) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div 
      className={cn("flex items-center gap-3 cursor-pointer select-none", className)}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {/* Logo Image with Animation */}
      <motion.div
        className="relative"
        animate={{
          scale: isHovered ? 1.1 : 1,
          rotate: isHovered ? [0, -5, 5, -5, 0] : 0,
        }}
        transition={{
          scale: { duration: 0.3, ease: "easeOut" },
          rotate: { duration: 0.5, ease: "easeInOut" },
        }}
      >
        {/* Glow Effect */}
        <motion.div
          className={cn(
            "absolute inset-0 rounded-xl bg-primary/30 blur-xl",
            sizeClasses[size]
          )}
          animate={{
            opacity: isHovered ? 0.8 : 0,
            scale: isHovered ? 1.3 : 1,
          }}
          transition={{ duration: 0.3 }}
        />
        
        {/* Logo Container */}
        <motion.div
          className={cn(
            "relative rounded-xl overflow-hidden shadow-lg",
            sizeClasses[size]
          )}
          whileTap={{ scale: 0.95 }}
        >
          <motion.img 
            src={logo} 
            alt="الحي" 
            className="w-full h-full object-contain"
            animate={{
              filter: isHovered ? 'brightness(1.1)' : 'brightness(1)',
            }}
            transition={{ duration: 0.2 }}
          />
        </motion.div>

        {/* Sparkle Effects */}
        {isHovered && (
          <>
            <motion.div
              className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ 
                scale: [0, 1, 0],
                opacity: [0, 1, 0],
              }}
              transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 0.2 }}
            />
            <motion.div
              className="absolute -bottom-1 -left-1 w-1.5 h-1.5 bg-accent rounded-full"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ 
                scale: [0, 1, 0],
                opacity: [0, 1, 0],
              }}
              transition={{ duration: 0.6, delay: 0.2, repeat: Infinity, repeatDelay: 0.2 }}
            />
            <motion.div
              className="absolute top-1/2 -left-2 w-1 h-1 bg-primary/60 rounded-full"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ 
                scale: [0, 1, 0],
                opacity: [0, 1, 0],
              }}
              transition={{ duration: 0.6, delay: 0.4, repeat: Infinity, repeatDelay: 0.2 }}
            />
          </>
        )}
      </motion.div>

      {/* Text with Animation */}
      {showText && (
        <motion.div className="flex flex-col">
          <motion.span 
            className={cn(
              "font-bold text-primary leading-none",
              textSizeClasses[size],
              textClassName
            )}
            animate={{
              x: isHovered ? 3 : 0,
            }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <motion.span
              className="inline-block"
              animate={{
                color: isHovered ? 'hsl(var(--primary))' : 'hsl(var(--primary))',
              }}
            >
              {"الحي".split('').map((char, index) => (
                <motion.span
                  key={index}
                  className="inline-block"
                  animate={{
                    y: isHovered ? [0, -3, 0] : 0,
                  }}
                  transition={{
                    duration: 0.3,
                    delay: index * 0.05,
                    ease: "easeOut",
                  }}
                >
                  {char}
                </motion.span>
              ))}
            </motion.span>
          </motion.span>
          
          {/* Animated Underline */}
          <motion.div
            className="h-0.5 bg-gradient-to-l from-primary via-primary/50 to-transparent rounded-full mt-1"
            initial={{ scaleX: 0, originX: 1 }}
            animate={{ scaleX: isHovered ? 1 : 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          />
        </motion.div>
      )}
    </motion.div>
  );
};

export default AnimatedLogo;
