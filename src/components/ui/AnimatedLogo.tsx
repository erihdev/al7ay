import { useState } from 'react';
import { motion, useAnimation } from 'framer-motion';
import logo from '@/assets/logo.png';
import { cn } from '@/lib/utils';
import { useClickSound } from '@/hooks/useClickSound';

interface AnimatedLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
  textClassName?: string;
  onClick?: () => void;
  enableSound?: boolean;
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
  textClassName,
  onClick,
  enableSound = true
}: AnimatedLogoProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const controls = useAnimation();
  const sparkleControls = useAnimation();
  const { playClickSound } = useClickSound();

  const handleClick = async () => {
    setIsClicked(true);
    
    // Play click sound
    if (enableSound) {
      playClickSound();
    }
    
    // Trigger click animation sequence
    await controls.start({
      scale: [1, 0.85, 1.15, 0.95, 1.05, 1],
      rotate: [0, -10, 10, -5, 5, 0],
      transition: { duration: 0.6, ease: "easeInOut" }
    });

    // Trigger burst effect
    await sparkleControls.start({
      scale: [0, 1.5, 0],
      opacity: [0, 1, 0],
      transition: { duration: 0.4 }
    });

    setIsClicked(false);
    onClick?.();
  };

  return (
    <motion.div 
      className={cn("flex items-center gap-3 cursor-pointer select-none", className)}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={handleClick}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {/* Logo Image with Animation */}
      <motion.div
        className="relative"
        animate={controls}
      >
        {/* Click burst effect */}
        <motion.div
          className={cn(
            "absolute inset-0 rounded-full border-4 border-primary",
            sizeClasses[size]
          )}
          initial={{ scale: 0, opacity: 0 }}
          animate={isClicked ? {
            scale: [1, 2.5],
            opacity: [0.8, 0],
          } : {}}
          transition={{ duration: 0.5 }}
          style={{ margin: 'auto', top: 0, bottom: 0, left: 0, right: 0 }}
        />

        {/* Secondary burst ring */}
        <motion.div
          className={cn(
            "absolute inset-0 rounded-full border-2 border-accent",
            sizeClasses[size]
          )}
          initial={{ scale: 0, opacity: 0 }}
          animate={isClicked ? {
            scale: [1, 2],
            opacity: [0.6, 0],
          } : {}}
          transition={{ duration: 0.4, delay: 0.1 }}
          style={{ margin: 'auto', top: 0, bottom: 0, left: 0, right: 0 }}
        />

        {/* Glow Effect */}
        <motion.div
          className={cn(
            "absolute inset-0 rounded-xl bg-primary/30 blur-xl",
            sizeClasses[size]
          )}
          animate={{
            opacity: isHovered || isClicked ? 0.8 : 0,
            scale: isHovered || isClicked ? 1.3 : 1,
          }}
          transition={{ duration: 0.3 }}
        />
        
        {/* Logo Container */}
        <motion.div
          className={cn(
            "relative rounded-xl overflow-hidden shadow-lg",
            sizeClasses[size]
          )}
          animate={{
            scale: isHovered ? 1.1 : 1,
            rotate: isHovered ? [0, -5, 5, -5, 0] : 0,
          }}
          transition={{
            scale: { duration: 0.3, ease: "easeOut" },
            rotate: { duration: 0.5, ease: "easeInOut" },
          }}
          whileTap={{ scale: 0.9 }}
        >
          <motion.img 
            src={logo} 
            alt="الحي" 
            className="w-full h-full object-contain"
            animate={{
              filter: isHovered || isClicked ? 'brightness(1.2) saturate(1.2)' : 'brightness(1)',
            }}
            transition={{ duration: 0.2 }}
          />
        </motion.div>

        {/* Sparkle Effects on hover */}
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

        {/* Click particle burst */}
        {isClicked && [...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1.5 h-1.5 bg-primary rounded-full"
            style={{
              top: '50%',
              left: '50%',
              marginTop: -3,
              marginLeft: -3,
            }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{
              x: Math.cos((i * Math.PI * 2) / 8) * 40,
              y: Math.sin((i * Math.PI * 2) / 8) * 40,
              opacity: 0,
              scale: 0,
            }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        ))}
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
              scale: isClicked ? [1, 1.1, 1] : 1,
            }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <motion.span className="inline-block">
              {"الحي".split('').map((char, index) => (
                <motion.span
                  key={index}
                  className="inline-block"
                  animate={{
                    y: isHovered ? [0, -3, 0] : 0,
                    color: isClicked ? ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--primary))'] : 'hsl(var(--primary))',
                  }}
                  transition={{
                    y: { duration: 0.3, delay: index * 0.05, ease: "easeOut" },
                    color: { duration: 0.3 },
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
            animate={{ 
              scaleX: isHovered || isClicked ? 1 : 0,
              background: isClicked 
                ? 'linear-gradient(to left, hsl(var(--accent)), hsl(var(--primary)), transparent)'
                : 'linear-gradient(to left, hsl(var(--primary)), hsl(var(--primary) / 0.5), transparent)'
            }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          />
        </motion.div>
      )}
    </motion.div>
  );
};

export default AnimatedLogo;
