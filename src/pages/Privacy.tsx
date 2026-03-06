import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Shield, Database, Share2, Lock, Bell, Trash2, Cookie } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Privacy() {
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
            <h1 className="text-2xl font-bold">سياسة الخصوصية</h1>
            <p className="text-sm text-muted-foreground">آخر تحديث: يناير 2026</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Introduction */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                التزامنا بحماية خصوصيتك
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
              <p>
                في منصة "الحي"، نحن ملتزمون بحماية خصوصيتك وبياناتك الشخصية.
                توضح هذه السياسة كيفية جمع واستخدام وحماية معلوماتك عند استخدام منصتنا.
              </p>
              <p>
                نحن نتعامل مع بياناتك بمسؤولية كاملة ووفقاً لأفضل الممارسات والمعايير الدولية لحماية البيانات.
              </p>
            </CardContent>
          </Card>

          {/* Data Collection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                البيانات التي نجمعها
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">البيانات الشخصية والموقع</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>الاسم الكامل ورقم الهاتف</li>
                  <li>البريد الإلكتروني</li>
                  <li>عنوان التوصيل وبيانات الموقع الجغرافي (نستخدم الموقع بدقة فقط لربطك بخدمات الحي، ولا يتم التتبع في الخلفية بدون علمك وإذنك).</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">بيانات الاستخدام</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>سجل الطلبات والمعاملات</li>
                  <li>تفضيلات المنتجات والمفضلة</li>
                  <li>تقييمات ومراجعات المنتجات</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">البيانات التقنية</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>نوع الجهاز والمتصفح</li>
                  <li>عنوان IP</li>
                  <li>ملفات تعريف الارتباط (Cookies)</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Data Usage */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Share2 className="h-5 w-5 text-primary" />
                كيف نستخدم بياناتك
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                <li>معالجة وتوصيل طلباتك</li>
                <li>التواصل معك بشأن طلباتك وحسابك</li>
                <li>تحسين تجربة المستخدم وتخصيص المحتوى</li>
                <li>إرسال العروض والتحديثات (بموافقتك)</li>
                <li>تحليل الاستخدام لتحسين خدماتنا</li>
                <li>منع الاحتيال وضمان أمان المنصة</li>
                <li>الامتثال للمتطلبات القانونية</li>
              </ul>
            </CardContent>
          </Card>

          {/* Data Protection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" />
                حماية البيانات
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
              <p>نتخذ إجراءات أمنية متعددة لحماية بياناتك:</p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>تشفير البيانات أثناء النقل والتخزين (SSL/TLS)</li>
                <li>تخزين آمن للبيانات على خوادم محمية</li>
                <li>مراقبة مستمرة للنظام ضد التهديدات</li>
                <li>تقييد الوصول للبيانات على الموظفين المخولين فقط</li>
                <li>تحديث دوري لأنظمة الأمان</li>
              </ul>
            </CardContent>
          </Card>

          {/* Cookies */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cookie className="h-5 w-5 text-primary" />
                ملفات تعريف الارتباط (Cookies)
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
              <p>نستخدم ملفات تعريف الارتباط لـ:</p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>تذكر تفضيلاتك وإعدادات حسابك</li>
                <li>الحفاظ على تسجيل دخولك</li>
                <li>تحليل استخدام المنصة</li>
                <li>تحسين أداء المنصة</li>
              </ul>
              <p className="mt-3 text-sm">
                يمكنك إدارة ملفات تعريف الارتباط من خلال إعدادات متصفحك.
              </p>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                الإشعارات والتواصل
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
              <p>قد نتواصل معك عبر:</p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>إشعارات التطبيق (تحديثات الطلبات)</li>
                <li>البريد الإلكتروني (الفواتير والتأكيدات)</li>
                <li>الرسائل النصية (تأكيد الطلبات)</li>
              </ul>
              <p className="mt-3 text-sm">
                يمكنك إدارة تفضيلات الإشعارات من إعدادات حسابك.
              </p>
            </CardContent>
          </Card>

          {/* User Rights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-primary" />
                حقوقك
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm">لديك الحق في:</p>
              <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                <li>الوصول لبياناتك الشخصية وتعديلها.</li>
                <li><strong>حذف الحساب نهائياً:</strong> يمكنك محو حسابك وجميع بياناتك المرتبطة به فوراً من خلال إعدادات التطبيق.</li>
                <li>طلب حذف أو استخراج بياناتك.</li>
                <li>الاعتراض على معالجة بياناتك.</li>
                <li>نقل بياناتك لمنصة أخرى أو سحب موافقتك في أي وقت.</li>
              </ul>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <p className="text-sm text-center">
                للاستفسارات حول سياسة الخصوصية أو لممارسة حقوقك، تواصل معنا عبر:{' '}
                <a href="mailto:privacy@alhaay.com" className="text-primary font-medium">
                  privacy@alhaay.com
                </a>
              </p>
            </CardContent>
          </Card>

          {/* Links */}
          <div className="flex justify-center gap-4 text-sm">
            <Link to="/terms" className="text-primary hover:underline">
              شروط الاستخدام
            </Link>
            <span className="text-muted-foreground">•</span>
            <Link to="/" className="text-primary hover:underline">
              الصفحة الرئيسية
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
