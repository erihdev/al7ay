import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import heroProviderImage from '@/assets/hero-provider.jpg';
import { 
  MapPin, 
  Truck, 
  Star, 
  ArrowLeft,
  Store,
  Smartphone,
  Shield,
  Users,
  Download,
  Lock,
  TrendingUp,
  CreditCard,
  BarChart3,
  Bell,
  Palette,
  Clock,
  CheckCircle2,
  Zap,
  Globe,
  HeadphonesIcon,
  Sparkles,
  Award,
  Target,
  Rocket,
  ChefHat,
  Coffee,
  Cake,
  ShoppingBag,
  MessageCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { AnimatedLogo } from '@/components/ui/AnimatedLogo';
import { InteractiveBackground } from '@/components/ui/InteractiveBackground';
import { PageTransition } from '@/components/ui/PageTransition';
import { motion } from 'framer-motion';

const ProviderLanding = () => {
  const features = [
    {
      icon: Store,
      title: 'متجرك الإلكتروني الخاص',
      description: 'أنشئ متجرك بتصميم احترافي يعكس هويتك التجارية مع رابط مباشر لمشاركته',
      highlight: true
    },
    {
      icon: BarChart3,
      title: 'لوحة تحكم ذكية',
      description: 'تقارير مبيعات تفصيلية، إحصائيات الأداء، وتحليلات العملاء في مكان واحد'
    },
    {
      icon: Bell,
      title: 'إشعارات فورية',
      description: 'تنبيهات صوتية ومرئية لكل طلب جديد مع نظام Kitchen Display'
    },
    {
      icon: CreditCard,
      title: 'دفع إلكتروني متكامل',
      description: 'استقبل المدفوعات عبر مدى، فيزا، ماستركارد، أو نقداً عند الاستلام'
    },
    {
      icon: Palette,
      title: 'تخصيص كامل للمتجر',
      description: 'غيّر الألوان، الخطوط، الشعار، وصورة الغلاف لتناسب هويتك'
    },
    {
      icon: Truck,
      title: 'نظام توصيل ذكي',
      description: 'تتبع مباشر للطلبات مع حساب تلقائي للمسافة ووقت التوصيل'
    },
    {
      icon: Users,
      title: 'برنامج ولاء العملاء',
      description: 'نظام نقاط ومكافآت تلقائي لزيادة ولاء عملائك وتكرار الطلبات'
    },
    {
      icon: MapPin,
      title: 'استهداف الحي',
      description: 'حدد نطاق خدمتك واستفد من قربك من العملاء لتوصيل أسرع'
    },
    {
      icon: Shield,
      title: 'أمان وحماية',
      description: 'بوابات دفع موثوقة مع حماية كاملة لبياناتك ومعاملاتك المالية'
    }
  ];

  const howItWorks = [
    {
      step: 1,
      title: 'سجّل حسابك',
      description: 'أنشئ حسابك في دقيقتين واختر خطة الاشتراك المناسبة',
      icon: Smartphone,
      color: 'bg-blue-500'
    },
    {
      step: 2,
      title: 'جهّز متجرك',
      description: 'أضف منتجاتك مع الصور والأسعار وخصص تصميم متجرك',
      icon: Store,
      color: 'bg-green-500'
    },
    {
      step: 3,
      title: 'استقبل الطلبات',
      description: 'تابع طلباتك من لوحة تحكم سهلة مع إشعارات فورية',
      icon: Bell,
      color: 'bg-orange-500'
    },
    {
      step: 4,
      title: 'نمّي مشروعك',
      description: 'استفد من التقارير والتحليلات لتطوير عملك وزيادة مبيعاتك',
      icon: TrendingUp,
      color: 'bg-purple-500'
    }
  ];

  const testimonials = [
    {
      name: 'أم محمد',
      role: 'صاحبة مشروع حلويات منزلية',
      content: 'منصة الحي غيّرت طريقة عملي بالكامل! الآن أصل لعملاء أكثر بـ 5 أضعاف وأدير كل شيء من الجوال.',
      rating: 5,
      location: 'جدة',
      growth: '+400%'
    },
    {
      name: 'أبو عبدالله',
      role: 'باريستا منزلي متخصص',
      content: 'أفضل منصة للخدمات المحلية. الدعم الفني سريع جداً وميزة تتبع الطلبات ممتازة.',
      rating: 5,
      location: 'الرياض',
      growth: '+250%'
    },
    {
      name: 'سارة',
      role: 'شيف وصاحبة مطبخ منزلي',
      content: 'زاد دخلي الشهري بشكل كبير! نظام الولاء ساعدني أحافظ على عملائي الدائمين.',
      rating: 5,
      location: 'الدمام',
      growth: '+320%'
    }
  ];

  const stats = [
    { value: '+1,200', label: 'مقدم خدمة نشط', icon: Store },
    { value: '+50,000', label: 'طلب شهرياً', icon: ShoppingBag },
    { value: '+80', label: 'حي مغطى', icon: MapPin },
    { value: '4.9', label: 'تقييم المنصة', icon: Star }
  ];

  const categories = [
    { name: 'قهوة متخصصة', icon: Coffee, count: '+200' },
    { name: 'حلويات منزلية', icon: Cake, count: '+350' },
    { name: 'مطابخ منزلية', icon: ChefHat, count: '+400' },
    { name: 'وجبات صحية', icon: Target, count: '+150' }
  ];

  const pricingFeatures = [
    'متجر إلكتروني خاص بك',
    'لوحة تحكم متكاملة',
    'إشعارات فورية للطلبات',
    'تقارير وإحصائيات',
    'دعم فني على مدار الساعة',
    'بدون رسوم إعداد'
  ];

  return (
    <PageTransition>
      <div className="min-h-screen bg-background font-arabic relative overflow-hidden" dir="rtl">
        <InteractiveBackground variant="waves" intensity="subtle" />
        
        {/* Header */}
        <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <Link to="/">
              <AnimatedLogo size="md" showText={true} />
            </Link>
            <div className="flex items-center gap-2 md:gap-3">
              <ThemeToggle />
              <Badge variant="secondary" className="hidden md:flex gap-1 text-xs">
                <Sparkles className="h-3 w-3" />
                v2.5.0
              </Badge>
              <Link to="/for-customers">
                <Button variant="ghost" className="font-arabic text-xs sm:text-sm">
                  أنا عميل
                </Button>
              </Link>
              <Link to="/provider-login">
                <Button className="font-arabic text-xs sm:text-sm">
                  دخول
                  <ArrowLeft className="h-4 w-4 mr-2" />
                </Button>
              </Link>
            </div>
          </div>
        </header>

        {/* Hero Section with Image */}
        <section className="relative py-12 md:py-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10" />
          
          {/* Floating Elements */}
          <motion.div 
            className="absolute top-20 right-10 w-20 h-20 bg-primary/10 rounded-full blur-xl"
            animate={{ y: [0, -20, 0], scale: [1, 1.1, 1] }}
            transition={{ duration: 5, repeat: Infinity }}
          />
          <motion.div 
            className="absolute bottom-20 left-10 w-32 h-32 bg-accent/10 rounded-full blur-xl"
            animate={{ y: [0, 20, 0], scale: [1, 1.2, 1] }}
            transition={{ duration: 6, repeat: Infinity }}
          />

          <div className="container mx-auto px-4 relative">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <motion.div 
                className="text-center lg:text-right"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <motion.div 
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-primary/20 to-accent/20 text-primary px-4 py-2 rounded-full text-sm mb-6 border border-primary/20"
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <Rocket className="h-4 w-4" />
                  <span>منصة الخدمات المحلية الأولى في السعودية</span>
                  <Badge className="bg-primary/20 text-primary text-xs">جديد</Badge>
                </motion.div>
                
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                  حوّل موهبتك إلى
                  <span className="text-primary bg-gradient-to-r from-primary to-primary/70 bg-clip-text"> مشروع ناجح </span>
                </h1>
                
                <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed">
                  أنشئ متجرك الإلكتروني في دقائق وابدأ ببيع منتجاتك لسكان حيّك.
                  سواء كنت تصنع القهوة، الحلويات، أو أي منتج منزلي - نحن هنا لدعمك!
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8">
                  <Button size="lg" className="text-lg px-8 font-arabic group" asChild>
                    <Link to="/provider-register">
                      <Zap className="h-5 w-5 ml-2 group-hover:animate-pulse" />
                      ابدأ مجاناً - 30 يوم تجربة
                      <ArrowLeft className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" className="text-lg px-8 font-arabic" asChild>
                    <a href="#features">
                      <Globe className="h-5 w-5 ml-2" />
                      استكشف المميزات
                    </a>
                  </Button>
                </div>

                {/* Trust Badges */}
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span>بدون رسوم إعداد</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Shield className="h-4 w-4 text-primary" />
                    <span>دفع آمن</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4 text-accent" />
                    <span>30 يوم تجربة مجانية</span>
                  </div>
                </div>
              </motion.div>

              {/* Hero Image */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.6 }}
              >
                <div className="relative">
                  <img 
                    src={heroProviderImage} 
                    alt="مقدمة خدمة ناجحة" 
                    className="rounded-3xl shadow-2xl w-full object-cover"
                  />
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-t from-background/20 to-transparent" />
                  
                  {/* Floating Stats Badge */}
                  <motion.div 
                    className="absolute -bottom-4 -left-4 bg-card p-4 rounded-2xl shadow-xl border"
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
                        <TrendingUp className="h-6 w-6 text-green-500" />
                      </div>
                      <div>
                        <p className="font-bold text-lg text-green-500">+85%</p>
                        <p className="text-xs text-muted-foreground">نمو المبيعات</p>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-12 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  className="text-center"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <stat.icon className="h-7 w-7 text-primary" />
                  </div>
                  <div className="text-3xl md:text-4xl font-bold text-primary mb-1">{stat.value}</div>
                  <div className="text-muted-foreground text-sm">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Categories Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <motion.div 
              className="text-center mb-10"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Badge variant="secondary" className="mb-4">
                <ChefHat className="h-4 w-4 ml-2" />
                تصنيفات متنوعة
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">انضم لمجتمع مقدمي الخدمات</h2>
              <p className="text-muted-foreground text-lg">أكثر من 1,200 مقدم خدمة ناجح في مختلف التصنيفات</p>
            </motion.div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {categories.map((category, index) => (
                <motion.div
                  key={category.name}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-full hover:shadow-lg hover:border-primary/50 transition-all duration-300 group">
                    <CardContent className="p-6 text-center">
                      <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                        <category.icon className="h-8 w-8 text-primary" />
                      </div>
                      <h3 className="font-bold mb-1 group-hover:text-primary transition-colors">{category.name}</h3>
                      <p className="text-sm text-muted-foreground">{category.count} مقدم خدمة</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
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
              <Badge variant="secondary" className="mb-4">
                <Sparkles className="h-4 w-4 ml-2" />
                مميزات حصرية
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">كل ما تحتاجه لنجاح مشروعك</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                أدوات متكاملة لإدارة متجرك وزيادة مبيعاتك
              </p>
            </motion.div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className={`h-full hover:shadow-xl transition-all duration-300 group ${feature.highlight ? 'border-primary shadow-lg' : ''}`}>
                    <CardContent className="p-6">
                      <motion.div 
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform ${feature.highlight ? 'bg-primary text-white' : 'bg-primary/10'}`}
                        whileHover={{ rotate: 5 }}
                      >
                        <feature.icon className={`h-7 w-7 ${feature.highlight ? '' : 'text-primary'}`} />
                      </motion.div>
                      <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">{feature.title}</h3>
                      <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
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
              <Badge variant="secondary" className="mb-4">
                <Zap className="h-4 w-4 ml-2" />
                سهولة البدء
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">ابدأ في 4 خطوات بسيطة</h2>
              <p className="text-muted-foreground text-lg">من التسجيل للربح في أقل من ساعة</p>
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
                  {index < howItWorks.length - 1 && (
                    <div className="hidden lg:block absolute top-10 left-0 w-full h-0.5 bg-gradient-to-l from-primary/50 to-transparent" />
                  )}
                  <motion.div 
                    className={`w-20 h-20 ${item.color} rounded-3xl flex items-center justify-center mx-auto mb-4 relative shadow-lg`}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                  >
                    <item.icon className="h-10 w-10 text-white" />
                    <span className="absolute -top-2 -right-2 w-8 h-8 bg-card border-2 border-primary text-primary rounded-full flex items-center justify-center text-sm font-bold shadow">
                      {item.step}
                    </span>
                  </motion.div>
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
              <Badge variant="secondary" className="mb-4">
                <MessageCircle className="h-4 w-4 ml-2" />
                قصص نجاح
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">ماذا يقول مقدمو الخدمات؟</h2>
              <p className="text-muted-foreground text-lg">تجارب حقيقية من مقدمي خدمات ناجحين</p>
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
                  <Card className="h-full hover:shadow-xl transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex gap-1">
                          {[...Array(testimonial.rating)].map((_, i) => (
                            <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                          ))}
                        </div>
                        <Badge variant="secondary" className="text-green-600 bg-green-500/10">
                          {testimonial.growth}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground mb-6 leading-relaxed">"{testimonial.content}"</p>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold">{testimonial.name}</p>
                          <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                        </div>
                        <div className="text-left">
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {testimonial.location}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA / Pricing Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <motion.div 
              className="text-center mb-10"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Badge variant="secondary" className="mb-4 bg-green-500/10 text-green-600">
                <Sparkles className="h-4 w-4 ml-2" />
                عرض خاص
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">ابدأ مجاناً اليوم</h2>
              <p className="text-muted-foreground text-lg">جرّب جميع المميزات لمدة 30 يوم بدون أي التزام</p>
            </motion.div>
            
            <motion.div
              className="max-w-lg mx-auto"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Card className="border-primary shadow-xl">
                <CardContent className="p-8">
                  <div className="text-center mb-6">
                    <div className="inline-flex items-center gap-2 bg-green-500/10 text-green-600 px-4 py-2 rounded-full text-sm mb-4">
                      <Clock className="h-4 w-4" />
                      <span>30 يوم تجربة مجانية</span>
                    </div>
                    <h3 className="text-3xl font-bold mb-2">ابدأ مشروعك الآن</h3>
                    <p className="text-muted-foreground">
                      كل ما تحتاجه لبدء مشروعك المنزلي
                    </p>
                  </div>
                  
                  <ul className="space-y-3 mb-8">
                    {pricingFeatures.map((feature, index) => (
                      <li key={index} className="flex items-center gap-3">
                        <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button size="lg" className="w-full text-lg font-arabic group" asChild>
                    <Link to="/provider-register">
                      <Rocket className="h-5 w-5 ml-2 group-hover:animate-bounce" />
                      سجّل الآن مجاناً
                      <ArrowLeft className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </section>

        {/* Support Section */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <HeadphonesIcon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-bold mb-2">دعم على مدار الساعة</h3>
                <p className="text-muted-foreground text-sm">فريق الدعم متاح 24/7 لمساعدتك</p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
              >
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Award className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-bold mb-2">تدريب مجاني</h3>
                <p className="text-muted-foreground text-sm">دورات وشروحات لاستخدام المنصة</p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
              >
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Globe className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-bold mb-2">تغطية واسعة</h3>
                <p className="text-muted-foreground text-sm">متاح في أكثر من 80 حي في المملكة</p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 bg-gradient-to-br from-primary/10 to-accent/10">
          <div className="container mx-auto px-4">
            <motion.div 
              className="max-w-2xl mx-auto text-center"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
            >
              <motion.div
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ type: "spring", stiffness: 200 }}
                className="inline-block mb-6"
              >
                <div className="w-20 h-20 bg-gradient-to-br from-primary to-accent rounded-3xl flex items-center justify-center mx-auto shadow-lg">
                  <Rocket className="h-10 w-10 text-white" />
                </div>
              </motion.div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">جاهز تبدأ رحلتك؟</h2>
              <p className="text-muted-foreground text-lg mb-8">
                انضم لأكثر من 1,200 مقدم خدمة ناجح واحصل على 30 يوم تجربة مجانية
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="text-lg px-8 font-arabic group" asChild>
                  <Link to="/provider-register">
                    <Zap className="h-5 w-5 ml-2 group-hover:animate-pulse" />
                    ابدأ مجاناً الآن
                    <ArrowLeft className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="text-lg px-8 font-arabic" asChild>
                  <Link to="/provider-login">
                    لديك حساب؟ سجّل دخول
                  </Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-muted py-12">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-4 gap-8 mb-8">
              <div>
                <AnimatedLogo size="sm" showText={true} textClassName="!text-lg" />
                <p className="text-muted-foreground text-sm mt-4">
                  منصة الحي - نربط بين مقدمي الخدمات المحلية وسكان الأحياء
                </p>
              </div>
              <div>
                <h4 className="font-bold mb-4">روابط سريعة</h4>
                <ul className="space-y-2 text-sm">
                  <li>
                    <Link to="/provider-register" className="text-muted-foreground hover:text-primary transition-colors">
                      سجّل كمقدم خدمة
                    </Link>
                  </li>
                  <li>
                    <Link to="/for-customers" className="text-muted-foreground hover:text-primary transition-colors">
                      أنا عميل
                    </Link>
                  </li>
                  <li>
                    <Link to="/install" className="text-muted-foreground hover:text-primary transition-colors">
                      تثبيت التطبيق
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold mb-4">الدعم</h4>
                <ul className="space-y-2 text-sm">
                  <li>
                    <Link to="/faq" className="text-muted-foreground hover:text-primary transition-colors">
                      الأسئلة الشائعة
                    </Link>
                  </li>
                  <li>
                    <Link to="/contact" className="text-muted-foreground hover:text-primary transition-colors">
                      اتصل بنا
                    </Link>
                  </li>
                  <li>
                    <Link to="/edfapay-guide" className="text-muted-foreground hover:text-primary transition-colors">
                      دليل الدفع الإلكتروني
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold mb-4">قانوني</h4>
                <ul className="space-y-2 text-sm">
                  <li>
                    <Link to="/terms" className="text-muted-foreground hover:text-primary transition-colors">
                      شروط الاستخدام
                    </Link>
                  </li>
                  <li>
                    <Link to="/privacy" className="text-muted-foreground hover:text-primary transition-colors">
                      سياسة الخصوصية
                    </Link>
                  </li>
                  <li>
                    <Link to="/admin-login" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
                      <Lock className="h-3 w-3" />
                      لوحة التحكم
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
            <div className="border-t pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-muted-foreground text-sm">
                © 2026 منصة الحي. جميع الحقوق محفوظة.
              </p>
              <Badge variant="secondary" className="gap-1">
                <Sparkles className="h-3 w-3" />
                الإصدار v2.5.0
              </Badge>
            </div>
          </div>
        </footer>
      </div>
    </PageTransition>
  );
};

export default ProviderLanding;
