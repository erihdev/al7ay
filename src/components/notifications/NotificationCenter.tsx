import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Notification {
    id: string;
    title: string;
    message: string;
    type: "info" | "success" | "warning" | "error";
    read: boolean;
    created_at: string;
}

export function NotificationCenter() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        loadNotifications();

        // Subscribe to real-time notifications
        const channel = supabase
            .channel('notifications')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'notifications',
            }, (payload) => {
                const newNotification = payload.new as Notification;
                setNotifications(prev => [newNotification, ...prev]);
                setUnreadCount(prev => prev + 1);

                // Show toast notification
                toast({
                    title: newNotification.title,
                    description: newNotification.message,
                    variant: newNotification.type === "error" ? "destructive" : "default",
                });
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [toast]);

    const loadNotifications = async () => {
        // Mock data for now - replace with actual Supabase query
        const mockNotifications: Notification[] = [
            {
                id: "1",
                title: "طلب جديد",
                message: "لديك طلب جديد #1234",
                type: "info",
                read: false,
                created_at: new Date().toISOString(),
            },
            {
                id: "2",
                title: "تم التسليم",
                message: "تم تسليم الطلب #1230 بنجاح",
                type: "success",
                read: false,
                created_at: new Date(Date.now() - 3600000).toISOString(),
            },
        ];

        setNotifications(mockNotifications);
        setUnreadCount(mockNotifications.filter(n => !n.read).length);
    };

    const markAsRead = async (notificationId: string) => {
        setNotifications(prev =>
            prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
    };

    const markAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
    };

    const getTypeColor = (type: Notification["type"]) => {
        switch (type) {
            case "success": return "bg-green-500/10 text-green-500 border-green-500/20";
            case "warning": return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
            case "error": return "bg-red-500/10 text-red-500 border-red-500/20";
            default: return "bg-blue-500/10 text-blue-500 border-blue-500/20";
        }
    };

    return (
        <div className="relative">
            {/* Notification Bell */}
            <Button
                variant="ghost"
                size="icon"
                className="relative hover-scale"
                onClick={() => setIsOpen(!isOpen)}
            >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                    <Badge
                        className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-gradient-accent animate-glow-pulse"
                    >
                        {unreadCount}
                    </Badge>
                )}
            </Button>

            {/* Notification Panel */}
            {isOpen && (
                <Card className="absolute left-0 mt-2 w-96 max-w-[calc(100vw-2rem)] glass-effect-strong shadow-premium-xl animate-scale-in z-50">
                    <div className="p-4 border-b flex items-center justify-between">
                        <h3 className="font-bold text-lg">الإشعارات</h3>
                        {unreadCount > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={markAllAsRead}
                                className="text-xs hover-glow"
                            >
                                تحديد الكل كمقروء
                            </Button>
                        )}
                    </div>

                    <ScrollArea className="h-96">
                        <div className="p-2 space-y-2">
                            {notifications.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    لا توجد إشعارات
                                </div>
                            ) : (
                                notifications.map((notification, index) => (
                                    <div
                                        key={notification.id}
                                        className={`p-3 rounded-lg border transition-all cursor-pointer hover-lift animate-fade-up stagger-${Math.min(index + 1, 5)} ${notification.read
                                                ? "bg-muted/30"
                                                : getTypeColor(notification.type)
                                            }`}
                                        onClick={() => markAsRead(notification.id)}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1">
                                                <h4 className="font-semibold text-sm mb-1">
                                                    {notification.title}
                                                </h4>
                                                <p className="text-xs text-muted-foreground line-clamp-2">
                                                    {notification.message}
                                                </p>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {new Date(notification.created_at).toLocaleString('ar-SA', {
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                </p>
                                            </div>
                                            {!notification.read && (
                                                <div className="w-2 h-2 rounded-full bg-primary animate-pulse-soft" />
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </ScrollArea>

                    <div className="p-3 border-t">
                        <Button
                            variant="outline"
                            className="w-full hover-scale"
                            onClick={() => setIsOpen(false)}
                        >
                            إغلاق
                        </Button>
                    </div>
                </Card>
            )}
        </div>
    );
}
