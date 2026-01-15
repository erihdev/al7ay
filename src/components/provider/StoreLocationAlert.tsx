import { AlertCircle, MapPin } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface StoreLocationAlertProps {
  onNavigateToSettings: () => void;
}

export const StoreLocationAlert = ({ onNavigateToSettings }: StoreLocationAlertProps) => {
  return (
    <Alert className="border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 mb-6">
      <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
      <AlertTitle className="font-arabic text-amber-800 dark:text-amber-300 font-bold">
        لم يتم تحديد موقع متجرك بعد!
      </AlertTitle>
      <AlertDescription className="font-arabic text-amber-700 dark:text-amber-400 mt-2">
        <p className="mb-3">
          يجب تحديد موقع متجرك على الخريطة لتتمكن من:
        </p>
        <ul className="list-disc list-inside space-y-1 mb-4 text-sm">
          <li>حساب المسافة الحقيقية بين متجرك والعملاء</li>
          <li>تحديد نطاق التوصيل بالكيلومترات</li>
          <li>عرض موقعك للعملاء في طلباتهم</li>
        </ul>
        <Button 
          onClick={onNavigateToSettings}
          className="gap-2 bg-amber-600 hover:bg-amber-700 text-white"
        >
          <MapPin className="h-4 w-4" />
          تحديد موقع المتجر الآن
        </Button>
      </AlertDescription>
    </Alert>
  );
};
