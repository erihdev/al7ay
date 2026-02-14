import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function DesignShowcase() {
    return (
        <div className="min-h-screen bg-background p-8">
            <div className="max-w-7xl mx-auto space-y-12">
                {/* Header */}
                <div className="text-center space-y-4 animate-fade-up">
                    <h1 className="text-5xl font-bold text-gradient-premium">
                        نظام التصميم المتطور
                    </h1>
                    <p className="text-xl text-muted-foreground">
                        عرض جميع التحسينات والميزات الجديدة
                    </p>
                </div>

                {/* Gradients Section */}
                <section className="space-y-6 animate-fade-up stagger-1">
                    <h2 className="text-3xl font-bold">🎨 Premium Gradients</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card className="p-6 bg-gradient-hero">
                            <h3 className="text-white font-bold">Hero Gradient</h3>
                        </Card>
                        <Card className="p-6 bg-gradient-luxury">
                            <h3 className="text-white font-bold">Luxury Gradient</h3>
                        </Card>
                        <Card className="p-6 bg-gradient-vibrant">
                            <h3 className="text-white font-bold">Vibrant Gradient</h3>
                        </Card>
                        <Card className="p-6 bg-gradient-sunset">
                            <h3 className="text-white font-bold">Sunset Gradient</h3>
                        </Card>
                    </div>
                </section>

                {/* Glassmorphism Section */}
                <section className="space-y-6 animate-fade-up stagger-2">
                    <h2 className="text-3xl font-bold">✨ Glassmorphism</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-8 bg-gradient-premium rounded-lg">
                        <Card className="p-6 glass-effect-light">
                            <h3 className="font-bold mb-2">Light Glass</h3>
                            <p className="text-sm text-muted-foreground">
                                تأثير زجاجي خفيف
                            </p>
                        </Card>
                        <Card className="p-6 glass-effect">
                            <h3 className="font-bold mb-2">Medium Glass</h3>
                            <p className="text-sm text-muted-foreground">
                                تأثير زجاجي متوسط
                            </p>
                        </Card>
                        <Card className="p-6 glass-effect-strong">
                            <h3 className="font-bold mb-2">Strong Glass</h3>
                            <p className="text-sm text-muted-foreground">
                                تأثير زجاجي قوي
                            </p>
                        </Card>
                    </div>
                </section>

                {/* Shadows & Glows */}
                <section className="space-y-6 animate-fade-up stagger-3">
                    <h2 className="text-3xl font-bold">🌟 Shadows & Glows</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card className="p-6 shadow-premium-sm">
                            <h3 className="font-bold">Small Shadow</h3>
                        </Card>
                        <Card className="p-6 shadow-premium-md">
                            <h3 className="font-bold">Medium Shadow</h3>
                        </Card>
                        <Card className="p-6 shadow-premium-lg">
                            <h3 className="font-bold">Large Shadow</h3>
                        </Card>
                        <Card className="p-6 glow-gold">
                            <h3 className="font-bold">Gold Glow</h3>
                        </Card>
                    </div>
                </section>

                {/* Hover Effects */}
                <section className="space-y-6 animate-fade-up stagger-4">
                    <h2 className="text-3xl font-bold">🎭 Hover Effects</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="p-6 hover-lift cursor-pointer">
                            <h3 className="font-bold mb-2">Lift على Hover</h3>
                            <p className="text-sm text-muted-foreground">
                                حرك الماوس فوقي!
                            </p>
                        </Card>
                        <Card className="p-6 hover-scale cursor-pointer">
                            <h3 className="font-bold mb-2">Scale على Hover</h3>
                            <p className="text-sm text-muted-foreground">
                                حرك الماوس فوقي!
                            </p>
                        </Card>
                        <Card className="p-6 hover-glow cursor-pointer">
                            <h3 className="font-bold mb-2">Glow على Hover</h3>
                            <p className="text-sm text-muted-foreground">
                                حرك الماوس فوقي!
                            </p>
                        </Card>
                    </div>
                </section>

                {/* Animations */}
                <section className="space-y-6 animate-fade-up stagger-5">
                    <h2 className="text-3xl font-bold">🎬 Animations</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card className="p-6 animate-float-slow">
                            <h3 className="font-bold">Float</h3>
                        </Card>
                        <Card className="p-6 animate-scale-pulse">
                            <h3 className="font-bold">Pulse</h3>
                        </Card>
                        <Card className="p-6 animate-pulse-soft">
                            <h3 className="font-bold">Soft Pulse</h3>
                        </Card>
                        <Card className="p-6 animate-glow-pulse glow-teal">
                            <h3 className="font-bold">Glow Pulse</h3>
                        </Card>
                    </div>
                </section>

                {/* Buttons */}
                <section className="space-y-6 animate-fade-up">
                    <h2 className="text-3xl font-bold">🔘 Buttons with Effects</h2>
                    <div className="flex flex-wrap gap-4">
                        <Button className="bg-gradient-accent hover-lift">
                            Gradient Button
                        </Button>
                        <Button className="bg-gradient-luxury hover-scale">
                            Luxury Button
                        </Button>
                        <Button variant="outline" className="border-gradient hover-glow">
                            Gradient Border
                        </Button>
                        <Button className="glow-gold animate-glow-pulse">
                            Glowing Button
                        </Button>
                    </div>
                </section>

                {/* Text Gradients */}
                <section className="space-y-6 animate-fade-up">
                    <h2 className="text-3xl font-bold">📝 Text Gradients</h2>
                    <div className="space-y-4">
                        <h1 className="text-5xl font-bold text-gradient">
                            نص بتدرج لوني عادي
                        </h1>
                        <h1 className="text-5xl font-bold text-gradient-premium">
                            نص بتدرج لوني فاخر
                        </h1>
                        <h1 className="text-5xl font-bold text-gradient-luxury">
                            نص بتدرج لوني راقي
                        </h1>
                    </div>
                </section>

                {/* Interactive Cards */}
                <section className="space-y-6 animate-fade-up">
                    <h2 className="text-3xl font-bold">🃏 Interactive Cards</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="p-6 interactive-card cursor-pointer">
                            <h3 className="font-bold mb-2">بطاقة تفاعلية 1</h3>
                            <p className="text-sm text-muted-foreground">
                                تأثيرات متعددة عند التحريك
                            </p>
                        </Card>
                        <Card className="p-6 interactive-card glass-effect cursor-pointer">
                            <h3 className="font-bold mb-2">بطاقة زجاجية تفاعلية</h3>
                            <p className="text-sm text-muted-foreground">
                                زجاج + تفاعل
                            </p>
                        </Card>
                        <Card className="p-6 interactive-card border-gradient-luxury cursor-pointer">
                            <h3 className="font-bold mb-2">بطاقة بحدود متدرجة</h3>
                            <p className="text-sm text-muted-foreground">
                                حدود فاخرة + تفاعل
                            </p>
                        </Card>
                    </div>
                </section>
            </div>
        </div>
    );
}
