import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Car, Edit2, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

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
                <Input
                  id="vehicle_brand"
                  placeholder="مثال: تويوتا"
                  value={vehicleData.vehicle_brand || ''}
                  onChange={(e) => setVehicleData({ ...vehicleData, vehicle_brand: e.target.value })}
                  className="h-9"
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