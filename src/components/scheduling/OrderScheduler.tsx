import { useState } from 'react';
import { format, addHours, setHours, setMinutes, startOfHour, isBefore, addDays } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Clock, Calendar as CalendarIcon, X } from 'lucide-react';

interface OrderSchedulerProps {
  scheduledFor: Date | null;
  onScheduleChange: (date: Date | null) => void;
}

export function OrderScheduler({ scheduledFor, onScheduleChange }: OrderSchedulerProps) {
  const [scheduleType, setScheduleType] = useState<'now' | 'later'>(scheduledFor ? 'later' : 'now');
  const [selectedDate, setSelectedDate] = useState<Date>(scheduledFor || addHours(new Date(), 1));
  const [selectedHour, setSelectedHour] = useState<string>(
    scheduledFor ? format(scheduledFor, 'HH') : format(addHours(new Date(), 1), 'HH')
  );
  const [selectedMinute, setSelectedMinute] = useState<string>(
    scheduledFor ? format(scheduledFor, 'mm') : '00'
  );
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const now = new Date();
  const minDate = now;
  const maxDate = addDays(now, 7); // Allow scheduling up to 7 days ahead

  // Generate available hours (from current hour + 1 to 23)
  const availableHours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));

  // Generate available minutes (00, 15, 30, 45)
  const availableMinutes = ['00', '15', '30', '45'];

  const handleScheduleTypeChange = (value: 'now' | 'later') => {
    setScheduleType(value);
    if (value === 'now') {
      onScheduleChange(null);
    } else {
      updateScheduledTime(selectedDate, selectedHour, selectedMinute);
    }
  };

  const updateScheduledTime = (date: Date, hour: string, minute: string) => {
    const scheduledDate = setMinutes(setHours(date, parseInt(hour)), parseInt(minute));

    // Ensure the scheduled time is in the future
    if (isBefore(scheduledDate, addHours(now, 1))) {
      const minScheduleTime = startOfHour(addHours(now, 1));
      onScheduleChange(minScheduleTime);
      setSelectedHour(format(minScheduleTime, 'HH'));
      setSelectedMinute('00');
    } else {
      onScheduleChange(scheduledDate);
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      updateScheduledTime(date, selectedHour, selectedMinute);
      setIsCalendarOpen(false);
    }
  };

  const handleHourChange = (hour: string) => {
    setSelectedHour(hour);
    updateScheduledTime(selectedDate, hour, selectedMinute);
  };

  const handleMinuteChange = (minute: string) => {
    setSelectedMinute(minute);
    updateScheduledTime(selectedDate, selectedHour, minute);
  };

  const clearSchedule = () => {
    setScheduleType('now');
    onScheduleChange(null);
  };

  return (
    <div className="space-y-4">
      <Label className="font-semibold flex items-center gap-2">
        <Clock className="h-4 w-4" />
        موعد الطلب
      </Label>

      <RadioGroup
        value={scheduleType}
        onValueChange={(v) => handleScheduleTypeChange(v as 'now' | 'later')}
        className="flex gap-4"
      >
        <div className="flex items-center gap-2 flex-1">
          <RadioGroupItem value="now" id="schedule-now" />
          <Label htmlFor="schedule-now" className="cursor-pointer">
            الآن
          </Label>
        </div>
        <div className="flex items-center gap-2 flex-1">
          <RadioGroupItem value="later" id="schedule-later" />
          <Label htmlFor="schedule-later" className="cursor-pointer">
            جدولة لاحقاً
          </Label>
        </div>
      </RadioGroup>

      {scheduleType === 'later' && (
        <div className="space-y-3 p-4 bg-background/40 backdrop-blur-sm rounded-xl border border-white/10">
          {/* Date Picker */}
          <div className="space-y-2">
            <Label className="text-sm">التاريخ</Label>
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start font-arabic">
                  <CalendarIcon className="h-4 w-4 ml-2" />
                  {format(selectedDate, 'EEEE, d MMMM yyyy', { locale: ar })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  disabled={(date) => isBefore(date, minDate) || isBefore(maxDate, date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time Picker */}
          <div className="flex gap-3">
            <div className="flex-1 space-y-2">
              <Label className="text-sm">الساعة</Label>
              <Select value={selectedHour} onValueChange={handleHourChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableHours.map((hour) => (
                    <SelectItem key={hour} value={hour}>
                      {hour}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 space-y-2">
              <Label className="text-sm">الدقيقة</Label>
              <Select value={selectedMinute} onValueChange={handleMinuteChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableMinutes.map((minute) => (
                    <SelectItem key={minute} value={minute}>
                      {minute}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Summary */}
          {scheduledFor && (
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-primary/10 to-transparent rounded-xl border border-primary/20">
              <div>
                <p className="text-sm font-medium text-primary">موعد التوصيل</p>
                <p className="text-xs text-muted-foreground">
                  {format(scheduledFor, 'EEEE, d MMMM - hh:mm a', { locale: ar })}
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={clearSchedule}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
