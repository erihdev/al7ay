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
  Home
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { AnimatedLogo } from '@/components/ui/AnimatedLogo';
import { InteractiveBackground } from '@/components/ui/InteractiveBackground';
import { PageTransition } from '@/components/ui/PageTransition';
import { motion } from 'framer-motion';

const WhyAlHay = () => {
  const customerBenefits = [
    { 
      icon: MapPin, 
      title: 'خدمات قريبة منك', 
      desc: 'اكتشف مزودي خدمات محليين في حيّك، لا حاجة للتنقل بعيداً',
      color: 'text-primary'
    },
    { 
      icon: Truck, 
      title: 'توصيل فائق السرعة', 
      desc: 'استلم طلبك خلال 15-30 دقيقة لأن المزود جارك!',
      color: 'text-green-500'
    },
    { 
      icon: Gift, 
      title: 'مكافآت مستمرة', 
      desc: 'اكسب نقاط مع كل طلب واستبدلها بخصومات حصرية',
      color: 'text-amber-500'
    },
    { 
      icon: Heart, 
      title: 'دعم المجتمع المحلي', 
      desc: 'كل طلب يدعم رائد أعمال محلي ويقوي اقتصاد حيّك',
      color: 'text-pink-500'
    },
    { 
      icon: Star, 
      title: 'جودة موثوقة', 
      desc: 'تقييمات حقيقية من جيرانك تضمن لك أفضل الخدمات',
      color: 'text-yellow-500'
    },
    { 
      icon: Clock, 
      title: 'جدولة مرنة', 
      desc: 'اطلب الآن أو جدول لوقت يناسبك',
      color: 'text-blue-500'
    },
  ];

  const providerBenefits = [
    { 
      icon: Store, 
      title: 'متجرك الإلكتروني', 
      desc: 'احصل على متجر احترافي جاهز بدون أي تكلفة تقنية',
      color: 'text-accent'
    },
    { 
      icon: Users, 
      title: 'عملاء جاهزين', 
      desc: 'وصول مباشر لسكان حيّك الباحثين عن خدماتك',
      color: 'text-primary'
    },
    { 
      icon: BarChart3, 
      title: 'تقارير ذكية', 
      desc: 'تابع مبيعاتك وأرباحك بإحصائيات مفصلة',
      color: 'text-green-500'
    },
    { 
      icon: CreditCard, 
      title: 'دفع إلكتروني', 
      desc: 'استقبل مدفوعات مدى وفيزا بكل سهولة',
      color: 'text-blue-500'
    },
    { 
      icon: Bell, 
      title: 'إشعارات فورية', 
      desc: 'لا تفوت أي طلب مع تنبيهات صوتية ومرئية',
      color: 'text-amber-500'
    },
    { 
      icon: TrendingUp, 
      title: 'نمو مستمر', 
      desc: 'أدوات تسويق وعروض خاصة لزيادة مبيعاتك',
      color: 'text-pink-500'
    },
  ];

  return (
    <PageTransition>
      <div className="min-h-screen bg-background font-arabic relative overflow-hidden" dir="rtl">
        <InteractiveBackground variant="gradient" intensity="subtle" />
        
        {/* Header */}
        <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b pt-[env(safe-area-inset-top)]">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <Link to="/" className="flex items-center gap-2">
                <ArrowRight className="h-5 w-5" />
                <span className="text-sm">الرئيسية</span>
              </Link>
              <AnimatedLogo size="sm" showText={true} />
              <ThemeToggle />
            </div>
          </div>
        </header>

        {/* Hero Section with Neighborhood Image */}
        <section className="relative py-12 md:py-20">
          <div className="absolute inset-0">
            <img 
              src={neighborhoodConnection} 
              alt="شبكة الحي" 
              className="w-full h-full object-cover opacity-20"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-background via-background/90 to-background" />
          </div>
          
          <div className="container mx-auto px-4 relative z-10">
            <motion.div 
              className="text-center max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Badge className="mb-4 text-sm px-4 py-1.5">
                <Sparkles className="h-4 w-4 ml-2" />
                لماذا تختار الحي؟
              </Badge>
              <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                الحي يحيييك
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground mb-6">
                منصة تربط بين جيران الحي الواحد
                <br />
                <span className="text-primary font-semibold">خدمات محلية بلمسة جارك</span>
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button size="lg" asChild>
                  <Link to="/app">
                    <ShoppingBag className="h-5 w-5 ml-2" />
                    ابدأ كعميل
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="border-accent text-accent hover:bg-accent hover:text-accent-foreground" asChild>
                  <Link to="/provider-register">
                    <Store className="h-5 w-5 ml-2" />
                    انضم كمزود
                  </Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Customer Section */}
        <section className="py-12 md:py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-10 items-center">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                  <img 
                    src={heroCustomerWhy} 
                    alt="تجربة العميل" 
                    className="w-full h-auto"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-4 right-4 left-4">
                    <Badge className="bg-primary text-lg px-4 py-2">
                      <ShoppingBag className="h-5 w-5 ml-2" />
                      للعملاء
                    </Badge>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <h2 className="text-3xl md:text-4xl font-bold mb-6">
                  لماذا تطلب من <span className="text-primary">الحي</span>؟
                </h2>
                <p className="text-lg text-muted-foreground mb-8">
                  استمتع بتجربة تسوق فريدة من مزودي خدمات محليين موهوبين في حيّك
                </p>
                
                <div className="grid sm:grid-cols-2 gap-4">
                  {customerBenefits.map((benefit, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className="h-full hover:border-primary/50 transition-all">
                        <CardContent className="p-4">
                          <benefit.icon className={`h-8 w-8 mb-3 ${benefit.color}`} />
                          <h3 className="font-bold mb-1">{benefit.title}</h3>
                          <p className="text-sm text-muted-foreground">{benefit.desc}</p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>

                <Button className="mt-8 w-full sm:w-auto" size="lg" asChild>
                  <Link to="/app">
                    ابدأ الطلب الآن
                    <ArrowLeft className="h-5 w-5 mr-2" />
                  </Link>
                </Button>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Provider Section */}
        <section className="py-12 md:py-20">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-10 items-center">
              <motion.div
                className="order-2 lg:order-1"
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <h2 className="text-3xl md:text-4xl font-bold mb-6">
                  لماذا تنضم كـ<span className="text-accent">مزود خدمة</span>؟
                </h2>
                <p className="text-lg text-muted-foreground mb-8">
                  حوّل موهبتك إلى مشروع ناجح واصل لعملاء في حيّك مباشرة
                </p>
                
                <div className="grid sm:grid-cols-2 gap-4">
                  {providerBenefits.map((benefit, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className="h-full hover:border-accent/50 transition-all">
                        <CardContent className="p-4">
                          <benefit.icon className={`h-8 w-8 mb-3 ${benefit.color}`} />
                          <h3 className="font-bold mb-1">{benefit.title}</h3>
                          <p className="text-sm text-muted-foreground">{benefit.desc}</p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-4 mt-8">
                  <Button className="bg-accent hover:bg-accent/90" size="lg" asChild>
                    <Link to="/provider-register">
                      <Zap className="h-5 w-5 ml-2" />
                      ابدأ مجاناً - 30 يوم
                    </Link>
                  </Button>
                  <Button variant="outline" size="lg" asChild>
                    <Link to="/provider-login">
                      تسجيل الدخول
                    </Link>
                  </Button>
                </div>
              </motion.div>

              <motion.div
                className="order-1 lg:order-2"
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                  <img 
                    src={heroProviderWhy} 
                    alt="تجربة المزود" 
                    className="w-full h-auto"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-4 right-4 left-4">
                    <Badge className="bg-accent text-lg px-4 py-2">
                      <Store className="h-5 w-5 ml-2" />
                      لمزودي الخدمات
                    </Badge>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Neighborhood Connection Section */}
        <section className="py-12 md:py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <motion.div 
              className="text-center max-w-3xl mx-auto mb-10"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                نربط بين <span className="text-primary">جيران الحي</span>
              </h2>
              <p className="text-lg text-muted-foreground">
                منصة الحي تُنشئ شبكة تواصل بين سكان الحي الواحد، حيث يستفيد الجميع
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
            >
              <div className="relative rounded-2xl overflow-hidden shadow-2xl max-w-4xl mx-auto">
                <img 
                  src={neighborhoodConnection} 
                  alt="شبكة الحي" 
                  className="w-full h-auto"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
                <div className="absolute bottom-6 right-6 left-6 text-center">
                  <h3 className="text-2xl font-bold text-white drop-shadow-lg mb-2">
                    كل نقطة مضيئة تمثل فرصة
                  </h3>
                  <p className="text-white/80 drop-shadow-lg">
                    مزودين محليين وعملاء متصلين في حي واحد
                  </p>
                </div>
              </div>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6 mt-10 max-w-4xl mx-auto">
              <Card className="text-center p-6 hover:border-primary/50 transition-all">
                <Home className="h-10 w-10 text-primary mx-auto mb-3" />
                <h3 className="font-bold text-lg mb-2">محلي 100%</h3>
                <p className="text-sm text-muted-foreground">خدمات من جيرانك في نفس الحي</p>
              </Card>
              <Card className="text-center p-6 hover:border-accent/50 transition-all">
                <MessageCircle className="h-10 w-10 text-accent mx-auto mb-3" />
                <h3 className="font-bold text-lg mb-2">تواصل مباشر</h3>
                <p className="text-sm text-muted-foreground">تفاهم سريع وخدمة شخصية</p>
              </Card>
              <Card className="text-center p-6 hover:border-green-500/50 transition-all">
                <Wallet className="h-10 w-10 text-green-500 mx-auto mb-3" />
                <h3 className="font-bold text-lg mb-2">اقتصاد الحي</h3>
                <p className="text-sm text-muted-foreground">أموالك تبقى في مجتمعك</p>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 md:py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/5 to-primary/10" />
          <div className="container mx-auto px-4 relative z-10">
            <motion.div 
              className="text-center max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-5xl font-bold mb-6">
                انضم لمجتمع <span className="text-primary">الحي</span> اليوم
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                سواء كنت تبحث عن خدمات محلية أو تريد بدء مشروعك، الحي هو مكانك
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button size="lg" className="text-lg px-8" asChild>
                  <Link to="/app">
                    <ShoppingBag className="h-6 w-6 ml-2" />
                    تصفح الخدمات
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="text-lg px-8 border-accent text-accent hover:bg-accent hover:text-accent-foreground" asChild>
                  <Link to="/provider-register">
                    <Zap className="h-6 w-6 ml-2" />
                    سجل كمزود
                  </Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Trust Badges */}
        <section className="py-6 bg-muted/30 border-t">
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap justify-center gap-6 md:gap-10 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-500" />
                <span>دفع آمن 100%</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-primary" />
                <span>توصيل سريع</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-blue-500" />
                <span>30 يوم تجربة مجانية</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                <span>+50K عميل سعيد</span>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-6 border-t">
          <div className="container mx-auto px-4 text-center">
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground mb-3">
              <Link to="/" className="hover:text-primary transition-colors">الرئيسية</Link>
              <Link to="/terms" className="hover:text-primary transition-colors">الشروط</Link>
              <Link to="/privacy" className="hover:text-primary transition-colors">الخصوصية</Link>
              <Link to="/faq" className="hover:text-primary transition-colors">الأسئلة</Link>
              <Link to="/contact" className="hover:text-primary transition-colors">اتصل بنا</Link>
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
