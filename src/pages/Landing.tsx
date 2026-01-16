import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import heroCustomerVideo from '@/assets/hero-customer.mp4';
import heroProviderVideo from '@/assets/hero-provider.mp4';
import {
  MapPin, 
  Truck, 
  Star, 
  ArrowLeft,
  Store,
  Shield,
  Gift,
  ShoppingBag,
  Zap,
  Download,
  Users,
  Bell,
  BarChart3,
  CreditCard,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { AnimatedLogo } from '@/components/ui/AnimatedLogo';
import { InteractiveBackground } from '@/components/ui/InteractiveBackground';
import { PageTransition } from '@/components/ui/PageTransition';
import { motion } from 'framer-motion';

const Landing = () => {
  const stats = [
    { value: '+50K', label: 'عميل', icon: Users },
    { value: '+1.2K', label: 'مقدم خدمة', icon: Store },
    { value: '+100K', label: 'طلب/شهر', icon: ShoppingBag },
    { value: '4.9', label: 'تقييم', icon: Star }
  ];

  const customerFeatures = [
    { icon: MapPin, title: 'قريب منك', desc: 'خدمات في حيّك' },
    { icon: Truck, title: 'توصيل سريع', desc: '15-30 دقيقة' },
    { icon: Gift, title: 'مكافآت', desc: 'نقاط مع كل طلب' },
  ];

  const providerFeatures = [
    { icon: Store, title: 'متجرك', desc: 'تصميم احترافي' },
    { icon: BarChart3, title: 'تقارير', desc: 'إحصائيات مبيعات' },
    { icon: CreditCard, title: 'دفع', desc: 'مدى وفيزا' },
  ];

  return (
    <PageTransition>
      <div className="min-h-screen bg-background font-arabic relative overflow-hidden" dir="rtl">
        <InteractiveBackground variant="particles" intensity="subtle" />
        
        {/* Header */}
        <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b pt-[env(safe-area-inset-top)]">
          <div className="container mx-auto px-4 py-1">
            <div className="flex items-center justify-between mb-3">
              <AnimatedLogo size="md" showText={true} />
              <ThemeToggle />
            </div>
            {/* How it Works - 3 Steps */}
            <div className="flex justify-center gap-2 md:gap-6 text-[10px] md:text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-[10px]">1</span>
                <span className="text-muted-foreground">اختر حيّك</span>
              </div>
              <ArrowLeft className="h-3 w-3 text-muted-foreground/50 rotate-180" />
              <div className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-[10px]">2</span>
                <span className="text-muted-foreground">اطلب منتجاتك</span>
              </div>
              <ArrowLeft className="h-3 w-3 text-muted-foreground/50 rotate-180" />
              <div className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-[10px]">3</span>
                <span className="text-muted-foreground">استلم بدقائق</span>
              </div>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="relative py-10 md:py-16">
          <div className="container mx-auto px-4">
            {/* Title */}
            <motion.div 
              className="text-center mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <motion.h1 
                className="text-4xl md:text-6xl font-bold mb-3 bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent"
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                الحي يحيييك
              </motion.h1>
              <p className="text-lg text-muted-foreground">
                منصة تربط مقدمي الخدمات المحلية بسكان الأحياء
              </p>
            </motion.div>

            {/* Stats Row */}
            <div className="flex justify-center gap-6 md:gap-12 mb-10">
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  className="text-center"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                >
                  <div className="text-xl md:text-2xl font-bold text-primary">{stat.value}</div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                </motion.div>
              ))}
            </div>

            {/* Two Cards */}
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {/* Customer Card */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card className="overflow-hidden border-2 hover:border-primary/50 transition-all group h-full">
                  <div className="relative h-40 overflow-hidden">
                    <video 
                      src={heroCustomerVideo} 
                      autoPlay 
                      loop 
                      muted 
                      playsInline
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
                    {/* Slogan Top Left */}
                    <div className="absolute top-3 left-3">
                      <span className="text-lg font-bold text-white drop-shadow-lg bg-primary/80 px-2 py-1 rounded-md">
                        الحي يحيييك
                      </span>
                    </div>
                    <div className="absolute bottom-3 right-4 left-4">
                      <Badge className="bg-primary/90 text-xs mb-1">
                        <ShoppingBag className="h-3 w-3 ml-1" />
                        للعملاء
                      </Badge>
                      <h3 className="text-xl font-bold text-white drop-shadow-lg">اطلب من جيرانك</h3>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      {customerFeatures.map((f, i) => (
                        <div key={i} className="text-center p-2 rounded-lg bg-muted/50">
                          <f.icon className="h-4 w-4 text-primary mx-auto mb-1" />
                          <p className="text-[10px] font-medium leading-tight">{f.title}</p>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Button className="flex-1 font-arabic text-sm" size="sm" asChild>
                        <Link to="/app">
                          ابدأ الطلب
                          <ArrowLeft className="h-3 w-3 mr-1" />
                        </Link>
                      </Button>
                      <Button variant="outline" size="icon" className="h-9 w-9" asChild>
                        <Link to="/install">
                          <Download className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Provider Card */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Card className="overflow-hidden border-2 hover:border-accent/50 transition-all group h-full">
                  <div className="relative h-40 overflow-hidden">
                    <video 
                      src={heroProviderVideo} 
                      autoPlay 
                      loop 
                      muted 
                      playsInline
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
                    {/* Slogan Top Left */}
                    <div className="absolute top-3 left-3">
                      <span className="text-lg font-bold text-white drop-shadow-lg bg-accent/80 px-2 py-1 rounded-md">
                        الحي يحيييك
                      </span>
                    </div>
                    <div className="absolute bottom-3 right-4 left-4">
                      <Badge className="bg-accent/90 text-xs mb-1">
                        <Store className="h-3 w-3 ml-1" />
                        لمقدمي الخدمات
                      </Badge>
                      <h3 className="text-xl font-bold text-white drop-shadow-lg">حوّل موهبتك لمشروع</h3>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      {providerFeatures.map((f, i) => (
                        <div key={i} className="text-center p-2 rounded-lg bg-muted/50">
                          <f.icon className="h-4 w-4 text-accent mx-auto mb-1" />
                          <p className="text-[10px] font-medium leading-tight">{f.title}</p>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Button className="flex-1 font-arabic text-sm bg-accent hover:bg-accent/90" size="sm" asChild>
                        <Link to="/provider-register">
                          <Zap className="h-3 w-3 ml-1" />
                          ابدأ مجاناً
                        </Link>
                      </Button>
                      <Button variant="outline" size="icon" className="h-9 w-9" asChild>
                        <Link to="/provider-login">
                          <ArrowLeft className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Trust Badges */}
        <section className="py-6 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap justify-center gap-4 md:gap-8 text-xs md:text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Shield className="h-4 w-4 text-green-500" />
                <span>دفع آمن</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Truck className="h-4 w-4 text-primary" />
                <span>توصيل سريع</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Bell className="h-4 w-4 text-accent" />
                <span>إشعارات فورية</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-blue-500" />
                <span>30 يوم مجاناً</span>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-6 border-t">
          <div className="container mx-auto px-4 text-center">
            <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-muted-foreground mb-3">
              <Link to="/terms" className="hover:text-primary transition-colors">الشروط</Link>
              <Link to="/privacy" className="hover:text-primary transition-colors">الخصوصية</Link>
              <Link to="/faq" className="hover:text-primary transition-colors">الأسئلة</Link>
              <Link to="/contact" className="hover:text-primary transition-colors">اتصل بنا</Link>
              <Link to="/admin-login" className="hover:text-primary transition-colors flex items-center gap-1">
                <Lock className="h-3 w-3" />
                الإدارة
              </Link>
            </div>
            <p className="text-[10px] text-muted-foreground">
              © 2026 منصة الحي. جميع الحقوق محفوظة.
            </p>
          </div>
        </footer>
      </div>
    </PageTransition>
  );
};

export default Landing;
