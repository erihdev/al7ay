import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import heroCustomerImage from '@/assets/hero-customer.jpg';
import categoryCoffeeImage from '@/assets/category-coffee.jpg';
import categorySweetsImage from '@/assets/category-sweets.jpg';
import promoDeliveryVideo from '@/assets/promo-delivery.mp4';
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
  Download,
  Sparkles,
  Users,
  TrendingUp,
  Award,
  CheckCircle2,
  MessageCircle,
  Headphones,
  Globe,
  Play,
  Volume2,
  VolumeX
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { AnimatedLogo } from '@/components/ui/AnimatedLogo';
import { AnimatedSlogan } from '@/components/ui/AnimatedSlogan';
import { InteractiveBackground } from '@/components/ui/InteractiveBackground';
import { PageTransition } from '@/components/ui/PageTransition';
import { motion } from 'framer-motion';
import { useState, useRef } from 'react';

const CustomerLanding = () => {
  const stats = [
    { value: '+50,000', label: 'عميل سعيد', icon: Users },
    { value: '+1,200', label: 'مقدم خدمة', icon: ShoppingBag },
    { value: '+100,000', label: 'طلب شهرياً', icon: TrendingUp },
    { value: '4.9', label: 'تقييم المنصة', icon: Star }
  ];

  const features = [
    {
      icon: MapPin,
      title: 'خدمات قريبة منك',
      description: 'اكتشف مقدمي خدمات في حيّك واستمتع بتوصيل سريع خلال دقائق'
    },
    {
      icon: Coffee,
      title: 'منتجات طازجة',
      description: 'قهوة، حلويات، ومأكولات منزلية طازجة يومياً من أفضل الطهاة المحليين'
    },
    {
      icon: Truck,
      title: 'توصيل سريع',
      description: 'استلم طلبك خلال دقائق معدودة من مقدمي خدمات حيّك'
    },
    {
      icon: Gift,
      title: 'برنامج مكافآت',
      description: 'اجمع النقاط مع كل طلب واستبدلها بخصومات ومكافآت حصرية'
    },
    {
      icon: Shield,
      title: 'دفع آمن',
      description: 'خيارات دفع متعددة وآمنة مع تشفير كامل لحماية بياناتك'
    },
    {
      icon: Heart,
      title: 'المفضلة والتتبع',
      description: 'احفظ مقدمي الخدمات المفضلين وتتبع طلباتك لحظة بلحظة'
    }
  ];

  const howItWorks = [
    {
      step: 1,
      icon: Smartphone,
      title: 'سجّل حسابك',
      description: 'أنشئ حسابك مجاناً في ثوانٍ بدون أي رسوم'
    },
    {
      step: 2,
      icon: MapPin,
      title: 'اختر موقعك',
      description: 'حدد حيّك لنعرض لك أفضل الخدمات القريبة'
    },
    {
      step: 3,
      icon: ShoppingBag,
      title: 'اطلب بسهولة',
      description: 'تصفح المنتجات وأضفها لسلتك بضغطة زر'
    },
    {
      step: 4,
      icon: Zap,
      title: 'استلم طلبك',
      description: 'تتبع طلبك على الخريطة واستلمه بأسرع وقت'
    }
  ];

  const testimonials = [
    {
      name: 'أحمد الغامدي',
      location: 'الرياض، حي الملقا',
      content: 'أفضل منصة للطلب من المنزل! القهوة تصلني وهي ساخنة والتوصيل سريع جداً. أنصح الجميع بتجربتها.',
      rating: 5,
      orders: '+150 طلب'
    },
    {
      name: 'نورة العتيبي',
      location: 'جدة، حي الحمراء',
      content: 'أحب فكرة دعم المشاريع المحلية. المنتجات طازجة وبجودة عالية. برنامج المكافآت رائع!',
      rating: 5,
      orders: '+80 طلب'
    },
    {
      name: 'محمد الشهري',
      location: 'الدمام، حي الفيصلية',
      content: 'تطبيق سهل الاستخدام وخيارات كثيرة. أصبحت أطلب يومياً والتوفير ممتاز مع النقاط.',
      rating: 5,
      orders: '+200 طلب'
    }
  ];

  const categories = [
    { name: 'قهوة مختصة', icon: '☕', count: '+500 منتج' },
    { name: 'حلويات', icon: '🧁', count: '+300 منتج' },
    { name: 'مأكولات', icon: '🍕', count: '+400 منتج' },
    { name: 'مشروبات', icon: '🥤', count: '+200 منتج' },
    { name: 'معجنات', icon: '🥐', count: '+150 منتج' },
    { name: 'عصائر طازجة', icon: '🍊', count: '+100 منتج' }
  ];

  const loyaltyTiers = [
    { name: 'برونزي', points: '0-499', benefits: ['نقاط مع كل طلب', 'عروض حصرية'] },
    { name: 'فضي', points: '500-999', benefits: ['خصم 5% إضافي', 'توصيل مجاني'] },
    { name: 'ذهبي', points: '1000+', benefits: ['خصم 10% إضافي', 'أولوية التوصيل', 'هدايا شهرية'] }
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
              <Badge variant="secondary" className="hidden sm:flex gap-1 text-xs">
                <Sparkles className="h-3 w-3" />
                v2.5.0
              </Badge>
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

        {/* Hero Section with Image */}
        <section className="relative py-16 md:py-24 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
          <div className="container mx-auto px-4 relative">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <motion.div 
                className="text-center lg:text-right order-2 lg:order-1"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="inline-block mb-6"
                >
                  <Badge variant="secondary" className="px-4 py-2 text-sm gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    توصيل سريع خلال 15-30 دقيقة
                  </Badge>
                </motion.div>
                
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                  اطلب من 
                  <span className="text-primary bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"> جيرانك </span>
                  <br className="hidden sm:block" />
                  واستمتع بالطعم الأصيل
                </h1>
                
                <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed">
                  اكتشف أشهى المأكولات والمشروبات من مقدمي الخدمات في حيّك.
                  طازجة، محلية، وتصلك بأسرع وقت!
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8">
                  <Button size="lg" className="text-lg px-8 font-arabic group" asChild>
                    <Link to="/app">
                      <ShoppingBag className="h-5 w-5 ml-2 group-hover:animate-pulse" />
                      ابدأ الطلب الآن
                      <ArrowLeft className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" className="text-lg px-8 font-arabic" asChild>
                    <Link to="/install">
                      <Download className="h-5 w-5 ml-2" />
                      حمّل التطبيق
                    </Link>
                  </Button>
                </div>

                {/* Trust Badges */}
                <motion.div 
                  className="flex flex-wrap justify-center lg:justify-start gap-4 text-sm text-muted-foreground"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-green-500" />
                    <span>دفع آمن 100%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-primary" />
                    <span>توصيل مجاني للطلبات +50 ريال</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Gift className="h-4 w-4 text-accent" />
                    <span>نقاط مع كل طلب</span>
                  </div>
                </motion.div>
              </motion.div>

              {/* Hero Image */}
              <motion.div 
                className="order-1 lg:order-2"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.6 }}
              >
                <div className="relative">
                  <img 
                    src={heroCustomerImage} 
                    alt="منتجات طازجة للتوصيل" 
                    className="rounded-3xl shadow-2xl w-full object-cover"
                  />
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-t from-background/40 to-transparent" />
                  
                  {/* Slogan Overlay */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <motion.h2 
                      className="text-4xl md:text-5xl lg:text-6xl font-bold text-white drop-shadow-2xl text-center"
                      style={{ textShadow: '0 4px 20px rgba(0,0,0,0.5), 0 2px 10px rgba(0,0,0,0.3)' }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                    >
                      الحي يحيييك
                    </motion.h2>
                    <motion.p
                      className="text-lg md:text-xl text-white/90 mt-3 drop-shadow-lg"
                      style={{ textShadow: '0 2px 10px rgba(0,0,0,0.4)' }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.7 }}
                    >
                      منصة الخدمات المحلية
                    </motion.p>
                  </div>
                  
                  {/* Floating Badge */}
                  <motion.div 
                    className="absolute -bottom-4 -right-4 bg-card p-4 rounded-2xl shadow-xl border"
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                        <Star className="h-6 w-6 text-yellow-500 fill-yellow-500" />
                      </div>
                      <div>
                        <p className="font-bold text-lg">4.9</p>
                        <p className="text-xs text-muted-foreground">+50,000 تقييم</p>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Animated Slogan Section */}
        <section className="py-16 bg-gradient-to-br from-primary/5 via-background to-accent/5">
          <div className="container mx-auto px-4">
            <AnimatedSlogan size="lg" showLogo={true} />
          </div>
        </section>

        {/* Promotional Video Section */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <motion.div 
              className="text-center mb-8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Badge variant="secondary" className="mb-4">
                <Play className="h-4 w-4 ml-2" />
                شاهد المزيد
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">اكتشف تجربة الحي</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                شاهد كيف نوصل لك أشهى المأكولات والمشروبات من جيرانك في حيّك
              </p>
            </motion.div>
            
            <motion.div 
              className="max-w-4xl mx-auto"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
            >
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-primary/20">
                <video 
                  className="w-full aspect-video object-cover"
                  autoPlay 
                  muted 
                  loop 
                  playsInline
                  controls
                  poster={heroCustomerImage}
                >
                  <source src={promoDeliveryVideo} type="video/mp4" />
                  متصفحك لا يدعم تشغيل الفيديو
                </video>
                
                {/* Video overlay gradient */}
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-background/20 to-transparent" />
              </div>
              
              {/* Video caption */}
              <motion.p 
                className="text-center text-muted-foreground mt-4 text-sm"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
              >
                🎬 تجربة توصيل سريعة وموثوقة من قلب الحي
              </motion.p>
            </motion.div>
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
                  <div className="text-muted-foreground">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Categories Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <motion.div 
              className="text-center mb-12"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Badge variant="secondary" className="mb-4">
                <Coffee className="h-4 w-4 ml-2" />
                تنوع لا حدود له
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">استكشف التصنيفات</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                تشكيلة واسعة من المنتجات الطازجة المحضرة بحب من مقدمي خدمات حيّك
              </p>
            </motion.div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {categories.map((category, index) => (
                <motion.div
                  key={category.name}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link to="/app">
                    <Card className="h-full hover:shadow-lg hover:border-primary/50 transition-all duration-300 hover:-translate-y-1 cursor-pointer group">
                      <CardContent className="p-6 text-center">
                        <motion.div 
                          className="text-5xl mb-3"
                          whileHover={{ scale: 1.2, rotate: [0, -10, 10, 0] }}
                          transition={{ duration: 0.3 }}
                        >
                          {category.icon}
                        </motion.div>
                        <h3 className="font-bold mb-1 group-hover:text-primary transition-colors">{category.name}</h3>
                        <p className="text-xs text-muted-foreground">{category.count}</p>
                      </CardContent>
                    </Card>
                  </Link>
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
              <h2 className="text-3xl md:text-4xl font-bold mb-4">لماذا تطلب من منصة الحي؟</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                تجربة طلب مميزة ومحلية تدعم مشاريع حيّك
              </p>
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
                  <Card className="h-full hover:shadow-xl hover:border-primary/50 transition-all duration-300 group">
                    <CardContent className="p-6">
                      <motion.div 
                        className="w-14 h-14 bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"
                        whileHover={{ rotate: 5 }}
                      >
                        <feature.icon className="h-7 w-7 text-primary" />
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
                سهولة الاستخدام
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">كيف تطلب؟</h2>
              <p className="text-muted-foreground text-lg">أربع خطوات بسيطة للحصول على طلبك</p>
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
                    className="w-20 h-20 bg-gradient-to-br from-primary/20 to-accent/20 rounded-3xl flex items-center justify-center mx-auto mb-4 relative"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                  >
                    <item.icon className="h-10 w-10 text-primary" />
                    <span className="absolute -top-2 -right-2 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold shadow-lg">
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

        {/* Loyalty Program Section */}
        <section className="py-20 bg-gradient-to-br from-primary/5 via-background to-accent/5">
          <div className="container mx-auto px-4">
            <motion.div 
              className="text-center mb-12"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Badge variant="secondary" className="mb-4">
                <Award className="h-4 w-4 ml-2" />
                برنامج الولاء
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">اجمع النقاط واستمتع بالمكافآت</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                كل طلب يقربك من مكافآت أكبر! تسلق المستويات واحصل على مزايا حصرية
              </p>
            </motion.div>
            
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {loyaltyTiers.map((tier, index) => (
                <motion.div
                  key={tier.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className={`h-full text-center hover:shadow-xl transition-all duration-300 ${index === 2 ? 'border-primary shadow-lg' : ''}`}>
                    <CardContent className="p-6">
                      <div className={`text-4xl mb-4 ${index === 0 ? 'text-orange-600' : index === 1 ? 'text-slate-400' : 'text-yellow-500'}`}>
                        {index === 0 ? '🥉' : index === 1 ? '🥈' : '🥇'}
                      </div>
                      <h3 className="text-xl font-bold mb-2">{tier.name}</h3>
                      <p className="text-muted-foreground text-sm mb-4">{tier.points} نقطة</p>
                      <ul className="space-y-2">
                        {tier.benefits.map((benefit, i) => (
                          <li key={i} className="flex items-center justify-center gap-2 text-sm">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            <span>{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
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
                آراء العملاء
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">ماذا يقول عملاؤنا؟</h2>
              <p className="text-muted-foreground text-lg">تجارب حقيقية من أكثر من 50,000 عميل سعيد</p>
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
                      <div className="flex gap-1 mb-4">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                      <p className="text-muted-foreground mb-6 leading-relaxed">"{testimonial.content}"</p>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold">{testimonial.name}</p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {testimonial.location}
                          </p>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {testimonial.orders}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* App Download Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <motion.div
              className="max-w-4xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Card className="overflow-hidden bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
                <CardContent className="p-8 md:p-12">
                  <div className="grid md:grid-cols-2 gap-8 items-center">
                    <div className="text-center md:text-right">
                      <Badge variant="secondary" className="mb-4">
                        <Download className="h-4 w-4 ml-2" />
                        التطبيق
                      </Badge>
                      <h2 className="text-3xl md:text-4xl font-bold mb-4">حمّل التطبيق الآن</h2>
                      <p className="text-muted-foreground mb-6 leading-relaxed">
                        استمتع بتجربة طلب أسهل وأسرع مع تطبيق منصة الحي. 
                        إشعارات فورية، تتبع الطلبات، وعروض حصرية!
                      </p>
                      <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                        <Button size="lg" className="font-arabic" asChild>
                          <Link to="/install">
                            <Download className="h-5 w-5 ml-2" />
                            تثبيت التطبيق
                          </Link>
                        </Button>
                      </div>
                    </div>
                    <div className="hidden md:flex justify-center">
                      <motion.div 
                        className="w-48 h-48 bg-gradient-to-br from-primary to-accent rounded-3xl flex items-center justify-center shadow-2xl"
                        animate={{ 
                          y: [0, -10, 0],
                          rotate: [0, 2, -2, 0]
                        }}
                        transition={{ 
                          duration: 4,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      >
                        <Smartphone className="h-24 w-24 text-white" />
                      </motion.div>
                    </div>
                  </div>
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
                  <Headphones className="h-7 w-7 text-primary" />
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
                  <Shield className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-bold mb-2">ضمان الجودة</h3>
                <p className="text-muted-foreground text-sm">جميع مقدمي الخدمات موثقون ومعتمدون</p>
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
                <p className="text-muted-foreground text-sm">متاح في أكثر من 50 حي في المملكة</p>
              </motion.div>
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
              <motion.div
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ type: "spring", stiffness: 200 }}
                className="inline-block mb-6"
              >
                <div className="w-20 h-20 bg-gradient-to-br from-primary to-accent rounded-3xl flex items-center justify-center mx-auto shadow-lg">
                  <ShoppingBag className="h-10 w-10 text-white" />
                </div>
              </motion.div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">جاهز تطلب؟</h2>
              <p className="text-muted-foreground text-lg mb-8">
                اكتشف مقدمي الخدمات في حيّك واستمتع بأشهى المأكولات والمشروبات!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="text-lg px-8 font-arabic group" asChild>
                  <Link to="/app">
                    <Zap className="h-5 w-5 ml-2 group-hover:animate-pulse" />
                    ابدأ الطلب الآن
                    <ArrowLeft className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="text-lg px-8 font-arabic" asChild>
                  <Link to="/profile">
                    سجّل حسابك مجاناً
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
                    <Link to="/app" className="text-muted-foreground hover:text-primary transition-colors">
                      تصفح المنتجات
                    </Link>
                  </li>
                  <li>
                    <Link to="/for-providers" className="text-muted-foreground hover:text-primary transition-colors">
                      كن مقدم خدمة
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

export default CustomerLanding;
