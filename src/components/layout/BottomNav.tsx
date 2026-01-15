import { Link, useLocation } from 'react-router-dom';
import { Coffee, ShoppingBag, ClipboardList, User } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const navItems = [
  { path: '/app', icon: Coffee, label: 'القائمة' },
  { path: '/cart', icon: ShoppingBag, label: 'السلة' },
  { path: '/orders', icon: ClipboardList, label: 'طلباتي' },
  { path: '/profile', icon: User, label: 'حسابي' },
];

export function BottomNav() {
  const location = useLocation();
  const { totalItems } = useCart();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border safe-area-inset-bottom">
      <div className="flex items-center justify-around h-16">
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path;
          const isCart = path === '/cart';

          return (
            <Link
              key={path}
              to={path}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full transition-all duration-300 relative group',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <motion.div 
                className="relative"
                whileTap={{ scale: 0.9 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <motion.div
                  animate={isActive ? { scale: [1, 1.2, 1] } : {}}
                  transition={{ duration: 0.3 }}
                >
                  <Icon className={cn(
                    "h-6 w-6 transition-all duration-300",
                    isActive && "drop-shadow-[0_0_8px_hsl(var(--primary)/0.5)]",
                    !isActive && "group-hover:scale-110"
                  )} />
                </motion.div>
                {isCart && totalItems > 0 && (
                  <motion.span 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -right-2 bg-accent text-accent-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-lg"
                  >
                    {totalItems}
                  </motion.span>
                )}
              </motion.div>
              <motion.span 
                className={cn(
                  "text-xs mt-1 font-arabic transition-all duration-300",
                  isActive && "font-semibold"
                )}
                animate={isActive ? { y: [0, -2, 0] } : {}}
                transition={{ duration: 0.3 }}
              >
                {label}
              </motion.span>
              
              {/* Active indicator */}
              {isActive && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-primary rounded-full"
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
              
              {/* Hover glow effect */}
              <div className={cn(
                "absolute inset-0 bg-primary/0 transition-all duration-300 rounded-lg",
                "group-hover:bg-primary/5"
              )} />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
