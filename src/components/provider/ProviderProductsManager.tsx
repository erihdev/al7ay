import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Coffee,
  Search,
  Star,
  Loader2,
  Upload,
  X,
  ImageIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { 
  useProviderProducts, 
  useCreateProviderProduct, 
  useUpdateProviderProduct, 
  useDeleteProviderProduct,
  ProviderProduct 
} from '@/hooks/useProviderData';

interface ProviderProductsManagerProps {
  providerId: string;
}

const categories = [
  { value: 'coffee', label: 'قهوة' },
  { value: 'drinks', label: 'مشروبات' },
  { value: 'sweets', label: 'حلويات' },
  { value: 'food', label: 'طعام' },
  { value: 'other', label: 'أخرى' },
];

const ProviderProductsManager = ({ providerId }: ProviderProductsManagerProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProviderProduct | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    name_ar: '',
    name_en: '',
    description_ar: '',
    price: '',
    image_url: '',
    category: 'coffee',
    is_available: true,
    is_featured: false
  });

  const { data: products, isLoading } = useProviderProducts(providerId);
  const createMutation = useCreateProviderProduct();
  const updateMutation = useUpdateProviderProduct();
  const deleteMutation = useDeleteProviderProduct();

  const resetForm = () => {
    setFormData({
      name_ar: '',
      name_en: '',
      description_ar: '',
      price: '',
      image_url: '',
      category: 'coffee',
      is_available: true,
      is_featured: false
    });
    setEditingProduct(null);
    setImageFile(null);
    setImagePreview(null);
    setIsDialogOpen(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleEdit = (product: ProviderProduct) => {
    setEditingProduct(product);
    setFormData({
      name_ar: product.name_ar,
      name_en: product.name_en || '',
      description_ar: product.description_ar || '',
      price: String(product.price),
      image_url: product.image_url || '',
      category: product.category,
      is_available: product.is_available,
      is_featured: product.is_featured
    });
    setImagePreview(product.image_url || null);
    setIsDialogOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('نوع الملف غير مدعوم. يرجى رفع صورة (JPG, PNG, WebP, GIF)');
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('حجم الصورة كبير جداً. الحد الأقصى 5 ميجابايت');
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setFormData({ ...formData, image_url: '' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${providerId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(fileName, file, { cacheControl: '3600', upsert: true });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return null;
    }

    const { data } = supabase.storage
      .from('product-images')
      .getPublicUrl(fileName);

    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name_ar || !formData.price) {
      toast.error('يرجى ملء الحقول المطلوبة');
      return;
    }

    setIsUploading(true);
    let finalImageUrl = formData.image_url;

    try {
      // Upload new image if selected
      if (imageFile) {
        const uploadedUrl = await uploadImage(imageFile);
        if (!uploadedUrl) {
          toast.error('فشل رفع الصورة');
          setIsUploading(false);
          return;
        }
        finalImageUrl = uploadedUrl;
      }

      const productData = {
        provider_id: providerId,
        name_ar: formData.name_ar,
        name_en: formData.name_en || null,
        description_ar: formData.description_ar || null,
        price: parseFloat(formData.price),
        image_url: finalImageUrl || null,
        category: formData.category,
        is_available: formData.is_available,
        is_featured: formData.is_featured,
        sort_order: 0
      };

      if (editingProduct) {
        await updateMutation.mutateAsync({ 
          id: editingProduct.id, 
          providerId, 
          data: productData 
        });
        toast.success('تم تحديث المنتج بنجاح');
      } else {
        await createMutation.mutateAsync(productData);
        toast.success('تم إضافة المنتج بنجاح');
      }
      resetForm();
    } catch (error) {
      toast.error('حدث خطأ');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (product: ProviderProduct) => {
    if (!confirm('هل أنت متأكد من حذف هذا المنتج؟')) return;
    
    try {
      await deleteMutation.mutateAsync({ id: product.id, providerId });
      toast.success('تم حذف المنتج');
    } catch (error) {
      toast.error('حدث خطأ أثناء الحذف');
    }
  };

  const filteredProducts = products?.filter(p =>
    p.name_ar.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 rounded-lg" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} className="h-48 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="البحث في المنتجات..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10 font-arabic"
          />
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="font-arabic">
          <Plus className="h-4 w-4 ml-2" />
          إضافة منتج جديد
        </Button>
      </div>

      {/* Products Grid */}
      {filteredProducts?.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Coffee className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">لا توجد منتجات</h3>
            <p className="text-muted-foreground mb-4">ابدأ بإضافة منتجاتك الآن</p>
            <Button onClick={() => setIsDialogOpen(true)} className="font-arabic">
              <Plus className="h-4 w-4 ml-2" />
              إضافة أول منتج
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredProducts?.map((product) => (
            <Card key={product.id} className={!product.is_available ? 'opacity-60' : ''}>
              <CardContent className="p-0">
                <div className="aspect-square bg-muted rounded-t-lg overflow-hidden">
                  {product.image_url ? (
                    <img 
                      src={product.image_url} 
                      alt={product.name_ar}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Coffee className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-bold text-sm line-clamp-1">{product.name_ar}</h3>
                    {product.is_featured && (
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-primary font-bold mb-2">{product.price} ر.س</p>
                  <div className="flex gap-2 mb-2">
                    <Badge variant="secondary" className="text-xs">
                      {categories.find(c => c.value === product.category)?.label}
                    </Badge>
                    {!product.is_available && (
                      <Badge variant="outline" className="text-xs">غير متاح</Badge>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(product)}
                      className="flex-1"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(product)}
                      className="text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent dir="rtl" className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-arabic">
              {editingProduct ? 'تعديل المنتج' : 'إضافة منتج جديد'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Image Upload */}
            <div className="space-y-2">
              <Label className="font-arabic">صورة المنتج</Label>
              <div className="flex items-center gap-4">
                {imagePreview ? (
                  <div className="relative w-24 h-24">
                    <img
                      src={imagePreview}
                      alt="معاينة"
                      className="w-full h-full object-cover rounded-xl border"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 shadow-lg hover:bg-destructive/90 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-24 h-24 border-2 border-dashed border-primary/30 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all"
                  >
                    <ImageIcon className="h-8 w-8 text-primary/50 mb-1" />
                    <span className="text-xs text-muted-foreground">رفع صورة</span>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <div className="flex-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="font-arabic w-full"
                  >
                    <Upload className="h-4 w-4 ml-2" />
                    {imagePreview ? 'تغيير الصورة' : 'اختر صورة'}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    JPG, PNG, WebP أو GIF - حد أقصى 5 ميجابايت
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-arabic">اسم المنتج (عربي) *</Label>
              <Input
                value={formData.name_ar}
                onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                placeholder="قهوة عربية"
                required
                className="font-arabic"
              />
            </div>

            <div className="space-y-2">
              <Label className="font-arabic">اسم المنتج (إنجليزي)</Label>
              <Input
                value={formData.name_en}
                onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                placeholder="Arabic Coffee"
                dir="ltr"
              />
            </div>

            <div className="space-y-2">
              <Label className="font-arabic">الوصف</Label>
              <Textarea
                value={formData.description_ar}
                onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
                placeholder="وصف المنتج..."
                className="font-arabic"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-arabic">السعر (ر.س) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="15.00"
                  required
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <Label className="font-arabic">التصنيف</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger className="font-arabic">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.value} value={cat.value} className="font-arabic">
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-6">
              <div className="flex items-center gap-3">
                <Switch
                  checked={formData.is_available}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_available: checked })}
                />
                <Label className="font-arabic">متاح</Label>
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  checked={formData.is_featured}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                />
                <Label className="font-arabic">مميز</Label>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={resetForm} className="font-arabic">
                إلغاء
              </Button>
              <Button 
                type="submit" 
                className="font-arabic"
                disabled={createMutation.isPending || updateMutation.isPending || isUploading}
              >
                {(createMutation.isPending || updateMutation.isPending || isUploading) ? (
                  <Loader2 className="h-4 w-4 animate-spin ml-2" />
                ) : null}
                {editingProduct ? 'حفظ التغييرات' : 'إضافة المنتج'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProviderProductsManager;
