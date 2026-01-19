import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Award, Gift, Trophy, Star, Plus, History, Settings, Mail, Check, Clock } from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface EmployeePoints {
  id: string;
  employee_id: string;
  total_points: number;
  monthly_points: number;
  weekly_points: number;
  employee?: {
    name: string;
    email: string;
  };
}

interface Reward {
  id: string;
  name_ar: string;
  name_en: string | null;
  description_ar: string | null;
  points_required: number;
  is_active: boolean;
}

interface ClaimedReward {
  id: string;
  employee_id: string;
  reward_id: string;
  points_spent: number;
  claimed_at: string;
  status: string;
  employee?: { name: string };
  reward?: { name_ar: string };
}

interface PointsHistory {
  id: string;
  employee_id: string;
  points: number;
  action_type: string;
  description: string | null;
  created_at: string;
  employee?: { name: string };
}

interface ReportSettings {
  id: string;
  report_type: string;
  is_enabled: boolean;
  schedule: string;
  recipients: string[];
  last_sent_at: string | null;
}

export const EmployeePointsManager = () => {
  const [employeePoints, setEmployeePoints] = useState<EmployeePoints[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [claimedRewards, setClaimedRewards] = useState<ClaimedReward[]>([]);
  const [pointsHistory, setPointsHistory] = useState<PointsHistory[]>([]);
  const [reportSettings, setReportSettings] = useState<ReportSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddReward, setShowAddReward] = useState(false);
  const [showAddPoints, setShowAddPoints] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [newReward, setNewReward] = useState({ name_ar: "", description_ar: "", points_required: 100 });
  const [newPoints, setNewPoints] = useState({ points: 0, description: "" });
  const [newRecipient, setNewRecipient] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch employee points with employee info
      const { data: pointsData } = await supabase
        .from("employee_points")
        .select("*, employee:admin_employees(name, email)")
        .order("total_points", { ascending: false });

      // Fetch rewards
      const { data: rewardsData } = await supabase
        .from("employee_rewards")
        .select("*")
        .order("points_required", { ascending: true });

      // Fetch claimed rewards
      const { data: claimedData } = await supabase
        .from("employee_claimed_rewards")
        .select("*, employee:admin_employees(name), reward:employee_rewards(name_ar)")
        .order("claimed_at", { ascending: false })
        .limit(50);

      // Fetch points history
      const { data: historyData } = await supabase
        .from("employee_points_history")
        .select("*, employee:admin_employees(name)")
        .order("created_at", { ascending: false })
        .limit(100);

      // Fetch report settings
      const { data: settingsData } = await supabase
        .from("admin_report_settings")
        .select("*")
        .eq("report_type", "employee_performance")
        .single();

      setEmployeePoints(pointsData || []);
      setRewards(rewardsData || []);
      setClaimedRewards(claimedData || []);
      setPointsHistory(historyData || []);
      setReportSettings(settingsData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddReward = async () => {
    if (!newReward.name_ar || newReward.points_required <= 0) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    const { error } = await supabase.from("employee_rewards").insert(newReward);

    if (error) {
      toast.error("فشل في إضافة المكافأة");
      return;
    }

    toast.success("تم إضافة المكافأة بنجاح");
    setNewReward({ name_ar: "", description_ar: "", points_required: 100 });
    setShowAddReward(false);
    fetchData();
  };

  const handleToggleReward = async (rewardId: string, isActive: boolean) => {
    const { error } = await supabase
      .from("employee_rewards")
      .update({ is_active: !isActive })
      .eq("id", rewardId);

    if (error) {
      toast.error("فشل في تحديث المكافأة");
      return;
    }

    fetchData();
  };

  const handleAddPoints = async () => {
    if (!selectedEmployee || newPoints.points === 0) {
      toast.error("يرجى اختيار موظف وتحديد النقاط");
      return;
    }

    // Get current points
    const { data: current } = await supabase
      .from("employee_points")
      .select("*")
      .eq("employee_id", selectedEmployee)
      .single();

    if (current) {
      await supabase
        .from("employee_points")
        .update({
          total_points: current.total_points + newPoints.points,
          monthly_points: current.monthly_points + newPoints.points,
          weekly_points: current.weekly_points + newPoints.points,
        })
        .eq("employee_id", selectedEmployee);
    } else {
      await supabase.from("employee_points").insert({
        employee_id: selectedEmployee,
        total_points: newPoints.points,
        monthly_points: newPoints.points,
        weekly_points: newPoints.points,
      });
    }

    // Add to history
    await supabase.from("employee_points_history").insert({
      employee_id: selectedEmployee,
      points: newPoints.points,
      action_type: "manual",
      description: newPoints.description || "إضافة يدوية من الإدارة",
    });

    toast.success("تم إضافة النقاط بنجاح");
    setNewPoints({ points: 0, description: "" });
    setSelectedEmployee("");
    setShowAddPoints(false);
    fetchData();
  };

  const handleUpdateClaimStatus = async (claimId: string, status: string) => {
    const { error } = await supabase
      .from("employee_claimed_rewards")
      .update({ status })
      .eq("id", claimId);

    if (error) {
      toast.error("فشل في تحديث الحالة");
      return;
    }

    toast.success("تم تحديث الحالة");
    fetchData();
  };

  const handleToggleReports = async () => {
    if (!reportSettings) return;

    const { error } = await supabase
      .from("admin_report_settings")
      .update({ is_enabled: !reportSettings.is_enabled })
      .eq("id", reportSettings.id);

    if (error) {
      toast.error("فشل في تحديث الإعدادات");
      return;
    }

    setReportSettings({ ...reportSettings, is_enabled: !reportSettings.is_enabled });
    toast.success(reportSettings.is_enabled ? "تم إيقاف التقارير" : "تم تفعيل التقارير");
  };

  const handleAddRecipient = async () => {
    if (!newRecipient || !reportSettings) return;

    const updatedRecipients = [...(reportSettings.recipients || []), newRecipient];
    
    const { error } = await supabase
      .from("admin_report_settings")
      .update({ recipients: updatedRecipients })
      .eq("id", reportSettings.id);

    if (error) {
      toast.error("فشل في إضافة المستلم");
      return;
    }

    setReportSettings({ ...reportSettings, recipients: updatedRecipients });
    setNewRecipient("");
    toast.success("تم إضافة المستلم");
  };

  const handleRemoveRecipient = async (email: string) => {
    if (!reportSettings) return;

    const updatedRecipients = reportSettings.recipients.filter((r) => r !== email);
    
    const { error } = await supabase
      .from("admin_report_settings")
      .update({ recipients: updatedRecipients })
      .eq("id", reportSettings.id);

    if (error) {
      toast.error("فشل في إزالة المستلم");
      return;
    }

    setReportSettings({ ...reportSettings, recipients: updatedRecipients });
    toast.success("تم إزالة المستلم");
  };

  const handleSendReportNow = async () => {
    toast.loading("جاري إرسال التقرير...");
    
    try {
      const { error } = await supabase.functions.invoke("send-weekly-report");
      
      if (error) throw error;
      
      toast.dismiss();
      toast.success("تم إرسال التقرير بنجاح");
      fetchData();
    } catch (error) {
      toast.dismiss();
      toast.error("فشل في إرسال التقرير");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500">تم التسليم</Badge>;
      case "rejected":
        return <Badge variant="destructive">مرفوض</Badge>;
      default:
        return <Badge variant="secondary">قيد المراجعة</Badge>;
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">جاري التحميل...</div>;
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="leaderboard" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="leaderboard" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            لوحة الصدارة
          </TabsTrigger>
          <TabsTrigger value="rewards" className="flex items-center gap-2">
            <Gift className="h-4 w-4" />
            المكافآت
          </TabsTrigger>
          <TabsTrigger value="claims" className="flex items-center gap-2">
            <Award className="h-4 w-4" />
            طلبات المكافآت
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            سجل النقاط
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            التقارير الدورية
          </TabsTrigger>
        </TabsList>

        <TabsContent value="leaderboard" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">ترتيب الموظفين حسب النقاط</h3>
            <Dialog open={showAddPoints} onOpenChange={setShowAddPoints}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 ml-2" />
                  إضافة نقاط
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>إضافة نقاط يدوياً</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>اختر الموظف</Label>
                    <select
                      className="w-full p-2 border rounded-md mt-1"
                      value={selectedEmployee}
                      onChange={(e) => setSelectedEmployee(e.target.value)}
                    >
                      <option value="">اختر موظف...</option>
                      {employeePoints.map((ep) => (
                        <option key={ep.employee_id} value={ep.employee_id}>
                          {ep.employee?.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>عدد النقاط</Label>
                    <Input
                      type="number"
                      value={newPoints.points}
                      onChange={(e) => setNewPoints({ ...newPoints, points: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <Label>السبب</Label>
                    <Input
                      value={newPoints.description}
                      onChange={(e) => setNewPoints({ ...newPoints, description: e.target.value })}
                      placeholder="مكافأة على الأداء المتميز..."
                    />
                  </div>
                  <Button onClick={handleAddPoints} className="w-full">
                    إضافة النقاط
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {employeePoints.map((ep, index) => (
              <Card key={ep.id} className={index === 0 ? "border-yellow-400 border-2" : ""}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${
                        index === 0 ? "bg-yellow-400 text-yellow-900" :
                        index === 1 ? "bg-gray-300 text-gray-700" :
                        index === 2 ? "bg-amber-600 text-white" :
                        "bg-muted text-muted-foreground"
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="font-semibold">{ep.employee?.name}</h4>
                        <p className="text-sm text-muted-foreground">{ep.employee?.email}</p>
                      </div>
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                        <span className="text-2xl font-bold">{ep.total_points}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        هذا الأسبوع: {ep.weekly_points} | هذا الشهر: {ep.monthly_points}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="rewards" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">إدارة المكافآت</h3>
            <Dialog open={showAddReward} onOpenChange={setShowAddReward}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 ml-2" />
                  إضافة مكافأة
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>إضافة مكافأة جديدة</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>اسم المكافأة</Label>
                    <Input
                      value={newReward.name_ar}
                      onChange={(e) => setNewReward({ ...newReward, name_ar: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>الوصف</Label>
                    <Input
                      value={newReward.description_ar}
                      onChange={(e) => setNewReward({ ...newReward, description_ar: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>النقاط المطلوبة</Label>
                    <Input
                      type="number"
                      value={newReward.points_required}
                      onChange={(e) => setNewReward({ ...newReward, points_required: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <Button onClick={handleAddReward} className="w-full">
                    إضافة المكافأة
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {rewards.map((reward) => (
              <Card key={reward.id} className={!reward.is_active ? "opacity-50" : ""}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold flex items-center gap-2">
                        <Gift className="h-4 w-4 text-primary" />
                        {reward.name_ar}
                      </h4>
                      {reward.description_ar && (
                        <p className="text-sm text-muted-foreground mt-1">{reward.description_ar}</p>
                      )}
                      <Badge className="mt-2" variant="outline">
                        {reward.points_required} نقطة
                      </Badge>
                    </div>
                    <Switch
                      checked={reward.is_active}
                      onCheckedChange={() => handleToggleReward(reward.id, reward.is_active)}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="claims" className="space-y-4">
          <h3 className="text-lg font-semibold">طلبات استبدال المكافآت</h3>
          
          <div className="space-y-3">
            {claimedRewards.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  لا توجد طلبات حالياً
                </CardContent>
              </Card>
            ) : (
              claimedRewards.map((claim) => (
                <Card key={claim.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold">{claim.employee?.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {claim.reward?.name_ar} • {claim.points_spent} نقطة
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(claim.claimed_at).toLocaleDateString("ar-SA")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(claim.status)}
                        {claim.status === "pending" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateClaimStatus(claim.id, "approved")}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleUpdateClaimStatus(claim.id, "rejected")}
                            >
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
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <h3 className="text-lg font-semibold">سجل النقاط</h3>
          
          <div className="space-y-2">
            {pointsHistory.map((record) => (
              <Card key={record.id}>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">{record.employee?.name}</span>
                      <p className="text-sm text-muted-foreground">{record.description}</p>
                    </div>
                    <div className="text-left">
                      <Badge variant={record.points > 0 ? "default" : "destructive"}>
                        {record.points > 0 ? "+" : ""}{record.points}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(record.created_at).toLocaleDateString("ar-SA")}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                إعدادات التقارير الأسبوعية
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">تفعيل التقارير الأسبوعية</h4>
                  <p className="text-sm text-muted-foreground">إرسال تقرير أداء أسبوعي للإدارة كل يوم أحد</p>
                </div>
                <Switch
                  checked={reportSettings?.is_enabled ?? false}
                  onCheckedChange={handleToggleReports}
                />
              </div>

              {reportSettings?.last_sent_at && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  آخر إرسال: {new Date(reportSettings.last_sent_at).toLocaleDateString("ar-SA")}
                </div>
              )}

              <div className="space-y-3">
                <Label>مستلمو التقارير</Label>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="أضف بريد إلكتروني..."
                    value={newRecipient}
                    onChange={(e) => setNewRecipient(e.target.value)}
                  />
                  <Button onClick={handleAddRecipient}>إضافة</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {reportSettings?.recipients?.map((email) => (
                    <Badge key={email} variant="secondary" className="py-1 px-3">
                      {email}
                      <button
                        className="mr-2 hover:text-destructive"
                        onClick={() => handleRemoveRecipient(email)}
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              <Button onClick={handleSendReportNow} className="w-full">
                <Mail className="h-4 w-4 ml-2" />
                إرسال التقرير الآن
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
