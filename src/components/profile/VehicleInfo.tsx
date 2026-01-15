import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Car, Edit2, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

// قائمة شاملة بماركات السيارات مع الموديلات
const CAR_BRANDS_WITH_MODELS: Record<string, string[]> = {
  // الماركات اليابانية
  'تويوتا': ['كامري', 'كورولا', 'لاند كروزر', 'برادو', 'هايلكس', 'RAV4', 'يارس', 'أفالون', 'فورتشنر', 'إنوفا', 'هايلاندر', 'سيينا', 'سوبرا', '86', 'تندرا', 'سيكويا', 'تاكوما', 'كراون', 'كامري هايبرد'],
  'هوندا': ['أكورد', 'سيفيك', 'CR-V', 'بايلوت', 'HR-V', 'أوديسي', 'سيتي', 'جاز', 'BR-V', 'إنتيجرا', 'NSX', 'ريدجلاين', 'باسبورت'],
  'نيسان': ['ألتيما', 'سنترا', 'ماكسيما', 'باترول', 'إكستيرا', 'باثفايندر', 'روج', 'أرمادا', 'كيكس', 'جوك', 'مورانو', 'تيتان', 'فرونتير', 'ليف', 'Z', 'GT-R', 'صني'],
  'مازدا': ['مازدا 3', 'مازدا 6', 'CX-3', 'CX-5', 'CX-9', 'CX-30', 'CX-50', 'CX-60', 'CX-90', 'MX-5', 'BT-50'],
  'سوبارو': ['فورستر', 'أوت باك', 'امبريزا', 'WRX', 'ليجاسي', 'كروستريك', 'أسينت', 'BRZ', 'سولتيرا'],
  'ميتسوبيشي': ['لانسر', 'باجيرو', 'مونتيرو', 'أوتلاندر', 'ASX', 'إكليبس كروس', 'L200', 'ميراج', 'أتراج'],
  'سوزوكي': ['سويفت', 'فيتارا', 'جيمني', 'ألتو', 'سياز', 'إرتيجا', 'S-Cross', 'بالينو', 'XL7'],
  'لكزس': ['ES', 'IS', 'LS', 'GS', 'RX', 'NX', 'UX', 'LX', 'GX', 'LC', 'RC', 'LM', 'RZ'],
  'إنفينيتي': ['Q50', 'Q60', 'Q70', 'QX50', 'QX55', 'QX60', 'QX80'],
  'أكورا': ['TLX', 'ILX', 'RDX', 'MDX', 'NSX', 'إنتيجرا'],
  'إيسوزو': ['D-Max', 'MU-X', 'ترافيرس'],

  // الماركات الكورية
  'هيونداي': ['سوناتا', 'إلنترا', 'أكسنت', 'توسان', 'سانتا في', 'كونا', 'باليسيد', 'فينيو', 'أزيرا', 'ستاريا', 'كريتا', 'أيونيك 5', 'أيونيك 6', 'نكسو', 'جينيسيس كوبيه'],
  'كيا': ['سيراتو', 'أوبتيما', 'K5', 'K8', 'سورينتو', 'سبورتاج', 'سيلتوس', 'كارنيفال', 'تيلورايد', 'ستينجر', 'سول', 'نيرو', 'EV6', 'EV9', 'ريو', 'بيكانتو'],
  'جينيسيس': ['G70', 'G80', 'G90', 'GV60', 'GV70', 'GV80'],
  'سانج يونج': ['تيفولي', 'كوراندو', 'ريكستون', 'موسو'],

  // الماركات الأمريكية
  'فورد': ['فيوجن', 'توروس', 'موستانج', 'إكسبلورر', 'إكسبيديشن', 'إيدج', 'إسكيب', 'برونكو', 'F-150', 'رينجر', 'مافريك', 'ماك إي'],
  'شيفروليه': ['ماليبو', 'إمبالا', 'كامارو', 'كورفيت', 'تاهو', 'سوبربان', 'ترافيرس', 'إكوينوكس', 'بليزر', 'ترايل بليزر', 'سيلفرادو', 'كولورادو', 'بولت'],
  'جي إم سي': ['سييرا', 'يوكون', 'أكاديا', 'تيرين', 'كانيون', 'هامر EV'],
  'دودج': ['تشارجر', 'تشالنجر', 'دورانجو', 'رام 1500', 'رام 2500', 'هورنت'],
  'جيب': ['رانجلر', 'جراند شيروكي', 'شيروكي', 'كومباس', 'رينيجيد', 'جلاديتور', 'واجونير', 'جراند واجونير'],
  'كاديلاك': ['CT4', 'CT5', 'إسكاليد', 'XT4', 'XT5', 'XT6', 'ليريك'],
  'لينكولن': ['MKZ', 'كونتيننتال', 'أفييتور', 'نوتيلوس', 'كورسير', 'نافيجيتور'],
  'كرايسلر': ['300', 'باسيفيكا', 'فوياجر'],
  'بويك': ['إنكليف', 'أنفيجن', 'إنكور'],
  'تسلا': ['موديل S', 'موديل 3', 'موديل X', 'موديل Y', 'سايبر تراك', 'رودستر'],
  'رام': ['1500', '2500', '3500', 'بروماستر'],

  // الماركات الألمانية
  'مرسيدس': ['C-Class', 'E-Class', 'S-Class', 'A-Class', 'CLA', 'CLS', 'GLA', 'GLB', 'GLC', 'GLE', 'GLS', 'G-Class', 'AMG GT', 'EQS', 'EQE', 'EQB', 'EQA', 'مايباخ'],
  'بي إم دبليو': ['الفئة 3', 'الفئة 5', 'الفئة 7', 'الفئة 2', 'الفئة 4', 'X1', 'X2', 'X3', 'X4', 'X5', 'X6', 'X7', 'XM', 'iX', 'i4', 'i7', 'Z4', 'M2', 'M3', 'M4', 'M5', 'M8'],
  'أودي': ['A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'Q2', 'Q3', 'Q5', 'Q7', 'Q8', 'e-tron', 'RS3', 'RS4', 'RS5', 'RS6', 'RS7', 'R8', 'TT'],
  'فولكس واجن': ['جيتا', 'باسات', 'أرتيون', 'جولف', 'تيجوان', 'توارق', 'أطلس', 'ID.4', 'ID.Buzz', 'تايجون', 'تي-روك'],
  'بورشه': ['911', 'كايين', 'ماكان', 'باناميرا', 'تايكان', 'بوكستر', 'كايمان'],
  'أوبل': ['كورسا', 'أسترا', 'إنسيجنيا', 'موكا', 'جراندلاند', 'كروسلاند', 'كومبو'],
  'ميني': ['كوبر', 'كانتريمان', 'كلوبمان', 'كوبر إلكتريك'],

  // الماركات البريطانية
  'لاند روفر': ['ديفندر', 'ديسكفري', 'ديسكفري سبورت', 'رينج روفر', 'رينج روفر سبورت', 'رينج روفر فيلار', 'رينج روفر إيفوك'],
  'رينج روفر': ['رينج روفر', 'رينج روفر سبورت', 'رينج روفر فيلار', 'رينج روفر إيفوك'],
  'جاكوار': ['XE', 'XF', 'XJ', 'F-Type', 'F-Pace', 'E-Pace', 'I-Pace'],
  'بنتلي': ['كونتيننتال GT', 'فلاينج سبير', 'بنتايجا', 'مولسان'],
  'رولز رويس': ['فانتوم', 'جوست', 'رايث', 'داون', 'كولينان', 'سبيكتر'],
  'أستون مارتن': ['DB11', 'DBS', 'فانتاج', 'DBX', 'فالكيري'],
  'ماكلارين': ['GT', '720S', '765LT', 'أرتورا'],
  'لوتس': ['إيميرا', 'إليترا', 'إيفيجا'],
  'إم جي': ['MG5', 'MG6', 'ZS', 'HS', 'RX5', 'Marvel R', 'MG4'],

  // الماركات الفرنسية
  'بيجو': ['208', '308', '408', '508', '2008', '3008', '5008', 'رايفتر', 'لاندتريك'],
  'رينو': ['ميجان', 'كليو', 'تاليسمان', 'كابتشر', 'كادجار', 'أركانا', 'أوسترال', 'كوليوس', 'زوي'],
  'سيتروين': ['C3', 'C4', 'C5 X', 'C3 إيركروس', 'C5 إيركروس', 'بيرلينجو'],
  'دي إس': ['DS 3', 'DS 4', 'DS 7', 'DS 9'],

  // الماركات الإيطالية
  'فيراري': ['روما', 'بورتوفينو', 'F8', 'SF90', '296 GTB', '812', 'بوروسانغوي'],
  'لامبورجيني': ['هوراكان', 'أوروس', 'ريفيويلتو'],
  'مازيراتي': ['جيبلي', 'كواتروبورتي', 'ليفانتي', 'MC20', 'جريكالي', 'جران توريزمو'],
  'ألفا روميو': ['جوليا', 'ستيلفيو', 'تونالي'],
  'فيات': ['500', 'تيبو', 'باندا', '500X'],

  // الماركات السويدية
  'فولفو': ['S60', 'S90', 'V60', 'V90', 'XC40', 'XC60', 'XC90', 'C40', 'EX30', 'EX90'],
  'بوليستار': ['بوليستار 2', 'بوليستار 3', 'بوليستار 4'],

  // الماركات الصينية
  'جيلي': ['إمجراند', 'كولراي', 'أوكافانجو', 'ستار', 'مونجارو', 'بريتون'],
  'شيري': ['تيجو 2', 'تيجو 4', 'تيجو 7', 'تيجو 8', 'أريزو 5', 'أريزو 6'],
  'بي واي دي': ['هان', 'تانغ', 'سونج', 'يوان', 'دولفين', 'سيل', 'أتو 3', 'سيجال'],
  'هافال': ['H2', 'H6', 'H9', 'جوليان', 'داركو', 'دوغ'],
  'جريت وول': ['وينجل', 'كانون', 'تانك 300', 'تانك 500'],
  'شانجان': ['إيدو', 'CS35', 'CS55', 'CS75', 'CS85', 'UNI-T', 'UNI-K', 'UNI-V'],
  'جاك': ['S2', 'S3', 'S4', 'S7', 'T6', 'T8'],
  'فاو': ['بيستون T77', 'بيستون T55', 'بيستون T99'],
  'دونج فينج': ['AX7', 'فورتشينج', 'ريتش'],
  'غاز': ['GS3', 'GS4', 'GS8', 'إمباو', 'أيون'],
  'ليون': ['01', '02', '03', '05', '09'],
  'زيكر': ['001', '007', '009', 'X'],
  'نيو': ['ES6', 'ES7', 'ES8', 'ET5', 'ET7', 'EC6', 'EC7'],
  'إكسبينج': ['P5', 'P7', 'G3', 'G6', 'G9', 'X9'],
  'لي أوتو': ['L7', 'L8', 'L9', 'ميجا'],

  // الماركات الهندية
  'تاتا': ['نيكسون', 'هارير', 'سفاري', 'بانش', 'تياجو'],
  'ماهيندرا': ['XUV300', 'XUV400', 'XUV700', 'ثار', 'سكوربيو'],

  // ماركات أخرى
  'سكودا': ['أوكتافيا', 'سوبيرب', 'كودياك', 'كاميق', 'كاروك', 'إنياك'],
  'سيات': ['ليون', 'إيبيزا', 'أتيكا', 'تاراكو', 'أرونا'],
  'كوبرا': ['ليون', 'فورمنتور', 'بورن', 'تافاسكان'],
  'داسيا': ['لوجان', 'سانديرو', 'داستر', 'جوجر', 'سبرينج'],
};

// تحويل الماركات لقائمة SearchableSelect
const CAR_BRANDS = Object.keys(CAR_BRANDS_WITH_MODELS).map(brand => ({
  value: brand,
  label: brand
}));

// إنشاء قائمة السنوات من 1990 إلى السنة الحالية
const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: currentYear - 1989 }, (_, i) => {
  const year = (currentYear - i).toString();
  return { value: year, label: year };
});

interface VehicleData {
  vehicle_brand: string | null;
  vehicle_model: string | null;
  vehicle_year: string | null;
  vehicle_color: string | null;
  vehicle_plate: string | null;
}

export function VehicleInfo() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [vehicleData, setVehicleData] = useState<VehicleData>({
    vehicle_brand: null,
    vehicle_model: null,
    vehicle_year: null,
    vehicle_color: null,
    vehicle_plate: null,
  });

  // إنشاء قائمة الموديلات بناءً على الماركة المختارة
  const modelOptions = useMemo(() => {
    if (!vehicleData.vehicle_brand) return [];
    const models = CAR_BRANDS_WITH_MODELS[vehicleData.vehicle_brand] || [];
    return models.map(model => ({ value: model, label: model }));
  }, [vehicleData.vehicle_brand]);

  useEffect(() => {
    if (user) {
      fetchVehicleData();
    }
  }, [user]);

  const fetchVehicleData = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('vehicle_brand, vehicle_model, vehicle_year, vehicle_color, vehicle_plate')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching vehicle data:', error);
      }

      if (data) {
        setVehicleData({
          vehicle_brand: data.vehicle_brand,
          vehicle_model: data.vehicle_model,
          vehicle_year: data.vehicle_year,
          vehicle_color: data.vehicle_color,
          vehicle_plate: data.vehicle_plate,
        });
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          vehicle_brand: vehicleData.vehicle_brand?.trim() || null,
          vehicle_model: vehicleData.vehicle_model?.trim() || null,
          vehicle_year: vehicleData.vehicle_year?.trim() || null,
          vehicle_color: vehicleData.vehicle_color?.trim() || null,
          vehicle_plate: vehicleData.vehicle_plate?.trim() || null,
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('تم حفظ معلومات السيارة بنجاح');
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving vehicle data:', error);
      toast.error('حدث خطأ في حفظ البيانات');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    fetchVehicleData();
    setIsEditing(false);
  };

  const hasVehicleData = vehicleData.vehicle_brand || vehicleData.vehicle_model || vehicleData.vehicle_plate;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="h-8 bg-muted rounded"></div>
            <div className="h-8 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-2">
            <Car className="h-5 w-5 text-primary" />
            معلومات السيارة
          </div>
          {!isEditing && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="h-8 px-2"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {isEditing ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="vehicle_brand" className="text-xs">ماركة السيارة</Label>
                <SearchableSelect
                  options={CAR_BRANDS}
                  value={vehicleData.vehicle_brand || ''}
                  onValueChange={(value) => setVehicleData({ 
                    ...vehicleData, 
                    vehicle_brand: value,
                    vehicle_model: null // إعادة تعيين الموديل عند تغيير الماركة
                  })}
                  placeholder="اختر الماركة..."
                  searchPlaceholder="ابحث عن الماركة..."
                  emptyMessage="لم يتم العثور على ماركة"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="vehicle_model" className="text-xs">الموديل</Label>
                <SearchableSelect
                  options={modelOptions}
                  value={vehicleData.vehicle_model || ''}
                  onValueChange={(value) => setVehicleData({ ...vehicleData, vehicle_model: value })}
                  placeholder={vehicleData.vehicle_brand ? "اختر الموديل..." : "اختر الماركة أولاً"}
                  searchPlaceholder="ابحث عن الموديل..."
                  emptyMessage="لم يتم العثور على موديل"
                  disabled={!vehicleData.vehicle_brand}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="vehicle_year" className="text-xs">سنة الصنع</Label>
                <SearchableSelect
                  options={YEAR_OPTIONS}
                  value={vehicleData.vehicle_year || ''}
                  onValueChange={(value) => setVehicleData({ ...vehicleData, vehicle_year: value })}
                  placeholder="اختر السنة..."
                  searchPlaceholder="ابحث عن السنة..."
                  emptyMessage="لم يتم العثور على السنة"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="vehicle_color" className="text-xs">اللون</Label>
                <Input
                  id="vehicle_color"
                  placeholder="مثال: أبيض"
                  value={vehicleData.vehicle_color || ''}
                  onChange={(e) => setVehicleData({ ...vehicleData, vehicle_color: e.target.value })}
                  className="h-9"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="vehicle_plate" className="text-xs">رقم اللوحة</Label>
              <Input
                id="vehicle_plate"
                placeholder="مثال: أ ب ج 1234"
                value={vehicleData.vehicle_plate || ''}
                onChange={(e) => setVehicleData({ ...vehicleData, vehicle_plate: e.target.value })}
                className="h-9"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1"
                size="sm"
              >
                <Save className="h-4 w-4 ml-1" />
                {isSaving ? 'جاري الحفظ...' : 'حفظ'}
              </Button>
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={isSaving}
                size="sm"
              >
                <X className="h-4 w-4 ml-1" />
                إلغاء
              </Button>
            </div>
          </motion.div>
        ) : hasVehicleData ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {vehicleData.vehicle_brand && (
                <div className="p-2 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground">الماركة</p>
                  <p className="font-medium">{vehicleData.vehicle_brand}</p>
                </div>
              )}
              {vehicleData.vehicle_model && (
                <div className="p-2 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground">الموديل</p>
                  <p className="font-medium">{vehicleData.vehicle_model}</p>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {vehicleData.vehicle_year && (
                <div className="p-2 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground">سنة الصنع</p>
                  <p className="font-medium">{vehicleData.vehicle_year}</p>
                </div>
              )}
              {vehicleData.vehicle_color && (
                <div className="p-2 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground">اللون</p>
                  <p className="font-medium">{vehicleData.vehicle_color}</p>
                </div>
              )}
            </div>
            {vehicleData.vehicle_plate && (
              <div className="p-2 bg-primary/5 rounded-lg border border-primary/20">
                <p className="text-xs text-muted-foreground">رقم اللوحة</p>
                <p className="font-bold text-lg text-primary">{vehicleData.vehicle_plate}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-6">
            <Car className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">لم تقم بإضافة معلومات السيارة بعد</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="mt-3"
            >
              <Edit2 className="h-4 w-4 ml-1" />
              إضافة معلومات السيارة
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}