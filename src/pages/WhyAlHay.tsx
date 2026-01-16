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

// Floating icons component
const FloatingIcons = () => {
  const icons = [Coffee, Cake, ShoppingBag, Gift, Star, Heart];
  
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {icons.map((Icon, i) => (
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
            rotate: [0, 360],
            opacity: [0, 0.3, 0]
          }}
          transition={{ 
            duration: 15 + Math.random() * 10,
            repeat: Infinity,
            delay: i * 2,
            ease: 'linear'
          }}
        >
          <Icon className="h-8 w-8 md:h-12 md:w-12" />
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
  const { scrollYProgress } = useScroll({ target: containerRef });
  const y1 = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);
  const y2 = useTransform(scrollYProgress, [0, 1], ['0%', '-30%']);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 1.1]);

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
        <InteractiveBackground variant="particles" intensity="medium" />
        <FloatingIcons />
        
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
        <section className="relative py-16 md:py-24 overflow-hidden">
          <motion.div className="absolute inset-0" style={{ y: y1 }}>
            <img 
              src={neighborhoodConnection} 
              alt="شبكة الحي" 
              className="w-full h-full object-cover opacity-20 scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-background via-background/90 to-background" />
          </motion.div>
          
          {/* Animated decorative elements */}
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
          
          <div className="container mx-auto px-4 relative z-10">
            <motion.div 
              className="text-center max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            >
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
              >
                <Badge className="mb-6 text-sm px-6 py-2 bg-gradient-to-r from-primary/20 to-accent/20 border-primary/30">
                  <motion.div
                    animate={{ rotate: [0, 15, -15, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Sparkles className="h-4 w-4 ml-2" />
                  </motion.div>
                  لماذا تختار الحي؟
                </Badge>
              </motion.div>
              
              <motion.h1 
                className="text-5xl md:text-7xl font-bold mb-6"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <GradientText>الحي يحيييك</GradientText>
              </motion.h1>
              
              <motion.p 
                className="text-xl md:text-2xl text-muted-foreground mb-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                منصة تربط بين جيران الحي الواحد
                <br />
                <motion.span 
                  className="text-primary font-semibold inline-block"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  خدمات محلية بلمسة جارك
                </motion.span>
              </motion.p>
              
              <motion.div 
                className="flex flex-wrap justify-center gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button size="lg" className="text-lg px-8 shadow-lg shadow-primary/25" asChild>
                    <Link to="/app">
                      <ShoppingBag className="h-5 w-5 ml-2" />
                      ابدأ كعميل
                    </Link>
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button size="lg" variant="outline" className="text-lg px-8 border-accent text-accent hover:bg-accent hover:text-accent-foreground" asChild>
                    <Link to="/provider-register">
                      <Store className="h-5 w-5 ml-2" />
                      انضم كمزود
                    </Link>
                  </Button>
                </motion.div>
              </motion.div>
            </motion.div>

            {/* Stats with animated counters */}
            <motion.div 
              className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 max-w-3xl mx-auto"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  className="text-center p-4 rounded-2xl bg-card/50 backdrop-blur border"
                  whileHover={{ scale: 1.1, borderColor: 'hsl(var(--primary))' }}
                >
                  <div className="text-2xl md:text-3xl font-bold text-primary">
                    {stat.suffix === '⭐' ? (
                      <span>{stat.value}{stat.suffix}</span>
                    ) : (
                      <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Customer Section */}
        <section className="py-16 md:py-24 bg-gradient-to-b from-muted/30 to-background relative overflow-hidden">
          <motion.div 
            className="absolute -right-20 top-1/2 w-40 h-40 rounded-full bg-primary/10 blur-3xl"
            animate={{ x: [0, 30, 0], y: [-30, 30, -30] }}
            transition={{ duration: 8, repeat: Infinity }}
          />
          
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -50, rotateY: -15 }}
                whileInView={{ opacity: 1, x: 0, rotateY: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
              >
                <motion.div 
                  className="relative rounded-3xl overflow-hidden shadow-2xl group"
                  whileHover={{ scale: 1.02 }}
                  style={{ scale }}
                >
                  <motion.img 
                    src={heroCustomerWhy} 
                    alt="تجربة العميل" 
                    className="w-full h-auto transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <motion.div 
                    className="absolute bottom-6 right-6 left-6"
                    initial={{ y: 20, opacity: 0 }}
                    whileInView={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Badge className="bg-primary text-lg px-6 py-2.5 shadow-lg">
                      <motion.div
                        animate={{ rotate: [0, -10, 10, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        <ShoppingBag className="h-5 w-5 ml-2" />
                      </motion.div>
                      للعملاء
                    </Badge>
                  </motion.div>
                  
                  {/* Floating badge */}
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
                </motion.div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
              >
                <motion.h2 
                  className="text-3xl md:text-5xl font-bold mb-6"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                >
                  لماذا تطلب من <GradientText>الحي</GradientText>؟
                </motion.h2>
                <motion.p 
                  className="text-lg text-muted-foreground mb-10"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                >
                  استمتع بتجربة تسوق فريدة من مزودي خدمات محليين موهوبين في حيّك
                </motion.p>
                
                <motion.div 
                  className="grid sm:grid-cols-2 gap-4"
                  variants={containerVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                >
                  {customerBenefits.map((benefit, index) => (
                    <motion.div
                      key={index}
                      variants={itemVariants}
                      initial="rest"
                      whileHover="hover"
                    >
                      <motion.div variants={cardHoverVariants}>
                        <Card className="h-full border-2 hover:border-primary/50 transition-colors cursor-pointer overflow-hidden group">
                          <CardContent className="p-5 relative">
                            <div className={`absolute inset-0 bg-gradient-to-br ${benefit.color} opacity-0 group-hover:opacity-5 transition-opacity`} />
                            <motion.div
                              className={`h-12 w-12 mb-4 rounded-xl bg-gradient-to-br ${benefit.color} flex items-center justify-center`}
                              whileHover={{ rotate: [0, -10, 10, 0] }}
                              transition={{ duration: 0.5 }}
                            >
                              <benefit.icon className="h-6 w-6 text-white" />
                            </motion.div>
                            <h3 className="font-bold text-lg mb-2">{benefit.title}</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">{benefit.desc}</p>
                          </CardContent>
                        </Card>
                      </motion.div>
                    </motion.div>
                  ))}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5 }}
                >
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button className="mt-10 w-full sm:w-auto text-lg px-10 h-14 shadow-lg shadow-primary/25" size="lg" asChild>
                      <Link to="/app">
                        ابدأ الطلب الآن
                        <motion.div
                          animate={{ x: [0, 5, 0] }}
                          transition={{ duration: 1, repeat: Infinity }}
                        >
                          <ArrowLeft className="h-5 w-5 mr-2" />
                        </motion.div>
                      </Link>
                    </Button>
                  </motion.div>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Provider Section */}
        <section className="py-16 md:py-24 relative overflow-hidden">
          <motion.div 
            className="absolute -left-20 top-1/3 w-60 h-60 rounded-full bg-accent/10 blur-3xl"
            animate={{ x: [0, -30, 0], y: [30, -30, 30] }}
            transition={{ duration: 10, repeat: Infinity }}
          />
          
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <motion.div
                className="order-2 lg:order-1"
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
              >
                <motion.h2 
                  className="text-3xl md:text-5xl font-bold mb-6"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                >
                  لماذا تنضم كـ<span className="text-accent">مزود خدمة</span>؟
                </motion.h2>
                <motion.p 
                  className="text-lg text-muted-foreground mb-10"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                >
                  حوّل موهبتك إلى مشروع ناجح واصل لعملاء في حيّك مباشرة
                </motion.p>
                
                <motion.div 
                  className="grid sm:grid-cols-2 gap-4"
                  variants={containerVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                >
                  {providerBenefits.map((benefit, index) => (
                    <motion.div
                      key={index}
                      variants={itemVariants}
                      initial="rest"
                      whileHover="hover"
                    >
                      <motion.div variants={cardHoverVariants}>
                        <Card className="h-full border-2 hover:border-accent/50 transition-colors cursor-pointer overflow-hidden group">
                          <CardContent className="p-5 relative">
                            <div className={`absolute inset-0 bg-gradient-to-br ${benefit.color} opacity-0 group-hover:opacity-5 transition-opacity`} />
                            <motion.div
                              className={`h-12 w-12 mb-4 rounded-xl bg-gradient-to-br ${benefit.color} flex items-center justify-center`}
                              whileHover={{ rotate: [0, -10, 10, 0] }}
                              transition={{ duration: 0.5 }}
                            >
                              <benefit.icon className="h-6 w-6 text-white" />
                            </motion.div>
                            <h3 className="font-bold text-lg mb-2">{benefit.title}</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">{benefit.desc}</p>
                          </CardContent>
                        </Card>
                      </motion.div>
                    </motion.div>
                  ))}
                </motion.div>

                <motion.div 
                  className="flex flex-wrap gap-4 mt-10"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5 }}
                >
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button className="bg-accent hover:bg-accent/90 text-lg px-8 h-14 shadow-lg shadow-accent/25" size="lg" asChild>
                      <Link to="/provider-register">
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        >
                          <Zap className="h-5 w-5 ml-2" />
                        </motion.div>
                        ابدأ مجاناً - 30 يوم
                      </Link>
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button variant="outline" size="lg" className="text-lg h-14" asChild>
                      <Link to="/provider-login">
                        تسجيل الدخول
                      </Link>
                    </Button>
                  </motion.div>
                </motion.div>
              </motion.div>

              <motion.div
                className="order-1 lg:order-2"
                initial={{ opacity: 0, x: 50, rotateY: 15 }}
                whileInView={{ opacity: 1, x: 0, rotateY: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
              >
                <motion.div 
                  className="relative rounded-3xl overflow-hidden shadow-2xl group"
                  whileHover={{ scale: 1.02 }}
                >
                  <motion.img 
                    src={heroProviderWhy} 
                    alt="تجربة المزود" 
                    className="w-full h-auto transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <motion.div 
                    className="absolute bottom-6 right-6 left-6"
                    initial={{ y: 20, opacity: 0 }}
                    whileInView={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Badge className="bg-accent text-lg px-6 py-2.5 shadow-lg">
                      <motion.div
                        animate={{ rotate: [0, -10, 10, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        <Store className="h-5 w-5 ml-2" />
                      </motion.div>
                      لمزودي الخدمات
                    </Badge>
                  </motion.div>
                  
                  {/* Floating success badge */}
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
                </motion.div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Neighborhood Connection Section */}
        <section className="py-16 md:py-24 bg-gradient-to-b from-muted/30 to-background relative overflow-hidden">
          <div className="container mx-auto px-4">
            <motion.div 
              className="text-center max-w-3xl mx-auto mb-12"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <motion.h2 
                className="text-3xl md:text-5xl font-bold mb-4"
                initial={{ scale: 0.9 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
              >
                نربط بين <GradientText>جيران الحي</GradientText>
              </motion.h2>
              <p className="text-lg text-muted-foreground">
                منصة الحي تُنشئ شبكة تواصل بين سكان الحي الواحد، حيث يستفيد الجميع
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <motion.div 
                className="relative rounded-3xl overflow-hidden shadow-2xl max-w-5xl mx-auto group"
                whileHover={{ scale: 1.01 }}
                style={{ y: y2 }}
              >
                <motion.img 
                  src={neighborhoodConnection} 
                  alt="شبكة الحي" 
                  className="w-full h-auto transition-transform duration-1000 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
                <motion.div 
                  className="absolute bottom-8 right-8 left-8 text-center"
                  initial={{ y: 30, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <h3 className="text-2xl md:text-3xl font-bold text-white drop-shadow-lg mb-3">
                    كل نقطة مضيئة تمثل فرصة
                  </h3>
                  <p className="text-white/90 drop-shadow-lg text-lg">
                    مزودين محليين وعملاء متصلين في حي واحد
                  </p>
                </motion.div>
                
                {/* Animated connection lines overlay */}
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
              </motion.div>
            </motion.div>

            <motion.div 
              className="grid md:grid-cols-3 gap-6 mt-12 max-w-4xl mx-auto"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {[
                { icon: Home, title: 'محلي 100%', desc: 'خدمات من جيرانك في نفس الحي', color: 'primary' },
                { icon: MessageCircle, title: 'تواصل مباشر', desc: 'تفاهم سريع وخدمة شخصية', color: 'accent' },
                { icon: Wallet, title: 'اقتصاد الحي', desc: 'أموالك تبقى في مجتمعك', color: 'green-500' },
              ].map((item, index) => (
                <motion.div key={index} variants={itemVariants}>
                  <motion.div
                    whileHover={{ y: -10, scale: 1.02 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    <Card className={`text-center p-8 hover:border-${item.color}/50 transition-all h-full`}>
                      <motion.div
                        className={`h-16 w-16 mx-auto mb-4 rounded-2xl bg-${item.color}/10 flex items-center justify-center`}
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.6 }}
                      >
                        <item.icon className={`h-8 w-8 text-${item.color}`} />
                      </motion.div>
                      <h3 className="font-bold text-xl mb-2">{item.title}</h3>
                      <p className="text-muted-foreground">{item.desc}</p>
                    </Card>
                  </motion.div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 md:py-32 relative overflow-hidden">
          <motion.div 
            className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/5 to-primary/10"
            animate={{ 
              background: [
                'linear-gradient(135deg, hsl(var(--primary)/0.1), hsl(var(--accent)/0.05), hsl(var(--primary)/0.1))',
                'linear-gradient(135deg, hsl(var(--accent)/0.1), hsl(var(--primary)/0.05), hsl(var(--accent)/0.1))',
                'linear-gradient(135deg, hsl(var(--primary)/0.1), hsl(var(--accent)/0.05), hsl(var(--primary)/0.1))'
              ]
            }}
            transition={{ duration: 5, repeat: Infinity }}
          />
          
          {/* Animated shapes */}
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
          
          <div className="container mx-auto px-4 relative z-10">
            <motion.div 
              className="text-center max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <motion.h2 
                className="text-4xl md:text-6xl font-bold mb-8"
                initial={{ scale: 0.9 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
              >
                انضم لمجتمع <GradientText>الحي</GradientText> اليوم
              </motion.h2>
              <motion.p 
                className="text-xl text-muted-foreground mb-10"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                سواء كنت تبحث عن خدمات محلية أو تريد بدء مشروعك، الحي هو مكانك
              </motion.p>
              <motion.div 
                className="flex flex-wrap justify-center gap-4"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <motion.div 
                  whileHover={{ scale: 1.05, y: -3 }} 
                  whileTap={{ scale: 0.95 }}
                >
                  <Button size="lg" className="text-xl px-10 h-16 shadow-2xl shadow-primary/30" asChild>
                    <Link to="/app">
                      <motion.div
                        animate={{ rotate: [0, -10, 10, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <ShoppingBag className="h-6 w-6 ml-2" />
                      </motion.div>
                      تصفح الخدمات
                    </Link>
                  </Button>
                </motion.div>
                <motion.div 
                  whileHover={{ scale: 1.05, y: -3 }} 
                  whileTap={{ scale: 0.95 }}
                >
                  <Button size="lg" variant="outline" className="text-xl px-10 h-16 border-accent text-accent hover:bg-accent hover:text-accent-foreground" asChild>
                    <Link to="/provider-register">
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        <Zap className="h-6 w-6 ml-2" />
                      </motion.div>
                      سجل كمزود
                    </Link>
                  </Button>
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Trust Badges */}
        <section className="py-8 bg-muted/30 border-t">
          <div className="container mx-auto px-4">
            <motion.div 
              className="flex flex-wrap justify-center gap-8 md:gap-12 text-sm"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {[
                { icon: Shield, text: 'دفع آمن 100%', color: 'text-green-500' },
                { icon: Truck, text: 'توصيل سريع', color: 'text-primary' },
                { icon: CheckCircle2, text: '30 يوم تجربة مجانية', color: 'text-blue-500' },
                { icon: Star, text: '+50K عميل سعيد', color: 'text-yellow-500' },
              ].map((badge, index) => (
                <motion.div 
                  key={index}
                  variants={itemVariants}
                  className="flex items-center gap-2 text-muted-foreground"
                  whileHover={{ scale: 1.1, color: 'hsl(var(--foreground))' }}
                >
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, delay: index * 0.3 }}
                  >
                    <badge.icon className={`h-5 w-5 ${badge.color}`} />
                  </motion.div>
                  <span>{badge.text}</span>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 border-t">
          <div className="container mx-auto px-4 text-center">
            <motion.div 
              className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground mb-4"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              {['الرئيسية', 'الشروط', 'الخصوصية', 'الأسئلة', 'اتصل بنا'].map((item, index) => {
                const paths = ['/', '/terms', '/privacy', '/faq', '/contact'];
                return (
                  <motion.div key={item} whileHover={{ scale: 1.1, y: -2 }}>
                    <Link to={paths[index]} className="hover:text-primary transition-colors">
                      {item}
                    </Link>
                  </motion.div>
                );
              })}
            </motion.div>
            <motion.p 
              className="text-xs text-muted-foreground"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              © 2026 منصة الحي. جميع الحقوق محفوظة.
            </motion.p>
          </div>
        </footer>
      </div>
    </PageTransition>
  );
};

export default WhyAlHay;
