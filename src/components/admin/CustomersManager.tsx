import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Users,
  Search,
  Edit,
  Trash2,
  RefreshCw,
  Mail,
  Phone,
  Calendar,
  ShoppingCart,
  Star,
  Crown,
  Loader2,
  AlertTriangle,
  User
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface Customer {
  id: string;
  user_id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  referral_code: string | null;
  created_at: string;
  email: string;
  orders_count: number;
  total_spent: number;
  loyalty_points: number;
  tier: string;
}

type TierFilter = 'all' | 'gold' | 'silver' | 'bronze';

export const CustomersManager = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState<TierFilter>('all');
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form state for editing
  const [editForm, setEditForm] = useState({
    full_name: '',
    phone: ''
  });

  // Fetch customers with their stats
  const { data: customers, isLoading, refetch } = useQuery({
    queryKey: ['admin-customers'],
    queryFn: async () => {
      // Get profiles with user emails
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Get auth users for emails
      const userIds = profiles?.map(p => p.user_id) || [];
      
      // Get orders count and total per customer
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('customer_id, total_amount');

      if (ordersError) throw ordersError;

      // Get loyalty points
      const { data: loyaltyData, error: loyaltyError } = await supabase
        .from('loyalty_points')
        .select('user_id, total_points, tier');

      if (loyaltyError) throw loyaltyError;

      // Get emails from auth.users via edge function or direct query
      // Since we can't query auth.users directly, we'll use a workaround
      // by checking if profiles have associated data

      // Build stats maps
      const orderStats = new Map<string, { count: number; total: number }>();
      ordersData?.forEach(order => {
        if (order.customer_id) {
          const current = orderStats.get(order.customer_id) || { count: 0, total: 0 };
          current.count += 1;
          current.total += Number(order.total_amount) || 0;
          orderStats.set(order.customer_id, current);
        }
      });

      const loyaltyMap = new Map(loyaltyData?.map(l => [l.user_id, { points: l.total_points, tier: l.tier }]) || []);

      // We need to get emails - let's query auth.users through a raw query
      // Actually, we can't do that directly, so we'll need to use an alternative approach
      // Let's fetch from a view or use the admin API

      // For now, let's get emails from orders table where available
      const { data: orderEmails } = await supabase
        .from('orders')
        .select('customer_id, customer_email')
        .not('customer_email', 'is', null);

      const emailMap = new Map<string, string>();
      orderEmails?.forEach(o => {
        if (o.customer_id && o.customer_email) {
          emailMap.set(o.customer_id, o.customer_email);
        }
      });

      // Build customers list
      const customersList: Customer[] = profiles?.map(profile => {
        const stats = orderStats.get(profile.user_id) || { count: 0, total: 0 };
        const loyalty = loyaltyMap.get(profile.user_id) || { points: 0, tier: 'bronze' };
        
        return {
          id: profile.id,
          user_id: profile.user_id,
          full_name: profile.full_name,
          phone: profile.phone,
          avatar_url: profile.avatar_url,
          referral_code: profile.referral_code,
          created_at: profile.created_at,
          email: emailMap.get(profile.user_id) || '',
          orders_count: stats.count,
          total_spent: stats.total,
          loyalty_points: loyalty.points,
          tier: loyalty.tier
        };
      }) || [];

      return customersList;
    }
  });

  // Update customer mutation
  const updateCustomerMutation = useMutation({
    mutationFn: async ({ userId, data }: { userId: string; data: { full_name: string; phone: string } }) => {
      setIsSaving(true);
      
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: data.full_name,
          phone: data.phone,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-customers'] });
      toast.success('تم تحديث بيانات العميل بنجاح');
      setEditingCustomer(null);
      setIsSaving(false);
    },
    onError: (error: any) => {
      console.error('Update error:', error);
      toast.error('حدث خطأ أثناء تحديث البيانات');
      setIsSaving(false);
    }
  });

  // Delete customer mutation
  const deleteCustomerMutation = useMutation({
    mutationFn: async (customer: Customer) => {
      setIsDeleting(true);
      
      // Delete in order: loyalty_points, points_history, profiles
      // Orders are kept for records
      
      const { error: loyaltyError } = await supabase
        .from('loyalty_points')
        .delete()
        .eq('user_id', customer.user_id);

      if (loyaltyError) console.error('Loyalty delete error:', loyaltyError);

      const { error: pointsHistoryError } = await supabase
        .from('points_history')
        .delete()
        .eq('user_id', customer.user_id);

      if (pointsHistoryError) console.error('Points history delete error:', pointsHistoryError);

      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', customer.user_id);

      if (profileError) throw profileError;

      // Note: We cannot delete from auth.users directly
      // The admin needs to do this from the backend panel
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-customers'] });
      toast.success('تم حذف بيانات العميل. يرجى حذف حساب المصادقة من لوحة Backend');
      setCustomerToDelete(null);
      setIsDeleting(false);
    },
    onError: (error: any) => {
      console.error('Delete error:', error);
      toast.error('حدث خطأ أثناء حذف العميل');
      setIsDeleting(false);
    }
  });

  const handleEdit = (customer: Customer) => {
    setEditForm({
      full_name: customer.full_name || '',
      phone: customer.phone || ''
    });
    setEditingCustomer(customer);
  };

  const handleSave = () => {
    if (!editingCustomer) return;
    updateCustomerMutation.mutate({
      userId: editingCustomer.user_id,
      data: editForm
    });
  };

  const handleDelete = () => {
    if (!customerToDelete) return;
    deleteCustomerMutation.mutate(customerToDelete);
  };

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'gold':
        return <Badge className="bg-yellow-500"><Crown className="h-3 w-3 ml-1" />ذهبي</Badge>;
      case 'silver':
        return <Badge className="bg-gray-400"><Star className="h-3 w-3 ml-1" />فضي</Badge>;
      default:
        return <Badge variant="outline"><Star className="h-3 w-3 ml-1" />برونزي</Badge>;
    }
  };

  const filteredCustomers = customers?.filter(c => {
    const matchesSearch = 
      c.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone?.includes(searchTerm);
    
    const matchesTier = tierFilter === 'all' || c.tier === tierFilter;
    
    return matchesSearch && matchesTier;
  });

  const stats = {
    total: customers?.length || 0,
    withOrders: customers?.filter(c => c.orders_count > 0).length || 0,
    goldMembers: customers?.filter(c => c.tier === 'gold').length || 0,
    totalRevenue: customers?.reduce((sum, c) => sum + c.total_spent, 0) || 0
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
            <Users className="h-5 w-5 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">إجمالي العملاء</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <ShoppingCart className="h-5 w-5 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-600">{stats.withOrders}</p>
            <p className="text-xs text-muted-foreground">عملاء لديهم طلبات</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Crown className="h-5 w-5 text-yellow-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-yellow-600">{stats.goldMembers}</p>
            <p className="text-xs text-muted-foreground">أعضاء ذهبيين</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Star className="h-5 w-5 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-purple-600">{stats.totalRevenue.toFixed(0)}</p>
            <p className="text-xs text-muted-foreground">إجمالي المبيعات (ر.س)</p>
          </CardContent>
        </Card>
      </div>

      {/* Search, Filter and Refresh */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="البحث بالاسم أو البريد الإلكتروني أو رقم الهاتف..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
              <Button variant="outline" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4 ml-2" />
                تحديث
              </Button>
            </div>
            
            {/* Tier Filter Buttons */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant={tierFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTierFilter('all')}
              >
                <Users className="h-4 w-4 ml-1" />
                الكل ({customers?.length || 0})
              </Button>
              <Button
                variant={tierFilter === 'gold' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTierFilter('gold')}
                className={tierFilter === 'gold' ? 'bg-yellow-500 hover:bg-yellow-600' : ''}
              >
                <Crown className="h-4 w-4 ml-1" />
                ذهبي ({customers?.filter(c => c.tier === 'gold').length || 0})
              </Button>
              <Button
                variant={tierFilter === 'silver' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTierFilter('silver')}
                className={tierFilter === 'silver' ? 'bg-gray-400 hover:bg-gray-500' : ''}
              >
                <Star className="h-4 w-4 ml-1" />
                فضي ({customers?.filter(c => c.tier === 'silver').length || 0})
              </Button>
              <Button
                variant={tierFilter === 'bronze' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTierFilter('bronze')}
              >
                <Star className="h-4 w-4 ml-1" />
                برونزي ({customers?.filter(c => c.tier === 'bronze').length || 0})
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            قائمة العملاء ({filteredCustomers?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            {filteredCustomers?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>لا يوجد عملاء</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">العميل</TableHead>
                    <TableHead className="text-right">التواصل</TableHead>
                    <TableHead className="text-right">الطلبات</TableHead>
                    <TableHead className="text-right">المستوى</TableHead>
                    <TableHead className="text-right">تاريخ التسجيل</TableHead>
                    <TableHead className="text-right">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers?.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                            {customer.avatar_url ? (
                              <img src={customer.avatar_url} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <User className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{customer.full_name || 'بدون اسم'}</p>
                            <p className="text-xs text-muted-foreground">{customer.referral_code}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {customer.email && (
                            <div className="flex items-center gap-1 text-sm">
                              <Mail className="h-3 w-3 text-muted-foreground" />
                              <span dir="ltr">{customer.email}</span>
                            </div>
                          )}
                          {customer.phone && (
                            <div className="flex items-center gap-1 text-sm">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              <span dir="ltr">{customer.phone}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-center">
                          <p className="font-bold text-lg">{customer.orders_count}</p>
                          <p className="text-xs text-muted-foreground">{customer.total_spent.toFixed(0)} ر.س</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col items-start gap-1">
                          {getTierBadge(customer.tier)}
                          <span className="text-xs text-muted-foreground">{customer.loyalty_points} نقطة</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(customer.created_at), 'dd MMM yyyy', { locale: ar })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(customer)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setCustomerToDelete(customer)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingCustomer} onOpenChange={() => setEditingCustomer(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تعديل بيانات العميل</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>الاسم الكامل</Label>
              <Input
                value={editForm.full_name}
                onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                placeholder="أدخل الاسم"
              />
            </div>
            <div className="space-y-2">
              <Label>رقم الهاتف</Label>
              <Input
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                placeholder="05xxxxxxxx"
                dir="ltr"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingCustomer(null)}>
              إلغاء
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                  جاري الحفظ...
                </>
              ) : (
                'حفظ التغييرات'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!customerToDelete} onOpenChange={() => setCustomerToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              تأكيد حذف العميل
            </AlertDialogTitle>
            <AlertDialogDescription className="text-right">
              هل أنت متأكد من حذف العميل <strong>{customerToDelete?.full_name || customerToDelete?.email}</strong>؟
              <br />
              سيتم حذف بياناته ونقاط الولاء الخاصة به.
              <br />
              <span className="text-destructive">هذا الإجراء لا يمكن التراجع عنه.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                  جاري الحذف...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 ml-2" />
                  حذف العميل
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CustomersManager;
