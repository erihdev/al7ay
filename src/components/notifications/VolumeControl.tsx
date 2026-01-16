import { useState } from 'react';
import { Volume2, VolumeX, Volume1, Music, ChevronDown, ChevronUp, Play } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  getNotificationVolume, 
  setNotificationVolume, 
  getNotificationTone,
  setNotificationTone,
  getPerStatusTonesEnabled,
  setPerStatusTonesEnabled,
  getStatusTone,
  setStatusTone,
  playDemoSound,
  playStatusDemoSound,
  soundToneLabels,
  orderStatusLabels,
  type SoundTone,
  type OrderStatus
} from '@/utils/orderSounds';
import { cn } from '@/lib/utils';

interface VolumeControlProps {
  className?: string;
  showLabel?: boolean;
}

const toneOptions: SoundTone[] = ['classic', 'modern', 'gentle', 'retro'];
const statusOptions: OrderStatus[] = ['pending', 'preparing', 'ready', 'out_for_delivery', 'completed', 'cancelled'];

const statusIcons: Record<OrderStatus, string> = {
  pending: '📦',
  preparing: '☕',
  ready: '✅',
  out_for_delivery: '🚗',
  completed: '🎉',
  cancelled: '❌',
};

export function VolumeControl({ className, showLabel = true }: VolumeControlProps) {
  const [volume, setVolume] = useState(() => getNotificationVolume());
  const [tone, setTone] = useState<SoundTone>(() => getNotificationTone());
  const [perStatusEnabled, setPerStatusEnabled] = useState(() => getPerStatusTonesEnabled());
  const [statusTones, setStatusTones] = useState<Record<OrderStatus, SoundTone>>(() => {
    const tones: Record<OrderStatus, SoundTone> = {} as Record<OrderStatus, SoundTone>;
    statusOptions.forEach(status => {
      tones[status] = getStatusTone(status);
    });
    return tones;
  });
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    setNotificationVolume(newVolume);
  };

  const handleToneChange = (newTone: SoundTone) => {
    setTone(newTone);
    setNotificationTone(newTone);
    setTimeout(() => playDemoSound(newTone), 100);
  };

  const handlePerStatusToggle = (enabled: boolean) => {
    setPerStatusEnabled(enabled);
    setPerStatusTonesEnabled(enabled);
    if (enabled) {
      setIsAdvancedOpen(true);
    }
  };

  const handleStatusToneChange = (status: OrderStatus, newTone: SoundTone) => {
    setStatusTones(prev => ({ ...prev, [status]: newTone }));
    setStatusTone(status, newTone);
    setTimeout(() => playStatusDemoSound(status, newTone), 100);
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

      {/* Global Tone Selection */}
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

      {/* Per-Status Tones Toggle */}
      <div className="pt-2 border-t">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-sm font-medium">نغمات مخصصة لكل حالة</span>
            <p className="text-xs text-muted-foreground">اختر نغمة مختلفة لكل حالة طلب</p>
          </div>
          <Switch
            checked={perStatusEnabled}
            onCheckedChange={handlePerStatusToggle}
          />
        </div>
      </div>

      {/* Per-Status Tone Settings */}
      {perStatusEnabled && (
        <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-between text-xs">
              <span>إعدادات النغمات المتقدمة</span>
              {isAdvancedOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 pt-2">
            {statusOptions.map((status) => (
              <div key={status} className="space-y-2 p-3 rounded-lg bg-muted/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{statusIcons[status]}</span>
                    <span className="text-sm font-medium">{orderStatusLabels[status]}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => playStatusDemoSound(status, statusTones[status])}
                  >
                    <Play className="h-3 w-3" />
                  </Button>
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {toneOptions.map((toneOption) => (
                    <Button
                      key={toneOption}
                      variant={statusTones[status] === toneOption ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleStatusToneChange(status, toneOption)}
                      className={cn(
                        "text-xs h-7 px-2 flex-1 min-w-[60px]",
                        statusTones[status] === toneOption && "ring-1 ring-primary ring-offset-1"
                      )}
                    >
                      {soundToneLabels[toneOption]}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}
