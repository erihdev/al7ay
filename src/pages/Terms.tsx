import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, FileText, Shield, AlertTriangle, Scale, UserCheck, Ban } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Terms() {
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
            <h1 className="text-2xl font-bold">شروط الاستخدام</h1>
            <p className="text-sm text-muted-foreground">آخر تحديث: يناير 2026</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Introduction */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                مقدمة
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
              <p>
                مرحباً بك في منصة "الحي". باستخدامك لهذه المنصة، فإنك توافق على الالتزام بهذه الشروط والأحكام. 
                يرجى قراءتها بعناية قبل استخدام خدماتنا.
              </p>
              <p>
                منصة "الحي" هي منصة تربط بين مقدمي الخدمات المنزلية والعملاء في الأحياء المختلفة، 
                وتسهل عملية الطلب والتوصيل للمنتجات والخدمات.
              </p>
            </CardContent>
          </Card>

          {/* User Obligations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-primary" />
                التزامات المستخدم
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                <li>تقديم معلومات صحيحة ودقيقة عند التسجيل</li>
                <li>الحفاظ على سرية بيانات الحساب وعدم مشاركتها</li>
                <li>استخدام المنصة للأغراض المشروعة فقط</li>
                <li>احترام حقوق مقدمي الخدمات والمستخدمين الآخرين</li>
                <li>الالتزام بقوانين المملكة العربية السعودية</li>
                <li>عدم استخدام المنصة لأي نشاط غير قانوني أو ضار</li>
              </ul>
            </CardContent>
          </Card>

          {/* Service Provider Terms */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                شروط مقدمي الخدمات
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                <li>الحصول على جميع التراخيص والتصاريح اللازمة</li>
                <li>الالتزام بمعايير الجودة والسلامة الغذائية</li>
                <li>توفير منتجات طازجة وذات جودة عالية</li>
                <li>الالتزام بأوقات التوصيل المحددة</li>
                <li>التعامل باحترافية مع العملاء</li>
                <li>تحديث معلومات المنتجات والأسعار بشكل دوري</li>
              </ul>
            </CardContent>
          </Card>

          {/* Prohibited Activities */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ban className="h-5 w-5 text-destructive" />
                الأنشطة المحظورة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                <li>انتحال شخصية أو هوية شخص آخر</li>
                <li>نشر محتوى مسيء أو غير لائق</li>
                <li>محاولة اختراق أو تعطيل المنصة</li>
                <li>استخدام برامج آلية للوصول للمنصة</li>
                <li>بيع منتجات غير مرخصة أو محظورة</li>
                <li>التلاعب بالتقييمات والمراجعات</li>
              </ul>
            </CardContent>
          </Card>

          {/* Liability */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                حدود المسؤولية
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
              <p>
                منصة "الحي" هي وسيط بين مقدمي الخدمات والعملاء، ولا تتحمل المسؤولية المباشرة عن:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>جودة المنتجات المقدمة من مقدمي الخدمات</li>
                <li>التأخير في التوصيل بسبب ظروف خارجة عن السيطرة</li>
                <li>أي نزاعات تنشأ بين المستخدمين ومقدمي الخدمات</li>
                <li>أي أضرار ناتجة عن سوء استخدام المنصة</li>
              </ul>
            </CardContent>
          </Card>

          {/* Dispute Resolution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale className="h-5 w-5 text-primary" />
                حل النزاعات
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
              <p>
                في حالة وجود أي نزاع، نشجع على التواصل معنا أولاً لمحاولة حله ودياً. 
                تخضع هذه الشروط لقوانين المملكة العربية السعودية، وأي نزاع لا يمكن حله ودياً 
                سيتم إحالته للجهات القضائية المختصة.
              </p>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <p className="text-sm text-center">
                للاستفسارات حول شروط الاستخدام، تواصل معنا عبر البريد الإلكتروني:{' '}
                <a href="mailto:support@alhaay.com" className="text-primary font-medium">
                  support@alhaay.com
                </a>
              </p>
            </CardContent>
          </Card>

          {/* Links */}
          <div className="flex justify-center gap-4 text-sm">
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
    </div>
  );
}
