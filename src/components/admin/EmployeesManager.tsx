import { useState, useRef } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Shield, User, Mail, Phone, Key, FileText, PenTool, Briefcase, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

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

interface JobPosition {
  id: string;
  title_ar: string;
  title_en: string | null;
  description_ar: string | null;
  duties: string[];
  permissions_template: string[];
  salary_range_min: number | null;
  salary_range_max: number | null;
  is_active: boolean;
}

interface Employee {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone: string | null;
  position: string;
  position_id: string | null;
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
  created_at: string;
  job_positions?: JobPosition;
}

const CONTRACT_STATUS_LABELS: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  draft: { label: 'مسودة', color: 'bg-muted text-muted-foreground', icon: <FileText className="h-3 w-3" /> },
  pending_signature: { label: 'بانتظار التوقيع', color: 'bg-yellow-500/10 text-yellow-600', icon: <Clock className="h-3 w-3" /> },
  active: { label: 'نشط', color: 'bg-green-500/10 text-green-600', icon: <CheckCircle className="h-3 w-3" /> },
  expired: { label: 'منتهي', color: 'bg-red-500/10 text-red-600', icon: <AlertCircle className="h-3 w-3" /> },
  terminated: { label: 'ملغي', color: 'bg-destructive/10 text-destructive', icon: <AlertCircle className="h-3 w-3" /> },
};

const CONTRACT_TYPE_LABELS: Record<string, string> = {
  full_time: 'دوام كامل',
  part_time: 'دوام جزئي',
  contract: 'عقد مؤقت',
};

export const EmployeesManager = () => {
  const queryClient = useQueryClient();
  const signatureCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [activeTab, setActiveTab] = useState('employees');
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPermissionsOpen, setIsPermissionsOpen] = useState(false);
  const [isContractDialogOpen, setIsContractDialogOpen] = useState(false);
  const [isContractViewOpen, setIsContractViewOpen] = useState(false);
  const [isPositionDialogOpen, setIsPositionDialogOpen] = useState(false);
  
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedContract, setSelectedContract] = useState<EmployeeContract | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<JobPosition | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    position: '',
    position_id: '',
    password: '',
  });
  
  const [contractFormData, setContractFormData] = useState({
    position_id: '',
    start_date: '',
    end_date: '',
    salary: '',
    contract_type: 'full_time',
    terms_ar: '',
  });
  
  const [positionFormData, setPositionFormData] = useState({
    title_ar: '',
    title_en: '',
    description_ar: '',
    duties: [''],
    salary_range_min: '',
    salary_range_max: '',
  });
  
  const [permissions, setPermissions] = useState<Record<string, { view: boolean; edit: boolean }>>({});

  // Fetch job positions
  const { data: jobPositions } = useQuery({
    queryKey: ['job-positions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('job_positions')
        .select('*')
        .eq('is_active', true)
        .order('title_ar');
      if (error) throw error;
      return data as JobPosition[];
    },
  });

  // Fetch all positions for management
  const { data: allPositions, isLoading: positionsLoading } = useQuery({
    queryKey: ['all-job-positions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('job_positions')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as JobPosition[];
    },
  });

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

  // Fetch contracts
  const { data: contracts, isLoading: contractsLoading } = useQuery({
    queryKey: ['employee-contracts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employee_contracts')
        .select('*, job_positions(*)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as EmployeeContract[];
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
    type: 'permissions_updated' | 'account_created' | 'status_changed' | 'contract_created',
    employee: Employee,
    extraData?: { permissions?: any[]; isActive?: boolean; temporaryPassword?: string; contractNumber?: string }
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

  // Create position mutation
  const createPosition = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from('job_positions')
        .insert({
          title_ar: positionFormData.title_ar,
          title_en: positionFormData.title_en || null,
          description_ar: positionFormData.description_ar || null,
          duties: positionFormData.duties.filter(d => d.trim()),
          salary_range_min: positionFormData.salary_range_min ? parseFloat(positionFormData.salary_range_min) : null,
          salary_range_max: positionFormData.salary_range_max ? parseFloat(positionFormData.salary_range_max) : null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-positions'] });
      queryClient.invalidateQueries({ queryKey: ['all-job-positions'] });
      setIsPositionDialogOpen(false);
      resetPositionForm();
      toast.success('تم إضافة المسمى الوظيفي بنجاح');
    },
    onError: (error: any) => {
      toast.error(error.message || 'حدث خطأ');
    },
  });

  // Update position mutation
  const updatePosition = useMutation({
    mutationFn: async () => {
      if (!selectedPosition) return;
      const { error } = await supabase
        .from('job_positions')
        .update({
          title_ar: positionFormData.title_ar,
          title_en: positionFormData.title_en || null,
          description_ar: positionFormData.description_ar || null,
          duties: positionFormData.duties.filter(d => d.trim()),
          salary_range_min: positionFormData.salary_range_min ? parseFloat(positionFormData.salary_range_min) : null,
          salary_range_max: positionFormData.salary_range_max ? parseFloat(positionFormData.salary_range_max) : null,
        })
        .eq('id', selectedPosition.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-positions'] });
      queryClient.invalidateQueries({ queryKey: ['all-job-positions'] });
      setIsPositionDialogOpen(false);
      setSelectedPosition(null);
      resetPositionForm();
      toast.success('تم تحديث المسمى الوظيفي');
    },
  });

  // Delete position mutation
  const deletePosition = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('job_positions')
        .update({ is_active: false })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-positions'] });
      queryClient.invalidateQueries({ queryKey: ['all-job-positions'] });
      toast.success('تم حذف المسمى الوظيفي');
    },
  });

  // Create employee mutation
  const createEmployee = useMutation({
    mutationFn: async () => {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: { full_name: formData.name },
        },
      });
      
      if (authError) throw authError;
      if (!authData.user) throw new Error('Failed to create user');

      const position = jobPositions?.find(p => p.id === formData.position_id);
      
      const { data, error } = await supabase
        .from('admin_employees')
        .insert({
          user_id: authData.user.id,
          name: formData.name,
          email: formData.email,
          phone: formData.phone || null,
          position: position?.title_ar || formData.position,
          position_id: formData.position_id || null,
        })
        .select()
        .single();
      
      if (error) throw error;

      await supabase.from('user_roles').insert({
        user_id: authData.user.id,
        role: 'admin',
      });

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
      const position = jobPositions?.find(p => p.id === formData.position_id);
      
      const { error } = await supabase
        .from('admin_employees')
        .update({
          name: formData.name,
          phone: formData.phone || null,
          position: position?.title_ar || formData.position,
          position_id: formData.position_id || null,
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
  });

  // Toggle employee active status
  const toggleActive = useMutation({
    mutationFn: async ({ id, isActive, employee }: { id: string; isActive: boolean; employee: Employee }) => {
      const { error } = await supabase
        .from('admin_employees')
        .update({ is_active: isActive })
        .eq('id', id);
      if (error) throw error;
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

  // Create contract mutation
  const createContract = useMutation({
    mutationFn: async () => {
      if (!selectedEmployee) return;
      
      const position = jobPositions?.find(p => p.id === contractFormData.position_id);
      const contractNumber = `EMP-${Date.now().toString(36).toUpperCase()}`;
      
      const { data, error } = await supabase
        .from('employee_contracts')
        .insert({
          employee_id: selectedEmployee.id,
          position_id: contractFormData.position_id,
          contract_number: contractNumber,
          start_date: contractFormData.start_date,
          end_date: contractFormData.end_date || null,
          salary: parseFloat(contractFormData.salary),
          contract_type: contractFormData.contract_type,
          duties: position?.duties || [],
          terms_ar: contractFormData.terms_ar || null,
          status: 'pending_signature',
        })
        .select()
        .single();
      
      if (error) throw error;
      
      await sendEmployeeNotification('contract_created', selectedEmployee, {
        contractNumber,
      });
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-contracts'] });
      setIsContractDialogOpen(false);
      resetContractForm();
      toast.success('تم إنشاء العقد بنجاح وإرسال إشعار للموظف');
    },
    onError: (error: any) => {
      toast.error(error.message || 'حدث خطأ');
    },
  });

  // Sign contract mutation
  const signContract = useMutation({
    mutationFn: async ({ contractId, signatureData, isAdmin }: { contractId: string; signatureData: string; isAdmin: boolean }) => {
      const updates: any = {};
      
      if (isAdmin) {
        updates.admin_signature = signatureData;
        updates.admin_signed_at = new Date().toISOString();
      } else {
        updates.employee_signature = signatureData;
        updates.employee_signed_at = new Date().toISOString();
      }
      
      // Check if both signatures are present
      const { data: contract } = await supabase
        .from('employee_contracts')
        .select('*')
        .eq('id', contractId)
        .single();
      
      if (contract) {
        const hasAdminSig = isAdmin ? true : !!contract.admin_signature;
        const hasEmployeeSig = isAdmin ? !!contract.employee_signature : true;
        
        if (hasAdminSig && hasEmployeeSig) {
          updates.status = 'active';
        }
      }
      
      const { error } = await supabase
        .from('employee_contracts')
        .update(updates)
        .eq('id', contractId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-contracts'] });
      toast.success('تم حفظ التوقيع بنجاح');
      clearSignature();
    },
  });

  // Save permissions mutation
  const savePermissions = useMutation({
    mutationFn: async () => {
      if (!selectedEmployee) return;
      
      await supabase
        .from('employee_permissions')
        .delete()
        .eq('employee_id', selectedEmployee.id);

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

      const allPermissions = PERMISSION_GROUPS.flatMap(g => g.permissions);
      const permissionsForEmail = Object.entries(permissions)
        .filter(([_, p]) => p.view || p.edit)
        .map(([key, p]) => ({
          key,
          label: allPermissions.find(perm => perm.key === key)?.label || key,
          canView: p.view,
          canEdit: p.edit,
        }));

      await sendEmployeeNotification('permissions_updated', selectedEmployee, {
        permissions: permissionsForEmail,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-permissions'] });
      setIsPermissionsOpen(false);
      toast.success('تم حفظ الصلاحيات وإرسال إشعار للموظف');
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
    ctx.strokeStyle = 'hsl(var(--foreground))';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.stroke();
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
  };

  const getSignatureData = () => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return '';
    return canvas.toDataURL();
  };

  const resetForm = () => {
    setFormData({ name: '', email: '', phone: '', position: '', position_id: '', password: '' });
  };

  const resetContractForm = () => {
    setContractFormData({
      position_id: '',
      start_date: '',
      end_date: '',
      salary: '',
      contract_type: 'full_time',
      terms_ar: '',
    });
    setSelectedEmployee(null);
  };

  const resetPositionForm = () => {
    setPositionFormData({
      title_ar: '',
      title_en: '',
      description_ar: '',
      duties: [''],
      salary_range_min: '',
      salary_range_max: '',
    });
  };

  const openEditDialog = (employee: Employee) => {
    setSelectedEmployee(employee);
    setFormData({
      name: employee.name,
      email: employee.email,
      phone: employee.phone || '',
      position: employee.position,
      position_id: employee.position_id || '',
      password: '',
    });
    setIsDialogOpen(true);
  };

  const openContractDialog = (employee: Employee) => {
    setSelectedEmployee(employee);
    if (employee.position_id) {
      setContractFormData(prev => ({ ...prev, position_id: employee.position_id || '' }));
    }
    setIsContractDialogOpen(true);
  };

  const openPermissionsDialog = (employee: Employee) => {
    setSelectedEmployee(employee);
    const permMap: Record<string, { view: boolean; edit: boolean }> = {};
    employeePermissions?.forEach((p) => {
      permMap[p.permission_key] = { view: p.can_view, edit: p.can_edit };
    });
    setPermissions(permMap);
    setIsPermissionsOpen(true);
  };

  const openPositionEditDialog = (position: JobPosition) => {
    setSelectedPosition(position);
    setPositionFormData({
      title_ar: position.title_ar,
      title_en: position.title_en || '',
      description_ar: position.description_ar || '',
      duties: position.duties?.length > 0 ? position.duties : [''],
      salary_range_min: position.salary_range_min?.toString() || '',
      salary_range_max: position.salary_range_max?.toString() || '',
    });
    setIsPositionDialogOpen(true);
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

  const addDutyField = () => {
    setPositionFormData(prev => ({ ...prev, duties: [...prev.duties, ''] }));
  };

  const updateDuty = (index: number, value: string) => {
    setPositionFormData(prev => ({
      ...prev,
      duties: prev.duties.map((d, i) => i === index ? value : d),
    }));
  };

  const removeDuty = (index: number) => {
    setPositionFormData(prev => ({
      ...prev,
      duties: prev.duties.filter((_, i) => i !== index),
    }));
  };

  const getEmployeeName = (employeeId: string) => {
    return employees?.find(e => e.id === employeeId)?.name || 'غير معروف';
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
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="employees" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            الموظفين
          </TabsTrigger>
          <TabsTrigger value="positions" className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            المسميات الوظيفية
          </TabsTrigger>
          <TabsTrigger value="contracts" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            العقود
          </TabsTrigger>
        </TabsList>

        {/* Employees Tab */}
        <TabsContent value="employees">
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
                      <Select
                        value={formData.position_id}
                        onValueChange={(value) => setFormData({ ...formData, position_id: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="اختر المسمى الوظيفي" />
                        </SelectTrigger>
                        <SelectContent>
                          {jobPositions?.map((pos) => (
                            <SelectItem key={pos.id} value={pos.id}>
                              {pos.title_ar}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                              onClick={() => openContractDialog(employee)}
                              title="إنشاء عقد"
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openPermissionsDialog(employee)}
                              title="الصلاحيات"
                            >
                              <Shield className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditDialog(employee)}
                              title="تعديل"
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
                              title="حذف"
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
        </TabsContent>

        {/* Positions Tab */}
        <TabsContent value="positions">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                المسميات الوظيفية
              </CardTitle>
              <Dialog open={isPositionDialogOpen} onOpenChange={(open) => {
                setIsPositionDialogOpen(open);
                if (!open) {
                  setSelectedPosition(null);
                  resetPositionForm();
                }
              }}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 ml-2" />
                    إضافة مسمى
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {selectedPosition ? 'تعديل المسمى الوظيفي' : 'إضافة مسمى وظيفي جديد'}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>المسمى بالعربية *</Label>
                      <Input
                        value={positionFormData.title_ar}
                        onChange={(e) => setPositionFormData({ ...positionFormData, title_ar: e.target.value })}
                        placeholder="مثال: مدير العمليات"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>المسمى بالإنجليزية</Label>
                      <Input
                        value={positionFormData.title_en}
                        onChange={(e) => setPositionFormData({ ...positionFormData, title_en: e.target.value })}
                        placeholder="e.g. Operations Manager"
                        dir="ltr"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>الوصف الوظيفي</Label>
                      <Textarea
                        value={positionFormData.description_ar}
                        onChange={(e) => setPositionFormData({ ...positionFormData, description_ar: e.target.value })}
                        placeholder="وصف مختصر للمسمى الوظيفي..."
                        rows={3}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>المهام الوظيفية</Label>
                      {positionFormData.duties.map((duty, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            value={duty}
                            onChange={(e) => updateDuty(index, e.target.value)}
                            placeholder={`المهمة ${index + 1}`}
                          />
                          {positionFormData.duties.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => removeDuty(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addDutyField}
                      >
                        <Plus className="h-4 w-4 ml-2" />
                        إضافة مهمة
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>الحد الأدنى للراتب</Label>
                        <Input
                          type="number"
                          value={positionFormData.salary_range_min}
                          onChange={(e) => setPositionFormData({ ...positionFormData, salary_range_min: e.target.value })}
                          placeholder="0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>الحد الأقصى للراتب</Label>
                        <Input
                          type="number"
                          value={positionFormData.salary_range_max}
                          onChange={(e) => setPositionFormData({ ...positionFormData, salary_range_max: e.target.value })}
                          placeholder="0"
                        />
                      </div>
                    </div>
                    
                    <Button
                      className="w-full"
                      onClick={() => selectedPosition ? updatePosition.mutate() : createPosition.mutate()}
                      disabled={createPosition.isPending || updatePosition.isPending || !positionFormData.title_ar}
                    >
                      {selectedPosition ? 'حفظ التغييرات' : 'إضافة المسمى'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {positionsLoading ? (
                <Skeleton className="h-64" />
              ) : allPositions?.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  لا يوجد مسميات وظيفية
                </div>
              ) : (
                <div className="grid gap-4">
                  {allPositions?.map((position) => (
                    <Card key={position.id} className={!position.is_active ? 'opacity-50' : ''}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{position.title_ar}</h3>
                              {position.title_en && (
                                <span className="text-sm text-muted-foreground">({position.title_en})</span>
                              )}
                              {!position.is_active && (
                                <Badge variant="outline">غير نشط</Badge>
                              )}
                            </div>
                            {position.description_ar && (
                              <p className="text-sm text-muted-foreground">{position.description_ar}</p>
                            )}
                            {position.duties && position.duties.length > 0 && (
                              <div className="mt-2">
                                <p className="text-sm font-medium mb-1">المهام:</p>
                                <ul className="text-sm text-muted-foreground list-disc list-inside">
                                  {position.duties.slice(0, 3).map((duty, i) => (
                                    <li key={i}>{duty}</li>
                                  ))}
                                  {position.duties.length > 3 && (
                                    <li className="text-primary">+{position.duties.length - 3} مهام أخرى</li>
                                  )}
                                </ul>
                              </div>
                            )}
                            {(position.salary_range_min || position.salary_range_max) && (
                              <p className="text-sm text-muted-foreground">
                                نطاق الراتب: {position.salary_range_min?.toLocaleString() || '-'} - {position.salary_range_max?.toLocaleString() || '-'} ر.س
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openPositionEditDialog(position)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                if (confirm('هل أنت متأكد؟')) {
                                  deletePosition.mutate(position.id);
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contracts Tab */}
        <TabsContent value="contracts">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                العقود الإلكترونية
              </CardTitle>
            </CardHeader>
            <CardContent>
              {contractsLoading ? (
                <Skeleton className="h-64" />
              ) : contracts?.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  لا يوجد عقود حتى الآن
                </div>
              ) : (
                <div className="space-y-4">
                  {contracts?.map((contract) => {
                    const status = CONTRACT_STATUS_LABELS[contract.status] || CONTRACT_STATUS_LABELS.draft;
                    return (
                      <Card key={contract.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold">{getEmployeeName(contract.employee_id)}</h3>
                                <Badge className={status.color}>
                                  {status.icon}
                                  <span className="mr-1">{status.label}</span>
                                </Badge>
                              </div>
                              <div className="text-sm text-muted-foreground space-y-1">
                                <p>رقم العقد: {contract.contract_number}</p>
                                <p>المسمى: {contract.job_positions?.title_ar}</p>
                                <p>نوع العقد: {CONTRACT_TYPE_LABELS[contract.contract_type]}</p>
                                <p>الراتب: {contract.salary.toLocaleString()} ر.س</p>
                                <p>
                                  تاريخ البدء: {format(new Date(contract.start_date), 'dd MMM yyyy', { locale: ar })}
                                  {contract.end_date && ` - انتهاء: ${format(new Date(contract.end_date), 'dd MMM yyyy', { locale: ar })}`}
                                </p>
                              </div>
                              <div className="flex items-center gap-4 mt-2">
                                <div className="flex items-center gap-1">
                                  {contract.admin_signature ? (
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                  )}
                                  <span className="text-xs">توقيع الإدارة</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  {contract.employee_signature ? (
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                  )}
                                  <span className="text-xs">توقيع الموظف</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedContract(contract);
                                  setIsContractViewOpen(true);
                                }}
                              >
                                <FileText className="h-4 w-4 ml-2" />
                                عرض
                              </Button>
                              {!contract.admin_signature && (
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setSelectedContract(contract);
                                    setIsContractViewOpen(true);
                                  }}
                                >
                                  <PenTool className="h-4 w-4 ml-2" />
                                  توقيع
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Contract Dialog */}
      <Dialog open={isContractDialogOpen} onOpenChange={(open) => {
        setIsContractDialogOpen(open);
        if (!open) resetContractForm();
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>إنشاء عقد جديد لـ {selectedEmployee?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>المسمى الوظيفي *</Label>
              <Select
                value={contractFormData.position_id}
                onValueChange={(value) => setContractFormData({ ...contractFormData, position_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر المسمى" />
                </SelectTrigger>
                <SelectContent>
                  {jobPositions?.map((pos) => (
                    <SelectItem key={pos.id} value={pos.id}>
                      {pos.title_ar}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>نوع العقد</Label>
              <Select
                value={contractFormData.contract_type}
                onValueChange={(value) => setContractFormData({ ...contractFormData, contract_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full_time">دوام كامل</SelectItem>
                  <SelectItem value="part_time">دوام جزئي</SelectItem>
                  <SelectItem value="contract">عقد مؤقت</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>تاريخ البدء *</Label>
                <Input
                  type="date"
                  value={contractFormData.start_date}
                  onChange={(e) => setContractFormData({ ...contractFormData, start_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>تاريخ الانتهاء</Label>
                <Input
                  type="date"
                  value={contractFormData.end_date}
                  onChange={(e) => setContractFormData({ ...contractFormData, end_date: e.target.value })}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>الراتب الشهري (ر.س) *</Label>
              <Input
                type="number"
                value={contractFormData.salary}
                onChange={(e) => setContractFormData({ ...contractFormData, salary: e.target.value })}
                placeholder="0"
              />
            </div>
            
            <div className="space-y-2">
              <Label>شروط إضافية</Label>
              <Textarea
                value={contractFormData.terms_ar}
                onChange={(e) => setContractFormData({ ...contractFormData, terms_ar: e.target.value })}
                placeholder="أي شروط أو ملاحظات إضافية..."
                rows={3}
              />
            </div>
            
            <Button
              className="w-full"
              onClick={() => createContract.mutate()}
              disabled={createContract.isPending || !contractFormData.position_id || !contractFormData.start_date || !contractFormData.salary}
            >
              إنشاء العقد
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View/Sign Contract Dialog */}
      <Dialog open={isContractViewOpen} onOpenChange={(open) => {
        setIsContractViewOpen(open);
        if (!open) {
          setSelectedContract(null);
          clearSignature();
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>العقد الإلكتروني - {selectedContract?.contract_number}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[70vh]">
            {selectedContract && (
              <div className="space-y-6 p-4">
                {/* Contract Header */}
                <div className="text-center border-b pb-4">
                  <h2 className="text-xl font-bold">عقد عمل</h2>
                  <p className="text-sm text-muted-foreground">رقم العقد: {selectedContract.contract_number}</p>
                </div>
                
                {/* Contract Details */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">اسم الموظف:</span>
                      <p>{getEmployeeName(selectedContract.employee_id)}</p>
                    </div>
                    <div>
                      <span className="font-medium">المسمى الوظيفي:</span>
                      <p>{selectedContract.job_positions?.title_ar}</p>
                    </div>
                    <div>
                      <span className="font-medium">نوع العقد:</span>
                      <p>{CONTRACT_TYPE_LABELS[selectedContract.contract_type]}</p>
                    </div>
                    <div>
                      <span className="font-medium">الراتب الشهري:</span>
                      <p>{selectedContract.salary.toLocaleString()} ر.س</p>
                    </div>
                    <div>
                      <span className="font-medium">تاريخ البدء:</span>
                      <p>{format(new Date(selectedContract.start_date), 'dd MMMM yyyy', { locale: ar })}</p>
                    </div>
                    {selectedContract.end_date && (
                      <div>
                        <span className="font-medium">تاريخ الانتهاء:</span>
                        <p>{format(new Date(selectedContract.end_date), 'dd MMMM yyyy', { locale: ar })}</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Duties */}
                  {selectedContract.duties && selectedContract.duties.length > 0 && (
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold mb-2">المهام والمسؤوليات:</h4>
                      <ul className="list-decimal list-inside space-y-1 text-sm">
                        {selectedContract.duties.map((duty, i) => (
                          <li key={i}>{duty}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* Additional Terms */}
                  {selectedContract.terms_ar && (
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold mb-2">شروط إضافية:</h4>
                      <p className="text-sm whitespace-pre-wrap">{selectedContract.terms_ar}</p>
                    </div>
                  )}
                  
                  {/* Signatures Section */}
                  <div className="grid grid-cols-2 gap-6 mt-6">
                    {/* Admin Signature */}
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold mb-2 text-center">توقيع الإدارة</h4>
                      {selectedContract.admin_signature ? (
                        <div className="text-center">
                          <img 
                            src={selectedContract.admin_signature} 
                            alt="توقيع الإدارة" 
                            className="max-h-20 mx-auto"
                          />
                          <p className="text-xs text-muted-foreground mt-2">
                            {selectedContract.admin_signed_at && format(new Date(selectedContract.admin_signed_at), 'dd/MM/yyyy HH:mm', { locale: ar })}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <canvas
                            ref={signatureCanvasRef}
                            width={200}
                            height={100}
                            className="border rounded bg-background w-full cursor-crosshair"
                            onMouseDown={startDrawing}
                            onMouseMove={draw}
                            onMouseUp={stopDrawing}
                            onMouseLeave={stopDrawing}
                            onTouchStart={startDrawing}
                            onTouchMove={draw}
                            onTouchEnd={stopDrawing}
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={clearSignature}
                              className="flex-1"
                            >
                              مسح
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => {
                                const sig = getSignatureData();
                                if (sig) {
                                  signContract.mutate({
                                    contractId: selectedContract.id,
                                    signatureData: sig,
                                    isAdmin: true,
                                  });
                                }
                              }}
                              className="flex-1"
                              disabled={signContract.isPending}
                            >
                              <PenTool className="h-4 w-4 ml-1" />
                              توقيع
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Employee Signature */}
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold mb-2 text-center">توقيع الموظف</h4>
                      {selectedContract.employee_signature ? (
                        <div className="text-center">
                          <img 
                            src={selectedContract.employee_signature} 
                            alt="توقيع الموظف" 
                            className="max-h-20 mx-auto"
                          />
                          <p className="text-xs text-muted-foreground mt-2">
                            {selectedContract.employee_signed_at && format(new Date(selectedContract.employee_signed_at), 'dd/MM/yyyy HH:mm', { locale: ar })}
                          </p>
                        </div>
                      ) : (
                        <div className="h-[100px] flex items-center justify-center text-muted-foreground text-sm">
                          بانتظار توقيع الموظف
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

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
