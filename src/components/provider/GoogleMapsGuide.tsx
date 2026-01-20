import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  HelpCircle, X, ChevronLeft, ChevronRight, 
  Smartphone, MousePointer, Copy, Share2, ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Import guide images
import guideStep1 from '@/assets/guide-step1-longpress.png';
import guideStep2 from '@/assets/guide-step2-coordinates.png';
import guideStep3 from '@/assets/guide-step3-share.png';

interface GuideStep {
  id: number;
  title: string;
  description: string;
  image: string;
  icon: React.ReactNode;
  tip?: string;
}

const guideSteps: GuideStep[] = [
  {
    id: 1,
    title: 'افتح Google Maps',
    description: 'افتح تطبيق خرائط جوجل على هاتفك وابحث عن موقع متجرك أو انتقل إليه يدوياً',
    image: guideStep1,
    icon: <Smartphone className="h-4 w-4" />,
    tip: 'تأكد من تفعيل GPS للحصول على موقع دقيق'
  },
  {
    id: 2,
    title: 'اضغط مطولاً على الموقع',
    description: 'اضغط بشكل مطول على موقع متجرك في الخريطة حتى تظهر الدبوس الأحمر والإحداثيات في الأسفل',
    image: guideStep1,
    icon: <MousePointer className="h-4 w-4" />,
    tip: 'ستظهر الإحداثيات مثل: 24.7136, 46.6753'
  },
  {
    id: 3,
    title: 'انسخ الإحداثيات',
    description: 'اضغط على الإحداثيات في الأسفل لنسخها تلقائياً إلى الحافظة',
    image: guideStep2,
    icon: <Copy className="h-4 w-4" />,
    tip: 'يمكنك أيضاً نسخ رابط الموقع بالضغط على "مشاركة"'
  },
  {
    id: 4,
    title: 'الصق في الحقل',
    description: 'عد إلى هذه الصفحة والصق الإحداثيات أو الرابط في حقل "رابط Google Maps"',
    image: guideStep3,
    icon: <Share2 className="h-4 w-4" />,
    tip: 'سيتم استخراج الموقع تلقائياً من الرابط أو الإحداثيات'
  }
];

export function GoogleMapsGuide() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const nextStep = () => {
    if (currentStep < guideSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const openGoogleMaps = () => {
    window.open('https://maps.google.com', '_blank');
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors font-arabic"
      >
        <HelpCircle className="h-3.5 w-3.5" />
        كيف أحصل على الموقع؟
      </button>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <Card className="overflow-hidden border-2">
                {/* Header */}
                <div className="flex items-center justify-between p-4 bg-primary/10 border-b">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-primary/20 text-primary">
                      <Smartphone className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold font-arabic text-sm">دليل الحصول على الموقع</h3>
                      <p className="text-xs text-muted-foreground font-arabic">
                        خطوة {currentStep + 1} من {guideSteps.length}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setIsOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Progress bar */}
                <div className="h-1 bg-muted">
                  <motion.div
                    className="h-full bg-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${((currentStep + 1) / guideSteps.length) * 100}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>

                <CardContent className="p-4 space-y-4">
                  {/* Step Content */}
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentStep}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4"
                    >
                      {/* Image */}
                      <div className="relative aspect-square max-h-48 mx-auto rounded-xl overflow-hidden bg-muted border-2 border-dashed">
                        <img
                          src={guideSteps[currentStep].image}
                          alt={guideSteps[currentStep].title}
                          className="w-full h-full object-contain"
                        />
                        <Badge 
                          className="absolute top-2 right-2 gap-1 bg-primary"
                        >
                          {guideSteps[currentStep].icon}
                          الخطوة {currentStep + 1}
                        </Badge>
                      </div>

                      {/* Text */}
                      <div className="text-center space-y-2">
                        <h4 className="font-bold font-arabic text-lg">
                          {guideSteps[currentStep].title}
                        </h4>
                        <p className="text-sm text-muted-foreground font-arabic leading-relaxed">
                          {guideSteps[currentStep].description}
                        </p>
                      </div>

                      {/* Tip */}
                      {guideSteps[currentStep].tip && (
                        <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                          <p className="text-xs text-amber-700 dark:text-amber-300 font-arabic text-center">
                            💡 {guideSteps[currentStep].tip}
                          </p>
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>

                  {/* Step indicators */}
                  <div className="flex justify-center gap-2">
                    {guideSteps.map((_, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setCurrentStep(index)}
                        className={`w-2.5 h-2.5 rounded-full transition-all ${
                          index === currentStep 
                            ? 'bg-primary w-6' 
                            : 'bg-muted hover:bg-muted-foreground/30'
                        }`}
                      />
                    ))}
                  </div>

                  {/* Navigation */}
                  <div className="flex items-center justify-between gap-3 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={prevStep}
                      disabled={currentStep === 0}
                      className="gap-1 font-arabic"
                    >
                      <ChevronRight className="h-4 w-4" />
                      السابق
                    </Button>

                    {currentStep === guideSteps.length - 1 ? (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={openGoogleMaps}
                          className="gap-1.5 font-arabic"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          فتح Google Maps
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => setIsOpen(false)}
                          className="gap-1 font-arabic"
                        >
                          فهمت!
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        onClick={nextStep}
                        className="gap-1 font-arabic"
                      >
                        التالي
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
