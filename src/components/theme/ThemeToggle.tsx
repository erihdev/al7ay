import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Moon, Sun, Monitor, Clock } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

export function ThemeToggle() {
  const { theme, setTheme, actualTheme } = useTheme();
  const [isAnimating, setIsAnimating] = useState(false);

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system' | 'auto') => {
    setIsAnimating(true);
    setTheme(newTheme);
    setTimeout(() => setIsAnimating(false), 500);
  };

  const iconVariants = {
    initial: { scale: 0, rotate: -180, opacity: 0 },
    animate: { scale: 1, rotate: 0, opacity: 1 },
    exit: { scale: 0, rotate: 180, opacity: 0 }
  };

  const getIconKey = () => {
    if (theme === 'auto') return 'clock';
    return actualTheme;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative overflow-hidden"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={getIconKey()}
              variants={iconVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="absolute inset-0 flex items-center justify-center"
            >
              {theme === 'auto' ? (
                <Clock className="h-5 w-5" />
              ) : actualTheme === 'dark' ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5" />
              )}
            </motion.div>
          </AnimatePresence>
          
          {/* Ripple effect on theme change */}
          <AnimatePresence>
            {isAnimating && (
              <motion.div
                className="absolute inset-0 rounded-full"
                initial={{ scale: 0, opacity: 0.5 }}
                animate={{ scale: 2.5, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                style={{
                  background: actualTheme === 'dark' 
                    ? 'radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)'
                    : 'radial-gradient(circle, hsl(var(--accent)) 0%, transparent 70%)'
                }}
              />
            )}
          </AnimatePresence>
          
          <span className="sr-only">تبديل المظهر</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="font-arabic">
        <DropdownMenuItem onClick={() => handleThemeChange('light')} className="gap-2">
          <motion.div
            whileHover={{ rotate: 20 }}
            transition={{ duration: 0.2 }}
          >
            <Sun className="h-4 w-4" />
          </motion.div>
          فاتح
          {theme === 'light' && (
            <motion.span 
              initial={{ scale: 0 }} 
              animate={{ scale: 1 }}
              className="mr-auto text-primary"
            >
              ✓
            </motion.span>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleThemeChange('dark')} className="gap-2">
          <motion.div
            whileHover={{ rotate: -20 }}
            transition={{ duration: 0.2 }}
          >
            <Moon className="h-4 w-4" />
          </motion.div>
          داكن
          {theme === 'dark' && (
            <motion.span 
              initial={{ scale: 0 }} 
              animate={{ scale: 1 }}
              className="mr-auto text-primary"
            >
              ✓
            </motion.span>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleThemeChange('system')} className="gap-2">
          <motion.div
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.2 }}
          >
            <Monitor className="h-4 w-4" />
          </motion.div>
          حسب النظام
          {theme === 'system' && (
            <motion.span 
              initial={{ scale: 0 }} 
              animate={{ scale: 1 }}
              className="mr-auto text-primary"
            >
              ✓
            </motion.span>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleThemeChange('auto')} className="gap-2">
          <motion.div
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.5 }}
          >
            <Clock className="h-4 w-4" />
          </motion.div>
          تلقائي (حسب الوقت)
          {theme === 'auto' && (
            <motion.span 
              initial={{ scale: 0 }} 
              animate={{ scale: 1 }}
              className="mr-auto text-primary"
            >
              ✓
            </motion.span>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
