import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Mail, Phone, MapPin, Clock, MessageCircle, Save, Loader2 } from 'lucide-react';

interface ContactSettings {
  id: string;
  email: string;
  phone: string;
  whatsapp: string;
  location: string;
  working_hours: string;
}

export function ContactSettingsManager() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<Partial<ContactSettings>>({});

  const { data: settings, isLoading } = useQuery({
    queryKey: ['contact-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contact_settings')
        .select('*')
        .single();
      
      if (error) throw error;
      setFormData(data);
      return data as ContactSettings;
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<ContactSettings>) => {
      if (!settings?.id) throw new Error('No settings found');
      
      const { error } = await supabase
        .from('contact_settings')
        .update({
          email: data.email,
          phone: data.phone,
          whatsapp: data.whatsapp,
          location: data.location,
          working_hours: data.working_hours
        })
        .eq('id', settings.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-settings'] });
      toast.success('تم حفظ إعدادات التواصل بنجاح');
    },
    onError: (error) => {
      console.error('Error updating contact settings:', error);
      toast.error('حدث خطأ أثناء حفظ الإعدادات');
    }
  });

  const handleChange = (field: keyof ContactSettings, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-primary" />
          إعدادات التواصل
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                البريد الإلكتروني
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email || ''}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="support@example.com"
                dir="ltr"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                رقم الهاتف
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone || ''}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="+966 50 000 0000"
                dir="ltr"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatsapp" className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-muted-foreground" />
                رقم واتساب (بدون +)
              </Label>
              <Input
                id="whatsapp"
                type="tel"
                value={formData.whatsapp || ''}
                onChange={(e) => handleChange('whatsapp', e.target.value)}
                placeholder="966500000000"
                dir="ltr"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location" className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                الموقع
              </Label>
              <Input
                id="location"
                value={formData.location || ''}
                onChange={(e) => handleChange('location', e.target.value)}
                placeholder="المملكة العربية السعودية"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="working_hours" className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                ساعات العمل
              </Label>
              <Input
                id="working_hours"
                value={formData.working_hours || ''}
                onChange={(e) => handleChange('working_hours', e.target.value)}
                placeholder="السبت - الخميس: 9 ص - 9 م"
              />
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full sm:w-auto"
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin ml-2" />
                جاري الحفظ...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 ml-2" />
                حفظ الإعدادات
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
