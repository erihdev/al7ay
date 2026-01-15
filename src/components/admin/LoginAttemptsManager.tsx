import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Clock,
  Mail,
  Globe,
  Monitor
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface LoginAttempt {
  id: string;
  email: string;
  ip_address: string | null;
  user_agent: string | null;
  attempt_type: string;
  success: boolean;
  error_message: string | null;
  created_at: string;
}

export const LoginAttemptsManager = () => {
  const { data: attempts, isLoading } = useQuery({
    queryKey: ['login-attempts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('login_attempts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data as LoginAttempt[];
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const getAttemptTypeLabel = (type: string) => {
    switch (type) {
      case 'failed_login':
        return { label: 'فشل تسجيل الدخول', color: 'bg-red-500' };
      case 'unauthorized_access':
        return { label: 'وصول غير مصرح', color: 'bg-orange-500' };
      case 'blocked':
        return { label: 'محظور', color: 'bg-destructive' };
      case 'success':
        return { label: 'ناجح', color: 'bg-green-500' };
      default:
        return { label: type, color: 'bg-muted' };
    }
  };

  const failedCount = attempts?.filter(a => !a.success).length || 0;
  const successCount = attempts?.filter(a => a.success).length || 0;
  const uniqueEmails = new Set(attempts?.filter(a => !a.success).map(a => a.email)).size;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
              <XCircle className="h-6 w-6 text-red-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">محاولات فاشلة</p>
              <p className="text-2xl font-bold">{failedCount}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
              <CheckCircle className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">محاولات ناجحة</p>
              <p className="text-2xl font-bold">{successCount}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-full">
              <AlertTriangle className="h-6 w-6 text-orange-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">حسابات مستهدفة</p>
              <p className="text-2xl font-bold">{uniqueEmails}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attempts List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            سجل محاولات الدخول (آخر 100)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            {!attempts || attempts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>لا توجد محاولات دخول مسجلة</p>
              </div>
            ) : (
              <div className="space-y-3">
                {attempts.map((attempt) => {
                  const typeInfo = getAttemptTypeLabel(attempt.attempt_type);
                  
                  return (
                    <div
                      key={attempt.id}
                      className={`p-4 rounded-lg border ${
                        attempt.success 
                          ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800' 
                          : 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {attempt.success ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                          <Badge className={`${typeInfo.color} text-white`}>
                            {typeInfo.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {format(new Date(attempt.created_at), 'dd MMM yyyy - hh:mm a', {
                            locale: ar,
                          })}
                        </div>
                      </div>
                      
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="font-mono" dir="ltr">{attempt.email}</span>
                        </div>
                        
                        {attempt.ip_address && (
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4 text-muted-foreground" />
                            <span className="font-mono" dir="ltr">{attempt.ip_address}</span>
                          </div>
                        )}
                        
                        {attempt.user_agent && (
                          <div className="flex items-center gap-2">
                            <Monitor className="h-4 w-4 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground truncate max-w-md" dir="ltr">
                              {attempt.user_agent.slice(0, 80)}...
                            </span>
                          </div>
                        )}
                        
                        {attempt.error_message && (
                          <div className="mt-2 p-2 bg-background rounded text-xs text-muted-foreground">
                            {attempt.error_message}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};