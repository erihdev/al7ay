import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Shield, User, Mail, Phone, Key } from 'lucide-react';

// قائمة الصلاحيات المتاحة
const PERMISSION_GROUPS = [
  {
    label: 'العمليات',
    permissions: [
      { key: 'orders', label: 'الطلبات' },
      { key: 'stats', label: 'الإحصائيات' },
      { key: 'reports', label: 'التقارير' },
    ]
  },
  {
    label: 'التسويق',
    permissions: [
      { key: 'offers', label: 'العروض' },
      { key: 'referrals', label: 'الإحالات' },
      { key: 'coupons', label: 'الكوبونات' },
    ]
  },
  {
    label: 'المزودين',
    permissions: [
      { key: 'applications', label: 'طلبات الانضمام' },
      { key: 'providers', label: 'مقدمي الخدمات' },
      { key: 'verification', label: 'التوثيق' },
    ]
  },
  {
    label: 'المالية',
    permissions: [
      { key: 'payments', label: 'المدفوعات' },
      { key: 'subscriptions', label: 'الاشتراكات' },
      { key: 'commissions', label: 'العمولات' },
      { key: 'payouts', label: 'التحويلات' },
      { key: 'edfapay', label: 'EdfaPay' },
    ]
  },
  {
    label: 'الإعدادات',
    permissions: [
      { key: 'neighborhoods', label: 'الأحياء' },
      { key: 'versions', label: 'الإصدارات' },
      { key: 'settings', label: 'إعدادات المتجر' },
      { key: 'employees', label: 'إدارة الموظفين' },
    ]
  },
];

interface Employee {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone: string | null;
  position: string;
  is_active: boolean;
  created_at: string;
}

interface EmployeePermission {
  id: string;
  employee_id: string;
  permission_key: string;
  can_view: boolean;
  can_edit: boolean;
}

export const EmployeesManager = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPermissionsOpen, setIsPermissionsOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    position: '',
    password: '',
  });
  const [permissions, setPermissions] = useState<Record<string, { view: boolean; edit: boolean }>>({});

  // Fetch employees
  const { data: employees, isLoading } = useQuery({
    queryKey: ['admin-employees'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_employees')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Employee[];
    },
  });

  // Fetch employee permissions
  const { data: employeePermissions } = useQuery({
    queryKey: ['employee-permissions', selectedEmployee?.id],
    queryFn: async () => {
      if (!selectedEmployee) return [];
      const { data, error } = await supabase
        .from('employee_permissions')
        .select('*')
        .eq('employee_id', selectedEmployee.id);
      if (error) throw error;
      return data as EmployeePermission[];
    },
    enabled: !!selectedEmployee,
  });

  // Send employee notification
  const sendEmployeeNotification = async (
    type: 'permissions_updated' | 'account_created' | 'status_changed',
    employee: Employee,
    extraData?: { permissions?: any[]; isActive?: boolean; temporaryPassword?: string }
  ) => {
    try {
      await supabase.functions.invoke('send-employee-notification', {
        body: {
          type,
          employeeName: employee.name,
          employeeEmail: employee.email,
          ...extraData,
        },
      });
    } catch (error) {
      console.error('Error sending employee notification:', error);
    }
  };

  // Create employee mutation
  const createEmployee = useMutation({
    mutationFn: async () => {
      // First create the user in auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.name,
          },
        },
      });
      
      if (authError) throw authError;
      if (!authData.user) throw new Error('Failed to create user');

      // Create employee record
      const { data, error } = await supabase
        .from('admin_employees')
        .insert({
          user_id: authData.user.id,
          name: formData.name,
          email: formData.email,
          phone: formData.phone || null,
          position: formData.position,
        })
        .select()
        .single();
      
      if (error) throw error;

      // Add user role
      await supabase.from('user_roles').insert({
        user_id: authData.user.id,
        role: 'admin',
      });

      // Send welcome email notification
      await sendEmployeeNotification('account_created', data as Employee, {
        temporaryPassword: formData.password,
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-employees'] });
      setIsDialogOpen(false);
      resetForm();
      toast.success('تم إضافة الموظف بنجاح وإرسال بيانات الدخول');
    },
    onError: (error: any) => {
      toast.error(error.message || 'حدث خطأ أثناء إضافة الموظف');
    },
  });

  // Update employee mutation
  const updateEmployee = useMutation({
    mutationFn: async () => {
      if (!selectedEmployee) return;
      const { error } = await supabase
        .from('admin_employees')
        .update({
          name: formData.name,
          phone: formData.phone || null,
          position: formData.position,
        })
        .eq('id', selectedEmployee.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-employees'] });
      setIsDialogOpen(false);
      setSelectedEmployee(null);
      resetForm();
      toast.success('تم تحديث بيانات الموظف');
    },
    onError: () => {
      toast.error('حدث خطأ أثناء التحديث');
    },
  });

  // Toggle employee active status
  const toggleActive = useMutation({
    mutationFn: async ({ id, isActive, employee }: { id: string; isActive: boolean; employee: Employee }) => {
      const { error } = await supabase
        .from('admin_employees')
        .update({ is_active: isActive })
        .eq('id', id);
      if (error) throw error;
      
      // Send status change notification
      await sendEmployeeNotification('status_changed', employee, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-employees'] });
      toast.success('تم تحديث حالة الموظف وإرسال إشعار');
    },
  });

  // Delete employee mutation
  const deleteEmployee = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('admin_employees')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-employees'] });
      toast.success('تم حذف الموظف');
    },
  });

  // Save permissions mutation
  const savePermissions = useMutation({
    mutationFn: async () => {
      if (!selectedEmployee) return;
      
      // Delete existing permissions
      await supabase
        .from('employee_permissions')
        .delete()
        .eq('employee_id', selectedEmployee.id);

      // Insert new permissions
      const permissionsToInsert = Object.entries(permissions)
        .filter(([_, p]) => p.view || p.edit)
        .map(([key, p]) => ({
          employee_id: selectedEmployee.id,
          permission_key: key,
          can_view: p.view,
          can_edit: p.edit,
        }));

      if (permissionsToInsert.length > 0) {
        const { error } = await supabase
          .from('employee_permissions')
          .insert(permissionsToInsert);
        if (error) throw error;
      }

      // Get permission labels for notification
      const allPermissions = PERMISSION_GROUPS.flatMap(g => g.permissions);
      const permissionsForEmail = Object.entries(permissions)
        .filter(([_, p]) => p.view || p.edit)
        .map(([key, p]) => ({
          key,
          label: allPermissions.find(perm => perm.key === key)?.label || key,
          canView: p.view,
          canEdit: p.edit,
        }));

      // Send permissions update notification
      await sendEmployeeNotification('permissions_updated', selectedEmployee, {
        permissions: permissionsForEmail,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-permissions'] });
      setIsPermissionsOpen(false);
      toast.success('تم حفظ الصلاحيات وإرسال إشعار للموظف');
    },
    onError: () => {
      toast.error('حدث خطأ أثناء حفظ الصلاحيات');
    },
  });

  const resetForm = () => {
    setFormData({ name: '', email: '', phone: '', position: '', password: '' });
  };

  const openEditDialog = (employee: Employee) => {
    setSelectedEmployee(employee);
    setFormData({
      name: employee.name,
      email: employee.email,
      phone: employee.phone || '',
      position: employee.position,
      password: '',
    });
    setIsDialogOpen(true);
  };

  const openPermissionsDialog = (employee: Employee) => {
    setSelectedEmployee(employee);
    // Initialize permissions from existing data
    const permMap: Record<string, { view: boolean; edit: boolean }> = {};
    employeePermissions?.forEach((p) => {
      permMap[p.permission_key] = { view: p.can_view, edit: p.can_edit };
    });
    setPermissions(permMap);
    setIsPermissionsOpen(true);
  };

  const togglePermission = (key: string, type: 'view' | 'edit') => {
    setPermissions((prev) => ({
      ...prev,
      [key]: {
        view: type === 'view' ? !prev[key]?.view : prev[key]?.view || false,
        edit: type === 'edit' ? !prev[key]?.edit : prev[key]?.edit || false,
      },
    }));
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-64" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            إدارة الموظفين
          </CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setSelectedEmployee(null);
              resetForm();
            }
          }}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 ml-2" />
                إضافة موظف
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {selectedEmployee ? 'تعديل بيانات الموظف' : 'إضافة موظف جديد'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>الاسم الكامل</Label>
                  <div className="relative">
                    <User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="أدخل اسم الموظف"
                      className="pr-10"
                    />
                  </div>
                </div>
                
                {!selectedEmployee && (
                  <>
                    <div className="space-y-2">
                      <Label>البريد الإلكتروني</Label>
                      <div className="relative">
                        <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="example@email.com"
                          className="pr-10"
                          dir="ltr"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>كلمة المرور</Label>
                      <div className="relative">
                        <Key className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="password"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          placeholder="كلمة مرور قوية"
                          className="pr-10"
                        />
                      </div>
                    </div>
                  </>
                )}
                
                <div className="space-y-2">
                  <Label>رقم الجوال</Label>
                  <div className="relative">
                    <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="05xxxxxxxx"
                      className="pr-10"
                      dir="ltr"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>المسمى الوظيفي</Label>
                  <Input
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    placeholder="مثال: مدير العمليات"
                  />
                </div>
                
                <Button
                  className="w-full"
                  onClick={() => selectedEmployee ? updateEmployee.mutate() : createEmployee.mutate()}
                  disabled={createEmployee.isPending || updateEmployee.isPending}
                >
                  {selectedEmployee ? 'حفظ التغييرات' : 'إضافة الموظف'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {employees?.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              لا يوجد موظفين حتى الآن
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الموظف</TableHead>
                  <TableHead>المسمى الوظيفي</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees?.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{employee.name}</p>
                        <p className="text-sm text-muted-foreground">{employee.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>{employee.position}</TableCell>
                    <TableCell>
                      <Switch
                        checked={employee.is_active}
                        onCheckedChange={(checked) => 
                          toggleActive.mutate({ id: employee.id, isActive: checked, employee })
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openPermissionsDialog(employee)}
                        >
                          <Shield className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditDialog(employee)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            if (confirm('هل أنت متأكد من حذف هذا الموظف؟')) {
                              deleteEmployee.mutate(employee.id);
                            }
                          }}
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
        </CardContent>
      </Card>

      {/* Permissions Dialog */}
      <Dialog open={isPermissionsOpen} onOpenChange={setIsPermissionsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              صلاحيات الموظف: {selectedEmployee?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {PERMISSION_GROUPS.map((group) => (
              <div key={group.label} className="space-y-3">
                <h4 className="font-semibold text-sm text-muted-foreground">{group.label}</h4>
                <div className="grid grid-cols-1 gap-2">
                  {group.permissions.map((perm) => (
                    <div
                      key={perm.key}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <span>{perm.label}</span>
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <Checkbox
                            checked={permissions[perm.key]?.view || false}
                            onCheckedChange={() => togglePermission(perm.key, 'view')}
                          />
                          <span className="text-sm">عرض</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <Checkbox
                            checked={permissions[perm.key]?.edit || false}
                            onCheckedChange={() => togglePermission(perm.key, 'edit')}
                          />
                          <span className="text-sm">تعديل</span>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <Button
              className="w-full"
              onClick={() => savePermissions.mutate()}
              disabled={savePermissions.isPending}
            >
              حفظ الصلاحيات
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
