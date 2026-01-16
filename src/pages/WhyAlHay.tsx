import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import heroCustomerWhy from '@/assets/hero-customer-why.jpg';
import heroProviderWhy from '@/assets/hero-provider-why.jpg';
import neighborhoodConnection from '@/assets/neighborhood-connection.jpg';
import {
  MapPin, 
  Truck, 
  Star, 
  ArrowLeft,
  ArrowRight,
  Store,
  Shield,
  Gift,
  ShoppingBag,
  Zap,
  Users,
  Bell,
  BarChart3,
  CreditCard,
  CheckCircle2,
  Heart,
  Clock,
  Sparkles,
  TrendingUp,
  Wallet,
  MessageCircle,
  Home,
  Coffee,
  Cake
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { AnimatedLogo } from '@/components/ui/AnimatedLogo';
import { InteractiveBackground } from '@/components/ui/InteractiveBackground';
import { PageTransition } from '@/components/ui/PageTransition';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

// Animated counter component
const AnimatedCounter = ({ target, duration = 2, suffix = '' }: { target: number; duration?: number; suffix?: string }) => {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          let start = 0;
          const increment = target / (duration * 60);
          const animate = () => {
            start += increment;
            if (start < target) {
              setCount(Math.floor(start));
              requestAnimationFrame(animate);
            } else {
              setCount(target);
            }
          };
          animate();
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration, hasAnimated]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
};

// Floating icons component - simplified for mobile
const FloatingIcons = ({ isMobile }: { isMobile: boolean }) => {
  const icons = [Coffee, Cake, ShoppingBag, Gift, Star, Heart];
  
  // Reduce number of floating icons on mobile for performance
  const visibleIcons = isMobile ? icons.slice(0, 3) : icons;
  
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {visibleIcons.map((Icon, i) => (
        <motion.div
          key={i}
          className="absolute text-primary/10"
          initial={{ 
            x: Math.random() * 100 + '%', 
            y: Math.random() * 100 + '%',
            scale: 0.5 + Math.random() * 0.5
          }}
          animate={{ 
            y: [null, '-20%', '120%'],
            rotate: isMobile ? [0, 180] : [0, 360],
            opacity: [0, isMobile ? 0.2 : 0.3, 0]
          }}
          transition={{ 
            duration: isMobile ? 20 + Math.random() * 10 : 15 + Math.random() * 10,
            repeat: Infinity,
            delay: i * 3,
            ease: 'linear'
          }}
        >
          <Icon className="h-6 w-6 md:h-8 md:w-8 lg:h-12 lg:w-12" />
        </motion.div>
      ))}
    </div>
  );
};

// Gradient text animation
const GradientText = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <motion.span
    className={`bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_auto] bg-clip-text text-transparent ${className}`}
    animate={{ backgroundPosition: ['0%', '200%'] }}
    transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
  >
    {children}
  </motion.span>
);

const WhyAlHay = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const { scrollYProgress } = useScroll({ target: containerRef });
  
  // Reduce parallax effect on mobile for smoother scrolling
  const y1 = useTransform(scrollYProgress, [0, 1], ['0%', isMobile ? '20%' : '50%']);
  const y2 = useTransform(scrollYProgress, [0, 1], ['0%', isMobile ? '-10%' : '-30%']);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, isMobile ? 1.02 : 1.1]);

  const customerBenefits = [
    { 
      icon: MapPin, 
      title: 'خدمات قريبة منك', 
      desc: 'اكتشف مزودي خدمات محليين في حيّك، لا حاجة للتنقل بعيداً',
      color: 'from-primary to-primary/50'
    },
    { 
      icon: Truck, 
      title: 'توصيل فائق السرعة', 
      desc: 'استلم طلبك خلال 15-30 دقيقة لأن المزود جارك!',
      color: 'from-green-500 to-emerald-400'
    },
    { 
      icon: Gift, 
      title: 'مكافآت مستمرة', 
      desc: 'اكسب نقاط مع كل طلب واستبدلها بخصومات حصرية',
      color: 'from-amber-500 to-yellow-400'
    },
    { 
      icon: Heart, 
      title: 'دعم المجتمع المحلي', 
      desc: 'كل طلب يدعم رائد أعمال محلي ويقوي اقتصاد حيّك',
      color: 'from-pink-500 to-rose-400'
    },
    { 
      icon: Star, 
      title: 'جودة موثوقة', 
      desc: 'تقييمات حقيقية من جيرانك تضمن لك أفضل الخدمات',
      color: 'from-yellow-500 to-orange-400'
    },
    { 
      icon: Clock, 
      title: 'جدولة مرنة', 
      desc: 'اطلب الآن أو جدول لوقت يناسبك',
      color: 'from-blue-500 to-cyan-400'
    },
  ];

  const providerBenefits = [
    { 
      icon: Store, 
      title: 'متجرك الإلكتروني', 
      desc: 'احصل على متجر احترافي جاهز بدون أي تكلفة تقنية',
      color: 'from-accent to-accent/50'
    },
    { 
      icon: Users, 
      title: 'عملاء جاهزين', 
      desc: 'وصول مباشر لسكان حيّك الباحثين عن خدماتك',
      color: 'from-primary to-primary/50'
    },
    { 
      icon: BarChart3, 
      title: 'تقارير ذكية', 
      desc: 'تابع مبيعاتك وأرباحك بإحصائيات مفصلة',
      color: 'from-green-500 to-emerald-400'
    },
    { 
      icon: CreditCard, 
      title: 'دفع إلكتروني', 
      desc: 'استقبل مدفوعات مدى وفيزا بكل سهولة',
      color: 'from-blue-500 to-cyan-400'
    },
    { 
      icon: Bell, 
      title: 'إشعارات فورية', 
      desc: 'لا تفوت أي طلب مع تنبيهات صوتية ومرئية',
      color: 'from-amber-500 to-yellow-400'
    },
    { 
      icon: TrendingUp, 
      title: 'نمو مستمر', 
      desc: 'أدوات تسويق وعروض خاصة لزيادة مبيعاتك',
      color: 'from-pink-500 to-rose-400'
    },
  ];

  const stats = [
    { value: 50000, label: 'عميل سعيد', suffix: '+' },
    { value: 1200, label: 'مزود خدمة', suffix: '+' },
    { value: 100000, label: 'طلب شهرياً', suffix: '+' },
    { value: 4.9, label: 'تقييم', suffix: '⭐' },
  ];

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.9 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { type: 'spring' as const, stiffness: 100, damping: 15 }
    }
  };

  const cardHoverVariants = {
    rest: { scale: 1, y: 0, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' },
    hover: { 
      scale: 1.05, 
      y: -8,
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
      transition: { type: 'spring' as const, stiffness: 300 }
    }
  };

  return (
    <PageTransition>
      <div ref={containerRef} className="min-h-screen bg-background font-arabic relative overflow-hidden" dir="rtl">
        {/* Disable heavy background effects on mobile */}
        {!isMobile && <InteractiveBackground variant="particles" intensity="medium" />}
        <FloatingIcons isMobile={isMobile} />
        
        {/* Header */}
        <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b pt-[env(safe-area-inset-top)]">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <Link to="/" className="flex items-center gap-2 hover:text-primary transition-colors">
                <motion.div whileHover={{ x: 5 }} whileTap={{ scale: 0.9 }}>
                  <ArrowRight className="h-5 w-5" />
                </motion.div>
                <span className="text-sm">الرئيسية</span>
              </Link>
              <AnimatedLogo size="sm" showText={true} />
              <ThemeToggle />
            </div>
          </div>
        </header>

        {/* Hero Section with Parallax */}
        <section className="relative py-10 sm:py-16 md:py-24 overflow-hidden">
          {/* Only apply parallax on desktop */}
          <motion.div 
            className="absolute inset-0" 
            style={isMobile ? {} : { y: y1 }}
          >
            <img 
              src={neighborhoodConnection} 
              alt="شبكة الحي" 
              className="w-full h-full object-cover opacity-15 sm:opacity-20 scale-105 sm:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background" />
          </motion.div>
          
          {/* Animated decorative elements - smaller on mobile */}
          {!isMobile && (
            <>
              <motion.div 
                className="absolute top-20 right-10 w-20 h-20 rounded-full bg-primary/20 blur-xl"
                animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 4, repeat: Infinity }}
              />
              <motion.div 
                className="absolute bottom-20 left-10 w-32 h-32 rounded-full bg-accent/20 blur-xl"
                animate={{ scale: [1.2, 1, 1.2], opacity: [0.4, 0.2, 0.4] }}
                transition={{ duration: 5, repeat: Infinity }}
              />
            </>
          )}
          
          <div className="container mx-auto px-4 relative z-10">
            <motion.div 
              className="text-center max-w-3xl mx-auto"
              initial={{ opacity: 0, y: isMobile ? 20 : 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: isMobile ? 0.5 : 0.8, ease: 'easeOut' }}
            >
              <motion.div
                initial={{ scale: 0, rotate: isMobile ? -90 : -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
              >
                <Badge className="mb-4 sm:mb-6 text-xs sm:text-sm px-4 sm:px-6 py-1.5 sm:py-2 bg-gradient-to-r from-primary/20 to-accent/20 border-primary/30">
                  {!isMobile && (
                    <motion.div
                      animate={{ rotate: [0, 15, -15, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 ml-1.5 sm:ml-2" />
                    </motion.div>
                  )}
                  {isMobile && <Sparkles className="h-3 w-3 ml-1.5" />}
                  لماذا تختار الحي؟
                </Badge>
              </motion.div>
              
              <motion.h1 
                className="text-3xl sm:text-5xl md:text-7xl font-bold mb-4 sm:mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <GradientText>الحي يحيييك</GradientText>
              </motion.h1>
              
              <motion.p 
                className="text-base sm:text-xl md:text-2xl text-muted-foreground mb-6 sm:mb-8 px-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                منصة تربط بين جيران الحي الواحد
                <br />
                <span className="text-primary font-semibold">
                  خدمات محلية بلمسة جارك
                </span>
              </motion.p>
              
              <motion.div 
                className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 px-4 sm:px-0"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Button size={isMobile ? "default" : "lg"} className="text-base sm:text-lg px-6 sm:px-8 h-11 sm:h-12 shadow-lg shadow-primary/25" asChild>
                  <Link to="/app">
                    <ShoppingBag className="h-4 w-4 sm:h-5 sm:w-5 ml-2" />
                    ابدأ كعميل
                  </Link>
                </Button>
                <Button size={isMobile ? "default" : "lg"} variant="outline" className="text-base sm:text-lg px-6 sm:px-8 h-11 sm:h-12 border-accent text-accent hover:bg-accent hover:text-accent-foreground" asChild>
                  <Link to="/provider-register">
                    <Store className="h-4 w-4 sm:h-5 sm:w-5 ml-2" />
                    انضم كمزود
                  </Link>
                </Button>
              </motion.div>
            </motion.div>

            {/* Stats with animated counters */}
            <motion.div 
              className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 mt-8 sm:mt-16 max-w-3xl mx-auto px-2"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  className="text-center p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-card/50 backdrop-blur border"
                  whileHover={isMobile ? {} : { scale: 1.1, borderColor: 'hsl(var(--primary))' }}
                >
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold text-primary">
                    {stat.suffix === '⭐' ? (
                      <span>{stat.value}{stat.suffix}</span>
                    ) : (
                      <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                    )}
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground mt-1">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Customer Section */}
        <section className="py-10 sm:py-16 md:py-24 bg-gradient-to-b from-muted/30 to-background relative overflow-hidden">
          {!isMobile && (
            <motion.div 
              className="absolute -right-20 top-1/2 w-40 h-40 rounded-full bg-primary/10 blur-3xl"
              animate={{ x: [0, 30, 0], y: [-30, 30, -30] }}
              transition={{ duration: 8, repeat: Infinity }}
            />
          )}
          
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: isMobile ? 0 : -50, rotateY: isMobile ? 0 : -15 }}
                whileInView={{ opacity: 1, x: 0, rotateY: 0 }}
                viewport={{ once: true }}
                transition={{ duration: isMobile ? 0.5 : 0.8 }}
              >
                <motion.div 
                  className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl sm:shadow-2xl group"
                  whileHover={isMobile ? {} : { scale: 1.02 }}
                  style={isMobile ? {} : { scale }}
                >
                  <img 
                    src={heroCustomerWhy} 
                    alt="تجربة العميل" 
                    className="w-full h-auto"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute bottom-4 sm:bottom-6 right-4 sm:right-6 left-4 sm:left-6">
                    <Badge className="bg-primary text-sm sm:text-lg px-4 sm:px-6 py-1.5 sm:py-2.5 shadow-lg">
                      <ShoppingBag className="h-4 w-4 sm:h-5 sm:w-5 ml-1.5 sm:ml-2" />
                      للعملاء
                    </Badge>
                  </div>
                  
                  {/* Floating badge - simpler on mobile */}
                  {!isMobile && (
                    <motion.div 
                      className="absolute top-4 left-4"
                      animate={{ y: [0, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Badge variant="secondary" className="bg-white/90 text-primary shadow-lg">
                        <Star className="h-4 w-4 ml-1 fill-yellow-400 text-yellow-400" />
                        تجربة مميزة
                      </Badge>
                    </motion.div>
                  )}
                </motion.div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: isMobile ? 0 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: isMobile ? 0.5 : 0.8 }}
              >
                <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-4 sm:mb-6">
                  لماذا تطلب من <GradientText>الحي</GradientText>؟
                </h2>
                <p className="text-sm sm:text-lg text-muted-foreground mb-6 sm:mb-10">
                  استمتع بتجربة تسوق فريدة من مزودي خدمات محليين موهوبين في حيّك
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {customerBenefits.map((benefit, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: isMobile ? index * 0.05 : index * 0.1 }}
                    >
                      <Card className="h-full border hover:border-primary/50 transition-colors">
                        <CardContent className="p-4 sm:p-5 flex items-start gap-3 sm:gap-4">
                          <div className={`h-10 w-10 sm:h-12 sm:w-12 shrink-0 rounded-lg sm:rounded-xl bg-gradient-to-br ${benefit.color} flex items-center justify-center`}>
                            <benefit.icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                          </div>
                          <div>
                            <h3 className="font-bold text-base sm:text-lg mb-1">{benefit.title}</h3>
                            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{benefit.desc}</p>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>

                <Button className="mt-6 sm:mt-10 w-full sm:w-auto text-base sm:text-lg px-6 sm:px-10 h-11 sm:h-14 shadow-lg shadow-primary/25" size={isMobile ? "default" : "lg"} asChild>
                  <Link to="/app">
                    ابدأ الطلب الآن
                    <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  </Link>
                </Button>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Provider Section */}
        <section className="py-10 sm:py-16 md:py-24 relative overflow-hidden">
          {!isMobile && (
            <motion.div 
              className="absolute -left-20 top-1/3 w-60 h-60 rounded-full bg-accent/10 blur-3xl"
              animate={{ x: [0, -30, 0], y: [30, -30, 30] }}
              transition={{ duration: 10, repeat: Infinity }}
            />
          )}
          
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              <motion.div
                className="order-2 lg:order-1"
                initial={{ opacity: 0, x: isMobile ? 0 : -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: isMobile ? 0.5 : 0.8 }}
              >
                <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-4 sm:mb-6">
                  لماذا تنضم كـ<span className="text-accent">مزود خدمة</span>؟
                </h2>
                <p className="text-sm sm:text-lg text-muted-foreground mb-6 sm:mb-10">
                  حوّل موهبتك إلى مشروع ناجح واصل لعملاء في حيّك مباشرة
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {providerBenefits.map((benefit, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: isMobile ? index * 0.05 : index * 0.1 }}
                    >
                      <Card className="h-full border hover:border-accent/50 transition-colors">
                        <CardContent className="p-4 sm:p-5 flex items-start gap-3 sm:gap-4">
                          <div className={`h-10 w-10 sm:h-12 sm:w-12 shrink-0 rounded-lg sm:rounded-xl bg-gradient-to-br ${benefit.color} flex items-center justify-center`}>
                            <benefit.icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                          </div>
                          <div>
                            <h3 className="font-bold text-base sm:text-lg mb-1">{benefit.title}</h3>
                            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{benefit.desc}</p>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-6 sm:mt-10">
                  <Button className="bg-accent hover:bg-accent/90 text-base sm:text-lg px-6 sm:px-8 h-11 sm:h-14 shadow-lg shadow-accent/25" size={isMobile ? "default" : "lg"} asChild>
                    <Link to="/provider-register">
                      <Zap className="h-4 w-4 sm:h-5 sm:w-5 ml-2" />
                      ابدأ مجاناً - 30 يوم
                    </Link>
                  </Button>
                  <Button variant="outline" size={isMobile ? "default" : "lg"} className="text-base sm:text-lg h-11 sm:h-14" asChild>
                    <Link to="/provider-login">
                      تسجيل الدخول
                    </Link>
                  </Button>
                </div>
              </motion.div>

              <motion.div
                className="order-1 lg:order-2"
                initial={{ opacity: 0, x: isMobile ? 0 : 50, rotateY: isMobile ? 0 : 15 }}
                whileInView={{ opacity: 1, x: 0, rotateY: 0 }}
                viewport={{ once: true }}
                transition={{ duration: isMobile ? 0.5 : 0.8 }}
              >
                <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl sm:shadow-2xl">
                  <img 
                    src={heroProviderWhy} 
                    alt="تجربة المزود" 
                    className="w-full h-auto"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute bottom-4 sm:bottom-6 right-4 sm:right-6 left-4 sm:left-6">
                    <Badge className="bg-accent text-sm sm:text-lg px-4 sm:px-6 py-1.5 sm:py-2.5 shadow-lg">
                      <Store className="h-4 w-4 sm:h-5 sm:w-5 ml-1.5 sm:ml-2" />
                      لمزودي الخدمات
                    </Badge>
                  </div>
                  
                  {/* Floating success badge - only on desktop */}
                  {!isMobile && (
                    <motion.div 
                      className="absolute top-4 left-4"
                      animate={{ y: [0, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                    >
                      <Badge variant="secondary" className="bg-white/90 text-accent shadow-lg">
                        <TrendingUp className="h-4 w-4 ml-1" />
                        نمو مستمر
                      </Badge>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Neighborhood Connection Section */}
        <section className="py-10 sm:py-16 md:py-24 bg-gradient-to-b from-muted/30 to-background relative overflow-hidden">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-3 sm:mb-4">
                نربط بين <GradientText>جيران الحي</GradientText>
              </h2>
              <p className="text-sm sm:text-lg text-muted-foreground px-2">
                منصة الحي تُنشئ شبكة تواصل بين سكان الحي الواحد، حيث يستفيد الجميع
              </p>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: isMobile ? 0.5 : 0.8 }}
            >
              <div 
                className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl sm:shadow-2xl max-w-5xl mx-auto"
              >
                <img 
                  src={neighborhoodConnection} 
                  alt="شبكة الحي" 
                  className="w-full h-auto"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
                <div className="absolute bottom-4 sm:bottom-8 right-4 sm:right-8 left-4 sm:left-8 text-center">
                  <h3 className="text-lg sm:text-2xl md:text-3xl font-bold text-white drop-shadow-lg mb-1 sm:mb-3">
                    كل نقطة مضيئة تمثل فرصة
                  </h3>
                  <p className="text-white/90 drop-shadow-lg text-sm sm:text-lg">
                    مزودين محليين وعملاء متصلين في حي واحد
                  </p>
                </div>
                
                {/* Animated connection lines overlay - only on desktop */}
                {!isMobile && (
                  <motion.div 
                    className="absolute inset-0 pointer-events-none"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                  >
                    <svg className="w-full h-full opacity-50">
                      <motion.circle
                        cx="30%"
                        cy="40%"
                        r="8"
                        fill="hsl(var(--primary))"
                        initial={{ scale: 0 }}
                        animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                      <motion.circle
                        cx="70%"
                        cy="60%"
                        r="8"
                        fill="hsl(var(--accent))"
                        initial={{ scale: 0 }}
                        animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                        transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                      />
                    </svg>
                  </motion.div>
                )}
              </div>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mt-8 sm:mt-12 max-w-4xl mx-auto">
              {[
                { icon: Home, title: 'محلي 100%', desc: 'خدمات من جيرانك في نفس الحي', color: 'primary' },
                { icon: MessageCircle, title: 'تواصل مباشر', desc: 'تفاهم سريع وخدمة شخصية', color: 'accent' },
                { icon: Wallet, title: 'اقتصاد الحي', desc: 'أموالك تبقى في مجتمعك', color: 'green-500' },
              ].map((item, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="text-center p-5 sm:p-8 h-full">
                    <div className={`h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-3 sm:mb-4 rounded-xl sm:rounded-2xl bg-${item.color}/10 flex items-center justify-center`}>
                      <item.icon className={`h-6 w-6 sm:h-8 sm:w-8 text-${item.color}`} />
                    </div>
                    <h3 className="font-bold text-lg sm:text-xl mb-1 sm:mb-2">{item.title}</h3>
                    <p className="text-sm sm:text-base text-muted-foreground">{item.desc}</p>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-12 sm:py-20 md:py-32 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/5 to-primary/10" />
          
          {/* Animated shapes - only on desktop */}
          {!isMobile && (
            <>
              <motion.div 
                className="absolute top-10 left-10 w-24 h-24 border-2 border-primary/20 rounded-full"
                animate={{ rotate: 360, scale: [1, 1.1, 1] }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              />
              <motion.div 
                className="absolute bottom-10 right-10 w-32 h-32 border-2 border-accent/20 rounded-full"
                animate={{ rotate: -360, scale: [1.1, 1, 1.1] }}
                transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
              />
            </>
          )}
          
          <div className="container mx-auto px-4 relative z-10">
            <motion.div 
              className="text-center max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-2xl sm:text-4xl md:text-6xl font-bold mb-4 sm:mb-8">
                انضم لمجتمع <GradientText>الحي</GradientText> اليوم
              </h2>
              <p className="text-sm sm:text-xl text-muted-foreground mb-6 sm:mb-10 px-2">
                سواء كنت تبحث عن خدمات محلية أو تريد بدء مشروعك، الحي هو مكانك
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 px-4 sm:px-0">
                <Button size={isMobile ? "default" : "lg"} className="text-base sm:text-xl px-6 sm:px-10 h-12 sm:h-16 shadow-2xl shadow-primary/30" asChild>
                  <Link to="/app">
                    <ShoppingBag className="h-5 w-5 sm:h-6 sm:w-6 ml-2" />
                    تصفح الخدمات
                  </Link>
                </Button>
                <Button size={isMobile ? "default" : "lg"} variant="outline" className="text-base sm:text-xl px-6 sm:px-10 h-12 sm:h-16 border-accent text-accent hover:bg-accent hover:text-accent-foreground" asChild>
                  <Link to="/provider-register">
                    <Zap className="h-5 w-5 sm:h-6 sm:w-6 ml-2" />
                    سجل كمزود
                  </Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Trust Badges */}
        <section className="py-6 sm:py-8 bg-muted/30 border-t">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap justify-center gap-4 sm:gap-8 md:gap-12 text-xs sm:text-sm">
              {[
                { icon: Shield, text: 'دفع آمن 100%', color: 'text-green-500' },
                { icon: Truck, text: 'توصيل سريع', color: 'text-primary' },
                { icon: CheckCircle2, text: '30 يوم تجربة', color: 'text-blue-500' },
                { icon: Star, text: '+50K عميل', color: 'text-yellow-500' },
              ].map((badge, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-center gap-1.5 sm:gap-2 text-muted-foreground"
                >
                  <badge.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${badge.color}`} />
                  <span>{badge.text}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-6 sm:py-8 border-t pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
          <div className="container mx-auto px-4 text-center">
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
              {['الرئيسية', 'الشروط', 'الخصوصية', 'الأسئلة', 'اتصل بنا'].map((item, index) => {
                const paths = ['/', '/terms', '/privacy', '/faq', '/contact'];
                return (
                  <Link key={item} to={paths[index]} className="hover:text-primary transition-colors">
                    {item}
                  </Link>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              © 2026 منصة الحي. جميع الحقوق محفوظة.
            </p>
          </div>
        </footer>
      </div>
    </PageTransition>
  );
};

export default WhyAlHay;
