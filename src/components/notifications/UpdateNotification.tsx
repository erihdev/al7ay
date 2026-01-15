import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RefreshCw, X, Sparkles } from 'lucide-react';
import { useAppVersion } from '@/hooks/useAppVersion';
import { motion, AnimatePresence } from 'framer-motion';

export function UpdateNotification() {
  const { hasUpdate, latestVersion, dismissUpdate, refreshApp } = useAppVersion();

  if (!hasUpdate || !latestVersion) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -50, scale: 0.9 }}
        className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-[calc(100%-2rem)] max-w-md"
      >
        <Card className="border-primary/50 bg-gradient-to-r from-primary/10 via-background to-accent/10 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-bold text-foreground">
                    تحديث جديد متاح! 🎉
                  </h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 flex-shrink-0"
                    onClick={dismissUpdate}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  الإصدار {latestVersion.version}
                </p>
                {latestVersion.release_notes && (
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                    {latestVersion.release_notes}
                  </p>
                )}
                <Button
                  onClick={refreshApp}
                  size="sm"
                  className="mt-3 w-full font-arabic"
                >
                  <RefreshCw className="h-4 w-4 ml-2" />
                  تحديث الآن
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
