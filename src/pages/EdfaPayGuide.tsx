import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AnimatedLogo } from '@/components/ui/AnimatedLogo';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { InteractiveBackground } from '@/components/ui/InteractiveBackground';
import { motion } from 'framer-motion';
import {
  CreditCard,
  ArrowRight,
  Check,
  ExternalLink,
  FileText,
  Building2,
  Shield,
  Clock,
  DollarSign,
  Copy,
  AlertCircle,
  Phone,
  Mail,
  Globe,
  ChevronDown,
  User,
  Upload,
  Link2
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const steps = [
  {
    number: 1,
    title: 'زيارة موقع EdfaPay',
    description: 'افتح موقع EdfaPay الرسمي وانقر على زر "التسجيل" أو "Apply Now"',
    icon: Globe,
    details: [
      'اذهب إلى edfapay.com',
      'اختر "Merchant Registration" أو "تسجيل التاجر"',
      'اختر نوع الحساب: "Individual" للأفراد أو "Business" للشركات'
    ]
  },
  {
    number: 2,
    title: 'إنشاء حساب جديد',
    description: 'أدخل بياناتك الأساسية لإنشاء حساب تاجر',
    icon: User,
    details: [
      'أدخل الاسم الكامل كما في الهوية',
      'أدخل البريد الإلكتروني (سيُستخدم لتسجيل الدخول)',
      'أدخل رقم الجوال السعودي',
      'أنشئ كلمة مرور قوية'
    ]
  },
  {
    number: 3,
    title: 'رفع المستندات المطلوبة',
    description: 'ارفع الوثائق اللازمة للتحقق من هويتك',
    icon: Upload,
    details: [
      'صورة من الهوية الوطنية (الوجهين)',
      'شهادة العمل الحر (إن وجدت)',
      'صورة من السجل التجاري (للشركات)',
      'صورة شخصية واضحة'
    ]
  },
  {
    number: 4,
    title: 'إضافة الحساب البنكي',
    description: 'أضف معلومات حسابك البنكي لاستلام الأرباح',
    icon: Building2,
    details: [
      'اسم البنك (مثال: بنك الراجحي، الأهلي)',
      'رقم الآيبان IBAN (يبدأ بـ SA)',
      'اسم صاحب الحساب (يجب أن يطابق اسمك)',
      'تأكد من صحة البيانات لتجنب التأخير'
    ]
  },
  {
    number: 5,
    title: 'انتظار المراجعة',
    description: 'سيتم مراجعة طلبك خلال 1-3 أيام عمل',
    icon: Clock,
    details: [
      'ستصلك رسالة تأكيد على البريد',
      'قد يتواصل فريق EdfaPay للتحقق',
      'تأكد من أن بياناتك دقيقة لتسريع الموافقة',
      'ستصلك رسالة بالموافقة مع بيانات الدخول'
    ]
  },
  {
    number: 6,
    title: 'ربط الحساب بمتجرك',
    description: 'بعد الموافقة، اربط حسابك بمتجرك في المنصة',
    icon: Link2,
    details: [
      'سجل دخول إلى لوحة تحكم EdfaPay',
      'انسخ "Merchant ID" و "Secret Key"',
      'اذهب إلى إعدادات متجرك في منصتنا',
      'الصق البيانات في قسم "ربط بوابة الدفع"'
    ]
  }
];

const requirements = [
  { label: 'هوية وطنية سعودية سارية', icon: FileText },
  { label: 'حساب بنكي سعودي باسمك', icon: Building2 },
  { label: 'رقم جوال سعودي مفعّل', icon: Phone },
  { label: 'بريد إلكتروني صالح', icon: Mail },
];

const benefits = [
  { label: 'استلام الأرباح فوراً في حسابك', icon: DollarSign },
  { label: 'عمولات تنافسية تبدأ من 2.5%', icon: CreditCard },
  { label: 'دعم جميع البطاقات ومدى وأبل باي', icon: Shield },
  { label: 'لوحة تحكم متقدمة للتقارير', icon: FileText },
];

const faqs = [
  {
    question: 'كم تستغرق عملية التسجيل؟',
    answer: 'عادةً تستغرق 1-3 أيام عمل للمراجعة والموافقة. تأكد من رفع جميع المستندات المطلوبة لتسريع العملية.'
  },
  {
    question: 'هل يمكنني التسجيل كفرد بدون سجل تجاري؟',
    answer: 'نعم، يمكنك التسجيل كفرد باستخدام شهادة العمل الحر أو الهوية الوطنية فقط.'
  },
  {
    question: 'ما هي عمولة EdfaPay؟',
    answer: 'تبدأ العمولة من 2.5% + 1 ريال لكل عملية. قد تختلف حسب حجم المبيعات ونوع النشاط.'
  },
  {
    question: 'متى أستلم أرباحي؟',
    answer: 'يتم تحويل الأرباح خلال 1-2 يوم عمل من تاريخ العملية مباشرة إلى حسابك البنكي.'
  },
  {
    question: 'هل EdfaPay آمن؟',
    answer: 'نعم، EdfaPay مرخص من البنك المركزي السعودي ومعتمد بشهادة PCI DSS لأمان البيانات.'
  },
];

const EdfaPayGuide = () => {
  const [copiedLink, setCopiedLink] = useState(false);

  const copyRegistrationLink = () => {
    navigator.clipboard.writeText('https://merchant.edfapay.com/register');
    setCopiedLink(true);
    toast.success('تم نسخ الرابط!');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background font-arabic relative" dir="rtl">
      <InteractiveBackground variant="gradient" intensity="subtle" />
      
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link to="/">
              <AnimatedLogo size="md" showText={true} />
            </Link>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <Link to="/provider-register">
                <Button variant="outline" size="sm">
                  <ArrowRight className="h-4 w-4 ml-2 rotate-180" />
                  العودة للتسجيل
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 relative z-10 max-w-4xl">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <Badge variant="secondary" className="mb-4">
            <CreditCard className="h-3 w-3 ml-1" />
            دليل التسجيل
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            كيفية التسجيل في <span className="text-primary">EdfaPay</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            اتبع الخطوات التالية للتسجيل في بوابة الدفع EdfaPay وربطها بمتجرك لاستلام الأرباح مباشرة
          </p>
        </motion.div>

        {/* Registration Link Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="mb-8 overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-emerald-400 p-6 text-white">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold mb-1">رابط التسجيل في EdfaPay</h2>
                  <p className="text-white/90 text-sm">انقر على الزر للذهاب مباشرة لصفحة التسجيل</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    onClick={copyRegistrationLink}
                    className="shrink-0"
                  >
                    {copiedLink ? <Check className="h-4 w-4 ml-2" /> : <Copy className="h-4 w-4 ml-2" />}
                    {copiedLink ? 'تم النسخ!' : 'نسخ الرابط'}
                  </Button>
                  <Button
                    asChild
                    className="bg-white text-green-600 hover:bg-white/90 shrink-0"
                  >
                    <a href="https://merchant.edfapay.com/register" target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 ml-2" />
                      التسجيل الآن
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Requirements */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                المتطلبات الأساسية
              </CardTitle>
              <CardDescription>
                تأكد من توفر هذه المتطلبات قبل البدء بالتسجيل
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {requirements.map((req, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                      <req.icon className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm font-medium">{req.label}</span>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-2xl font-bold mb-6 text-center">خطوات التسجيل</h2>
          <div className="space-y-4 mb-8">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
              >
                <Card className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex flex-col md:flex-row">
                      {/* Step Number */}
                      <div className="bg-primary/10 p-4 md:p-6 flex items-center justify-center md:w-24 shrink-0">
                        <span className="text-3xl md:text-4xl font-bold text-primary">{step.number}</span>
                      </div>
                      
                      {/* Step Content */}
                      <div className="p-4 md:p-6 flex-1">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                            <step.icon className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-bold text-lg mb-1">{step.title}</h3>
                            <p className="text-muted-foreground text-sm">{step.description}</p>
                          </div>
                        </div>
                        <ul className="space-y-2 mr-13">
                          {step.details.map((detail, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                              <span>{detail}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Benefits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card className="mb-8 bg-gradient-to-br from-primary/5 to-primary/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                مميزات EdfaPay
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {benefits.map((benefit, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 bg-background/50 rounded-lg"
                  >
                    <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center shrink-0">
                      <benefit.icon className="h-4 w-4 text-green-600" />
                    </div>
                    <span className="text-sm font-medium">{benefit.label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* FAQs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-primary" />
                الأسئلة الشائعة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, index) => (
                  <AccordionItem key={index} value={`faq-${index}`}>
                    <AccordionTrigger className="text-right">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </motion.div>

        {/* Support */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          <Card className="border-primary/50">
            <CardContent className="p-6">
              <div className="text-center">
                <h3 className="font-bold text-lg mb-2">تحتاج مساعدة؟</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  فريق الدعم لدينا جاهز لمساعدتك في عملية التسجيل والربط
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button variant="outline" asChild>
                    <a href="mailto:support@example.com">
                      <Mail className="h-4 w-4 ml-2" />
                      راسلنا
                    </a>
                  </Button>
                  <Button asChild>
                    <Link to="/contact">
                      <Phone className="h-4 w-4 ml-2" />
                      تواصل معنا
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
};

export default EdfaPayGuide;
