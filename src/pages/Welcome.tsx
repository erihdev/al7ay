import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingBag, Store, ArrowLeft, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { AnimatedLogo } from '@/components/ui/AnimatedLogo';
import { AnimatedSlogan } from '@/components/ui/AnimatedSlogan';
import { InteractiveBackground } from '@/components/ui/InteractiveBackground';
import { PageTransition } from '@/components/ui/PageTransition';
import { Badge } from '@/components/ui/badge';

const Welcome = () => {
  const options = [
    {
      id: 'customer',
      title: 'أنا عميل',
      subtitle: 'أريد الطلب من مقدمي الخدمات',
      description: 'تصفح المنتجات واطلب من مقدمي الخدمات في حيّك',
      icon: ShoppingBag,
      to: '/for-customers',
      gradient: 'from-blue-500 to-cyan-500',
      bgGradient: 'from-blue-500/10 to-cyan-500/10',
      features: ['توصيل سريع', 'منتجات طازجة', 'برنامج مكافآت']
    },
    {
      id: 'provider',
      title: 'أنا مقدم خدمة',
      subtitle: 'أريد بيع منتجاتي وخدماتي',
      description: 'أنشئ متجرك الإلكتروني وابدأ البيع لسكان حيّك',
      icon: Store,
      to: '/for-providers',
      gradient: 'from-primary to-accent',
      bgGradient: 'from-primary/10 to-accent/10',
      features: ['متجر خاص بك', 'لوحة تحكم ذكية', 'دفع إلكتروني']
    }
  ];

  return (
    <PageTransition>
      <div className="min-h-screen bg-background font-arabic relative overflow-hidden flex flex-col" dir="rtl">
        <InteractiveBackground variant="geometric" intensity="subtle" />
        
        {/* Header */}
        <header className="relative z-10 py-4 px-4">
          <div className="container mx-auto flex items-center justify-between">
            <AnimatedLogo size="md" showText={true} />
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="hidden sm:flex gap-1 text-xs">
                <Sparkles className="h-3 w-3" />
                v2.5.0
              </Badge>
              <ThemeToggle />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex items-center justify-center px-4 py-8">
          <div className="w-full max-w-4xl">
            {/* Title with Animated Slogan */}
            <motion.div 
              className="text-center mb-10"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <AnimatedSlogan size="md" showLogo={true} className="mb-6" />
              <p className="text-lg text-muted-foreground">
                كيف يمكننا مساعدتك اليوم؟
              </p>
            </motion.div>

            {/* Options */}
            <div className="grid md:grid-cols-2 gap-6">
              {options.map((option, index) => (
                <motion.div
                  key={option.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.1, duration: 0.5 }}
                >
                  <Link to={option.to} className="block h-full">
                    <Card className={`h-full border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 overflow-hidden group cursor-pointer bg-gradient-to-br ${option.bgGradient}`}>
                      <CardContent className="p-6 md:p-8 h-full flex flex-col">
                        {/* Icon */}
                        <motion.div 
                          className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${option.gradient} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}
                          whileHover={{ rotate: [0, -5, 5, 0] }}
                          transition={{ duration: 0.5 }}
                        >
                          <option.icon className="h-8 w-8 text-white" />
                        </motion.div>

                        {/* Content */}
                        <h2 className="text-2xl md:text-3xl font-bold mb-2 group-hover:text-primary transition-colors">
                          {option.title}
                        </h2>
                        <p className="text-primary font-medium mb-2">
                          {option.subtitle}
                        </p>
                        <p className="text-muted-foreground mb-5 flex-1">
                          {option.description}
                        </p>

                        {/* Features */}
                        <div className="flex flex-wrap gap-2 mb-5">
                          {option.features.map((feature) => (
                            <Badge 
                              key={feature} 
                              variant="secondary" 
                              className="bg-background/80 backdrop-blur-sm"
                            >
                              {feature}
                            </Badge>
                          ))}
                        </div>

                        {/* CTA */}
                        <div className={`flex items-center gap-2 text-lg font-medium bg-gradient-to-r ${option.gradient} bg-clip-text text-transparent group-hover:gap-3 transition-all`}>
                          <span>ابدأ الآن</span>
                          <ArrowLeft className="h-5 w-5 text-primary group-hover:-translate-x-1 transition-transform" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>

            {/* Bottom Info */}
            <motion.div 
              className="text-center mt-10 text-sm text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <p>
                منصة الحي - نربط بين مقدمي الخدمات المحلية وسكان الأحياء
              </p>
            </motion.div>
          </div>
        </main>

        {/* Footer Links */}
        <footer className="relative z-10 py-4 px-4 text-center">
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
            <Link to="/terms" className="hover:text-primary transition-colors">
              شروط الاستخدام
            </Link>
            <Link to="/privacy" className="hover:text-primary transition-colors">
              سياسة الخصوصية
            </Link>
            <Link to="/faq" className="hover:text-primary transition-colors">
              الأسئلة الشائعة
            </Link>
            <Link to="/contact" className="hover:text-primary transition-colors">
              اتصل بنا
            </Link>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            © 2026 منصة الحي. جميع الحقوق محفوظة.
          </p>
        </footer>
      </div>
    </PageTransition>
  );
};

export default Welcome;
