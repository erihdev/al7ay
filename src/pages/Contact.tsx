import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  ArrowRight, 
  Mail, 
  Phone, 
  MapPin, 
  Send, 
  MessageSquare,
  Clock,
  Loader2,
  CheckCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';

const contactSchema = z.object({
  name: z.string().trim().min(2, 'الاسم يجب أن يكون حرفين على الأقل').max(100, 'الاسم طويل جداً'),
  email: z.string().trim().email('البريد الإلكتروني غير صحيح').max(255, 'البريد الإلكتروني طويل جداً'),
  phone: z.string().trim().optional(),
  subject: z.string().trim().min(3, 'الموضوع يجب أن يكون 3 أحرف على الأقل').max(200, 'الموضوع طويل جداً'),
  message: z.string().trim().min(10, 'الرسالة يجب أن تكون 10 أحرف على الأقل').max(2000, 'الرسالة طويلة جداً')
});

type ContactFormData = z.infer<typeof contactSchema>;

export default function Contact() {
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ContactFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Fetch contact settings from database
  const { data: contactSettings } = useQuery({
    queryKey: ['contact-settings-public'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contact_settings')
        .select('*')
        .single();
      
      if (error) throw error;
      return data;
    }
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name as keyof ContactFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate form
    const result = contactSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof ContactFormData, string>> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as keyof ContactFormData] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke('send-contact-email', {
        body: result.data
      });

      if (error) throw error;

      setIsSubmitted(true);
      toast.success('تم إرسال رسالتك بنجاح! سنتواصل معك قريباً.');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('حدث خطأ أثناء إرسال الرسالة. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactInfo = [
    {
      icon: Mail,
      title: 'البريد الإلكتروني',
      value: contactSettings?.email || 'support@alhaay.com',
      href: `mailto:${contactSettings?.email || 'support@alhaay.com'}`
    },
    {
      icon: Phone,
      title: 'رقم الهاتف',
      value: contactSettings?.phone || '+966 50 000 0000',
      href: `tel:${(contactSettings?.phone || '+966500000000').replace(/\s/g, '')}`
    },
    {
      icon: MapPin,
      title: 'الموقع',
      value: contactSettings?.location || 'المملكة العربية السعودية',
      href: null
    },
    {
      icon: Clock,
      title: 'ساعات العمل',
      value: contactSettings?.working_hours || 'السبت - الخميس: 9 ص - 9 م',
      href: null
    }
  ];

  const whatsappNumber = contactSettings?.whatsapp || '966500000000';

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-8 pb-8">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-xl font-bold mb-2">شكراً لتواصلك معنا!</h2>
            <p className="text-muted-foreground mb-6">
              تم استلام رسالتك بنجاح. سيقوم فريقنا بالرد عليك خلال 24-48 ساعة.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild>
                <Link to="/">العودة للرئيسية</Link>
              </Button>
              <Button variant="outline" onClick={() => {
                setIsSubmitted(false);
                setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
              }}>
                إرسال رسالة أخرى
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="container max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/">
              <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <MessageSquare className="h-6 w-6 text-primary" />
              اتصل بنا
            </h1>
            <p className="text-sm text-muted-foreground">نحن هنا لمساعدتك</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5 text-primary" />
                  أرسل لنا رسالة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">الاسم الكامل *</Label>
                      <Input
                        id="name"
                        name="name"
                        placeholder="أدخل اسمك"
                        value={formData.name}
                        onChange={handleChange}
                        className={errors.name ? 'border-destructive' : ''}
                      />
                      {errors.name && (
                        <p className="text-xs text-destructive">{errors.name}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">البريد الإلكتروني *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="example@email.com"
                        value={formData.email}
                        onChange={handleChange}
                        className={errors.email ? 'border-destructive' : ''}
                      />
                      {errors.email && (
                        <p className="text-xs text-destructive">{errors.email}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">رقم الهاتف (اختياري)</Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        placeholder="+966 5X XXX XXXX"
                        value={formData.phone}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subject">الموضوع *</Label>
                      <Input
                        id="subject"
                        name="subject"
                        placeholder="موضوع الرسالة"
                        value={formData.subject}
                        onChange={handleChange}
                        className={errors.subject ? 'border-destructive' : ''}
                      />
                      {errors.subject && (
                        <p className="text-xs text-destructive">{errors.subject}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">الرسالة *</Label>
                    <Textarea
                      id="message"
                      name="message"
                      placeholder="اكتب رسالتك هنا..."
                      rows={6}
                      value={formData.message}
                      onChange={handleChange}
                      className={errors.message ? 'border-destructive' : ''}
                    />
                    {errors.message && (
                      <p className="text-xs text-destructive">{errors.message}</p>
                    )}
                  </div>

                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin ml-2" />
                        جاري الإرسال...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 ml-2" />
                        إرسال الرسالة
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>معلومات التواصل</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {contactInfo.map((item, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                      <item.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{item.title}</p>
                      {item.href ? (
                        <a 
                          href={item.href} 
                          className="text-sm text-muted-foreground hover:text-primary transition-colors"
                        >
                          {item.value}
                        </a>
                      ) : (
                        <p className="text-sm text-muted-foreground">{item.value}</p>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2">تواصل سريع</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  للاستفسارات العاجلة، يمكنك التواصل معنا مباشرة عبر واتساب
                </p>
                <Button variant="outline" className="w-full" asChild>
                  <a 
                    href={`https://wa.me/${whatsappNumber}`}
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    تواصل عبر واتساب
                  </a>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2">الأسئلة الشائعة</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  قد تجد إجابة سؤالك في صفحة الأسئلة الشائعة
                </p>
                <Button variant="outline" className="w-full" asChild>
                  <Link to="/faq">تصفح الأسئلة الشائعة</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Links */}
        <div className="flex justify-center gap-4 text-sm mt-12">
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
