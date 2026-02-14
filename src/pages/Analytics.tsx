import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { AnalyticsCard } from "@/components/analytics/AnalyticsCard";
import { PerformanceReport } from "@/components/reports/PerformanceReport";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Analytics() {
    return (
        <div className="min-h-screen bg-background">
            {/* Header with Notification Center */}
            <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="animate-fade-in">
                            <h1 className="text-3xl font-bold text-gradient-premium">
                                لوحة التحليلات
                            </h1>
                            <p className="text-muted-foreground mt-1">
                                نظرة شاملة على أداء عملك
                            </p>
                        </div>
                        <NotificationCenter />
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
                <Tabs defaultValue="overview" className="space-y-6">
                    <TabsList className="grid w-full max-w-md grid-cols-2">
                        <TabsTrigger value="overview" className="hover-scale">
                            نظرة عامة
                        </TabsTrigger>
                        <TabsTrigger value="performance" className="hover-scale">
                            الأداء
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-6">
                        <AnalyticsCard />
                    </TabsContent>

                    <TabsContent value="performance" className="space-y-6">
                        <PerformanceReport />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
