import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  MapPin, 
  Coffee, 
  Truck, 
  Star, 
  ArrowLeft,
  Smartphone,
  Shield,
  Heart,
  Clock,
  Gift,
  ShoppingBag,
  Zap,
  Download
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { AnimatedLogo } from '@/components/ui/AnimatedLogo';
import { InteractiveBackground } from '@/components/ui/InteractiveBackground';
import { PageTransition } from '@/components/ui/PageTransition';
import { motion } from 'framer-motion';

const CustomerLanding = () => {
  const features = [
    {
      icon: MapPin,
      title: 'خدمات قريبة منك',
      description: 'اكتشف مقدمي خدمات في حيّك واستمتع بتوصيل سريع'
    },
    {
      icon: Coffee,
      title: 'منتجات طازجة',
      description: 'قهوة، حلويات، ومأكولات منزلية طازجة يومياً'
    },
    {
      icon: Truck,
      title: 'توصيل سريع',
      description: 'استلم طلبك خلال دقائق من مقدمي خدمات حيّك'
    },
    {
      icon: Gift,
      title: 'برنامج مكافآت',
      description: 'اجمع النقاط واستبدلها بخصومات ومكافآت حصرية'
    },
    {
      icon: Shield,
      title: 'دفع آمن',
      description: 'خيارات دفع متعددة وآمنة لراحتك'
    },
    {
      icon: Heart,
      title: 'المفضلة',
      description: 'احفظ مقدمي الخدمات المفضلين لديك للوصول السريع'
    }
  ];

  const howItWorks = [
    {
      step: 1,
      icon: Smartphone,
      title: 'سجّل حسابك',
      description: 'أنشئ حسابك مجاناً في ثوانٍ'
    },
    {
      step: 2,
      icon: MapPin,
      title: 'اختر موقعك',
      description: 'حدد حيّك لنعرض لك الخدمات القريبة'
    },
    {
      step: 3,
      icon: ShoppingBag,
      title: 'اطلب بسهولة',
      description: 'تصفح المنتجات وأضفها لسلتك'
    },
    {
      step: 4,
      icon: Zap,
      title: 'استلم طلبك',
      description: 'تتبع طلبك واستلمه بسرعة'
    }
  ];

  const testimonials = [
    {
      name: 'أحمد',
      role: 'عميل دائم',
      content: 'الطلب سهل جداً والتوصيل سريع. القهوة تصلني وهي ساخنة!',
      rating: 5
    },
    {
      name: 'نورة',
      role: 'عميلة',
      content: 'أحب فكرة دعم المشاريع المحلية. المنتجات طازجة وبجودة عالية.',
      rating: 5
    },
    {
      name: 'محمد',
      role: 'عميل',
      content: 'برنامج المكافآت رائع! حصلت على خصومات كثيرة.',
      rating: 5
    }
  ];

  const categories = [
    { name: 'قهوة', icon: '☕' },
    { name: 'حلويات', icon: '🧁' },
    { name: 'مأكولات', icon: '🍕' },
    { name: 'مشروبات', icon: '🥤' },
    { name: 'معجنات', icon: '🥐' },
    { name: 'عصائر', icon: '🍊' }
  ];

  return (
    <PageTransition>
      <div className="min-h-screen bg-background font-arabic relative overflow-hidden" dir="rtl">
        <InteractiveBackground variant="particles" intensity="subtle" />
        
        {/* Header */}
        <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Link to="/">
              <AnimatedLogo size="md" showText={true} />
            </Link>
            <div className="flex items-center gap-2 md:gap-4">
              <ThemeToggle />
              <Link to="/install" className="hidden sm:block">
                <Button variant="ghost" size="icon" className="text-primary">
                  <Download className="h-5 w-5" />
                </Button>
              </Link>
              <Link to="/for-providers">
                <Button variant="outline" className="font-arabic text-xs sm:text-sm">
                  مقدم خدمة؟
                </Button>
              </Link>
              <Link to="/profile">
                <Button className="font-arabic text-xs sm:text-sm">
                  تسجيل الدخول
                  <ArrowLeft className="h-4 w-4 mr-2" />
                </Button>
              </Link>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="relative py-16 md:py-24 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
          <div className="container mx-auto px-4 relative">
            <motion.div 
              className="max-w-3xl mx-auto text-center"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 bg-accent/10 text-accent-foreground px-4 py-2 rounded-full text-sm mb-6">
                <Clock className="h-4 w-4 text-primary" />
                <span>توصيل سريع خلال دقائق</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
                اطلب من 
                <span className="text-primary"> جيرانك </span>
                الآن
              </h1>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                اكتشف أشهى المأكولات والمشروبات من مقدمي الخدمات في حيّك.
                طازجة، محلية، وتصلك بسرعة!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="text-lg px-8 font-arabic" asChild>
                  <Link to="/app">
                    تصفح القائمة
                    <ArrowLeft className="h-5 w-5 mr-2" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="text-lg px-8 font-arabic" asChild>
                  <Link to="/install">
                    <Download className="h-5 w-5 ml-2" />
                    حمّل التطبيق
                  </Link>
                </Button>
              </div>
            </motion.div>

            {/* Categories Preview */}
            <motion.div 
              className="mt-12 flex flex-wrap justify-center gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              {categories.map((category, index) => (
                <motion.div
                  key={category.name}
                  className="flex items-center gap-2 bg-card/80 backdrop-blur px-4 py-2 rounded-full border shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  whileHover={{ scale: 1.05 }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                >
                  <span className="text-2xl">{category.icon}</span>
                  <span className="font-medium">{category.name}</span>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <motion.div 
              className="text-center mb-12"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold mb-4">لماذا تطلب من منصة الحي؟</h2>
              <p className="text-muted-foreground text-lg">تجربة طلب مميزة ومحلية</p>
            </motion.div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-full hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                        <feature.icon className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                      <p className="text-muted-foreground">{feature.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <motion.div 
              className="text-center mb-12"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold mb-4">كيف تطلب؟</h2>
              <p className="text-muted-foreground text-lg">أربع خطوات بسيطة</p>
            </motion.div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {howItWorks.map((item, index) => (
                <motion.div 
                  key={item.step} 
                  className="text-center relative"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 relative">
                    <item.icon className="h-10 w-10 text-primary" />
                    <span className="absolute -top-2 -right-2 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                      {item.step}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <motion.div 
              className="text-center mb-12"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold mb-4">ماذا يقول عملاؤنا؟</h2>
              <p className="text-muted-foreground text-lg">تجارب حقيقية من مستخدمي المنصة</p>
            </motion.div>
            <div className="grid md:grid-cols-3 gap-6">
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-full">
                    <CardContent className="p-6">
                      <div className="flex gap-1 mb-4">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                      <p className="text-muted-foreground mb-4">"{testimonial.content}"</p>
                      <div>
                        <p className="font-bold">{testimonial.name}</p>
                        <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-br from-primary/10 to-accent/10">
          <div className="container mx-auto px-4">
            <motion.div 
              className="max-w-2xl mx-auto text-center"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold mb-4">جاهز تطلب؟</h2>
              <p className="text-muted-foreground text-lg mb-8">
                اكتشف مقدمي الخدمات في حيّك واطلب الآن!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="text-lg px-8 font-arabic" asChild>
                  <Link to="/app">
                    ابدأ الطلب
                    <ArrowLeft className="h-5 w-5 mr-2" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="text-lg px-8 font-arabic" asChild>
                  <Link to="/profile">
                    سجّل حسابك
                  </Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-muted py-12">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <AnimatedLogo size="sm" showText={true} textClassName="!text-lg" />
              <div className="flex flex-col items-center md:items-end gap-2">
                <div className="flex items-center gap-4 text-sm">
                  <Link to="/for-providers" className="text-muted-foreground hover:text-primary transition-colors">
                    كن مقدم خدمة
                  </Link>
                  <Link to="/install" className="text-muted-foreground hover:text-primary transition-colors">
                    تثبيت التطبيق
                  </Link>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <Link to="/terms" className="text-muted-foreground hover:text-primary transition-colors">
                    شروط الاستخدام
                  </Link>
                  <Link to="/privacy" className="text-muted-foreground hover:text-primary transition-colors">
                    سياسة الخصوصية
                  </Link>
                  <Link to="/faq" className="text-muted-foreground hover:text-primary transition-colors">
                    الأسئلة الشائعة
                  </Link>
                  <Link to="/contact" className="text-muted-foreground hover:text-primary transition-colors">
                    اتصل بنا
                  </Link>
                </div>
                <p className="text-muted-foreground text-sm">
                  © 2026 منصة الحي. جميع الحقوق محفوظة.
                </p>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </PageTransition>
  );
};

export default CustomerLanding;
