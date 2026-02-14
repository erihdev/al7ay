import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";

interface PerformanceMetric {
    label: string;
    value: number;
    target: number;
    trend: "up" | "down" | "stable";
    change: number;
}

const metrics: PerformanceMetric[] = [
    { label: "معدل إتمام الطلبات", value: 94, target: 95, trend: "up", change: 3 },
    { label: "رضا العملاء", value: 4.7, target: 4.5, trend: "up", change: 5 },
    { label: "وقت الاستجابة", value: 85, target: 90, trend: "down", change: -2 },
    { label: "معدل العودة", value: 12, target: 10, trend: "stable", change: 0 },
];

function getTrendIcon(trend: PerformanceMetric["trend"]) {
    switch (trend) {
        case "up":
            return <ArrowUpRight className="h-4 w-4 text-green-500" />;
        case "down":
            return <ArrowDownRight className="h-4 w-4 text-red-500" />;
        default:
            return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
}

function getTrendColor(trend: PerformanceMetric["trend"]) {
    switch (trend) {
        case "up":
            return "text-green-500";
        case "down":
            return "text-red-500";
        default:
            return "text-muted-foreground";
    }
}

export function PerformanceReport() {
    return (
        <div className="space-y-6">
            <div className="animate-fade-up">
                <h2 className="text-2xl font-bold text-gradient-premium mb-2">
                    تقرير الأداء
                </h2>
                <p className="text-muted-foreground">
                    مؤشرات الأداء الرئيسية KPIs
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {metrics.map((metric, index) => {
                    const progress = (metric.value / metric.target) * 100;
                    const isOnTarget = metric.value >= metric.target;

                    return (
                        <Card
                            key={metric.label}
                            className={`p-6 glass-effect hover-lift animate-fade-up stagger-${index + 1}`}
                        >
                            <div className="space-y-4">
                                {/* Header */}
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-muted-foreground">
                                            {metric.label}
                                        </p>
                                        <p className="text-3xl font-bold">
                                            {metric.value}
                                            {metric.label.includes("رضا") && <span className="text-xl">/5</span>}
                                            {metric.label.includes("معدل") && "%"}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {getTrendIcon(metric.trend)}
                                        {metric.change !== 0 && (
                                            <span className={`text-sm font-semibold ${getTrendColor(metric.trend)}`}>
                                                {metric.change > 0 && "+"}
                                                {metric.change}%
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Progress */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                                        <span>التقدم</span>
                                        <span>الهدف: {metric.target}{metric.label.includes("رضا") ? "/5" : metric.label.includes("معدل") ? "%" : ""}</span>
                                    </div>
                                    <Progress value={Math.min(progress, 100)} className="h-2" />
                                </div>

                                {/* Status Badge */}
                                <Badge
                                    variant={isOnTarget ? "default" : "secondary"}
                                    className={isOnTarget ? "bg-green-500/10 text-green-500 hover:bg-green-500/20" : ""}
                                >
                                    {isOnTarget ? "✓ ضمن الهدف" : "⚠ تحت الهدف"}
                                </Badge>
                            </div>
                        </Card>
                    );
                })}
            </div>

            {/* Summary Card */}
            <Card className="p-6 bg-gradient-success text-white animate-fade-up stagger-5">
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-white/20">
                        <ArrowUpRight className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-1">أداء ممتاز!</h3>
                        <p className="text-white/90 text-sm">
                            3 من 4 مؤشرات ضمن الهدف المطلوب. استمر في العمل الرائع!
                        </p>
                    </div>
                </div>
            </Card>
        </div>
    );
}
