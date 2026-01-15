import { Button } from '@/components/ui/button';
import { RefreshCw, X, Sparkles } from 'lucide-react';
import { useAppVersion } from '@/hooks/useAppVersion';
import { motion, AnimatePresence } from 'framer-motion';

export function UpdateBanner() {
  const { hasUpdate, latestVersion, dismissUpdate, refreshApp } = useAppVersion();

  if (!hasUpdate || !latestVersion) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -100 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        className="fixed top-0 left-0 right-0 z-[100] safe-area-inset-top"
      >
        <div className="bg-gradient-to-r from-primary via-primary/90 to-primary text-primary-foreground p-3 shadow-lg">
          <div className="max-w-md mx-auto flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 animate-pulse">
              <Sparkles className="h-4 w-4" />
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold">
                تحديث جديد متاح! {latestVersion.version} 🎉
              </p>
              {latestVersion.release_notes && (
                <p className="text-xs opacity-90 line-clamp-1">
                  {latestVersion.release_notes}
                </p>
              )}
            </div>
            
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                onClick={refreshApp}
                size="sm"
                variant="secondary"
                className="h-8 px-3 text-xs font-bold gap-1.5"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                تحديث
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-primary-foreground hover:bg-white/20"
                onClick={dismissUpdate}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
