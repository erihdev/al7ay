import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
} from '@/components/ui/dialog';
import { 
  CheckCircle2, 
  Clock, 
  Search,
  UserCheck,
  Store,
  ShieldCheck,
  Loader2,
  RefreshCw,
  Package,
  ShoppingCart,
  TrendingUp,
  Eye,
  BarChart3
} from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';

interface ProviderStats {
  providerId: string;
  productsCount: number;
  ordersCount: number;
  totalRevenue: number;
  pendingOrders: number;
  completedOrders: number;
}

interface RegisteredProvider {
  id: string;
  email: string;
  created_at: string;
  raw_user_meta_data: {
    full_name?: string;
  };
  hasRole: boolean;
  hasProfile: boolean;
  applicationId?: string;
  businessName?: string;
  phone?: string;
  neighborhood?: string;
  stats?: ProviderStats;
}

const RegisteredProvidersManager = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<RegisteredProvider | null>(null);
  const [activatingId, setActivatingId] = useState<string | null>(null);

  // Fetch service providers with detailed stats
  const { data: providers, isLoading, refetch } = useQuery({
    queryKey: ['registered-providers-with-stats'],
    queryFn: async () => {
      // Get all service providers with their details
      const { data: serviceProviders, error: spError } = await supabase
        .from('service_providers')
        .select('id, user_id, business_name, email, phone, is_active, is_verified, neighborhood_id, created_at');

      if (spError) throw spError;

      // Get all approved applications for additional info
      const { data: applications, error: appError } = await supabase
        .from('service_provider_applications')
        .select('id, email, full_name, business_name, phone, neighborhood')
        .eq('status', 'approved');

      if (appError) throw appError;

      // Get all service provider roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'service_provider');

      if (rolesError) throw rolesError;

      // Get user profiles
      const { data: userProfiles, error: userProfilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name');

      if (userProfilesError) throw userProfilesError;

      // Get products count per provider
      const { data: products, error: productsError } = await supabase
        .from('provider_products')
        .select('provider_id');

      if (productsError) throw productsError;

      // Get orders with amounts per provider
      const { data: orders, error: ordersError } = await supabase
        .from('provider_orders')
        .select('provider_id, status, total_amount');

      if (ordersError) throw ordersError;

      // Get neighborhoods
      const { data: neighborhoods, error: neighborhoodsError } = await supabase
        .from('active_neighborhoods')
        .select('id, name');

      if (neighborhoodsError) throw neighborhoodsError;

      const roleUserIds = new Set(roles?.map(r => r.user_id) || []);
      const userProfileMap = new Map(userProfiles?.map(p => [p.user_id, p]) || []);
      const neighborhoodMap = new Map(neighborhoods?.map(n => [n.id, n.name]) || []);
      const applicationMap = new Map(applications?.map(a => [a.email.toLowerCase(), a]) || []);

      // Calculate stats per provider
      const productsByProvider = new Map<string, number>();
      products?.forEach(p => {
        productsByProvider.set(p.provider_id, (productsByProvider.get(p.provider_id) || 0) + 1);
      });

      const orderStatsByProvider = new Map<string, { count: number; revenue: number; pending: number; completed: number }>();
      orders?.forEach(o => {
        const current = orderStatsByProvider.get(o.provider_id) || { count: 0, revenue: 0, pending: 0, completed: 0 };
        current.count += 1;
        current.revenue += Number(o.total_amount) || 0;
        if (o.status === 'pending') current.pending += 1;
        if (o.status === 'completed' || o.status === 'delivered') current.completed += 1;
        orderStatsByProvider.set(o.provider_id, current);
      });

      // Build registered providers list
      const registeredProviders: RegisteredProvider[] = [];

      // First, add all service providers from the service_providers table
      for (const sp of serviceProviders || []) {
        const userProfile = userProfileMap.get(sp.user_id);
        const application = applicationMap.get(sp.email?.toLowerCase() || '');
        const orderStats = orderStatsByProvider.get(sp.id) || { count: 0, revenue: 0, pending: 0, completed: 0 };
        
        registeredProviders.push({
          id: sp.user_id,
          email: sp.email || application?.email || '',
          created_at: sp.created_at,
          raw_user_meta_data: {
            full_name: userProfile?.full_name || application?.full_name || ''
          },
          hasRole: roleUserIds.has(sp.user_id),
          hasProfile: true,
          applicationId: application?.id,
          businessName: sp.business_name || application?.business_name,
          phone: sp.phone || application?.phone,
          neighborhood: sp.neighborhood_id ? neighborhoodMap.get(sp.neighborhood_id) : application?.neighborhood,
          stats: {
            providerId: sp.id,
            productsCount: productsByProvider.get(sp.id) || 0,
            ordersCount: orderStats.count,
            totalRevenue: orderStats.revenue,
            pendingOrders: orderStats.pending,
            completedOrders: orderStats.completed
          }
        });
      }

      // Add approved applications that don't have a service provider yet
      for (const app of applications || []) {
        const existingProvider = registeredProviders.find(p => p.email.toLowerCase() === app.email.toLowerCase());
        if (!existingProvider) {
          const matchingProfile = userProfiles?.find(up => {
            const fullName = up.full_name?.toLowerCase() || '';
            return fullName === app.full_name.toLowerCase();
          });

          if (matchingProfile) {
            registeredProviders.push({
              id: matchingProfile.user_id,
              email: app.email,
              created_at: new Date().toISOString(),
              raw_user_meta_data: {
                full_name: matchingProfile.full_name || app.full_name
              },
              hasRole: roleUserIds.has(matchingProfile.user_id),
              hasProfile: false,
              applicationId: app.id,
              businessName: app.business_name,
              phone: app.phone,
              neighborhood: app.neighborhood
            });
          }
        }
      }

      return registeredProviders;
    }
  });

  const activateProviderMutation = useMutation({
    mutationFn: async (provider: RegisteredProvider) => {
      setActivatingId(provider.id);
      
      const { data, error } = await supabase.functions.invoke('setup-provider', {
        body: {
          userId: provider.id,
          email: provider.email,
          fullName: provider.raw_user_meta_data.full_name || '',
          applicationId: provider.applicationId
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['registered-providers-with-stats'] });
      toast.success('تم تفعيل حساب مقدم الخدمة بنجاح');
      setSelectedProvider(null);
      setActivatingId(null);
    },
    onError: (error: any) => {
      console.error('Activation error:', error);
      toast.error('حدث خطأ أثناء تفعيل الحساب');
      setActivatingId(null);
    }
  });

  const filteredProviders = providers?.filter(p =>
    p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.raw_user_meta_data.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.businessName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.neighborhood?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: providers?.length || 0,
    active: providers?.filter(p => p.hasRole && p.hasProfile).length || 0,
    pending: providers?.filter(p => !p.hasRole || !p.hasProfile).length || 0,
    totalProducts: providers?.reduce((sum, p) => sum + (p.stats?.productsCount || 0), 0) || 0,
    totalOrders: providers?.reduce((sum, p) => sum + (p.stats?.ordersCount || 0), 0) || 0,
    totalRevenue: providers?.reduce((sum, p) => sum + (p.stats?.totalRevenue || 0), 0) || 0
  };

  const getStatusBadge = (provider: RegisteredProvider) => {
    if (provider.hasRole && provider.hasProfile) {
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <ShieldCheck className="h-3 w-3 ml-1" />
          مفعّل
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
        <Clock className="h-3 w-3 ml-1" />
        بانتظار التفعيل
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Store className="h-5 w-5 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">إجمالي المسجلين</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <ShieldCheck className="h-5 w-5 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            <p className="text-xs text-muted-foreground">حسابات مفعّلة</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="h-5 w-5 text-yellow-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            <p className="text-xs text-muted-foreground">بانتظار التفعيل</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Package className="h-5 w-5 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-600">{stats.totalProducts}</p>
            <p className="text-xs text-muted-foreground">إجمالي المنتجات</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <ShoppingCart className="h-5 w-5 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-purple-600">{stats.totalOrders}</p>
            <p className="text-xs text-muted-foreground">إجمالي الطلبات</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-5 w-5 text-emerald-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-emerald-600">{stats.totalRevenue.toFixed(0)}</p>
            <p className="text-xs text-muted-foreground">الإيرادات (ر.س)</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Refresh */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="البحث بالاسم أو البريد الإلكتروني أو اسم النشاط أو الحي..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10 font-arabic"
              />
            </div>
            <Button variant="outline" onClick={() => refetch()} className="font-arabic">
              <RefreshCw className="h-4 w-4 ml-2" />
              تحديث
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Providers Table */}
      <Card>
        <CardHeader>
          <CardTitle className="font-arabic flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            مقدمي الخدمات المسجلين
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredProviders?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              لا يوجد مقدمي خدمات مسجلين
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right font-arabic">اسم النشاط</TableHead>
                    <TableHead className="text-right font-arabic">الحي</TableHead>
                    <TableHead className="text-right font-arabic">المنتجات</TableHead>
                    <TableHead className="text-right font-arabic">الطلبات</TableHead>
                    <TableHead className="text-right font-arabic">الإيرادات</TableHead>
                    <TableHead className="text-right font-arabic">الحالة</TableHead>
                    <TableHead className="text-right font-arabic">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProviders?.map((provider) => (
                    <TableRow key={provider.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{provider.businessName || '-'}</p>
                          <p className="text-xs text-muted-foreground">{provider.raw_user_meta_data.full_name}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{provider.neighborhood || '-'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-blue-600" />
                          <span className="font-medium">{provider.stats?.productsCount || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <ShoppingCart className="h-4 w-4 text-purple-600" />
                          <span className="font-medium">{provider.stats?.ordersCount || 0}</span>
                          {(provider.stats?.pendingOrders || 0) > 0 && (
                            <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700">
                              {provider.stats?.pendingOrders} قيد الانتظار
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span className="font-medium text-emerald-600">
                            {(provider.stats?.totalRevenue || 0).toFixed(0)}
                          </span>
                          <span className="text-xs text-muted-foreground">ر.س</span>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(provider)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {provider.hasRole && provider.hasProfile && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="font-arabic"
                              onClick={() => setSelectedProvider(provider)}
                            >
                              <Eye className="h-4 w-4 ml-1" />
                              تفاصيل
                            </Button>
                          )}
                          {(!provider.hasRole || !provider.hasProfile) && (
                            <Button
                              size="sm"
                              className="font-arabic bg-green-600 hover:bg-green-700"
                              onClick={() => activateProviderMutation.mutate(provider)}
                              disabled={activatingId === provider.id}
                            >
                              {activatingId === provider.id ? (
                                <>
                                  <Loader2 className="h-4 w-4 ml-1 animate-spin" />
                                  جاري التفعيل...
                                </>
                              ) : (
                                <>
                                  <ShieldCheck className="h-4 w-4 ml-1" />
                                  تفعيل
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Provider Details Dialog */}
      <Dialog open={!!selectedProvider} onOpenChange={() => setSelectedProvider(null)}>
        <DialogContent className="max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="font-arabic flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              إحصائيات {selectedProvider?.businessName}
            </DialogTitle>
          </DialogHeader>
          
          {selectedProvider && (
            <div className="space-y-6">
              {/* Provider Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">اسم المالك</p>
                  <p className="font-medium">{selectedProvider.raw_user_meta_data.full_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">الحي</p>
                  <p className="font-medium">{selectedProvider.neighborhood || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">البريد الإلكتروني</p>
                  <p className="font-medium text-sm" dir="ltr">{selectedProvider.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">الهاتف</p>
                  <p className="font-medium" dir="ltr">{selectedProvider.phone || '-'}</p>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <Package className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                    <p className="text-3xl font-bold text-blue-600">{selectedProvider.stats?.productsCount || 0}</p>
                    <p className="text-sm text-muted-foreground">المنتجات</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <ShoppingCart className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                    <p className="text-3xl font-bold text-purple-600">{selectedProvider.stats?.ordersCount || 0}</p>
                    <p className="text-sm text-muted-foreground">الطلبات</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <CheckCircle2 className="h-6 w-6 text-green-600 mx-auto mb-2" />
                    <p className="text-3xl font-bold text-green-600">{selectedProvider.stats?.completedOrders || 0}</p>
                    <p className="text-sm text-muted-foreground">مكتملة</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <TrendingUp className="h-6 w-6 text-emerald-600 mx-auto mb-2" />
                    <p className="text-3xl font-bold text-emerald-600">{(selectedProvider.stats?.totalRevenue || 0).toFixed(0)}</p>
                    <p className="text-sm text-muted-foreground">الإيرادات (ر.س)</p>
                  </CardContent>
                </Card>
              </div>

              {/* Orders Progress */}
              {(selectedProvider.stats?.ordersCount || 0) > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">نسبة الطلبات المكتملة</span>
                    <span className="font-medium">
                      {Math.round(((selectedProvider.stats?.completedOrders || 0) / (selectedProvider.stats?.ordersCount || 1)) * 100)}%
                    </span>
                  </div>
                  <Progress 
                    value={((selectedProvider.stats?.completedOrders || 0) / (selectedProvider.stats?.ordersCount || 1)) * 100} 
                    className="h-2"
                  />
                </div>
              )}

              {/* Pending Orders Alert */}
              {(selectedProvider.stats?.pendingOrders || 0) > 0 && (
                <div className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <Clock className="h-5 w-5 text-yellow-600" />
                  <div>
                    <p className="font-medium text-yellow-800">طلبات قيد الانتظار</p>
                    <p className="text-sm text-yellow-700">
                      يوجد {selectedProvider.stats?.pendingOrders} طلب بانتظار المعالجة
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RegisteredProvidersManager;
