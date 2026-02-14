import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Palette, Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

export function AppearanceSettings() {
    const { theme, setTheme } = useTheme();

    return (
        <Card className="p-6 glass-effect space-y-6 animate-fade-up">
            <div className="space-y-2">
                <h2 className="text-2xl font-bold text-gradient-premium flex items-center gap-2">
                    <Palette className="h-6 w-6" />
                    إعدادات المظهر
                </h2>
                <p className="text-sm text-muted-foreground">
                    تخصيص شكل التطبيق حسب تفضيلاتك
                </p>
            </div>

            {/* Theme Selection */}
            <div className="space-y-4 p-4 rounded-lg border">
                <Label className="text-base font-semibold">نمط العرض</Label>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <button
                        onClick={() => setTheme("light")}
                        className={`p-4 rounded-lg border-2 transition-all hover-lift ${theme === "light"
                                ? "border-primary bg-primary/10"
                                : "border-border hover:border-primary/50"
                            }`}
                    >
                        <div className="flex flex-col items-center gap-2">
                            <Sun className="h-8 w-8" />
                            <span className="font-semibold">فاتح</span>
                            {theme === "light" && (
                                <span className="text-xs text-primary">✓ مفعّل</span>
                            )}
                        </div>
                    </button>

                    <button
                        onClick={() => setTheme("dark")}
                        className={`p-4 rounded-lg border-2 transition-all hover-lift ${theme === "dark"
                                ? "border-primary bg-primary/10"
                                : "border-border hover:border-primary/50"
                            }`}
                    >
                        <div className="flex flex-col items-center gap-2">
                            <Moon className="h-8 w-8" />
                            <span className="font-semibold">داكن</span>
                            {theme === "dark" && (
                                <span className="text-xs text-primary">✓ مفعّل</span>
                            )}
                        </div>
                    </button>

                    <button
                        onClick={() => setTheme("system")}
                        className={`p-4 rounded-lg border-2 transition-all hover-lift ${theme === "system"
                                ? "border-primary bg-primary/10"
                                : "border-border hover:border-primary/50"
                            }`}
                    >
                        <div className="flex flex-col items-center gap-2">
                            <Monitor className="h-8 w-8" />
                            <span className="font-semibold">تلقائي</span>
                            {theme === "system" && (
                                <span className="text-xs text-primary">✓ مفعّل</span>
                            )}
                        </div>
                    </button>
                </div>
            </div>

            {/* Preview */}
            <div className="p-4 rounded-lg bg-gradient-card space-y-3">
                <Label className="text-sm font-semibold text-white">معاينة</Label>
                <div className="grid grid-cols-2 gap-2">
                    <div className="p-3 rounded bg-white/20 backdrop-blur-sm">
                        <div className="h-2 w-16 bg-white/40 rounded mb-2" />
                        <div className="h-1.5 w-12 bg-white/30 rounded" />
                    </div>
                    <div className="p-3 rounded bg-white/20 backdrop-blur-sm">
                        <div className="h-2 w-16 bg-white/40 rounded mb-2" />
                        <div className="h-1.5 w-12 bg-white/30 rounded" />
                    </div>
                </div>
            </div>

            {/* Info */}
            <div className="p-4 rounded-lg bg-muted/30 border">
                <p className="text-sm text-muted-foreground">
                    💡 <strong>نصيحة:</strong> الوضع التلقائي يتبع إعدادات نظام التشغيل الخاص بك
                </p>
            </div>
        </Card>
    );
}
