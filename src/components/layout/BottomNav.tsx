import { Link, useLocation } from 'react-router-dom';
import { Coffee, ShoppingBag, ClipboardList, User, Heart, Store } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useFavorites } from '@/hooks/useFavorites';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const navItems = [
  { path: '/app', icon: Coffee, label: 'القائمة' },
  { path: '/favorites', icon: Heart, label: 'المفضلة' },
  { path: '/cart', icon: ShoppingBag, label: 'السلة' },
  { path: '/my-store-orders', icon: Store, label: 'طلباتي' },
  { path: '/profile', icon: User, label: 'حسابي' },
];

export function BottomNav() {
  const location = useLocation();
  const { totalItems } = useCart();
  const { data: favorites } = useFavorites();
  const favoritesCount = favorites?.length || 0;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border safe-area-inset-bottom">
      <div className="flex items-center justify-around h-14">
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path;
          const isCart = path === '/cart';
          const isFavorites = path === '/favorites';

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
                    "h-5 w-5 transition-all duration-300",
                    isActive && "drop-shadow-[0_0_8px_hsl(var(--primary)/0.5)]",
                    !isActive && "group-hover:scale-110"
                  )} />
                </motion.div>
                {isCart && totalItems > 0 && (
                  <motion.span 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1.5 -right-1.5 bg-accent text-accent-foreground text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center shadow-lg"
                  >
                    {totalItems}
                  </motion.span>
                )}
                {isFavorites && favoritesCount > 0 && (
                  <motion.span 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center shadow-lg"
                  >
                    {favoritesCount}
                  </motion.span>
                )}
              </motion.div>
              <motion.span 
                className={cn(
                  "text-[10px] mt-0.5 font-arabic transition-all duration-300",
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
