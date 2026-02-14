import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText, TrendingUp, TrendingDown } from "lucide-react";
import {
    BarChart,
    Bar,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from "recharts";

interface AnalyticsData {
    period: string;
    orders: number;
    revenue: number;
    customers: number;
}

const mockData: AnalyticsData[] = [
    { period: "يناير", orders: 65, revenue: 12500, customers: 45 },
    { period: "فبراير", orders: 78, revenue: 15200, customers: 52 },
    { period: "مارس", orders: 85, revenue: 16800, customers: 58 },
    { period: "أبريل", orders: 92, revenue: 18400, customers: 64 },
    { period: "مايو", orders: 105, revenue: 21000, customers: 72 },
    { period: "يونيو", orders: 118, revenue: 24500, customers: 85 },
];

interface StatCardProps {
    title: string;
    value: string | number;
    change: number;
    icon: React.ReactNode;
}

function StatCard({ title, value, change, icon }: StatCardProps) {
    const isPositive = change >= 0;

    return (
        <Card className="p-6 glass-effect hover-lift animate-fade-up">
            <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-lg bg-gradient-accent">
                    {icon}
                </div>
                <div className={`flex items-center gap-1 text-sm font-semibold ${isPositive ? "text-green-500" : "text-red-500"
                    }`}>
                    {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                    {Math.abs(change)}%
                </div>
            </div>
            <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{title}</p>
                <p className="text-3xl font-bold text-gradient-premium">{value}</p>
            </div>
        </Card>
    );
}

export function AnalyticsCard() {
    const exportReport = (format: "pdf" | "excel") => {
        console.log(`Exporting report as ${format}`);
        // Implementation for export functionality
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between animate-fade-up">
                <div>
                    <h2 className="text-3xl font-bold text-gradient-premium">
                        لوحة التحليلات
                    </h2>
                    <p className="text-muted-foreground mt-1">
                        نظرة شاملة على أداء عملك
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        className="hover-lift"
                        onClick={() => exportReport("pdf")}
                    >
                        <FileText className="h-4 w-4 ml-2" />
                        تصدير PDF
                    </Button>
                    <Button
                        variant="outline"
                        className="hover-lift"
                        onClick={() => exportReport("excel")}
                    >
                        <Download className="h-4 w-4 ml-2" />
                        تصدير Excel
                    </Button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="إجمالي الطلبات"
                    value="543"
                    change={12.5}
                    icon={<FileText className="h-5 w-5 text-white" />}
                />
                <StatCard
                    title="الإيرادات"
                    value="108,400 ر.س"
                    change={18.2}
                    icon={<TrendingUp className="h-5 w-5 text-white" />}
                />
                <StatCard
                    title="العملاء"
                    value={376}
                    change={8.7}
                    icon={<TrendingUp className="h-5 w-5 text-white" />}
                />
                <StatCard
                    title="متوسط قيمة الطلب"
                    value="199 ر.س"
                    change={-2.4}
                    icon={<TrendingDown className="h-5 w-5 text-white" />}
                />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Orders Chart */}
                <Card className="p-6 glass-effect animate-fade-up stagger-1">
                    <h3 className="text-lg font-semibold mb-4">عدد الطلبات الشهرية</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={mockData}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                            <XAxis dataKey="period" />
                            <YAxis />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "hsl(var(--card))",
                                    border: "1px solid hsl(var(--border))",
                                    borderRadius: "8px",
                                }}
                            />
                            <Legend />
                            <Bar dataKey="orders" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </Card>

                {/* Revenue Chart */}
                <Card className="p-6 glass-effect animate-fade-up stagger-2">
                    <h3 className="text-lg font-semibold mb-4">الإيرادات الشهرية</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={mockData}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                            <XAxis dataKey="period" />
                            <YAxis />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "hsl(var(--card))",
                                    border: "1px solid hsl(var(--border))",
                                    borderRadius: "8px",
                                }}
                            />
                            <Legend />
                            <Line
                                type="monotone"
                                dataKey="revenue"
                                stroke="hsl(var(--primary))"
                                strokeWidth={3}
                                dot={{ r: 5 }}
                                activeDot={{ r: 7 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </Card>
            </div>

            {/* Summary */}
            <Card className="p-6 bg-gradient-luxury text-white animate-fade-up stagger-3">
                <div className="flex items-start justify-between">
                    <div className="space-y-2">
                        <h3 className="text-xl font-bold">ملخص الأداء</h3>
                        <p className="text-white/80">
                            أداء ممتاز هذا الشهر! نمو ملحوظ في الطلبات والإيرادات
                        </p>
                    </div>
                    <Button variant="secondary" className="hover-scale">
                        عرض التفاصيل
                    </Button>
                </div>
            </Card>
        </div>
    );
}
