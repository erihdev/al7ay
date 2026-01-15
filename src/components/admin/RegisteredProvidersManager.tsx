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
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search,
  UserCheck,
  Store,
  Mail,
  Phone,
  Calendar,
  Shield,
  ShieldCheck,
  ShieldX,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';

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
}

const RegisteredProvidersManager = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<RegisteredProvider | null>(null);
  const [activatingId, setActivatingId] = useState<string | null>(null);

  // Fetch users who signed up from approved applications
  const { data: providers, isLoading, refetch } = useQuery({
    queryKey: ['registered-providers'],
    queryFn: async () => {
      // Get all approved applications
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

      // Get all service provider profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('service_providers')
        .select('user_id, business_name, email, phone');

      if (profilesError) throw profilesError;

      // Get profiles table to match emails to user IDs
      const { data: userProfiles, error: userProfilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name');

      if (userProfilesError) throw userProfilesError;

      // Create a map of emails to user info
      const roleUserIds = new Set(roles?.map(r => r.user_id) || []);
      const profileUserIds = new Set(profiles?.map(p => p.user_id) || []);
      const userProfileMap = new Map(userProfiles?.map(p => [p.user_id, p]) || []);

      // For each approved application, check if they have a corresponding user
      const registeredProviders: RegisteredProvider[] = [];

      for (const app of applications || []) {
        // Check if there's a service provider with this email
        const providerProfile = profiles?.find(p => p.email?.toLowerCase() === app.email.toLowerCase());
        
        if (providerProfile) {
          const userProfile = userProfileMap.get(providerProfile.user_id);
          registeredProviders.push({
            id: providerProfile.user_id,
            email: app.email,
            created_at: new Date().toISOString(),
            raw_user_meta_data: {
              full_name: userProfile?.full_name || app.full_name
            },
            hasRole: roleUserIds.has(providerProfile.user_id),
            hasProfile: true,
            applicationId: app.id,
            businessName: app.business_name,
            phone: app.phone
          });
        } else {
          // Check profiles table for users with matching names from applications
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
              hasProfile: profileUserIds.has(matchingProfile.user_id),
              applicationId: app.id,
              businessName: app.business_name,
              phone: app.phone
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
      
      // Call edge function to setup provider
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
      queryClient.invalidateQueries({ queryKey: ['registered-providers'] });
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
    p.businessName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: providers?.length || 0,
    active: providers?.filter(p => p.hasRole && p.hasProfile).length || 0,
    pending: providers?.filter(p => !p.hasRole || !p.hasProfile).length || 0
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
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Store className="h-5 w-5 text-primary" />
            </div>
            <p className="text-3xl font-bold">{stats.total}</p>
            <p className="text-sm text-muted-foreground">إجمالي المسجلين</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <ShieldCheck className="h-5 w-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-green-600">{stats.active}</p>
            <p className="text-sm text-muted-foreground">حسابات مفعّلة</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
            <p className="text-sm text-muted-foreground">بانتظار التفعيل</p>
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
                placeholder="البحث بالاسم أو البريد الإلكتروني أو اسم النشاط..."
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
                    <TableHead className="text-right font-arabic">الاسم</TableHead>
                    <TableHead className="text-right font-arabic">البريد الإلكتروني</TableHead>
                    <TableHead className="text-right font-arabic">الهاتف</TableHead>
                    <TableHead className="text-right font-arabic">الحالة</TableHead>
                    <TableHead className="text-right font-arabic">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProviders?.map((provider) => (
                    <TableRow key={provider.id}>
                      <TableCell className="font-medium">{provider.businessName || '-'}</TableCell>
                      <TableCell>{provider.raw_user_meta_data.full_name || '-'}</TableCell>
                      <TableCell dir="ltr" className="text-left">{provider.email}</TableCell>
                      <TableCell dir="ltr" className="text-left">{provider.phone || '-'}</TableCell>
                      <TableCell>{getStatusBadge(provider)}</TableCell>
                      <TableCell>
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
                        {provider.hasRole && provider.hasProfile && (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            <CheckCircle2 className="h-3 w-3 ml-1" />
                            مفعّل
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RegisteredProvidersManager;
