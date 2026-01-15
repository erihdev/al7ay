import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Mail, Phone, Edit2, Save, X, Calendar, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { z } from 'zod';

// Validation schema
const profileSchema = z.object({
  full_name: z.string()
    .trim()
    .min(2, 'الاسم يجب أن يكون حرفين على الأقل')
    .max(100, 'الاسم طويل جداً')
    .regex(/^[\u0600-\u06FFa-zA-Z\s]+$/, 'الاسم يجب أن يحتوي على حروف فقط'),
  phone: z.string()
    .trim()
    .regex(/^(\+?966|0)?5\d{8}$/, 'رقم الجوال غير صحيح')
    .or(z.literal(''))
    .optional(),
});

interface ProfileData {
  full_name: string | null;
  phone: string | null;
}

export function ProfileInfo() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<{ full_name?: string; phone?: string }>({});
  const [profileData, setProfileData] = useState<ProfileData>({
    full_name: null,
    phone: null,
  });

  useEffect(() => {
    if (user) {
      fetchProfileData();
    }
  }, [user]);

  const fetchProfileData = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, phone')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile data:', error);
      }

      if (data) {
        setProfileData({
          full_name: data.full_name,
          phone: data.phone,
        });
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = (): boolean => {
    try {
      profileSchema.parse({
        full_name: profileData.full_name || '',
        phone: profileData.phone || '',
      });
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: { full_name?: string; phone?: string } = {};
        error.errors.forEach((err) => {
          if (err.path[0] === 'full_name') {
            fieldErrors.full_name = err.message;
          } else if (err.path[0] === 'phone') {
            fieldErrors.phone = err.message;
          }
        });
        setErrors(fieldErrors);
      }
      return false;
    }
  };

  const handleSave = async () => {
    if (!user) return;
    
    if (!validateForm()) {
      toast.error('يرجى تصحيح الأخطاء');
      return;
    }
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profileData.full_name?.trim() || null,
          phone: profileData.phone?.trim() || null,
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('تم حفظ البيانات بنجاح');
      setIsEditing(false);
      setErrors({});
    } catch (error) {
      console.error('Error saving profile data:', error);
      toast.error('حدث خطأ في حفظ البيانات');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    fetchProfileData();
    setIsEditing(false);
    setErrors({});
  };

  if (isLoading) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="animate-pulse">
            <div className="h-24 bg-gradient-to-l from-primary/20 to-primary/10" />
            <div className="p-4 space-y-4">
              <div className="h-5 bg-muted rounded w-1/3" />
              <div className="h-10 bg-muted rounded" />
              <div className="h-10 bg-muted rounded" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-0 shadow-lg">
      <CardContent className="p-0">
        {/* Header with gradient */}
        <div className="relative h-20 bg-gradient-to-l from-primary via-primary/90 to-primary/70">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtOS45NDEgMC0xOCA4LjA1OS0xOCAxOHM4LjA1OSAxOCAxOCAxOCAxOC04LjA1OSAxOC0xOC04LjA1OS0xOC0xOC0xOHoiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIiBzdHJva2Utd2lkdGg9IjIiLz48L2c+PC9zdmc+')] opacity-30" />
          
          {/* Edit button */}
          <AnimatePresence>
            {!isEditing && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute top-3 left-3"
              >
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="h-8 px-3 bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm"
                >
                  <Edit2 className="h-3.5 w-3.5 ml-1" />
                  تعديل
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Avatar */}
          <div className="absolute -bottom-10 right-4">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-white to-gray-100 p-1 shadow-xl">
              <div className="w-full h-full rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                <User className="h-8 w-8 text-primary" />
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="pt-14 pb-5 px-4">
          <AnimatePresence mode="wait">
            {isEditing ? (
              <motion.div
                key="editing"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div className="space-y-1.5">
                  <Label htmlFor="full_name" className="text-xs flex items-center gap-1.5 text-muted-foreground">
                    <User className="h-3.5 w-3.5" />
                    الاسم الكامل
                  </Label>
                  <Input
                    id="full_name"
                    placeholder="أدخل اسمك الكامل"
                    value={profileData.full_name || ''}
                    onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                    className={`h-11 ${errors.full_name ? 'border-destructive' : ''}`}
                    maxLength={100}
                  />
                  {errors.full_name && (
                    <p className="text-xs text-destructive">{errors.full_name}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-xs flex items-center gap-1.5 text-muted-foreground">
                    <Phone className="h-3.5 w-3.5" />
                    رقم الجوال
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="05XXXXXXXX"
                    value={profileData.phone || ''}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    className={`h-11 text-left dir-ltr ${errors.phone ? 'border-destructive' : ''}`}
                    maxLength={15}
                    dir="ltr"
                  />
                  {errors.phone && (
                    <p className="text-xs text-destructive">{errors.phone}</p>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex-1 h-11"
                  >
                    <Save className="h-4 w-4 ml-2" />
                    {isSaving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isSaving}
                    className="h-11"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="viewing"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                {/* Name */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground">الاسم</p>
                    <p className="font-semibold truncate">
                      {profileData.full_name || 'لم يتم تحديد الاسم'}
                    </p>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                    <Mail className="h-5 w-5 text-blue-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground">البريد الإلكتروني</p>
                    <p className="font-medium text-sm truncate" dir="ltr">
                      {user?.email}
                    </p>
                  </div>
                  <div className="shrink-0">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-green-500/10 text-green-600">
                      <Shield className="h-3 w-3" />
                      مُفعّل
                    </span>
                  </div>
                </div>

                {/* Phone */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <Phone className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground">رقم الجوال</p>
                    <p className={`font-medium ${profileData.phone ? '' : 'text-muted-foreground text-sm'}`} dir="ltr">
                      {profileData.phone || 'لم يتم إضافة رقم جوال'}
                    </p>
                  </div>
                </div>

                {/* Join date */}
                <div className="flex items-center gap-3 pt-2 border-t">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0">
                    <Calendar className="h-5 w-5 text-orange-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground">تاريخ الانضمام</p>
                    <p className="font-medium text-sm">
                      {user?.created_at && format(new Date(user.created_at), 'dd MMMM yyyy', { locale: ar })}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
}
