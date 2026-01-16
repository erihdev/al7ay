import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AnimatedLogo } from '@/components/ui/AnimatedLogo';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ArrowRight, 
  Sparkles, 
  Calendar,
  CheckCircle2,
  Rocket,
  Star
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { FloatingParticles } from '@/components/ui/InteractiveBackground';

interface AppVersion {
  id: string;
  version: string;
  release_notes: string | null;
  is_current: boolean;
  created_at: string;
}

const Changelog = () => {
  const [versions, setVersions] = useState<AppVersion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchVersions = async () => {
      try {
        const { data, error } = await supabase
          .from('app_versions')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data) {
          setVersions(data);
        }
      } catch (error) {
        console.error('Error fetching versions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVersions();
  }, []);

  return (
    <div className="min-h-screen bg-background font-arabic relative" dir="rtl">
      <FloatingParticles count={10} />
      
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-sm border-b border-border pt-[env(safe-area-inset-top)]">
        <div className="container mx-auto px-4 py-1">
          <div className="flex items-center justify-between">
            <Link to="/">
              <AnimatedLogo size="md" showText={true} />
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Hero */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <motion.div 
            className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 mb-6"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
          >
            <Rocket className="h-10 w-10 text-primary" />
          </motion.div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3 bg-gradient-to-l from-primary to-primary/60 bg-clip-text text-transparent">
            سجل التحديثات
          </h1>
          <p className="text-muted-foreground">
            تابع جميع التحسينات والميزات الجديدة
          </p>
        </motion.div>

        {/* Timeline */}
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute right-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-primary/50 to-transparent" />

          <div className="space-y-6">
            {isLoading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="relative pr-16">
                  <div className="absolute right-4 w-5 h-5 rounded-full bg-muted" />
                  <Card>
                    <CardContent className="p-6">
                      <Skeleton className="h-6 w-24 mb-2" />
                      <Skeleton className="h-4 w-32 mb-4" />
                      <Skeleton className="h-16 w-full" />
                    </CardContent>
                  </Card>
                </div>
              ))
            ) : versions.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">لا توجد تحديثات بعد</p>
              </motion.div>
            ) : (
              versions.map((version, index) => (
                <motion.div
                  key={version.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative pr-16"
                >
                  {/* Timeline dot */}
                  <motion.div 
                    className={`absolute right-[14px] w-6 h-6 rounded-full flex items-center justify-center ${
                      version.is_current 
                        ? 'bg-primary shadow-lg shadow-primary/30' 
                        : 'bg-muted border-2 border-primary/30'
                    }`}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.1 + 0.2, type: "spring" }}
                  >
                    {version.is_current ? (
                      <Star className="h-3 w-3 text-primary-foreground" />
                    ) : (
                      <CheckCircle2 className="h-3 w-3 text-primary/60" />
                    )}
                  </motion.div>

                  {/* Version Card */}
                  <Card className={`overflow-hidden transition-all hover:shadow-lg ${
                    version.is_current 
                      ? 'border-primary/50 shadow-md bg-gradient-to-l from-primary/5 to-transparent' 
                      : 'hover:border-primary/30'
                  }`}>
                    <CardContent className="p-0">
                      {/* Header */}
                      <div className={`px-6 py-4 border-b ${
                        version.is_current ? 'bg-primary/5' : 'bg-muted/30'
                      }`}>
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl font-bold text-primary">
                              v{version.version}
                            </span>
                            {version.is_current && (
                              <Badge className="bg-primary text-primary-foreground text-xs">
                                <Sparkles className="h-3 w-3 ml-1" />
                                الحالي
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {format(new Date(version.created_at), 'dd MMMM yyyy', { locale: ar })}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="px-6 py-5">
                        {version.release_notes ? (
                          <div className="space-y-3">
                            {version.release_notes.split('،').map((note, noteIndex) => (
                              <motion.div
                                key={noteIndex}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 + noteIndex * 0.05 }}
                                className="flex items-start gap-3"
                              >
                                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                                <span className="text-foreground leading-relaxed">
                                  {note.trim()}
                                </span>
                              </motion.div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-muted-foreground text-center py-2">
                            تحديثات وتحسينات عامة
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Coming Soon */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-12"
        >
          <Card className="border-dashed border-2 bg-gradient-to-br from-muted/30 to-transparent overflow-hidden">
            <CardContent className="p-8 text-center relative">
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              />
              <Sparkles className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">قريباً...</h3>
              <p className="text-muted-foreground mb-6">
                نعمل على ميزات جديدة ومثيرة!
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <Badge variant="outline" className="bg-background">دردشة مباشرة</Badge>
                <Badge variant="outline" className="bg-background">تتبع الطلبات المباشر</Badge>
                <Badge variant="outline" className="bg-background">تقييمات محسّنة</Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Back Button */}
        <motion.div 
          className="text-center mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Button variant="outline" asChild className="font-arabic">
            <Link to="/">
              <ArrowRight className="h-4 w-4 ml-2" />
              العودة للرئيسية
            </Link>
          </Button>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-sm text-muted-foreground border-t mt-12">
        <p>© 2026 منصة الحي. جميع الحقوق محفوظة.</p>
      </footer>
    </div>
  );
};

export default Changelog;
