import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Bell, Send, Loader2, Users, AlertTriangle, Star, MapPin, Filter } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface BulkNotificationDialogProps {
  totalCustomers: number;
}

export function BulkNotificationDialog({ totalCustomers }: BulkNotificationDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [confirmStep, setConfirmStep] = useState(false);
  const [selectedTier, setSelectedTier] = useState<string>('all');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string>('all');
  const [filteredCount, setFilteredCount] = useState(totalCustomers);

  // Fetch neighborhoods for filter
  const { data: neighborhoods } = useQuery({
    queryKey: ['active-neighborhoods-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('active_neighborhoods')
        .select('id, name, city')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data || [];
    }
  });

  // Calculate filtered count when filters change
  useEffect(() => {
    const calculateCount = async () => {
      if (selectedTier !== 'all' || selectedNeighborhood !== 'all') {
        // Get filtered count from backend
        const { data, error } = await supabase.functions.invoke('send-notification', {
          body: {
            type: 'count_recipients',
            tier: selectedTier !== 'all' ? selectedTier : undefined,
            neighborhoodId: selectedNeighborhood !== 'all' ? selectedNeighborhood : undefined
          }
        });
        
        if (!error && data?.count !== undefined) {
          setFilteredCount(data.count);
        } else {
          setFilteredCount(totalCustomers);
        }
      } else {
        setFilteredCount(totalCustomers);
      }
    };

    calculateCount();
  }, [selectedTier, selectedNeighborhood, totalCustomers]);

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) {
      toast.error('يرجى ملء جميع الحقول');
      return;
    }

    if (!confirmStep) {
      setConfirmStep(true);
      return;
    }

    setIsSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-notification', {
        body: {
          type: 'bulk_notification',
          title: title.trim(),
          message: body.trim(),
          tier: selectedTier !== 'all' ? selectedTier : undefined,
          neighborhoodId: selectedNeighborhood !== 'all' ? selectedNeighborhood : undefined
        }
      });

      if (error) throw error;

      toast.success(`تم إرسال الإشعار لـ ${data?.sentCount || filteredCount} عميل`);
      resetForm();
      setOpen(false);
    } catch (error) {
      console.error('Error sending bulk notification:', error);
      toast.error('فشل في إرسال الإشعار');
    } finally {
      setIsSending(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setBody('');
    setConfirmStep(false);
    setSelectedTier('all');
    setSelectedNeighborhood('all');
  };

  const handleCancel = () => {
    if (confirmStep) {
      setConfirmStep(false);
    } else {
      setOpen(false);
    }
  };

  const getTierLabel = (tier: string) => {
    switch (tier) {
      case 'gold': return 'ذهبي';
      case 'silver': return 'فضي';
      case 'bronze': return 'برونزي';
      default: return 'الكل';
    }
  };

  const getNeighborhoodLabel = () => {
    if (selectedNeighborhood === 'all') return 'الكل';
    const neighborhood = neighborhoods?.find(n => n.id === selectedNeighborhood);
    return neighborhood?.name || 'غير محدد';
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) resetForm();
    }}>
      <DialogTrigger asChild>
        <Button variant="default" className="gap-2">
          <Bell className="h-4 w-4" />
          إرسال إشعار جماعي
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            إرسال إشعار جماعي
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Recipients Filter */}
          <Card className="bg-muted/50">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Filter className="h-4 w-4" />
                تصفية المستلمين
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs flex items-center gap-1">
                    <Star className="h-3 w-3" />
                    مستوى الولاء
                  </Label>
                  <Select value={selectedTier} onValueChange={setSelectedTier}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع المستويات</SelectItem>
                      <SelectItem value="gold">
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-yellow-500" />
                          ذهبي
                        </span>
                      </SelectItem>
                      <SelectItem value="silver">
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-gray-400" />
                          فضي
                        </span>
                      </SelectItem>
                      <SelectItem value="bronze">
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-amber-700" />
                          برونزي
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    الحي
                  </Label>
                  <Select value={selectedNeighborhood} onValueChange={setSelectedNeighborhood}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع الأحياء</SelectItem>
                      {neighborhoods?.map((n) => (
                        <SelectItem key={n.id} value={n.id}>
                          {n.name} - {n.city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recipients Count */}
          <Card className="bg-blue-500/5 border-blue-500/20">
            <CardContent className="p-3 flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-blue-600">{filteredCount}</p>
                <p className="text-xs text-muted-foreground">
                  عميل سيستلم الإشعار
                  {(selectedTier !== 'all' || selectedNeighborhood !== 'all') && (
                    <span className="text-primary mr-1">(مفلتر)</span>
                  )}
                </p>
              </div>
              {(selectedTier !== 'all' || selectedNeighborhood !== 'all') && (
                <div className="mr-auto flex gap-1 flex-wrap">
                  {selectedTier !== 'all' && (
                    <Badge variant="outline" className="text-xs">
                      <Star className="h-3 w-3 ml-1" />
                      {getTierLabel(selectedTier)}
                    </Badge>
                  )}
                  {selectedNeighborhood !== 'all' && (
                    <Badge variant="outline" className="text-xs">
                      <MapPin className="h-3 w-3 ml-1" />
                      {getNeighborhoodLabel()}
                    </Badge>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {!confirmStep ? (
            <>
              <div className="space-y-2">
                <Label>عنوان الإشعار</Label>
                <Input
                  placeholder="مثال: عرض خاص لك!"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={100}
                />
              </div>
              <div className="space-y-2">
                <Label>محتوى الإشعار</Label>
                <Textarea
                  placeholder="اكتب رسالتك هنا..."
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={4}
                  maxLength={500}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground text-left">{body.length}/500</p>
              </div>
            </>
          ) : (
            <Card className="bg-yellow-500/10 border-yellow-500/30">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2 text-yellow-600">
                  <AlertTriangle className="h-5 w-5" />
                  <span className="font-semibold">تأكيد الإرسال</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  سيتم إرسال الإشعار التالي لـ {filteredCount} عميل:
                </p>
                <div className="bg-background p-3 rounded-md space-y-1">
                  <p className="font-semibold">{title}</p>
                  <p className="text-sm text-muted-foreground">{body}</p>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={handleCancel}>
              {confirmStep ? 'رجوع' : 'إلغاء'}
            </Button>
            <Button
              onClick={handleSend}
              disabled={isSending || !title.trim() || !body.trim() || filteredCount === 0}
              className="gap-2"
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {confirmStep ? 'تأكيد الإرسال' : 'متابعة'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
