import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AnimatedLogo } from '@/components/ui/AnimatedLogo';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ArrowRight, 
  Sparkles, 
  Bug, 
  Zap, 
  Shield, 
  Palette,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { motion } from 'framer-motion';

interface AppVersion {
  id: string;
  version: string;
  release_notes: string | null;
  is_current: boolean;
  created_at: string;
}

// Static changelog data for versions before database tracking
const staticChangelog = [
  {
    version: '1.1.0',
    date: '2025-01-15',
    type: 'feature' as const,
    changes: [
      'إضافة لوحة إدارة مقدمي الخدمات مع إحصائيات تفصيلية',
      'نظام إشعار المستخدمين بالتحديثات الجديدة',
      'صفحة تثبيت التطبيق مع تعليمات واضحة',
      'دعم الإشعارات المحلية للطلبات والعروض',
      'تحسينات التوافق مع جميع الأجهزة'
    ]
  },
  {
    version: '1.0.0',
    date: '2025-01-10',
    type: 'release' as const,
    changes: [
      'إطلاق منصة الحي الرسمي',
      'نظام تسجيل مقدمي الخدمات',
      'متاجر إلكترونية لمقدمي الخدمات',
      'نظام الطلبات والتوصيل',
      'برنامج نقاط الولاء',
      'نظام الإحالات والمكافآت',
      'الدفع الإلكتروني ونقداً عند الاستلام',
      'خريطة الأحياء النشطة'
    ]
  }
];

const typeConfig = {
  feature: { icon: Sparkles, label: 'ميزات جديدة', color: 'bg-green-500/10 text-green-600 border-green-500/30' },
  fix: { icon: Bug, label: 'إصلاحات', color: 'bg-orange-500/10 text-orange-600 border-orange-500/30' },
  improvement: { icon: Zap, label: 'تحسينات', color: 'bg-blue-500/10 text-blue-600 border-blue-500/30' },
  security: { icon: Shield, label: 'أمان', color: 'bg-red-500/10 text-red-600 border-red-500/30' },
  design: { icon: Palette, label: 'تصميم', color: 'bg-purple-500/10 text-purple-600 border-purple-500/30' },
  release: { icon: Sparkles, label: 'إصدار رئيسي', color: 'bg-primary/10 text-primary border-primary/30' }
};

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
    <div className="min-h-screen bg-background font-arabic" dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-sm border-b border-border safe-area-inset-top">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link to="/">
              <AnimatedLogo size="md" showText={true} />
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Hero */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm mb-6">
            <Calendar className="h-4 w-4" />
            <span>سجل التحديثات</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            ما الجديد في الحي؟
          </h1>
          <p className="text-lg text-muted-foreground">
            تابع أحدث التحسينات والميزات الجديدة في المنصة
          </p>
        </motion.div>

        {/* Version Timeline */}
        <div className="space-y-8">
          {isLoading ? (
            // Loading skeleton
            [...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-24 mt-2" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {[...Array(4)].map((_, j) => (
                      <Skeleton key={j} className="h-4 w-full" />
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            // Changelog entries
            staticChangelog.map((entry, index) => {
              const config = typeConfig[entry.type];
              const Icon = config.icon;
              const dbVersion = versions.find(v => v.version === entry.version);
              const isCurrent = dbVersion?.is_current || (index === 0 && !dbVersion);

              return (
                <motion.div
                  key={entry.version}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className={isCurrent ? 'border-primary/50 shadow-lg' : ''}>
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-3">
                          <CardTitle className="text-2xl">
                            الإصدار {entry.version}
                          </CardTitle>
                          {isCurrent && (
                            <Badge className="bg-primary text-primary-foreground">
                              الحالي
                            </Badge>
                          )}
                        </div>
                        <Badge variant="outline" className={config.color}>
                          <Icon className="h-3 w-3 ml-1" />
                          {config.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground flex items-center gap-2 mt-2">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(entry.date), 'dd MMMM yyyy', { locale: ar })}
                      </p>
                    </CardHeader>
                    <CardContent>
                      {dbVersion?.release_notes && (
                        <p className="text-muted-foreground mb-4 pb-4 border-b">
                          {dbVersion.release_notes}
                        </p>
                      )}
                      <ul className="space-y-3">
                        {entry.changes.map((change, changeIndex) => (
                          <li 
                            key={changeIndex}
                            className="flex items-start gap-3"
                          >
                            <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                            <span>{change}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })
          )}
        </div>

        {/* Coming Soon */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-12"
        >
          <Card className="border-dashed border-2 bg-muted/30">
            <CardContent className="p-8 text-center">
              <Sparkles className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">قريباً...</h3>
              <p className="text-muted-foreground mb-4">
                نعمل على تحسينات وميزات جديدة رائعة!
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <Badge variant="outline">دردشة مباشرة</Badge>
                <Badge variant="outline">تتبع الطلبات المباشر</Badge>
                <Badge variant="outline">تقييمات محسّنة</Badge>
                <Badge variant="outline">المزيد...</Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Back Button */}
        <div className="text-center mt-8">
          <Button variant="outline" asChild className="font-arabic">
            <Link to="/">
              <ArrowRight className="h-4 w-4 ml-2" />
              العودة للصفحة الرئيسية
            </Link>
          </Button>
        </div>
      </main>
    </div>
  );
};

export default Changelog;
