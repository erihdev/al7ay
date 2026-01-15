import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Plus, Trash2, Star, Package, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface AppVersion {
  id: string;
  version: string;
  release_notes: string | null;
  is_current: boolean | null;
  created_at: string;
}

export function VersionManager() {
  const queryClient = useQueryClient();
  const [newVersion, setNewVersion] = useState('');
  const [newReleaseNotes, setNewReleaseNotes] = useState('');
  const [isAddingVersion, setIsAddingVersion] = useState(false);

  // Fetch all versions
  const { data: versions, isLoading } = useQuery({
    queryKey: ['app-versions-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_versions')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as AppVersion[];
    },
  });

  // Add version mutation
  const addVersion = useMutation({
    mutationFn: async (versionData: { version: string; release_notes: string; is_current: boolean }) => {
      // If setting as current, first unset any existing current version
      if (versionData.is_current) {
        await supabase
          .from('app_versions')
          .update({ is_current: false })
          .eq('is_current', true);
      }

      const { error } = await supabase
        .from('app_versions')
        .insert({
          version: versionData.version,
          release_notes: versionData.release_notes,
          is_current: versionData.is_current,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-versions-admin'] });
      setNewVersion('');
      setNewReleaseNotes('');
      setIsAddingVersion(false);
      toast.success('تم إضافة الإصدار بنجاح');
    },
    onError: () => {
      toast.error('حدث خطأ أثناء إضافة الإصدار');
    },
  });

  // Set as current mutation
  const setAsCurrent = useMutation({
    mutationFn: async (versionId: string) => {
      // First unset any existing current version
      await supabase
        .from('app_versions')
        .update({ is_current: false })
        .eq('is_current', true);

      // Set new current version
      const { error } = await supabase
        .from('app_versions')
        .update({ is_current: true })
        .eq('id', versionId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-versions-admin'] });
      toast.success('تم تعيين الإصدار الحالي');
    },
    onError: () => {
      toast.error('حدث خطأ أثناء التحديث');
    },
  });

  // Delete version mutation
  const deleteVersion = useMutation({
    mutationFn: async (versionId: string) => {
      const { error } = await supabase
        .from('app_versions')
        .delete()
        .eq('id', versionId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-versions-admin'] });
      toast.success('تم حذف الإصدار');
    },
    onError: () => {
      toast.error('حدث خطأ أثناء الحذف');
    },
  });

  const handleAddVersion = () => {
    if (!newVersion.trim()) {
      toast.error('يرجى إدخال رقم الإصدار');
      return;
    }
    addVersion.mutate({
      version: newVersion.trim(),
      release_notes: newReleaseNotes.trim(),
      is_current: versions?.length === 0, // First version is automatically current
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          إدارة إصدارات التطبيق
        </CardTitle>
        <Button
          size="sm"
          onClick={() => setIsAddingVersion(!isAddingVersion)}
        >
          <Plus className="h-4 w-4 ml-2" />
          إصدار جديد
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add New Version Form */}
        {isAddingVersion && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="version">رقم الإصدار *</Label>
                <Input
                  id="version"
                  placeholder="مثال: 1.2.0"
                  value={newVersion}
                  onChange={(e) => setNewVersion(e.target.value)}
                  dir="ltr"
                  className="text-left"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="releaseNotes">ملاحظات الإصدار</Label>
                <Textarea
                  id="releaseNotes"
                  placeholder="أضف التحديثات والتغييرات الجديدة في هذا الإصدار..."
                  value={newReleaseNotes}
                  onChange={(e) => setNewReleaseNotes(e.target.value)}
                  rows={4}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleAddVersion}
                  disabled={addVersion.isPending}
                >
                  {addVersion.isPending ? 'جاري الإضافة...' : 'إضافة الإصدار'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsAddingVersion(false);
                    setNewVersion('');
                    setNewReleaseNotes('');
                  }}
                >
                  إلغاء
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Versions List */}
        {versions?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            لا توجد إصدارات مسجلة
          </div>
        ) : (
          <div className="space-y-3">
            {versions?.map((version) => (
              <Card key={version.id} className={version.is_current ? 'border-primary' : ''}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-mono font-bold text-lg" dir="ltr">
                          v{version.version}
                        </span>
                        {version.is_current && (
                          <Badge className="bg-primary">
                            <Star className="h-3 w-3 ml-1" />
                            الإصدار الحالي
                          </Badge>
                        )}
                      </div>
                      {version.release_notes && (
                        <p className="text-sm text-muted-foreground whitespace-pre-line mb-2">
                          {version.release_notes}
                        </p>
                      )}
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(version.created_at), 'dd MMMM yyyy - hh:mm a', { locale: ar })}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!version.is_current && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setAsCurrent.mutate(version.id)}
                          disabled={setAsCurrent.isPending}
                        >
                          تعيين كحالي
                        </Button>
                      )}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent dir="rtl">
                          <AlertDialogHeader>
                            <AlertDialogTitle>حذف الإصدار</AlertDialogTitle>
                            <AlertDialogDescription>
                              هل أنت متأكد من حذف الإصدار {version.version}؟ لا يمكن التراجع عن هذا الإجراء.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="flex-row-reverse gap-2">
                            <AlertDialogCancel>إلغاء</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteVersion.mutate(version.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              حذف
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
