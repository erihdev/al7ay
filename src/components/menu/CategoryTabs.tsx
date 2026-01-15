import { cn } from '@/lib/utils';
import { Coffee, IceCream, Cake, Layers } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Database } from '@/integrations/supabase/types';

type ProductCategory = Database['public']['Enums']['product_category'];

interface CategoryTabsProps {
  activeCategory: ProductCategory | 'all';
  onCategoryChange: (category: ProductCategory | 'all') => void;
}

const categories: { id: ProductCategory | 'all'; label: string; icon: React.ComponentType<{ className?: string }>; color: string }[] = [
  { id: 'all', label: 'الكل', icon: Layers, color: 'from-primary to-primary/80' },
  { id: 'coffee', label: 'القهوة', icon: Coffee, color: 'from-amber-600 to-amber-500' },
  { id: 'cold_drinks', label: 'المشروبات الباردة', icon: IceCream, color: 'from-blue-500 to-cyan-400' },
  { id: 'sweets', label: 'الحلويات', icon: Cake, color: 'from-pink-500 to-rose-400' },
];

export function CategoryTabs({ activeCategory, onCategoryChange }: CategoryTabsProps) {
  return (
    <div className="flex gap-3 overflow-x-auto hide-scrollbar py-2 px-1">
      {categories.map(({ id, label, icon: Icon, color }) => {
        const isActive = activeCategory === id;
        
        return (
          <motion.button
            key={id}
            onClick={() => onCategoryChange(id)}
            className={cn(
              'relative flex items-center gap-2 px-4 py-2.5 rounded-2xl whitespace-nowrap transition-all font-arabic text-sm',
              isActive
                ? 'text-white shadow-lg'
                : 'bg-muted/50 text-muted-foreground hover:bg-muted'
            )}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Active background */}
            {isActive && (
              <motion.div
                layoutId="activeCategory"
                className={cn('absolute inset-0 rounded-2xl bg-gradient-to-r', color)}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
            
            <span className="relative z-10 flex items-center gap-2">
              <Icon className={cn('h-4 w-4', isActive && 'animate-pulse')} />
              {label}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
