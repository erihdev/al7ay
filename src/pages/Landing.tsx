import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  MapPin, 
  Coffee, 
  Truck, 
  Star, 
  ArrowLeft,
  Store,
  Smartphone,
  Shield,
  Users,
  Download
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { AnimatedLogo } from '@/components/ui/AnimatedLogo';
import { InteractiveBackground } from '@/components/ui/InteractiveBackground';
import { PageTransition } from '@/components/ui/PageTransition';
import { motion } from 'framer-motion';

const Landing = () => {
  const features = [
    {
      icon: Store,
      title: 'متجرك الخاص',
      description: 'أنشئ متجرك الإلكتروني بسهولة وابدأ ببيع منتجاتك لجيرانك'
    },
    {
      icon: MapPin,
      title: 'خدمة الحي',
      description: 'قدم خدماتك لسكان حيّك واستفد من قربك منهم'
    },
    {
      icon: Truck,
      title: 'توصيل سريع',
      description: 'نظام توصيل متكامل مع تتبع مباشر للطلبات'
    },
    {
      icon: Smartphone,
      title: 'تطبيق سهل',
      description: 'واجهة بسيطة وسهلة الاستخدام للعملاء والبائعين'
    },
    {
      icon: Users,
      title: 'نظام ولاء',
      description: 'برنامج نقاط ومكافآت لزيادة ولاء عملائك'
    },
    {
      icon: Shield,
      title: 'دفع آمن',
      description: 'خيارات دفع متعددة وآمنة لراحة عملائك'
    }
  ];

  const howItWorks = [
    {
      step: 1,
      title: 'سجّل حسابك',
      description: 'أنشئ حسابك واختر خطة الاشتراك المناسبة لك'
    },
    {
      step: 2,
      title: 'أضف منتجاتك',
      description: 'أضف منتجاتك وحدد أسعارك وخيارات التوصيل'
    },
    {
      step: 3,
      title: 'استقبل الطلبات',
      description: 'تابع طلباتك وقم بتوصيلها لعملائك في الحي'
    },
    {
      step: 4,
      title: 'نمّي مشروعك',
      description: 'استفد من التقارير والإحصائيات لتطوير عملك'
    }
  ];

  const testimonials = [
    {
      name: 'أم محمد',
      role: 'صاحبة مشروع منزلي',
      content: 'منصة الحي غيّرت طريقة بيعي لمنتجاتي. الآن أصل لعملاء أكثر في حيّي!',
      rating: 5
    },
    {
      name: 'أبو عبدالله',
      role: 'باريستا منزلي',
      content: 'أفضل منصة للخدمات المحلية. سهلة الاستخدام ودعم فني ممتاز.',
      rating: 5
    },
    {
      name: 'سارة',
      role: 'صاحبة حلويات منزلية',
      content: 'زاد دخلي بشكل كبير بعد انضمامي للمنصة. أنصح بها بشدة!',
      rating: 5
    }
  ];

  return (
    <PageTransition>
      <div className="min-h-screen bg-background font-arabic relative overflow-hidden" dir="rtl">
        <InteractiveBackground variant="waves" intensity="subtle" />
        
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
              <Link to="/provider-login">
                <Button variant="outline" className="font-arabic text-xs sm:text-sm">
                  دخول مقدمي الخدمات
                </Button>
              </Link>
              <Link to="/app">
                <Button className="font-arabic text-xs sm:text-sm">
                  دخول العملاء
                  <ArrowLeft className="h-4 w-4 mr-2" />
                </Button>
              </Link>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="relative py-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10" />
          <div className="container mx-auto px-4 relative">
            <motion.div 
              className="max-w-3xl mx-auto text-center"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm mb-6">
                <Coffee className="h-4 w-4" />
                <span>منصة الخدمات المحلية الأولى</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
                قدّم خدماتك لـ
                <span className="text-primary"> جيرانك </span>
                بسهولة
              </h1>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                منصة الحي تمكّنك من بيع منتجاتك وتقديم خدماتك لسكان حيّك. 
                سواء كنت تصنع القهوة، الحلويات، أو أي منتج منزلي.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="text-lg px-8 font-arabic" asChild>
                  <Link to="/provider-register">
                    ابدأ الآن مجاناً
                    <ArrowLeft className="h-5 w-5 mr-2" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="text-lg px-8 font-arabic" asChild>
                  <a href="#features">
                    تعرّف على المنصة
                  </a>
                </Button>
              </div>
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
              <h2 className="text-3xl font-bold mb-4">لماذا تختار منصة الحي؟</h2>
              <p className="text-muted-foreground text-lg">كل ما تحتاجه لإدارة مشروعك المحلي</p>
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
                  <Card className="h-full">
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
              <h2 className="text-3xl font-bold mb-4">كيف تبدأ؟</h2>
              <p className="text-muted-foreground text-lg">أربع خطوات بسيطة للانضمام</p>
            </motion.div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {howItWorks.map((item, index) => (
                <motion.div 
                  key={item.step} 
                  className="text-center"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                    {item.step}
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
              <p className="text-muted-foreground text-lg">تجارب حقيقية من أصحاب الخدمات</p>
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
                  <Card>
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
        <section className="py-20">
          <div className="container mx-auto px-4">
            <motion.div 
              className="max-w-2xl mx-auto text-center"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold mb-4">جاهز للبدء؟</h2>
              <p className="text-muted-foreground text-lg mb-8">
                انضم الآن واحصل على 7 أيام تجربة مجانية!
              </p>
              <Button size="lg" className="text-lg px-8 font-arabic" asChild>
                <Link to="/provider-register">
                  سجّل الآن
                  <ArrowLeft className="h-5 w-5 mr-2" />
                </Link>
              </Button>
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
                  <Link to="/install" className="text-muted-foreground hover:text-primary transition-colors">
                    تثبيت التطبيق
                  </Link>
                  <Link to="/changelog" className="text-muted-foreground hover:text-primary transition-colors">
                    سجل التحديثات
                  </Link>
                  <Link to="/provider-register" className="text-muted-foreground hover:text-primary transition-colors">
                    تسجيل مقدم خدمة
                  </Link>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <Link to="/terms" className="text-muted-foreground hover:text-primary transition-colors">
                    شروط الاستخدام
                  </Link>
                  <Link to="/privacy" className="text-muted-foreground hover:text-primary transition-colors">
                    سياسة الخصوصية
                  </Link>
                </div>
                <p className="text-muted-foreground text-sm">
                  © 2025 منصة الحي. جميع الحقوق محفوظة.
                </p>
                <Link to="/changelog" className="text-xs text-muted-foreground/60 hover:text-primary transition-colors">
                  الإصدار 1.1.0
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </PageTransition>
  );
};

export default Landing;
