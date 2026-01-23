import { Heart, ShoppingBag, ArrowRight, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useFavoritesWithProducts, useToggleFavorite } from '@/hooks/useFavorites';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { BottomNav } from '@/components/layout/BottomNav';
import { Header } from '@/components/layout/Header';
import { PageTransition, fadeInUp } from '@/components/ui/PageTransition';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export default function Favorites() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: favorites, isLoading } = useFavoritesWithProducts();
  const toggleFavorite = useToggleFavorite();

  const handleRemove = async (productId: string, productType: 'main' | 'provider') => {
    try {
      await toggleFavorite.mutateAsync({ productId, productType });
      toast.success('تمت الإزالة من المفضلة');
    } catch (error) {
      toast.error('حدث خطأ');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background font-arabic overflow-x-hidden" dir="rtl">
        <Header />
        <main className="w-full max-w-lg mx-auto px-3 py-6 pb-28">
          <PageTransition className="flex flex-col items-center justify-center min-h-[60vh]">
            <Heart className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-bold mb-2">سجل الدخول لعرض المفضلة</h2>
            <p className="text-muted-foreground mb-4">احفظ منتجاتك المفضلة للوصول السريع</p>
            <Button onClick={() => navigate('/profile')}>
              تسجيل الدخول
            </Button>
          </PageTransition>
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-arabic overflow-x-hidden" dir="rtl">
      <Header />
      
      <main className="w-full max-w-lg mx-auto px-3 py-4 pb-28">
        <PageTransition>
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center">
              <Heart className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">المفضلة</h1>
              <p className="text-sm text-muted-foreground">
                {favorites?.length || 0} منتج
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : favorites?.length === 0 ? (
            <motion.div 
              variants={fadeInUp}
              className="flex flex-col items-center justify-center py-16"
            >
              <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-4">
                <Heart className="h-10 w-10 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-bold mb-2">لا توجد منتجات مفضلة</h2>
              <p className="text-muted-foreground text-center mb-6 max-w-sm">
                اضغط على أيقونة القلب في أي منتج لإضافته للمفضلة
              </p>
              <Button onClick={() => navigate('/app')}>
                <ShoppingBag className="h-4 w-4 ml-2" />
                تصفح المنتجات
              </Button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence mode="popLayout">
                {favorites?.map((item, index) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="overflow-hidden group">
                      <div className="flex gap-4 p-4">
                        {/* Product Image */}
                        <div className="relative w-24 h-24 rounded-lg overflow-hidden shrink-0 bg-muted">
                          {item.product?.image_url ? (
                            <img
                              src={item.product.image_url}
                              alt={item.product.name_ar}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                              <ShoppingBag className="h-8 w-8 text-primary/50" />
                            </div>
                          )}
                        </div>

                        {/* Product Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate">{item.product?.name_ar}</h3>
                          {item.product?.description_ar && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                              {item.product.description_ar}
                            </p>
                          )}
                          <p className="text-primary font-bold mt-2">
                            {Number(item.product?.price || 0).toFixed(0)} ر.س
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => handleRemove(item.product_id, item.product_type as 'main' | 'provider')}
                            disabled={toggleFavorite.isPending}
                          >
                            {toggleFavorite.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-8 w-8"
                            onClick={() => {
                              if (item.product_type === 'main') {
                                navigate(`/product/${item.product_id}`);
                              } else {
                                navigate(`/store/${item.product?.provider_id}`);
                              }
                            }}
                          >
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </PageTransition>
      </main>

      <BottomNav />
    </div>
  );
}
