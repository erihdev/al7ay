import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  MapPin, 
  Check, 
  X, 
  Search, 
  Clock,
  User,
  Building,
  Mail,
  ExternalLink,
  Map
} from 'lucide-react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useMapboxToken } from '@/hooks/useMapboxToken';

interface SuggestedNeighborhood {
  id: string;
  name: string;
  city: string;
  lat: number | null;
  lng: number | null;
  address: string | null;
  suggested_by_email: string;
  suggested_by_name: string;
  application_id: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
}

// Map component for displaying suggestions
function SuggestionsMap({ 
  suggestions, 
  onSelectSuggestion 
}: { 
  suggestions: SuggestedNeighborhood[];
  onSelectSuggestion: (s: SuggestedNeighborhood) => void;
}) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const { data: mapboxToken, isLoading: tokenLoading } = useMapboxToken();
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    if (!showMap || !mapboxToken || !mapContainer.current || map.current) return;

    mapboxgl.accessToken = mapboxToken;
    
    const suggestionsWithCoords = suggestions.filter(s => s.lat && s.lng);
    const center: [number, number] = suggestionsWithCoords.length > 0 
      ? [suggestionsWithCoords[0].lng!, suggestionsWithCoords[0].lat!]
      : [46.6753, 24.7136]; // Riyadh default

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center,
      zoom: 10,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-left');

    return () => {
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
      map.current?.remove();
      map.current = null;
    };
  }, [showMap, mapboxToken]);

  useEffect(() => {
    if (!map.current || !showMap) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add markers for each suggestion with coordinates
    suggestions.forEach((suggestion) => {
      if (!suggestion.lat || !suggestion.lng) return;

      const el = document.createElement('div');
      el.className = 'suggestion-marker';
      el.innerHTML = `
        <div style="
          background: linear-gradient(135deg, #7C3AED, #5B21B6);
          color: white;
          padding: 8px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: bold;
          box-shadow: 0 4px 12px rgba(124, 58, 237, 0.4);
          cursor: pointer;
          white-space: nowrap;
          display: flex;
          align-items: center;
          gap: 4px;
        ">
          <span style="font-size: 14px;">📍</span>
          ${suggestion.name}
        </div>
      `;

      el.addEventListener('click', () => {
        onSelectSuggestion(suggestion);
      });

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([suggestion.lng, suggestion.lat])
        .addTo(map.current!);

      markersRef.current.push(marker);
    });

    // Fit bounds to show all markers
    const suggestionsWithCoords = suggestions.filter(s => s.lat && s.lng);
    if (suggestionsWithCoords.length > 1) {
      const bounds = new mapboxgl.LngLatBounds();
      suggestionsWithCoords.forEach(s => {
        bounds.extend([s.lng!, s.lat!]);
      });
      map.current.fitBounds(bounds, { padding: 50 });
    }
  }, [suggestions, showMap, onSelectSuggestion]);

  const suggestionsWithCoords = suggestions.filter(s => s.lat && s.lng);

  if (suggestionsWithCoords.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Map className="h-5 w-5" />
            خريطة الأحياء المقترحة
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowMap(!showMap)}
          >
            {showMap ? 'إخفاء الخريطة' : 'عرض الخريطة'}
          </Button>
        </div>
      </CardHeader>
      {showMap && (
        <CardContent>
          {tokenLoading ? (
            <Skeleton className="h-80 w-full rounded-lg" />
          ) : (
            <div 
              ref={mapContainer} 
              className="h-80 w-full rounded-lg overflow-hidden"
            />
          )}
          <p className="text-xs text-muted-foreground mt-2 text-center">
            اضغط على أي موقع لمراجعة الاقتراح
          </p>
        </CardContent>
      )}
    </Card>
  );
}

export function SuggestedNeighborhoodsManager() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSuggestion, setSelectedSuggestion] = useState<SuggestedNeighborhood | null>(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [providerCount, setProviderCount] = useState(0);

  const { data: suggestions, isLoading } = useQuery({
    queryKey: ['suggested-neighborhoods'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('suggested_neighborhoods')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as SuggestedNeighborhood[];
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (suggestion: SuggestedNeighborhood) => {
      // Add to active_neighborhoods
      const { error: insertError } = await supabase
        .from('active_neighborhoods')
        .insert({
          name: suggestion.name,
          city: suggestion.city,
          lat: suggestion.lat || 0,
          lng: suggestion.lng || 0,
          provider_count: providerCount,
          is_active: true,
        });

      if (insertError) throw insertError;

      // Update suggestion status
      const { error: updateError } = await supabase
        .from('suggested_neighborhoods')
        .update({
          status: 'approved',
          admin_notes: adminNotes,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', suggestion.id);

      if (updateError) throw updateError;

      // Send email notification to user
      try {
        await supabase.functions.invoke('send-application-email', {
          body: {
            type: 'neighborhood_approved',
            email: suggestion.suggested_by_email,
            fullName: suggestion.suggested_by_name,
            neighborhoodName: suggestion.name,
            city: suggestion.city,
            notes: adminNotes,
          },
        });
      } catch (emailError) {
        console.error('Error sending approval email:', emailError);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suggested-neighborhoods'] });
      queryClient.invalidateQueries({ queryKey: ['neighborhoods'] });
      toast.success('تم قبول الحي وإضافته للقائمة وإرسال إشعار للمستخدم');
      setShowApproveDialog(false);
      setSelectedSuggestion(null);
      setAdminNotes('');
      setProviderCount(0);
    },
    onError: (error) => {
      console.error('Error approving suggestion:', error);
      toast.error('حدث خطأ أثناء قبول الاقتراح');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (suggestion: SuggestedNeighborhood) => {
      const { error } = await supabase
        .from('suggested_neighborhoods')
        .update({
          status: 'rejected',
          admin_notes: adminNotes,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', suggestion.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suggested-neighborhoods'] });
      toast.success('تم رفض الاقتراح');
      setShowRejectDialog(false);
      setSelectedSuggestion(null);
      setAdminNotes('');
    },
    onError: (error) => {
      console.error('Error rejecting suggestion:', error);
      toast.error('حدث خطأ أثناء رفض الاقتراح');
    },
  });

  const filteredSuggestions = suggestions?.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.suggested_by_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingSuggestions = filteredSuggestions?.filter(s => s.status === 'pending') || [];
  const reviewedSuggestions = filteredSuggestions?.filter(s => s.status !== 'pending') || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 ml-1" /> قيد المراجعة</Badge>;
      case 'approved':
        return <Badge className="bg-green-500"><Check className="h-3 w-3 ml-1" /> مقبول</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><X className="h-3 w-3 ml-1" /> مرفوض</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <div className="grid gap-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="البحث في اقتراحات الأحياء..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pr-10 font-arabic"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-yellow-600">{pendingSuggestions.length}</p>
            <p className="text-sm text-muted-foreground">قيد المراجعة</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">
              {suggestions?.filter(s => s.status === 'approved').length || 0}
            </p>
            <p className="text-sm text-muted-foreground">مقبول</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-red-600">
              {suggestions?.filter(s => s.status === 'rejected').length || 0}
            </p>
            <p className="text-sm text-muted-foreground">مرفوض</p>
          </CardContent>
        </Card>
      </div>

      {/* Interactive Map */}
      <SuggestionsMap suggestions={pendingSuggestions} onSelectSuggestion={(s) => {
        setSelectedSuggestion(s);
        setShowApproveDialog(true);
      }} />

      {/* Pending Suggestions */}
      {pendingSuggestions.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-bold text-lg">اقتراحات قيد المراجعة</h3>
          <div className="grid gap-4">
            {pendingSuggestions.map((suggestion) => (
              <Card key={suggestion.id} className="border-yellow-200 bg-yellow-50/50 dark:bg-yellow-950/20">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-primary" />
                        <span className="font-bold text-lg">{suggestion.name}</span>
                        <span className="text-muted-foreground">- {suggestion.city}</span>
                      </div>
                      
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {suggestion.suggested_by_name}
                        </span>
                        <span className="flex items-center gap-1">
                          <Mail className="h-4 w-4" />
                          {suggestion.suggested_by_email}
                        </span>
                      </div>

                      {suggestion.address && (
                        <p className="text-sm text-muted-foreground">
                          📍 {suggestion.address}
                        </p>
                      )}

                      {suggestion.lat && suggestion.lng && (
                        <a
                          href={`https://www.google.com/maps?q=${suggestion.lat},${suggestion.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline flex items-center gap-1"
                        >
                          <ExternalLink className="h-3 w-3" />
                          عرض على الخريطة
                        </a>
                      )}

                      <p className="text-xs text-muted-foreground">
                        تم الإرسال: {new Date(suggestion.created_at).toLocaleDateString('ar-SA')}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedSuggestion(suggestion);
                          setShowApproveDialog(true);
                        }}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Check className="h-4 w-4 ml-1" />
                        قبول
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          setSelectedSuggestion(suggestion);
                          setShowRejectDialog(true);
                        }}
                      >
                        <X className="h-4 w-4 ml-1" />
                        رفض
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Reviewed Suggestions */}
      {reviewedSuggestions.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-bold text-lg">الاقتراحات السابقة</h3>
          <div className="grid gap-4">
            {reviewedSuggestions.map((suggestion) => (
              <Card key={suggestion.id} className="opacity-75">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium">{suggestion.name}</span>
                        <span className="text-muted-foreground">- {suggestion.city}</span>
                        {getStatusBadge(suggestion.status)}
                      </div>
                      
                      <p className="text-sm text-muted-foreground">
                        مقترح من: {suggestion.suggested_by_name}
                      </p>

                      {suggestion.admin_notes && (
                        <p className="text-sm bg-muted p-2 rounded">
                          ملاحظات: {suggestion.admin_notes}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {filteredSuggestions?.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>لا توجد اقتراحات أحياء</p>
        </div>
      )}

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent className="font-arabic" dir="rtl">
          <DialogHeader>
            <DialogTitle>قبول اقتراح الحي</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="font-bold">{selectedSuggestion?.name}</p>
              <p className="text-muted-foreground">{selectedSuggestion?.city}</p>
            </div>

            <div className="space-y-2">
              <Label>عدد مقدمي الخدمات الأولي</Label>
              <Input
                type="number"
                min="0"
                value={providerCount}
                onChange={(e) => setProviderCount(parseInt(e.target.value) || 0)}
              />
            </div>

            <div className="space-y-2">
              <Label>ملاحظات (اختياري)</Label>
              <Textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="أضف ملاحظات..."
                className="font-arabic"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
              إلغاء
            </Button>
            <Button 
              onClick={() => selectedSuggestion && approveMutation.mutate(selectedSuggestion)}
              disabled={approveMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {approveMutation.isPending ? 'جاري القبول...' : 'قبول وإضافة للقائمة'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="font-arabic" dir="rtl">
          <DialogHeader>
            <DialogTitle>رفض اقتراح الحي</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="font-bold">{selectedSuggestion?.name}</p>
              <p className="text-muted-foreground">{selectedSuggestion?.city}</p>
            </div>

            <div className="space-y-2">
              <Label>سبب الرفض (اختياري)</Label>
              <Textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="أضف سبب الرفض..."
                className="font-arabic"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              إلغاء
            </Button>
            <Button 
              variant="destructive"
              onClick={() => selectedSuggestion && rejectMutation.mutate(selectedSuggestion)}
              disabled={rejectMutation.isPending}
            >
              {rejectMutation.isPending ? 'جاري الرفض...' : 'رفض الاقتراح'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
