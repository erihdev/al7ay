import { Link, useLocation } from 'react-router-dom';
import { Coffee, ShoppingBag, User, Heart, Store } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useFavorites } from '@/hooks/useFavorites';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const navItems = [
  { path: '/app', icon: Coffee, label: 'القائمة' },
  { path: '/favorites', icon: Heart, label: 'المفضلة' },
  { path: '/cart', icon: ShoppingBag, label: 'السلة' },
  { path: '/my-store-orders', icon: Store, label: 'طلباتي' },
];

export function BottomNav() {
  const location = useLocation();
  const { totalItems } = useCart();
  const { data: favorites } = useFavorites();
  const favoritesCount = favorites?.length || 0;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 safe-area-inset-bottom">
      {/* Frosted glass background with gradient border */}
      <div className="relative bg-background/80 backdrop-blur-xl border-t border-border/50">
        {/* Subtle gradient glow at top */}
        <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map(({ path, icon: Icon, label }) => {
            const isActive = location.pathname === path;
            const isCart = path === '/cart';
            const isFavorites = path === '/favorites';

            return (
              <Link
                key={path}
                to={path}
                className={cn(
                  'relative flex flex-col items-center justify-center flex-1 h-full py-2 transition-all duration-300 group',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                {/* Active background pill */}
                {isActive && (
                  <motion.div
                    layoutId="navPill"
                    className="absolute inset-x-2 inset-y-1.5 bg-primary/10 rounded-xl"
                    initial={false}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}

                <motion.div 
                  className="relative z-10"
                  whileTap={{ scale: 0.85 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <motion.div
                    animate={isActive ? { y: -2 } : { y: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    <Icon 
                      className={cn(
                        "h-[22px] w-[22px] transition-all duration-300",
                        isActive && "stroke-[2.5px]",
                        !isActive && "stroke-[1.5px] group-hover:text-foreground group-hover:scale-110"
                      )} 
                    />
                  </motion.div>

                  {/* Cart badge */}
                  {isCart && totalItems > 0 && (
                    <motion.span 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-2 min-w-[18px] h-[18px] px-1 bg-gradient-to-br from-accent to-accent/80 text-accent-foreground text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg shadow-accent/30"
                    >
                      {totalItems > 99 ? '99+' : totalItems}
                    </motion.span>
                  )}

                  {/* Favorites badge */}
                  {isFavorites && favoritesCount > 0 && (
                    <motion.span 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-2 min-w-[18px] h-[18px] px-1 bg-gradient-to-br from-rose-500 to-rose-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg shadow-rose-500/30"
                    >
                      {favoritesCount > 99 ? '99+' : favoritesCount}
                    </motion.span>
                  )}
                </motion.div>

                <motion.span 
                  className={cn(
                    "relative z-10 text-[11px] mt-1 font-arabic transition-all duration-300",
                    isActive ? "font-bold" : "font-medium group-hover:text-foreground"
                  )}
                  animate={isActive ? { y: -1 } : { y: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  {label}
                </motion.span>

                {/* Active dot indicator */}
                {isActive && (
                  <motion.div 
                    layoutId="activeDot"
                    className="absolute bottom-1 w-1 h-1 bg-primary rounded-full"
                    initial={false}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
