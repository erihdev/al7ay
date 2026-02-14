import { NotificationSettings } from "@/components/notifications/NotificationSettings";
import { AppearanceSettings } from "@/components/settings/AppearanceSettings";
import { AccountSettings } from "@/components/settings/AccountSettings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings as SettingsIcon, Bell, Palette, User } from "lucide-react";

export default function Settings() {
    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="border-b bg-card/50 backdrop-blur-sm">
                <div className="max-w-5xl mx-auto px-4 py-6">
                    <div className="flex items-center gap-3 animate-fade-in">
                        <div className="p-3 rounded-lg bg-gradient-premium">
                            <SettingsIcon className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gradient-premium">
                                الإعدادات
                            </h1>
                            <p className="text-muted-foreground mt-1">
                                إدارة تفضيلاتك وإعدادات التطبيق
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-5xl mx-auto p-4 md:p-8">
                <Tabs defaultValue="account" className="space-y-6">
                    <TabsList className="grid w-full grid-cols-3 glass-effect">
                        <TabsTrigger value="account" className="hover-scale flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span className="hidden sm:inline">الحساب</span>
                        </TabsTrigger>
                        <TabsTrigger value="appearance" className="hover-scale flex items-center gap-2">
                            <Palette className="h-4 w-4" />
                            <span className="hidden sm:inline">المظهر</span>
                        </TabsTrigger>
                        <TabsTrigger value="notifications" className="hover-scale flex items-center gap-2">
                            <Bell className="h-4 w-4" />
                            <span className="hidden sm:inline">الإشعارات</span>
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="account" className="space-y-6">
                        <AccountSettings />
                    </TabsContent>

                    <TabsContent value="appearance" className="space-y-6">
                        <AppearanceSettings />
                    </TabsContent>

                    <TabsContent value="notifications" className="space-y-6">
                        <div className="space-y-4">
                            <h2 className="text-2xl font-bold text-gradient-premium">
                                إعدادات الإشعارات
                            </h2>
                            <NotificationSettings />
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
