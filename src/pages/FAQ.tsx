import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { ArrowRight, HelpCircle, Store, CreditCard, Truck, Shield, Users, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function FAQ() {
  const faqCategories = [
    {
      icon: Store,
      title: 'للعملاء',
      questions: [
        {
          q: 'كيف أطلب من منصة الحي؟',
          a: 'اختر الحي الذي تريد الطلب منه، ثم تصفح المتاجر المتاحة واختر المنتجات التي تريدها. أضفها إلى السلة وأكمل عملية الدفع. ستصلك رسالة تأكيد وستتمكن من تتبع طلبك مباشرة.'
        },
        {
          q: 'ما هي طرق الدفع المتاحة؟',
          a: 'نوفر عدة طرق للدفع: الدفع عند الاستلام (كاش)، والدفع الإلكتروني عبر البطاقات البنكية (مدى، فيزا، ماستركارد).'
        },
        {
          q: 'كم يستغرق التوصيل؟',
          a: 'يعتمد وقت التوصيل على نوع المنتج والمسافة. عادةً ما يتم التوصيل خلال 30-60 دقيقة للطلبات المحلية. يمكنك تتبع طلبك مباشرة في التطبيق.'
        },
        {
          q: 'هل يمكنني إلغاء طلبي؟',
          a: 'نعم، يمكنك إلغاء طلبك قبل أن يبدأ مقدم الخدمة بتحضيره. بعد بدء التحضير، يرجى التواصل مع مقدم الخدمة مباشرة.'
        },
        {
          q: 'ما هو برنامج نقاط الولاء؟',
          a: 'تحصل على نقاط مع كل طلب تقوم به. يمكنك استبدال هذه النقاط بخصومات على طلباتك القادمة. كلما زادت نقاطك، ارتفع مستواك (برونزي، فضي، ذهبي) وحصلت على مزايا أكثر.'
        },
        {
          q: 'كيف أضيف منتج للمفضلة؟',
          a: 'اضغط على أيقونة القلب بجانب أي منتج لإضافته للمفضلة. يمكنك الوصول لقائمة المفضلة من صفحة حسابك.'
        }
      ]
    },
    {
      icon: Users,
      title: 'لمقدمي الخدمات',
      questions: [
        {
          q: 'كيف أسجل كمقدم خدمة؟',
          a: 'اضغط على "انضم كمقدم خدمة" في الصفحة الرئيسية، واملأ نموذج التسجيل بمعلوماتك ومعلومات نشاطك التجاري. سيتم مراجعة طلبك خلال 24-48 ساعة.'
        },
        {
          q: 'ما هي رسوم الاشتراك؟',
          a: 'نوفر فترة تجريبية مجانية للبدء. بعدها، تتوفر خطط اشتراك مختلفة تناسب حجم عملك. تواصل معنا للحصول على تفاصيل الأسعار.'
        },
        {
          q: 'كيف أستلم المدفوعات؟',
          a: 'يتم تحويل مستحقاتك من المدفوعات الإلكترونية إلى حسابك البنكي بشكل دوري. للدفع عند الاستلام، تستلم المبلغ مباشرة من العميل.'
        },
        {
          q: 'هل أحتاج ترخيص لتقديم الخدمة؟',
          a: 'نعم، يجب أن تمتلك جميع التراخيص والتصاريح اللازمة لنشاطك التجاري وفقاً لأنظمة المملكة العربية السعودية.'
        },
        {
          q: 'كيف أدير طلباتي؟',
          a: 'من لوحة التحكم الخاصة بك، يمكنك رؤية جميع الطلبات الجديدة، قبولها أو رفضها، تحديث حالتها، والتواصل مع العملاء.'
        },
        {
          q: 'هل يمكنني تحديد منطقة التوصيل؟',
          a: 'نعم، يمكنك تحديد نطاق التوصيل الخاص بك من إعدادات متجرك. يمكنك أيضاً تحديد أوقات العمل ورسوم التوصيل.'
        }
      ]
    },
    {
      icon: Truck,
      title: 'التوصيل والتتبع',
      questions: [
        {
          q: 'كيف أتتبع طلبي؟',
          a: 'من صفحة "طلباتي"، اختر الطلب الذي تريد تتبعه. ستظهر لك خريطة تفاعلية تعرض موقع السائق والوقت المتوقع للوصول بناءً على حركة المرور الحية.'
        },
        {
          q: 'ماذا لو تأخر طلبي؟',
          a: 'يمكنك التواصل مع مقدم الخدمة مباشرة من صفحة الطلب. إذا كان هناك تأخير كبير، تواصل مع فريق الدعم وسنساعدك.'
        },
        {
          q: 'هل يمكنني تغيير عنوان التوصيل؟',
          a: 'يمكنك تغيير العنوان قبل بدء التوصيل. بعد خروج الطلب للتوصيل، يرجى التواصل مع السائق مباشرة.'
        },
        {
          q: 'هل تتوفر خدمة الاستلام من الموقع؟',
          a: 'نعم، بعض مقدمي الخدمات يوفرون خيار الاستلام من موقعهم. تحقق من خيارات الطلب عند الدفع.'
        }
      ]
    },
    {
      icon: CreditCard,
      title: 'الدفع والاسترداد',
      questions: [
        {
          q: 'هل بياناتي المالية آمنة؟',
          a: 'نعم، نستخدم أحدث تقنيات التشفير لحماية بياناتك. لا نخزن بيانات بطاقتك الكاملة على خوادمنا.'
        },
        {
          q: 'كيف أسترد أموالي؟',
          a: 'في حالة إلغاء الطلب أو وجود مشكلة، يتم استرداد المبلغ تلقائياً خلال 3-7 أيام عمل حسب البنك الخاص بك.'
        },
        {
          q: 'هل يمكنني استخدام كود خصم؟',
          a: 'نعم، أدخل كود الخصم في صفحة السلة قبل إتمام الدفع. سيتم تطبيق الخصم تلقائياً.'
        },
        {
          q: 'ما هي سياسة الإلغاء؟',
          a: 'يمكنك إلغاء طلبك مجاناً قبل بدء التحضير. بعد بدء التحضير، قد يتم خصم جزء من المبلغ حسب سياسة مقدم الخدمة.'
        }
      ]
    },
    {
      icon: Shield,
      title: 'الأمان والخصوصية',
      questions: [
        {
          q: 'كيف تحمون بياناتي؟',
          a: 'نستخدم تشفير SSL/TLS لجميع الاتصالات، ونخزن البيانات على خوادم آمنة. لا نشارك بياناتك مع أطراف ثالثة دون موافقتك.'
        },
        {
          q: 'هل يمكنني حذف حسابي؟',
          a: 'نعم، يمكنك طلب حذف حسابك من صفحة الإعدادات أو بالتواصل مع فريق الدعم. سيتم حذف جميع بياناتك بشكل دائم.'
        },
        {
          q: 'من يمكنه رؤية عنواني؟',
          a: 'عنوانك يظهر فقط لمقدم الخدمة عند تأكيد الطلب ولفترة محدودة لإتمام التوصيل.'
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="container max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/">
              <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <HelpCircle className="h-6 w-6 text-primary" />
              الأسئلة الشائعة
            </h1>
            <p className="text-sm text-muted-foreground">إجابات على أكثر الأسئلة شيوعاً</p>
          </div>
        </div>

        {/* FAQ Categories */}
        <div className="space-y-8">
          {faqCategories.map((category, index) => (
            <Card key={index}>
              <CardContent className="pt-6">
                <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
                  <category.icon className="h-5 w-5 text-primary" />
                  {category.title}
                </h2>
                <Accordion type="single" collapsible className="w-full">
                  {category.questions.map((item, qIndex) => (
                    <AccordionItem key={qIndex} value={`${index}-${qIndex}`}>
                      <AccordionTrigger className="text-right hover:no-underline">
                        <span className="text-sm font-medium">{item.q}</span>
                      </AccordionTrigger>
                      <AccordionContent>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {item.a}
                        </p>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Contact Section */}
        <Card className="mt-8 bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <Phone className="h-10 w-10 text-primary mx-auto" />
              <h3 className="font-semibold text-lg">لم تجد إجابة سؤالك؟</h3>
              <p className="text-sm text-muted-foreground">
                تواصل مع فريق الدعم وسنساعدك في أسرع وقت
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button asChild>
                  <a href="mailto:support@alhaay.com">
                    راسلنا عبر البريد
                  </a>
                </Button>
                <Button variant="outline" asChild>
                  <a href="https://wa.me/966500000000" target="_blank" rel="noopener noreferrer">
                    تواصل واتساب
                  </a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Links */}
        <div className="flex justify-center gap-4 text-sm mt-8">
          <Link to="/terms" className="text-primary hover:underline">
            شروط الاستخدام
          </Link>
          <span className="text-muted-foreground">•</span>
          <Link to="/privacy" className="text-primary hover:underline">
            سياسة الخصوصية
          </Link>
          <span className="text-muted-foreground">•</span>
          <Link to="/" className="text-primary hover:underline">
            الصفحة الرئيسية
          </Link>
        </div>
      </div>
    </div>
  );
}
