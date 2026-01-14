import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Eye, 
  MapPin,
  Phone,
  Mail,
  Store,
  User,
  Calendar,
  Search,
  Filter
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Application {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  business_name: string;
  neighborhood: string;
  status: string;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  reviewed_at: string | null;
}

const ApplicationsManager = () => {
  const queryClient = useQueryClient();
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: applications, isLoading } = useQuery({
    queryKey: ['service-provider-applications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_provider_applications')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Application[];
    }
  });

  const updateApplicationMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      const { error } = await supabase
        .from('service_provider_applications')
        .update({
          status,
          admin_notes: notes || null,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-provider-applications'] });
      setSelectedApplication(null);
      setAdminNotes('');
    }
  });

  const handleApprove = (application: Application) => {
    updateApplicationMutation.mutate(
      { id: application.id, status: 'approved', notes: adminNotes },
      {
        onSuccess: () => {
          toast.success(`تم قبول طلب ${application.full_name}`);
        },
        onError: () => {
          toast.error('حدث خطأ أثناء تحديث الطلب');
        }
      }
    );
  };

  const handleReject = (application: Application) => {
    updateApplicationMutation.mutate(
      { id: application.id, status: 'rejected', notes: adminNotes },
      {
        onSuccess: () => {
          toast.success(`تم رفض طلب ${application.full_name}`);
        },
        onError: () => {
          toast.error('حدث خطأ أثناء تحديث الطلب');
        }
      }
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200"><Clock className="h-3 w-3 ml-1" />قيد المراجعة</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><CheckCircle2 className="h-3 w-3 ml-1" />مقبول</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200"><XCircle className="h-3 w-3 ml-1" />مرفوض</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredApplications = applications?.filter(app => {
    const matchesSearch = 
      app.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.business_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.neighborhood.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: applications?.length || 0,
    pending: applications?.filter(a => a.status === 'pending').length || 0,
    approved: applications?.filter(a => a.status === 'approved').length || 0,
    rejected: applications?.filter(a => a.status === 'rejected').length || 0
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold">{stats.total}</p>
            <p className="text-sm text-muted-foreground">إجمالي الطلبات</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
            <p className="text-sm text-muted-foreground">قيد المراجعة</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-green-600">{stats.approved}</p>
            <p className="text-sm text-muted-foreground">مقبول</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-red-600">{stats.rejected}</p>
            <p className="text-sm text-muted-foreground">مرفوض</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="البحث بالاسم أو النشاط أو الحي..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10 font-arabic"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48 font-arabic">
                <Filter className="h-4 w-4 ml-2" />
                <SelectValue placeholder="تصفية حسب الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="font-arabic">جميع الحالات</SelectItem>
                <SelectItem value="pending" className="font-arabic">قيد المراجعة</SelectItem>
                <SelectItem value="approved" className="font-arabic">مقبول</SelectItem>
                <SelectItem value="rejected" className="font-arabic">مرفوض</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Applications List */}
      <div className="space-y-4">
        {filteredApplications?.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">لا توجد طلبات</p>
            </CardContent>
          </Card>
        ) : (
          filteredApplications?.map((application) => (
            <Card key={application.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="font-bold text-lg">{application.business_name}</h3>
                      {getStatusBadge(application.status)}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        <span>{application.full_name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span>{application.neighborhood}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Phone className="h-4 w-4" />
                        <span dir="ltr">{application.phone}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{format(new Date(application.created_at), 'dd MMM yyyy', { locale: ar })}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedApplication(application);
                        setAdminNotes(application.admin_notes || '');
                      }}
                      className="font-arabic"
                    >
                      <Eye className="h-4 w-4 ml-1" />
                      عرض
                    </Button>
                    {application.status === 'pending' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-green-600 hover:bg-green-50 font-arabic"
                          onClick={() => {
                            setSelectedApplication(application);
                            handleApprove(application);
                          }}
                        >
                          <CheckCircle2 className="h-4 w-4 ml-1" />
                          قبول
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:bg-red-50 font-arabic"
                          onClick={() => {
                            setSelectedApplication(application);
                            handleReject(application);
                          }}
                        >
                          <XCircle className="h-4 w-4 ml-1" />
                          رفض
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Application Details Dialog */}
      <Dialog open={!!selectedApplication} onOpenChange={() => setSelectedApplication(null)}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle className="font-arabic">تفاصيل الطلب</DialogTitle>
            <DialogDescription className="font-arabic">
              معلومات طلب الانضمام
            </DialogDescription>
          </DialogHeader>
          
          {selectedApplication && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">اسم النشاط</p>
                  <p className="font-medium flex items-center gap-1">
                    <Store className="h-4 w-4" />
                    {selectedApplication.business_name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">الحالة</p>
                  {getStatusBadge(selectedApplication.status)}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">الاسم الكامل</p>
                  <p className="font-medium flex items-center gap-1">
                    <User className="h-4 w-4" />
                    {selectedApplication.full_name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">الحي</p>
                  <p className="font-medium flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {selectedApplication.neighborhood}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">الهاتف</p>
                  <p className="font-medium flex items-center gap-1" dir="ltr">
                    <Phone className="h-4 w-4" />
                    {selectedApplication.phone}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">البريد الإلكتروني</p>
                  <p className="font-medium flex items-center gap-1 text-sm" dir="ltr">
                    <Mail className="h-4 w-4" />
                    {selectedApplication.email}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">تاريخ التقديم</p>
                  <p className="font-medium flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(selectedApplication.created_at), 'dd MMMM yyyy - HH:mm', { locale: ar })}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-muted-foreground font-arabic">ملاحظات المشرف</label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="أضف ملاحظاتك هنا..."
                  className="font-arabic"
                  rows={3}
                />
              </div>

              {selectedApplication.status === 'pending' && (
                <DialogFooter className="gap-2">
                  <Button
                    variant="outline"
                    className="text-red-600 hover:bg-red-50 font-arabic"
                    onClick={() => handleReject(selectedApplication)}
                    disabled={updateApplicationMutation.isPending}
                  >
                    <XCircle className="h-4 w-4 ml-1" />
                    رفض الطلب
                  </Button>
                  <Button
                    className="bg-green-600 hover:bg-green-700 font-arabic"
                    onClick={() => handleApprove(selectedApplication)}
                    disabled={updateApplicationMutation.isPending}
                  >
                    <CheckCircle2 className="h-4 w-4 ml-1" />
                    قبول الطلب
                  </Button>
                </DialogFooter>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ApplicationsManager;
