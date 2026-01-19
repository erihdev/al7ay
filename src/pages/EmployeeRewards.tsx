import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Award, Gift, Trophy, Star, History, ArrowRight, LogOut } from "lucide-react";
import { PageTransition } from "@/components/ui/PageTransition";

interface EmployeePoints {
  total_points: number;
  monthly_points: number;
  weekly_points: number;
}

interface Reward {
  id: string;
  name_ar: string;
  description_ar: string | null;
  points_required: number;
  is_active: boolean;
}

interface ClaimedReward {
  id: string;
  reward_id: string;
  points_spent: number;
  claimed_at: string;
  status: string;
  reward?: { name_ar: string };
}

interface PointsHistory {
  id: string;
  points: number;
  action_type: string;
  description: string | null;
  created_at: string;
}

const EmployeeRewards = () => {
  const navigate = useNavigate();
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [employeeName, setEmployeeName] = useState<string>("");
  const [employeeEmail, setEmployeeEmail] = useState<string>("");
  const [points, setPoints] = useState<EmployeePoints | null>(null);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [claimedRewards, setClaimedRewards] = useState<ClaimedReward[]>([]);
  const [pointsHistory, setPointsHistory] = useState<PointsHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);

  useEffect(() => {
    checkEmployee();
  }, []);

  const checkEmployee = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("يرجى تسجيل الدخول أولاً");
        navigate("/admin-login");
        return;
      }

      // Check if user is an employee
      const { data: employee, error } = await supabase
        .from("admin_employees")
        .select("id, name, email, is_active")
        .eq("user_id", user.id)
        .single();

      if (error || !employee) {
        toast.error("ليس لديك صلاحية الوصول إلى هذه الصفحة");
        navigate("/");
        return;
      }

      if (!employee.is_active) {
        toast.error("حسابك غير مفعل");
        navigate("/");
        return;
      }

      setEmployeeId(employee.id);
      setEmployeeName(employee.name);
      setEmployeeEmail(employee.email);
      fetchData(employee.id);
    } catch (error) {
      console.error("Error checking employee:", error);
      navigate("/");
    }
  };

  const fetchData = async (empId: string) => {
    setLoading(true);
    try {
      // Fetch employee points
      const { data: pointsData } = await supabase
        .from("employee_points")
        .select("total_points, monthly_points, weekly_points")
        .eq("employee_id", empId)
        .single();

      // Fetch available rewards
      const { data: rewardsData } = await supabase
        .from("employee_rewards")
        .select("*")
        .eq("is_active", true)
        .order("points_required", { ascending: true });

      // Fetch claimed rewards
      const { data: claimedData } = await supabase
        .from("employee_claimed_rewards")
        .select("*, reward:employee_rewards(name_ar)")
        .eq("employee_id", empId)
        .order("claimed_at", { ascending: false });

      // Fetch points history
      const { data: historyData } = await supabase
        .from("employee_points_history")
        .select("*")
        .eq("employee_id", empId)
        .order("created_at", { ascending: false })
        .limit(50);

      setPoints(pointsData || { total_points: 0, monthly_points: 0, weekly_points: 0 });
      setRewards(rewardsData || []);
      setClaimedRewards(claimedData || []);
      setPointsHistory(historyData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimReward = async (reward: Reward) => {
    if (!employeeId || !points) return;

    if (points.total_points < reward.points_required) {
      toast.error("ليس لديك نقاط كافية لهذه المكافأة");
      return;
    }

    setClaiming(reward.id);

    try {
      // Deduct points
      const newTotal = points.total_points - reward.points_required;
      
      await supabase
        .from("employee_points")
        .update({ total_points: newTotal })
        .eq("employee_id", employeeId);

      // Add to claimed rewards
      await supabase.from("employee_claimed_rewards").insert({
        employee_id: employeeId,
        reward_id: reward.id,
        points_spent: reward.points_required,
        status: "pending",
      });

      // Add to history
      await supabase.from("employee_points_history").insert({
        employee_id: employeeId,
        points: -reward.points_required,
        action_type: "reward_claimed",
        description: `استبدال المكافأة: ${reward.name_ar}`,
      });

      // Send notification email
      await supabase.functions.invoke("send-employee-notification", {
        body: {
          type: "reward_claimed",
          employeeName,
          employeeEmail,
          rewardClaimed: {
            rewardName: reward.name_ar,
            pointsSpent: reward.points_required,
            remainingPoints: newTotal,
          },
        },
      });

      toast.success("تم طلب المكافأة بنجاح! سيتم التواصل معك قريباً");
      fetchData(employeeId);
    } catch (error) {
      console.error("Error claiming reward:", error);
      toast.error("فشل في طلب المكافأة");
    } finally {
      setClaiming(null);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin-login");
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

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case "reward_claimed":
        return <Gift className="h-4 w-4 text-purple-500" />;
      case "manual":
        return <Star className="h-4 w-4 text-yellow-500" />;
      case "weekly_activity":
        return <Trophy className="h-4 w-4 text-amber-500" />;
      default:
        return <Star className="h-4 w-4 text-primary" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-xl">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="bg-primary text-primary-foreground py-4 px-6 shadow-lg">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">مرحباً، {employeeName}</h1>
              <p className="text-sm opacity-80">لوحة المكافآت والنقاط</p>
            </div>
            <Button variant="secondary" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 ml-2" />
              تسجيل الخروج
            </Button>
          </div>
        </header>

        <main className="max-w-4xl mx-auto p-6 space-y-6">
          {/* Points Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
              <CardContent className="p-6 text-center">
                <Star className="h-8 w-8 mx-auto mb-2 fill-current" />
                <div className="text-4xl font-bold">{points?.total_points || 0}</div>
                <div className="text-sm opacity-80">إجمالي النقاط</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <Trophy className="h-8 w-8 mx-auto mb-2 text-amber-500" />
                <div className="text-3xl font-bold">{points?.weekly_points || 0}</div>
                <div className="text-sm text-muted-foreground">نقاط هذا الأسبوع</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <Award className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                <div className="text-3xl font-bold">{points?.monthly_points || 0}</div>
                <div className="text-sm text-muted-foreground">نقاط هذا الشهر</div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="rewards" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="rewards" className="flex items-center gap-2">
                <Gift className="h-4 w-4" />
                المكافآت المتاحة
              </TabsTrigger>
              <TabsTrigger value="claimed" className="flex items-center gap-2">
                <Award className="h-4 w-4" />
                طلباتي
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <History className="h-4 w-4" />
                سجل النقاط
              </TabsTrigger>
            </TabsList>

            <TabsContent value="rewards" className="space-y-4 mt-4">
              <div className="grid gap-4">
                {rewards.map((reward) => {
                  const canClaim = (points?.total_points || 0) >= reward.points_required;
                  return (
                    <Card key={reward.id} className={!canClaim ? "opacity-60" : ""}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                              <Gift className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                              <h4 className="font-semibold">{reward.name_ar}</h4>
                              {reward.description_ar && (
                                <p className="text-sm text-muted-foreground">{reward.description_ar}</p>
                              )}
                              <Badge variant="outline" className="mt-1">
                                {reward.points_required} نقطة
                              </Badge>
                            </div>
                          </div>
                          <Button
                            onClick={() => handleClaimReward(reward)}
                            disabled={!canClaim || claiming === reward.id}
                            className="flex items-center gap-2"
                          >
                            {claiming === reward.id ? (
                              "جاري الطلب..."
                            ) : (
                              <>
                                استبدال
                                <ArrowRight className="h-4 w-4" />
                              </>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                {rewards.length === 0 && (
                  <Card>
                    <CardContent className="p-8 text-center text-muted-foreground">
                      <Gift className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>لا توجد مكافآت متاحة حالياً</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="claimed" className="space-y-4 mt-4">
              <div className="grid gap-4">
                {claimedRewards.map((claim) => (
                  <Card key={claim.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold">{claim.reward?.name_ar}</h4>
                          <p className="text-sm text-muted-foreground">
                            {new Date(claim.claimed_at).toLocaleDateString("ar-SA")}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {claim.points_spent} نقطة
                          </p>
                        </div>
                        {getStatusBadge(claim.status)}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {claimedRewards.length === 0 && (
                  <Card>
                    <CardContent className="p-8 text-center text-muted-foreground">
                      <Award className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>لم تقم بطلب أي مكافآت بعد</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="history" className="space-y-4 mt-4">
              <div className="grid gap-2">
                {pointsHistory.map((item) => (
                  <Card key={item.id}>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getActionIcon(item.action_type)}
                          <div>
                            <p className="text-sm font-medium">
                              {item.description || item.action_type}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(item.created_at).toLocaleDateString("ar-SA")}
                            </p>
                          </div>
                        </div>
                        <div className={`text-lg font-bold ${item.points > 0 ? "text-green-500" : "text-red-500"}`}>
                          {item.points > 0 ? "+" : ""}{item.points}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {pointsHistory.length === 0 && (
                  <Card>
                    <CardContent className="p-8 text-center text-muted-foreground">
                      <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>لا يوجد سجل نقاط</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </PageTransition>
  );
};

export default EmployeeRewards;
