import { motion } from 'framer-motion';
import logo from '@/assets/logo.png';

interface AnimatedSloganProps {
  showLogo?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const AnimatedSlogan = ({ showLogo = true, size = 'lg', className = '' }: AnimatedSloganProps) => {
  const sizeClasses = {
    sm: 'text-2xl md:text-3xl',
    md: 'text-3xl md:text-4xl lg:text-5xl',
    lg: 'text-4xl md:text-5xl lg:text-6xl'
  };

  const logoSizes = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-20 h-20'
  };

  return (
    <motion.div 
      className={`flex flex-col items-center gap-4 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {showLogo && (
        <motion.img 
          src={logo} 
          alt="الحي" 
          className={`${logoSizes[size]} object-contain`}
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
        />
      )}
      
      <motion.div className="relative overflow-hidden">
        <motion.h2 
          className={`${sizeClasses[size]} font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_auto]`}
          animate={{ 
            backgroundPosition: ['0%', '100%', '0%']
          }}
          transition={{ 
            duration: 3, 
            repeat: Infinity, 
            ease: "linear" 
          }}
        >
          الحي يحيييك
        </motion.h2>
        
        {/* Sparkle effects */}
        <motion.div
          className="absolute -top-1 -right-1 text-yellow-400"
          animate={{ 
            opacity: [0.5, 1, 0.5],
            scale: [0.8, 1.2, 0.8],
            rotate: [0, 180, 360]
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          ✨
        </motion.div>
        <motion.div
          className="absolute -bottom-1 -left-1 text-yellow-400"
          animate={{ 
            opacity: [1, 0.5, 1],
            scale: [1.2, 0.8, 1.2],
            rotate: [360, 180, 0]
          }}
          transition={{ duration: 2, repeat: Infinity, delay: 1 }}
        >
          ✨
        </motion.div>
      </motion.div>
      
      <motion.p 
        className="text-muted-foreground text-lg"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        منصة الخدمات المحلية
      </motion.p>
    </motion.div>
  );
};
