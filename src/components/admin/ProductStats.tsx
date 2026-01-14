import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Star, ShoppingBag, Package } from 'lucide-react';

interface ProductStat {
  product_id: string;
  product_name: string;
  total_quantity: number;
  total_revenue: number;
}

interface ProductRating {
  id: string;
  name_ar: string;
  image_url: string | null;
  average_rating: number;
  review_count: number;
}

export function ProductStats() {
  // Fetch best selling products
  const { data: bestSelling, isLoading: loadingBestSelling } = useQuery({
    queryKey: ['admin-best-selling'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('order_items')
        .select('product_id, product_name, quantity, total_price')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Aggregate by product
      const productMap = new Map<string, ProductStat>();
      data?.forEach((item) => {
        const existing = productMap.get(item.product_id) || {
          product_id: item.product_id,
          product_name: item.product_name,
          total_quantity: 0,
          total_revenue: 0,
        };
        existing.total_quantity += item.quantity;
        existing.total_revenue += Number(item.total_price);
        productMap.set(item.product_id, existing);
      });

      // Sort by quantity sold
      return Array.from(productMap.values())
        .sort((a, b) => b.total_quantity - a.total_quantity)
        .slice(0, 5);
    },
  });

  // Fetch highest rated products
  const { data: highestRated, isLoading: loadingHighestRated } = useQuery({
    queryKey: ['admin-highest-rated'],
    queryFn: async () => {
      // Get all reviews
      const { data: reviews, error: reviewsError } = await supabase
        .from('product_reviews')
        .select('product_id, rating');

      if (reviewsError) throw reviewsError;

      // Get all products
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, name_ar, image_url');

      if (productsError) throw productsError;

      // Calculate average ratings
      const ratingMap = new Map<string, { sum: number; count: number }>();
      reviews?.forEach((review) => {
        const existing = ratingMap.get(review.product_id) || { sum: 0, count: 0 };
        existing.sum += review.rating;
        existing.count += 1;
        ratingMap.set(review.product_id, existing);
      });

      // Combine with product info
      const rated: ProductRating[] = [];
      products?.forEach((product) => {
        const rating = ratingMap.get(product.id);
        if (rating && rating.count > 0) {
          rated.push({
            id: product.id,
            name_ar: product.name_ar,
            image_url: product.image_url,
            average_rating: rating.sum / rating.count,
            review_count: rating.count,
          });
        }
      });

      // Sort by rating
      return rated
        .sort((a, b) => b.average_rating - a.average_rating)
        .slice(0, 5);
    },
  });

  // Fetch total stats
  const { data: totalStats } = useQuery({
    queryKey: ['admin-total-stats'],
    queryFn: async () => {
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('total_amount, status');

      if (ordersError) throw ordersError;

      const { count: productCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('is_available', true);

      const completedOrders = orders?.filter(o => o.status === 'completed') || [];
      const totalRevenue = completedOrders.reduce((sum, o) => sum + Number(o.total_amount), 0);

      return {
        totalOrders: orders?.length || 0,
        completedOrders: completedOrders.length,
        totalRevenue,
        productCount: productCount || 0,
      };
    },
  });

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <ShoppingBag className="h-8 w-8 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">{totalStats?.totalOrders || 0}</p>
            <p className="text-sm text-muted-foreground">إجمالي الطلبات</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{totalStats?.completedOrders || 0}</p>
            <p className="text-sm text-muted-foreground">طلبات مكتملة</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Package className="h-8 w-8 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{totalStats?.productCount || 0}</p>
            <p className="text-sm text-muted-foreground">منتج متاح</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Star className="h-8 w-8 text-amber-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{totalStats?.totalRevenue?.toFixed(0) || 0}</p>
            <p className="text-sm text-muted-foreground">إجمالي الإيرادات (ر.س)</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Best Selling Products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              الأكثر مبيعاً
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingBestSelling ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : bestSelling?.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                لا توجد بيانات مبيعات بعد
              </p>
            ) : (
              <div className="space-y-3">
                {bestSelling?.map((product, index) => (
                  <div
                    key={product.product_id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <Badge
                        variant={index === 0 ? 'default' : 'secondary'}
                        className="w-6 h-6 rounded-full flex items-center justify-center p-0"
                      >
                        {index + 1}
                      </Badge>
                      <div>
                        <p className="font-medium">{product.product_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {product.total_revenue.toFixed(0)} ر.س
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline">
                      {product.total_quantity} مباع
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Highest Rated Products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-amber-500" />
              الأعلى تقييماً
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingHighestRated ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : highestRated?.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                لا توجد تقييمات بعد
              </p>
            ) : (
              <div className="space-y-3">
                {highestRated?.map((product, index) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted shrink-0">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name_ar}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-lg">
                            ☕
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{product.name_ar}</p>
                        <p className="text-xs text-muted-foreground">
                          {product.review_count} تقييم
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      <span className="font-bold">{product.average_rating.toFixed(1)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
