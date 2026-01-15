import { useState, useEffect } from 'react';
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

// قائمة شاملة بماركات السيارات
const CAR_BRANDS = [
  // الماركات اليابانية
  { value: 'تويوتا', label: 'تويوتا (Toyota)' },
  { value: 'هوندا', label: 'هوندا (Honda)' },
  { value: 'نيسان', label: 'نيسان (Nissan)' },
  { value: 'مازدا', label: 'مازدا (Mazda)' },
  { value: 'سوبارو', label: 'سوبارو (Subaru)' },
  { value: 'ميتسوبيشي', label: 'ميتسوبيشي (Mitsubishi)' },
  { value: 'سوزوكي', label: 'سوزوكي (Suzuki)' },
  { value: 'لكزس', label: 'لكزس (Lexus)' },
  { value: 'إنفينيتي', label: 'إنفينيتي (Infiniti)' },
  { value: 'أكورا', label: 'أكورا (Acura)' },
  { value: 'إيسوزو', label: 'إيسوزو (Isuzu)' },
  
  // الماركات الكورية
  { value: 'هيونداي', label: 'هيونداي (Hyundai)' },
  { value: 'كيا', label: 'كيا (Kia)' },
  { value: 'جينيسيس', label: 'جينيسيس (Genesis)' },
  { value: 'سانج يونج', label: 'سانج يونج (SsangYong)' },
  
  // الماركات الأمريكية
  { value: 'فورد', label: 'فورد (Ford)' },
  { value: 'شيفروليه', label: 'شيفروليه (Chevrolet)' },
  { value: 'جي إم سي', label: 'جي إم سي (GMC)' },
  { value: 'دودج', label: 'دودج (Dodge)' },
  { value: 'جيب', label: 'جيب (Jeep)' },
  { value: 'كاديلاك', label: 'كاديلاك (Cadillac)' },
  { value: 'لينكولن', label: 'لينكولن (Lincoln)' },
  { value: 'كرايسلر', label: 'كرايسلر (Chrysler)' },
  { value: 'بويك', label: 'بويك (Buick)' },
  { value: 'تسلا', label: 'تسلا (Tesla)' },
  { value: 'رام', label: 'رام (RAM)' },
  
  // الماركات الألمانية
  { value: 'مرسيدس', label: 'مرسيدس بنز (Mercedes-Benz)' },
  { value: 'بي إم دبليو', label: 'بي إم دبليو (BMW)' },
  { value: 'أودي', label: 'أودي (Audi)' },
  { value: 'فولكس واجن', label: 'فولكس واجن (Volkswagen)' },
  { value: 'بورشه', label: 'بورشه (Porsche)' },
  { value: 'أوبل', label: 'أوبل (Opel)' },
  { value: 'ميني', label: 'ميني (MINI)' },
  
  // الماركات البريطانية
  { value: 'لاند روفر', label: 'لاند روفر (Land Rover)' },
  { value: 'رينج روفر', label: 'رينج روفر (Range Rover)' },
  { value: 'جاكوار', label: 'جاكوار (Jaguar)' },
  { value: 'بنتلي', label: 'بنتلي (Bentley)' },
  { value: 'رولز رويس', label: 'رولز رويس (Rolls-Royce)' },
  { value: 'أستون مارتن', label: 'أستون مارتن (Aston Martin)' },
  { value: 'ماكلارين', label: 'ماكلارين (McLaren)' },
  { value: 'لوتس', label: 'لوتس (Lotus)' },
  { value: 'إم جي', label: 'إم جي (MG)' },
  
  // الماركات الفرنسية
  { value: 'بيجو', label: 'بيجو (Peugeot)' },
  { value: 'رينو', label: 'رينو (Renault)' },
  { value: 'سيتروين', label: 'سيتروين (Citroën)' },
  { value: 'دي إس', label: 'دي إس (DS)' },
  
  // الماركات الإيطالية
  { value: 'فيراري', label: 'فيراري (Ferrari)' },
  { value: 'لامبورجيني', label: 'لامبورجيني (Lamborghini)' },
  { value: 'مازيراتي', label: 'مازيراتي (Maserati)' },
  { value: 'ألفا روميو', label: 'ألفا روميو (Alfa Romeo)' },
  { value: 'فيات', label: 'فيات (Fiat)' },
  
  // الماركات السويدية
  { value: 'فولفو', label: 'فولفو (Volvo)' },
  { value: 'بوليستار', label: 'بوليستار (Polestar)' },
  
  // الماركات الصينية
  { value: 'جيلي', label: 'جيلي (Geely)' },
  { value: 'شيري', label: 'شيري (Chery)' },
  { value: 'بي واي دي', label: 'بي واي دي (BYD)' },
  { value: 'هافال', label: 'هافال (Haval)' },
  { value: 'جريت وول', label: 'جريت وول (Great Wall)' },
  { value: 'إم جي', label: 'إم جي (MG)' },
  { value: 'شانجان', label: 'شانجان (Changan)' },
  { value: 'جاك', label: 'جاك (JAC)' },
  { value: 'فاو', label: 'فاو (FAW)' },
  { value: 'دونج فينج', label: 'دونج فينج (Dongfeng)' },
  { value: 'غاز', label: 'غاز (GAC)' },
  { value: 'ليون', label: 'ليون (Lynk & Co)' },
  { value: 'زيكر', label: 'زيكر (Zeekr)' },
  { value: 'نيو', label: 'نيو (NIO)' },
  { value: 'إكسبينج', label: 'إكسبينج (Xpeng)' },
  { value: 'لي أوتو', label: 'لي أوتو (Li Auto)' },
  
  // الماركات الهندية
  { value: 'تاتا', label: 'تاتا (Tata)' },
  { value: 'ماهيندرا', label: 'ماهيندرا (Mahindra)' },
  
  // ماركات أخرى
  { value: 'سكودا', label: 'سكودا (Škoda)' },
  { value: 'سيات', label: 'سيات (SEAT)' },
  { value: 'كوبرا', label: 'كوبرا (Cupra)' },
  { value: 'داسيا', label: 'داسيا (Dacia)' },
];
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
                  onValueChange={(value) => setVehicleData({ ...vehicleData, vehicle_brand: value })}
                  placeholder="اختر الماركة..."
                  searchPlaceholder="ابحث عن الماركة..."
                  emptyMessage="لم يتم العثور على ماركة"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="vehicle_model" className="text-xs">الموديل</Label>
                <Input
                  id="vehicle_model"
                  placeholder="مثال: كامري"
                  value={vehicleData.vehicle_model || ''}
                  onChange={(e) => setVehicleData({ ...vehicleData, vehicle_model: e.target.value })}
                  className="h-9"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="vehicle_year" className="text-xs">سنة الصنع</Label>
                <Input
                  id="vehicle_year"
                  placeholder="مثال: 2024"
                  value={vehicleData.vehicle_year || ''}
                  onChange={(e) => setVehicleData({ ...vehicleData, vehicle_year: e.target.value })}
                  className="h-9"
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