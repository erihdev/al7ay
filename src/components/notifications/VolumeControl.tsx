import { useState } from 'react';
import { Volume2, VolumeX, Volume1, Music } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { 
  getNotificationVolume, 
  setNotificationVolume, 
  getNotificationTone,
  setNotificationTone,
  playDemoSound,
  soundToneLabels,
  type SoundTone 
} from '@/utils/orderSounds';
import { cn } from '@/lib/utils';

interface VolumeControlProps {
  className?: string;
  showLabel?: boolean;
}

const toneOptions: SoundTone[] = ['classic', 'modern', 'gentle', 'retro'];

export function VolumeControl({ className, showLabel = true }: VolumeControlProps) {
  const [volume, setVolume] = useState(() => getNotificationVolume());
  const [tone, setTone] = useState<SoundTone>(() => getNotificationTone());

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    setNotificationVolume(newVolume);
  };

  const handleToneChange = (newTone: SoundTone) => {
    setTone(newTone);
    setNotificationTone(newTone);
    // Play demo of the selected tone
    setTimeout(() => playDemoSound(newTone), 100);
  };

  const VolumeIcon = volume === 0 ? VolumeX : volume < 50 ? Volume1 : Volume2;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Volume Control */}
      <div className="space-y-3">
        {showLabel && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">مستوى الصوت</span>
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
        </div>
      </div>

      {/* Tone Selection */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Music className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">نغمة الإشعارات</span>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          {toneOptions.map((toneOption) => (
            <Button
              key={toneOption}
              variant={tone === toneOption ? "default" : "outline"}
              size="sm"
              onClick={() => handleToneChange(toneOption)}
              className={cn(
                "text-xs h-9",
                tone === toneOption && "ring-2 ring-primary ring-offset-2"
              )}
            >
              {soundToneLabels[toneOption]}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
