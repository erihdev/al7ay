import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Bell, Send, Loader2, Users, AlertTriangle } from 'lucide-react';

interface BulkNotificationDialogProps {
  totalCustomers: number;
}

export function BulkNotificationDialog({ totalCustomers }: BulkNotificationDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [confirmStep, setConfirmStep] = useState(false);

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
          message: body.trim()
        }
      });

      if (error) throw error;

      toast.success(`تم إرسال الإشعار لـ ${data?.sentCount || totalCustomers} عميل`);
      setTitle('');
      setBody('');
      setConfirmStep(false);
      setOpen(false);
    } catch (error) {
      console.error('Error sending bulk notification:', error);
      toast.error('فشل في إرسال الإشعار');
    } finally {
      setIsSending(false);
    }
  };

  const handleCancel = () => {
    if (confirmStep) {
      setConfirmStep(false);
    } else {
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) {
        setTitle('');
        setBody('');
        setConfirmStep(false);
      }
    }}>
      <DialogTrigger asChild>
        <Button variant="default" className="gap-2">
          <Bell className="h-4 w-4" />
          إرسال إشعار جماعي
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            إرسال إشعار جماعي
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Card className="bg-blue-500/5 border-blue-500/20">
            <CardContent className="p-3 flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-blue-600">{totalCustomers}</p>
                <p className="text-xs text-muted-foreground">عميل سيستلم الإشعار</p>
              </div>
            </CardContent>
          </Card>

          {!confirmStep ? (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">عنوان الإشعار</label>
                <Input
                  placeholder="مثال: عرض خاص لك!"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={100}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">محتوى الإشعار</label>
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
                  سيتم إرسال الإشعار التالي لجميع العملاء ({totalCustomers} عميل):
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
              disabled={isSending || !title.trim() || !body.trim()}
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
