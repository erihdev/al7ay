import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Download, 
  Share, 
  MoreVertical, 
  Plus, 
  Smartphone, 
  CheckCircle2,
  ArrowDown,
  Bell,
  Zap,
  Wifi,
  Shield
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { AnimatedLogo } from '@/components/ui/AnimatedLogo';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { motion } from 'framer-motion';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const Install = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Detect device type
    const userAgent = navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));
    setIsAndroid(/android/.test(userAgent));
    
    // Check if already installed
    const isInStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                           (window.navigator as any).standalone === true;
    setIsStandalone(isInStandalone);
    setIsInstalled(isInStandalone);

    // Listen for install prompt (Android/Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for successful install
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  const features = [
    {
      icon: Zap,
      title: 'تجربة سريعة',
      description: 'تطبيق سريع وخفيف يعمل بسلاسة'
    },
    {
      icon: Bell,
      title: 'إشعارات فورية',
      description: 'تلقي إشعارات عن حالة طلباتك'
    },
    {
      icon: Wifi,
      title: 'يعمل بدون إنترنت',
      description: 'تصفح المنتجات حتى بدون اتصال'
    },
    {
      icon: Shield,
      title: 'آمن وموثوق',
      description: 'بياناتك محمية بأعلى معايير الأمان'
    }
  ];

  if (isInstalled || isStandalone) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
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

        <main className="flex-1 container mx-auto px-4 py-12 flex items-center justify-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center max-w-md"
          >
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="h-10 w-10 text-green-500" />
            </div>
            <h1 className="text-3xl font-bold mb-4">تم تثبيت التطبيق! 🎉</h1>
            <p className="text-muted-foreground mb-8">
              يمكنك الآن الوصول للتطبيق من الشاشة الرئيسية لجهازك
            </p>
            <Button asChild size="lg" className="font-arabic">
              <Link to="/app">
                ابدأ التسوق
              </Link>
            </Button>
          </motion.div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
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

      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm mb-6">
            <Smartphone className="h-4 w-4" />
            <span>تطبيق مجاني</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            ثبّت تطبيق الحي على جهازك
          </h1>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            احصل على تجربة أفضل مع التطبيق المثبت على شاشتك الرئيسية
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-2 gap-4 mb-12 max-w-lg mx-auto">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="text-center h-full">
                <CardContent className="p-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-bold text-sm mb-1">{feature.title}</h3>
                  <p className="text-xs text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Android Install Button */}
        {deferredPrompt && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md mx-auto mb-8"
          >
            <Button 
              onClick={handleInstallClick} 
              size="lg" 
              className="w-full text-lg font-arabic"
            >
              <Download className="h-5 w-5 ml-2" />
              تثبيت التطبيق الآن
            </Button>
          </motion.div>
        )}

        {/* iOS Instructions */}
        {isIOS && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="max-w-md mx-auto mb-8 border-primary/30">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30">
                    iPhone / iPad
                  </Badge>
                </div>
                <CardTitle className="text-xl">خطوات التثبيت على iOS</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Step 1 */}
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                    1
                  </div>
                  <div>
                    <h4 className="font-bold mb-2">اضغط على زر المشاركة</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      في أسفل الشاشة (Safari) أو أعلى الشاشة
                    </p>
                    <div className="inline-flex items-center gap-2 bg-muted px-3 py-2 rounded-lg">
                      <Share className="h-5 w-5 text-blue-500" />
                      <span className="text-sm">زر المشاركة</span>
                    </div>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                    2
                  </div>
                  <div>
                    <h4 className="font-bold mb-2">اختر "إضافة إلى الشاشة الرئيسية"</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      مرر للأسفل في القائمة حتى تجده
                    </p>
                    <div className="inline-flex items-center gap-2 bg-muted px-3 py-2 rounded-lg">
                      <Plus className="h-5 w-5 text-primary" />
                      <span className="text-sm">إضافة إلى الشاشة الرئيسية</span>
                    </div>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                    3
                  </div>
                  <div>
                    <h4 className="font-bold mb-2">اضغط "إضافة"</h4>
                    <p className="text-sm text-muted-foreground">
                      سيظهر التطبيق على شاشتك الرئيسية
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-border">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <ArrowDown className="h-4 w-4 animate-bounce" />
                    <span>اتبع الخطوات أعلاه للتثبيت</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Android Instructions (when no prompt available) */}
        {isAndroid && !deferredPrompt && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="max-w-md mx-auto mb-8 border-primary/30">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
                    Android
                  </Badge>
                </div>
                <CardTitle className="text-xl">خطوات التثبيت على Android</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Step 1 */}
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                    1
                  </div>
                  <div>
                    <h4 className="font-bold mb-2">اضغط على قائمة المتصفح</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      النقاط الثلاث في أعلى الشاشة
                    </p>
                    <div className="inline-flex items-center gap-2 bg-muted px-3 py-2 rounded-lg">
                      <MoreVertical className="h-5 w-5" />
                      <span className="text-sm">قائمة الخيارات</span>
                    </div>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                    2
                  </div>
                  <div>
                    <h4 className="font-bold mb-2">اختر "تثبيت التطبيق" أو "إضافة إلى الشاشة"</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      قد يظهر كـ "Install app" أو "Add to Home screen"
                    </p>
                    <div className="inline-flex items-center gap-2 bg-muted px-3 py-2 rounded-lg">
                      <Download className="h-5 w-5 text-primary" />
                      <span className="text-sm">تثبيت التطبيق</span>
                    </div>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                    3
                  </div>
                  <div>
                    <h4 className="font-bold mb-2">اضغط "تثبيت"</h4>
                    <p className="text-sm text-muted-foreground">
                      سيظهر التطبيق على شاشتك الرئيسية
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Desktop Instructions */}
        {!isIOS && !isAndroid && !deferredPrompt && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="max-w-md mx-auto mb-8">
              <CardHeader>
                <CardTitle className="text-xl">التثبيت على الكمبيوتر</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  في Chrome أو Edge، ابحث عن أيقونة التثبيت في شريط العنوان أو استخدم قائمة المتصفح.
                </p>
                <div className="flex items-center gap-2 text-sm bg-muted p-3 rounded-lg">
                  <Download className="h-4 w-4" />
                  <span>ابحث عن "تثبيت التطبيق" في قائمة المتصفح</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Back to Home */}
        <div className="text-center">
          <Button variant="outline" asChild className="font-arabic">
            <Link to="/">
              العودة للصفحة الرئيسية
            </Link>
          </Button>
        </div>
      </main>
    </div>
  );
};

export default Install;
