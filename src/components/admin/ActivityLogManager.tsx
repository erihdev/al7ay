import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Search, Filter, RefreshCw, Activity, User, Clock, FileText } from "lucide-react";

const ACTION_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  order_status_change: { label: "تغيير حالة طلب", color: "bg-blue-500" },
  product_create: { label: "إنشاء منتج", color: "bg-green-500" },
  product_update: { label: "تحديث منتج", color: "bg-yellow-500" },
  product_delete: { label: "حذف منتج", color: "bg-red-500" },
  coupon_create: { label: "إنشاء كوبون", color: "bg-green-500" },
  coupon_update: { label: "تحديث كوبون", color: "bg-yellow-500" },
  coupon_delete: { label: "حذف كوبون", color: "bg-red-500" },
  provider_approve: { label: "قبول مقدم خدمة", color: "bg-green-500" },
  provider_reject: { label: "رفض مقدم خدمة", color: "bg-red-500" },
  provider_update: { label: "تحديث مقدم خدمة", color: "bg-yellow-500" },
  employee_create: { label: "إضافة موظف", color: "bg-green-500" },
  employee_update: { label: "تحديث موظف", color: "bg-yellow-500" },
  employee_permissions_update: { label: "تحديث صلاحيات", color: "bg-purple-500" },
  payout_process: { label: "معالجة دفعة", color: "bg-indigo-500" },
  settings_update: { label: "تحديث إعدادات", color: "bg-gray-500" },
  neighborhood_create: { label: "إضافة حي", color: "bg-green-500" },
  neighborhood_update: { label: "تحديث حي", color: "bg-yellow-500" },
  offer_create: { label: "إنشاء عرض", color: "bg-green-500" },
  offer_update: { label: "تحديث عرض", color: "bg-yellow-500" },
  offer_delete: { label: "حذف عرض", color: "bg-red-500" },
  login: { label: "تسجيل دخول", color: "bg-blue-500" },
  logout: { label: "تسجيل خروج", color: "bg-gray-500" },
  other: { label: "أخرى", color: "bg-gray-400" },
};

export const ActivityLogManager = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [employeeFilter, setEmployeeFilter] = useState<string>("all");

  const { data: employees } = useQuery({
    queryKey: ["admin-employees-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_employees")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: activityLogs, isLoading, refetch } = useQuery({
    queryKey: ["activity-logs", searchTerm, actionFilter, employeeFilter],
    queryFn: async () => {
      let query = supabase
        .from("employee_activity_log")
        .select(`
          *,
          admin_employees (
            name,
            email
          )
        `)
        .order("created_at", { ascending: false })
        .limit(100);

      if (actionFilter !== "all") {
        query = query.eq("action_type", actionFilter);
      }

      if (employeeFilter !== "all") {
        query = query.eq("employee_id", employeeFilter);
      }

      const { data, error } = await query;
      if (error) throw error;

      if (searchTerm) {
        return data.filter(
          (log) =>
            log.action_description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.admin_employees?.name?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      return data;
    },
  });

  const getActionBadge = (actionType: string) => {
    const config = ACTION_TYPE_LABELS[actionType] || ACTION_TYPE_LABELS.other;
    return (
      <Badge className={`${config.color} text-white`}>
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              سجل نشاطات الموظفين
            </CardTitle>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 ml-2" />
              تحديث
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="بحث في السجل..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger>
                <Filter className="h-4 w-4 ml-2" />
                <SelectValue placeholder="نوع الإجراء" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الإجراءات</SelectItem>
                {Object.entries(ACTION_TYPE_LABELS).map(([key, { label }]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
              <SelectTrigger>
                <User className="h-4 w-4 ml-2" />
                <SelectValue placeholder="الموظف" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الموظفين</SelectItem>
                {employees?.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Activity Table */}
          {isLoading ? (
            <div className="text-center py-8">جاري التحميل...</div>
          ) : activityLogs && activityLogs.length > 0 ? (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">الموظف</TableHead>
                    <TableHead className="text-right">الإجراء</TableHead>
                    <TableHead className="text-right">الوصف</TableHead>
                    <TableHead className="text-right">التاريخ</TableHead>
                    <TableHead className="text-right">التفاصيل</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activityLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">
                              {log.admin_employees?.name || "مشرف النظام"}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {log.admin_employees?.email || "-"}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getActionBadge(log.action_type)}</TableCell>
                      <TableCell>
                        <div className="max-w-[300px] truncate">
                          {log.action_description}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span className="text-sm">
                            {format(new Date(log.created_at), "dd MMM yyyy - HH:mm", {
                              locale: ar,
                            })}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {log.target_table && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <FileText className="h-3 w-3" />
                            <span>{log.target_table}</span>
                            {log.target_id && (
                              <span className="font-mono text-xs">
                                #{log.target_id.slice(0, 8)}
                              </span>
                            )}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>لا توجد نشاطات مسجلة</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
