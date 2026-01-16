import { Button } from '@/components/ui/button';
import { Volume2, VolumeX } from 'lucide-react';
import { useOrderStatusNotifications } from '@/hooks/useOrderStatusNotifications';
import { playReadySound } from '@/utils/orderSounds';

export function CustomerSoundToggle() {
  const { soundEnabled, toggleSound } = useOrderStatusNotifications();

  const handleToggle = () => {
    const newValue = !soundEnabled;
    toggleSound(newValue);
    
    // Play a test sound when enabling
    if (newValue) {
      setTimeout(() => playReadySound(), 100);
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleToggle}
      className="relative"
      title={soundEnabled ? 'إيقاف الإشعارات الصوتية' : 'تفعيل الإشعارات الصوتية'}
    >
      {soundEnabled ? (
        <Volume2 className="h-5 w-5" />
      ) : (
        <VolumeX className="h-5 w-5 text-muted-foreground" />
      )}
    </Button>
  );
}
