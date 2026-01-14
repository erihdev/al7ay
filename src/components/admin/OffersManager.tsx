import { useState } from 'react';
import { useAllOffers, useCreateOffer, useUpdateOffer, useDeleteOffer } from '@/hooks/useSpecialOffers';
import { useProducts } from '@/hooks/useProducts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Trash2, Edit2, Flame, Clock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export function OffersManager() {
  const { data: offers, isLoading } = useAllOffers();
  const { data: products } = useProducts();
  const createOffer = useCreateOffer();
  const updateOffer = useUpdateOffer();
  const deleteOffer = useDeleteOffer();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingOffer, setEditingOffer] = useState<any>(null);

  // Form state
  const [productId, setProductId] = useState('');
  const [discountPercentage, setDiscountPercentage] = useState('');
  const [titleAr, setTitleAr] = useState('');
  const [endsAt, setEndsAt] = useState('');

  const selectedProduct = products?.find((p) => p.id === productId);
  const originalPrice = selectedProduct ? Number(selectedProduct.price) : 0;
  const discount = parseInt(discountPercentage) || 0;
  const offerPrice = originalPrice - (originalPrice * discount) / 100;

  const resetForm = () => {
    setProductId('');
    setDiscountPercentage('');
    setTitleAr('');
    setEndsAt('');
    setEditingOffer(null);
  };

  const handleSubmit = async () => {
    if (!productId || !discountPercentage || !titleAr || !endsAt) {
      toast.error('يرجى ملء جميع الحقول');
      return;
    }

    try {
      if (editingOffer) {
        await updateOffer.mutateAsync({
          id: editingOffer.id,
          product_id: productId,
          discount_percentage: discount,
          original_price: originalPrice,
          offer_price: offerPrice,
          title_ar: titleAr,
          ends_at: new Date(endsAt).toISOString(),
        });
        toast.success('تم تحديث العرض');
      } else {
        await createOffer.mutateAsync({
          product_id: productId,
          discount_percentage: discount,
          original_price: originalPrice,
          offer_price: offerPrice,
          title_ar: titleAr,
          starts_at: new Date().toISOString(),
          ends_at: new Date(endsAt).toISOString(),
        });
        toast.success('تم إنشاء العرض');
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleEdit = (offer: any) => {
    setEditingOffer(offer);
    setProductId(offer.product_id);
    setDiscountPercentage(offer.discount_percentage.toString());
    setTitleAr(offer.title_ar);
    setEndsAt(format(new Date(offer.ends_at), "yyyy-MM-dd'T'HH:mm"));
    setIsDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteOffer.mutateAsync(deleteId);
      toast.success('تم حذف العرض');
      setDeleteId(null);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleToggleActive = async (offer: any) => {
    try {
      await updateOffer.mutateAsync({
        id: offer.id,
        is_active: !offer.is_active,
      });
      toast.success(offer.is_active ? 'تم إيقاف العرض' : 'تم تفعيل العرض');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const isOfferExpired = (endsAt: string) => new Date(endsAt) < new Date();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-destructive" />
          إدارة العروض الخاصة
        </CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 ml-2" />
              إضافة عرض
            </Button>
          </DialogTrigger>
          <DialogContent dir="rtl" className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-arabic">
                {editingOffer ? 'تعديل العرض' : 'إضافة عرض جديد'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>المنتج</Label>
                <Select value={productId} onValueChange={setProductId}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المنتج" />
                  </SelectTrigger>
                  <SelectContent>
                    {products?.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name_ar} - {Number(product.price).toFixed(0)} ر.س
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>نسبة الخصم (%)</Label>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={discountPercentage}
                  onChange={(e) => setDiscountPercentage(e.target.value)}
                  placeholder="مثال: 20"
                  dir="ltr"
                />
              </div>

              {selectedProduct && discount > 0 && (
                <div className="p-3 rounded-lg bg-muted">
                  <div className="flex justify-between text-sm">
                    <span>السعر الأصلي:</span>
                    <span>{originalPrice.toFixed(0)} ر.س</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-primary">
                    <span>سعر العرض:</span>
                    <span>{offerPrice.toFixed(0)} ر.س</span>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>عنوان العرض</Label>
                <Input
                  value={titleAr}
                  onChange={(e) => setTitleAr(e.target.value)}
                  placeholder="مثال: عرض نهاية الأسبوع"
                  dir="rtl"
                />
              </div>

              <div className="space-y-2">
                <Label>ينتهي في</Label>
                <Input
                  type="datetime-local"
                  value={endsAt}
                  onChange={(e) => setEndsAt(e.target.value)}
                  dir="ltr"
                />
              </div>
            </div>
            <DialogFooter className="flex-row-reverse gap-2">
              <Button
                onClick={handleSubmit}
                disabled={createOffer.isPending || updateOffer.isPending}
              >
                {(createOffer.isPending || updateOffer.isPending) && (
                  <Loader2 className="h-4 w-4 animate-spin ml-2" />
                )}
                {editingOffer ? 'تحديث' : 'إضافة'}
              </Button>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                إلغاء
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : offers?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Flame className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>لا توجد عروض حالياً</p>
          </div>
        ) : (
          <div className="space-y-3">
            {offers?.map((offer) => {
              const expired = isOfferExpired(offer.ends_at);
              return (
                <div
                  key={offer.id}
                  className={`p-4 rounded-lg border ${
                    expired ? 'bg-muted/50 opacity-60' : 'bg-card'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted shrink-0">
                        {offer.products?.image_url ? (
                          <img
                            src={offer.products.image_url}
                            alt={offer.products.name_ar}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xl">
                            ☕
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{offer.title_ar}</p>
                        <p className="text-sm text-muted-foreground">
                          {offer.products?.name_ar}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={expired ? 'secondary' : 'destructive'}>
                            {offer.discount_percentage}% خصم
                          </Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {expired
                              ? 'انتهى'
                              : format(new Date(offer.ends_at), 'dd/MM HH:mm')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Switch
                        checked={offer.is_active}
                        onCheckedChange={() => handleToggleActive(offer)}
                        disabled={expired}
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleEdit(offer)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteId(offer.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-arabic">حذف العرض</AlertDialogTitle>
            <AlertDialogDescription className="font-arabic">
              هل أنت متأكد من حذف هذا العرض؟
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel className="font-arabic">إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-arabic"
            >
              {deleteOffer.isPending && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
