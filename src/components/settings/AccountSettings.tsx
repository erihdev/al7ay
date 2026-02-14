import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { User, Mail, Phone, MapPin, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function AccountSettings() {
    const { toast } = useToast();
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: "محمد أحمد",
        email: "mohammed@example.com",
        phone: "+966 50 123 4567",
        location: "الرياض، السعودية",
        emailNotifications: true,
        smsNotifications: false,
        twoFactorAuth: false,
    });

    const handleSave = () => {
        // Save logic here
        toast({
            title: "تم الحفظ",
            description: "تم تحديث معلومات حسابك بنجاح",
        });
        setIsEditing(false);
    };

    return (
        <Card className="p-6 glass-effect space-y-6 animate-fade-up">
            <div className="space-y-2">
                <h2 className="text-2xl font-bold text-gradient-premium flex items-center gap-2">
                    <User className="h-6 w-6" />
                    إعدادات الحساب
                </h2>
                <p className="text-sm text-muted-foreground">
                    إدارة معلوماتك الشخصية وإعدادات الأمان
                </p>
            </div>

            {/* Personal Information */}
            <div className="space-y-4 p-4 rounded-lg border">
                <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">المعلومات الشخصية</Label>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditing(!isEditing)}
                        className="hover-scale"
                    >
                        {isEditing ? "إلغاء" : "تعديل"}
                    </Button>
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            الاسم
                        </Label>
                        <Input
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            disabled={!isEditing}
                            className={isEditing ? "hover-lift" : ""}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            البريد الإلكتروني
                        </Label>
                        <Input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            disabled={!isEditing}
                            className={isEditing ? "hover-lift" : ""}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            رقم الجوال
                        </Label>
                        <Input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            disabled={!isEditing}
                            className={isEditing ? "hover-lift" : ""}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            الموقع
                        </Label>
                        <Input
                            value={formData.location}
                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            disabled={!isEditing}
                            className={isEditing ? "hover-lift" : ""}
                        />
                    </div>
                </div>

                {isEditing && (
                    <Button
                        onClick={handleSave}
                        className="w-full bg-gradient-accent hover-scale"
                    >
                        حفظ التغييرات
                    </Button>
                )}
            </div>

            {/* Security Settings */}
            <div className="space-y-4 p-4 rounded-lg border">
                <Label className="text-base font-semibold flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    الأمان والخصوصية
                </Label>

                <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg hover-lift border">
                        <div className="space-y-1">
                            <Label>التحقق بخطوتين</Label>
                            <p className="text-xs text-muted-foreground">
                                حماية إضافية لحسابك
                            </p>
                        </div>
                        <Switch
                            checked={formData.twoFactorAuth}
                            onCheckedChange={(checked) =>
                                setFormData({ ...formData, twoFactorAuth: checked })
                            }
                        />
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg hover-lift border">
                        <div className="space-y-1">
                            <Label>إشعارات البريد</Label>
                            <p className="text-xs text-muted-foreground">
                                تلقي الإشعارات عبر البريد
                            </p>
                        </div>
                        <Switch
                            checked={formData.emailNotifications}
                            onCheckedChange={(checked) =>
                                setFormData({ ...formData, emailNotifications: checked })
                            }
                        />
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg hover-lift border">
                        <div className="space-y-1">
                            <Label>إشعارات SMS</Label>
                            <p className="text-xs text-muted-foreground">
                                تلقي الإشعارات عبر رسائل نصية
                            </p>
                        </div>
                        <Switch
                            checked={formData.smsNotifications}
                            onCheckedChange={(checked) =>
                                setFormData({ ...formData, smsNotifications: checked })
                            }
                        />
                    </div>
                </div>
            </div>

            {/* Danger Zone */}
            <div className="space-y-3 p-4 rounded-lg border border-red-500/20 bg-red-500/5">
                <Label className="text-base font-semibold text-red-500">منطقة الخطر</Label>
                <p className="text-sm text-muted-foreground">
                    إجراءات دائمة تؤثر على حسابك
                </p>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="text-red-500 hover:bg-red-500/10">
                        تغيير كلمة المرور
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-500 hover:bg-red-500/10">
                        حذف الحساب
                    </Button>
                </div>
            </div>
        </Card>
    );
}
