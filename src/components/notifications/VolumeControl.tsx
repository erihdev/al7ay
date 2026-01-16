import { useState } from 'react';
import { Volume2, VolumeX, Volume1 } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { getNotificationVolume, setNotificationVolume, playReadySound } from '@/utils/orderSounds';
import { cn } from '@/lib/utils';

interface VolumeControlProps {
  className?: string;
  showLabel?: boolean;
}

export function VolumeControl({ className, showLabel = true }: VolumeControlProps) {
  const [volume, setVolume] = useState(() => getNotificationVolume());

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    setNotificationVolume(newVolume);
  };

  const handleTestSound = () => {
    playReadySound();
  };

  const VolumeIcon = volume === 0 ? VolumeX : volume < 50 ? Volume1 : Volume2;

  return (
    <div className={cn("space-y-3", className)}>
      {showLabel && (
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">مستوى صوت الإشعارات</span>
          <span className="text-sm text-muted-foreground">{volume}%</span>
        </div>
      )}
      
      <div className="flex items-center gap-3">
        <VolumeIcon className="h-5 w-5 text-muted-foreground shrink-0" />
        <Slider
          value={[volume]}
          onValueChange={handleVolumeChange}
          max={100}
          min={0}
          step={5}
          className="flex-1"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={handleTestSound}
          className="shrink-0 text-xs"
        >
          اختبار
        </Button>
      </div>
    </div>
  );
}
