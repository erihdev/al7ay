import { useState, useRef, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { FileText, PenTool, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const CONTRACT_TYPE_LABELS: Record<string, string> = {
  full_time: 'دوام كامل',
  part_time: 'دوام جزئي',
  contract: 'عقد مؤقت',
};

interface JobPosition {
  id: string;
  title_ar: string;
  title_en: string | null;
  description_ar: string | null;
  duties: string[];
}

interface EmployeeContract {
  id: string;
  employee_id: string;
  position_id: string;
  contract_number: string;
  start_date: string;
  end_date: string | null;
  salary: number;
  contract_type: string;
  duties: string[];
  terms_ar: string | null;
  employee_signature: string | null;
  employee_signed_at: string | null;
  admin_signature: string | null;
  admin_signed_at: string | null;
  status: string;
  signing_token: string | null;
  signing_token_expires_at: string | null;
  job_positions?: JobPosition;
}

export default function SignContract() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  
  const signatureCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  // Fetch contract by token
  const { data: contract, isLoading, error } = useQuery({
    queryKey: ['contract-by-token', token],
    queryFn: async () => {
      if (!token) throw new Error('رابط غير صالح');
      
      const { data, error } = await supabase
        .from('employee_contracts')
        .select('*, job_positions(*)')
        .eq('signing_token', token)
        .gt('signing_token_expires_at', new Date().toISOString())
        .single();
      
      if (error) throw new Error('العقد غير موجود أو انتهت صلاحية الرابط');
      return data as EmployeeContract;
    },
    enabled: !!token,
  });

  // Sign contract mutation
  const signContract = useMutation({
    mutationFn: async (signatureData: string) => {
      if (!contract) throw new Error('العقد غير موجود');
      
      const updates: Record<string, any> = {
        employee_signature: signatureData,
        employee_signed_at: new Date().toISOString(),
      };
      
      // If admin already signed, activate contract
      if (contract.admin_signature) {
        updates.status = 'active';
        updates.signing_token = null;
        updates.signing_token_expires_at = null;
      }
      
      const { error } = await supabase
        .from('employee_contracts')
        .update(updates)
        .eq('signing_token', token);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('تم توقيع العقد بنجاح! شكراً لك.');
      setTimeout(() => navigate('/'), 2000);
    },
    onError: (error: any) => {
      toast.error(error.message || 'حدث خطأ أثناء التوقيع');
    },
  });

  // Signature canvas handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    
    setIsDrawing(true);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.nativeEvent.offsetX;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.nativeEvent.offsetY;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.nativeEvent.offsetX;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.nativeEvent.offsetY;
    
    ctx.lineTo(x, y);
    ctx.strokeStyle = '#1f2937';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleSign = () => {
    const canvas = signatureCanvasRef.current;
    if (!canvas || !hasSignature) {
      toast.error('يرجى رسم توقيعك أولاً');
      return;
    }
    const signatureData = canvas.toDataURL();
    signContract.mutate(signatureData);
  };

  // Prevent touch scrolling on canvas
  useEffect(() => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    
    const preventScroll = (e: TouchEvent) => {
      if (e.target === canvas) {
        e.preventDefault();
      }
    };
    
    document.addEventListener('touchmove', preventScroll, { passive: false });
    return () => document.removeEventListener('touchmove', preventScroll);
  }, []);

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">رابط غير صالح</h2>
            <p className="text-muted-foreground">يرجى التأكد من صحة الرابط المرسل إليك.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-2xl w-full">
          <CardContent className="p-8">
            <Skeleton className="h-64" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <Clock className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">انتهت صلاحية الرابط</h2>
            <p className="text-muted-foreground">هذا الرابط لم يعد صالحاً. يرجى التواصل مع الإدارة للحصول على رابط جديد.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (contract.employee_signature) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">تم توقيع العقد مسبقاً</h2>
            <p className="text-muted-foreground">شكراً لك، لقد تم توقيع هذا العقد بالفعل.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 py-8" dir="rtl">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <FileText className="h-12 w-12 text-primary mx-auto mb-4" />
          <h1 className="text-2xl font-bold">عقد العمل الإلكتروني</h1>
          <p className="text-muted-foreground">رقم العقد: {contract.contract_number}</p>
        </div>

        {/* Contract Details */}
        <Card>
          <CardHeader>
            <CardTitle>تفاصيل العقد</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-6 p-2">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">المسمى الوظيفي</p>
                    <p className="font-semibold">{contract.job_positions?.title_ar}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">نوع العقد</p>
                    <p className="font-semibold">{CONTRACT_TYPE_LABELS[contract.contract_type]}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">الراتب الشهري</p>
                    <p className="font-semibold">{contract.salary.toLocaleString()} ر.س</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">تاريخ البدء</p>
                    <p className="font-semibold">{format(new Date(contract.start_date), 'dd MMMM yyyy', { locale: ar })}</p>
                  </div>
                  {contract.end_date && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">تاريخ الانتهاء</p>
                      <p className="font-semibold">{format(new Date(contract.end_date), 'dd MMMM yyyy', { locale: ar })}</p>
                    </div>
                  )}
                </div>

                {/* Job Description */}
                {contract.job_positions?.description_ar && (
                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-2">الوصف الوظيفي</h4>
                    <p className="text-muted-foreground">{contract.job_positions.description_ar}</p>
                  </div>
                )}

                {/* Duties */}
                {contract.duties && contract.duties.length > 0 && (
                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-2">المهام والمسؤوليات</h4>
                    <ul className="list-decimal list-inside space-y-2 text-muted-foreground">
                      {contract.duties.map((duty, i) => (
                        <li key={i}>{duty}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Additional Terms */}
                {contract.terms_ar && (
                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-2">شروط إضافية</h4>
                    <p className="text-muted-foreground whitespace-pre-wrap">{contract.terms_ar}</p>
                  </div>
                )}

                {/* Admin Signature */}
                {contract.admin_signature && (
                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-2">توقيع الإدارة</h4>
                    <div className="flex items-center gap-3">
                      <img src={contract.admin_signature} alt="توقيع الإدارة" className="h-16 border rounded" />
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm">تم التوقيع</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Signature Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PenTool className="h-5 w-5" />
              توقيعك الإلكتروني
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              بتوقيعك أدناه، فإنك توافق على جميع شروط وأحكام هذا العقد.
            </p>
            
            <div className="border-2 border-dashed rounded-lg p-2 bg-muted/20">
              <canvas
                ref={signatureCanvasRef}
                width={500}
                height={150}
                className="w-full bg-white rounded cursor-crosshair touch-none"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
            </div>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={clearSignature}
                className="flex-1"
              >
                مسح التوقيع
              </Button>
              <Button
                onClick={handleSign}
                disabled={!hasSignature || signContract.isPending}
                className="flex-1"
              >
                {signContract.isPending ? 'جاري التوقيع...' : '✍️ توقيع العقد'}
              </Button>
            </div>
            
            <p className="text-xs text-center text-muted-foreground">
              هذا التوقيع الإلكتروني له نفس القوة القانونية للتوقيع الخطي
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
