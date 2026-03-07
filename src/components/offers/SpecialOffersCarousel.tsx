import { useState, useEffect } from 'react';
import { useActiveOffers, SpecialOffer } from '@/hooks/useSpecialOffers';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useCart } from '@/hooks/useCart';
import { Clock, Flame, Plus } from 'lucide-react';
import { toast } from 'sonner';

function CountdownTimer({ endsAt }: { endsAt: string }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const end = new Date(endsAt).getTime();
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft('انتهى');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (days > 0) {
        setTimeLeft(`${days}ي ${hours}س`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}س ${minutes}د`);
      } else {
        setTimeLeft(`${minutes}د ${seconds}ث`);
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [endsAt]);

  return (
    <div className="flex items-center gap-1 text-xs font-medium">
      <Clock className="h-3 w-3" />
      <span>{timeLeft}</span>
    </div>
  );
}

function OfferCard({ offer }: { offer: SpecialOffer }) {
  const { addItem } = useCart();

  const handleAddToCart = () => {
    if (!offer.products) return;

    addItem({
      id: `${offer.products.id}-offer-${offer.id}`,
      name_ar: `${offer.products.name_ar} (عرض خاص)`,
      price: Number(offer.offer_price),
      image_url: offer.products.image_url || undefined,
    });

    toast.success('تمت إضافة العرض للسلة');
  };

  return (
    <Card className="overflow-hidden border-2 border-accent/50 bg-gradient-to-br from-accent/5 to-accent/10 shrink-0 w-72">
      <CardContent className="p-0">
        <div className="relative">
          {/* Image */}
          <div className="aspect-[4/3] bg-muted overflow-hidden">
            {offer.products?.image_url ? (
              <img
                src={offer.products.image_url}
                alt={offer.products.name_ar}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-accent/20 to-accent/30">
                <span className="text-5xl">☕</span>
              </div>
            )}
          </div>

          {/* Discount Badge */}
          <Badge className="absolute top-2 right-2 bg-destructive text-destructive-foreground font-bold text-sm px-2 py-1">
            <Flame className="h-3 w-3 ml-1" />
            {offer.discount_percentage}% خصم
          </Badge>

          {/* Countdown */}
          <div className="absolute bottom-2 right-2 bg-background/90 backdrop-blur-sm rounded-full px-3 py-1 border border-border">
            <CountdownTimer endsAt={offer.ends_at} />
          </div>
        </div>

        <div className="p-4">
          <h3 className="font-bold text-sm mb-1">{offer.title_ar}</h3>
          <p className="text-xs text-muted-foreground mb-3">
            {offer.products?.name_ar}
          </p>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-primary">
                {Number(offer.offer_price).toFixed(0)} ر.س
              </span>
              <span className="text-sm text-muted-foreground line-through">
                {Number(offer.original_price).toFixed(0)} ر.س
              </span>
            </div>
            <Button size="sm" onClick={handleAddToCart}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function SpecialOffersCarousel() {
  const { data: offers, isLoading } = useActiveOffers();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-bold font-arabic flex items-center gap-2">
          <Flame className="h-5 w-5 text-destructive" />
          عروض خاصة
        </h2>
        <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="w-72 h-64 shrink-0 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!offers || offers.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold font-arabic flex items-center gap-2">
        <Flame className="h-5 w-5 text-destructive animate-pulse" />
        عروض خاصة
      </h2>
      <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2 -mx-4 px-4">
        {offers.map((offer) => (
          <OfferCard key={offer.id} offer={offer} />
        ))}
      </div>
    </div>
  );
}
