import { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Loader2, Upload, X } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type Product = Database['public']['Tables']['products']['Row'];
type ProductCategory = Database['public']['Enums']['product_category'];

interface ProductFormProps {
  product?: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const categories: { value: ProductCategory; label: string }[] = [
  { value: 'coffee', label: 'قهوة' },
  { value: 'cold_drinks', label: 'مشروبات باردة' },
  { value: 'sweets', label: 'حلويات' },
];

export function ProductForm({ product, open, onOpenChange }: ProductFormProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [nameAr, setNameAr] = useState(product?.name_ar || '');
  const [nameEn, setNameEn] = useState(product?.name_en || '');
  const [descriptionAr, setDescriptionAr] = useState(product?.description_ar || '');
  const [price, setPrice] = useState(product?.price?.toString() || '');
  const [category, setCategory] = useState<ProductCategory>(product?.category || 'coffee');
  const [isAvailable, setIsAvailable] = useState(product?.is_available ?? true);
  const [isFeatured, setIsFeatured] = useState(product?.is_featured ?? false);
  const [imageUrl, setImageUrl] = useState(product?.image_url || '');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(product?.image_url || null);
  const [uploading, setUploading] = useState(false);

  const isEditing = !!product;

  const resetForm = () => {
    setNameAr('');
    setNameEn('');
    setDescriptionAr('');
    setPrice('');
    setCategory('coffee');
    setIsAvailable(true);
    setIsFeatured(false);
    setImageUrl('');
    setImageFile(null);
    setImagePreview(null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setImageUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `products/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return null;
    }

    const { data } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      setUploading(true);
      let finalImageUrl = imageUrl;

      // Upload new image if selected
      if (imageFile) {
        const uploadedUrl = await uploadImage(imageFile);
        if (!uploadedUrl) {
          throw new Error('Failed to upload image');
        }
        finalImageUrl = uploadedUrl;
      }

      const productData = {
        name_ar: nameAr,
        name_en: nameEn || null,
        description_ar: descriptionAr || null,
        price: parseFloat(price),
        category,
        is_available: isAvailable,
        is_featured: isFeatured,
        image_url: finalImageUrl || null,
      };

      if (isEditing && product) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', product.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('products')
          .insert(productData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success(isEditing ? 'تم تحديث المنتج' : 'تم إضافة المنتج');
      resetForm();
      onOpenChange(false);
    },
    onError: (error: any) => {
      console.error('Save error:', error);
      toast.error(error.message || 'حدث خطأ');
    },
    onSettled: () => {
      setUploading(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nameAr.trim()) {
      toast.error('الاسم بالعربية مطلوب');
      return;
    }
    if (!price || parseFloat(price) <= 0) {
      toast.error('السعر مطلوب');
      return;
    }

    saveMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="font-arabic">
            {isEditing ? 'تعديل المنتج' : 'إضافة منتج جديد'}
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
                    alt="Preview"
                    className="w-full h-full object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-24 h-24 border-2 border-dashed border-border rounded-lg flex items-center justify-center cursor-pointer hover:border-primary transition-colors"
                >
                  <Upload className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="font-arabic"
              >
                اختر صورة
              </Button>
            </div>
          </div>

          {/* Name Arabic */}
          <div className="space-y-2">
            <Label htmlFor="nameAr" className="font-arabic">
              الاسم بالعربية *
            </Label>
            <Input
              id="nameAr"
              value={nameAr}
              onChange={(e) => setNameAr(e.target.value)}
              placeholder="مثال: قهوة عربية"
              dir="rtl"
              required
            />
          </div>

          {/* Name English */}
          <div className="space-y-2">
            <Label htmlFor="nameEn" className="font-arabic">
              الاسم بالإنجليزية
            </Label>
            <Input
              id="nameEn"
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              placeholder="Arabic Coffee"
              dir="ltr"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="descriptionAr" className="font-arabic">
              الوصف
            </Label>
            <Textarea
              id="descriptionAr"
              value={descriptionAr}
              onChange={(e) => setDescriptionAr(e.target.value)}
              placeholder="وصف المنتج..."
              dir="rtl"
              rows={3}
            />
          </div>

          {/* Price */}
          <div className="space-y-2">
            <Label htmlFor="price" className="font-arabic">
              السعر (ر.س) *
            </Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="15.00"
              dir="ltr"
              required
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label className="font-arabic">التصنيف</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as ProductCategory)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Toggles */}
          <div className="flex items-center justify-between">
            <Label htmlFor="isAvailable" className="font-arabic">
              متوفر
            </Label>
            <Switch
              id="isAvailable"
              checked={isAvailable}
              onCheckedChange={setIsAvailable}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="isFeatured" className="font-arabic">
              منتج مميز
            </Label>
            <Switch
              id="isFeatured"
              checked={isFeatured}
              onCheckedChange={setIsFeatured}
            />
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full font-arabic"
            disabled={saveMutation.isPending || uploading}
          >
            {(saveMutation.isPending || uploading) && (
              <Loader2 className="h-4 w-4 animate-spin ml-2" />
            )}
            {isEditing ? 'حفظ التغييرات' : 'إضافة المنتج'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
