import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, Plus, Pencil, Trash2, Calendar, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth-context';
import type { Database } from '@/integrations/supabase/types';

type KategoriPengumuman = Database['public']['Enums']['kategori_pengumuman'];

interface Pengumuman {
  id: string;
  judul: string;
  isi: string;
  kategori: KategoriPengumuman;
  aktif: boolean | null;
  dibuat_oleh: string | null;
  tanggal_dibuat: string | null;
}

export default function PengumumanPage() {
  const [pengumumanList, setPengumumanList] = useState<Pengumuman[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPengumuman, setSelectedPengumuman] = useState<Pengumuman | null>(null);
  const [formData, setFormData] = useState({
    judul: '',
    isi: '',
    kategori: 'umum' as KategoriPengumuman,
    aktif: true,
  });
  const { toast } = useToast();
  const { role, user } = useAuth();

  const canManage = role === 'admin' || role === 'guru';

  useEffect(() => {
    fetchPengumuman();
  }, []);

  const fetchPengumuman = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('pengumuman')
        .select('*')
        .order('tanggal_dibuat', { ascending: false });

      if (error) throw error;
      setPengumumanList(data || []);
    } catch (error) {
      console.error('Error fetching pengumuman:', error);
      toast({
        title: 'Error',
        description: 'Gagal memuat data pengumuman',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (selectedPengumuman) {
        const { error } = await supabase
          .from('pengumuman')
          .update({
            judul: formData.judul,
            isi: formData.isi,
            kategori: formData.kategori,
            aktif: formData.aktif,
          })
          .eq('id', selectedPengumuman.id);

        if (error) throw error;
        toast({ title: 'Berhasil', description: 'Pengumuman berhasil diperbarui' });
      } else {
        const { error } = await supabase.from('pengumuman').insert({
          judul: formData.judul,
          isi: formData.isi,
          kategori: formData.kategori,
          aktif: formData.aktif,
          dibuat_oleh: user?.id,
        });

        if (error) throw error;
        toast({ title: 'Berhasil', description: 'Pengumuman baru berhasil ditambahkan' });
      }

      setIsDialogOpen(false);
      setSelectedPengumuman(null);
      setFormData({ judul: '', isi: '', kategori: 'umum', aktif: true });
      fetchPengumuman();
    } catch (error: any) {
      console.error('Error saving pengumuman:', error);
      toast({
        title: 'Error',
        description: error.message || 'Gagal menyimpan pengumuman',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (pengumuman: Pengumuman) => {
    setSelectedPengumuman(pengumuman);
    setFormData({
      judul: pengumuman.judul,
      isi: pengumuman.isi,
      kategori: pengumuman.kategori,
      aktif: pengumuman.aktif ?? true,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus pengumuman ini?')) return;

    try {
      const { error } = await supabase.from('pengumuman').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Berhasil', description: 'Pengumuman berhasil dihapus' });
      fetchPengumuman();
    } catch (error) {
      console.error('Error deleting pengumuman:', error);
      toast({
        title: 'Error',
        description: 'Gagal menghapus pengumuman',
        variant: 'destructive',
      });
    }
  };

  const getKategoriBadge = (kategori: KategoriPengumuman) => {
    switch (kategori) {
      case 'akademik':
        return <Badge className="bg-blue-500/10 text-blue-700 border-blue-200">Akademik</Badge>;
      case 'libur':
        return <Badge className="bg-green-500/10 text-green-700 border-green-200">Libur</Badge>;
      case 'umum':
        return <Badge className="bg-gray-500/10 text-gray-700 border-gray-200">Umum</Badge>;
      default:
        return <Badge variant="secondary">{kategori}</Badge>;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <PageHeader
        title="Pengumuman"
        description="Informasi dan pengumuman sekolah"
        icon={Bell}
        action={canManage && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setSelectedPengumuman(null);
                setFormData({ judul: '', isi: '', kategori: 'umum', aktif: true });
              }}>
                <Plus className="w-4 h-4 mr-2" />
                Buat Pengumuman
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {selectedPengumuman ? 'Edit Pengumuman' : 'Buat Pengumuman Baru'}
                </DialogTitle>
                <DialogDescription>
                  {selectedPengumuman ? 'Perbarui pengumuman' : 'Isi form berikut'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Judul Pengumuman</Label>
                  <Input
                    value={formData.judul}
                    onChange={(e) => setFormData({ ...formData, judul: e.target.value })}
                    placeholder="Masukkan judul pengumuman..."
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Kategori</Label>
                  <Select
                    value={formData.kategori}
                    onValueChange={(value: KategoriPengumuman) => setFormData({ ...formData, kategori: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="akademik">Akademik</SelectItem>
                      <SelectItem value="libur">Libur</SelectItem>
                      <SelectItem value="umum">Umum</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Isi Pengumuman</Label>
                  <Textarea
                    value={formData.isi}
                    onChange={(e) => setFormData({ ...formData, isi: e.target.value })}
                    placeholder="Tulis isi pengumuman..."
                    rows={5}
                    required
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="aktif">Status Aktif</Label>
                  <Switch
                    id="aktif"
                    checked={formData.aktif}
                    onCheckedChange={(checked) => setFormData({ ...formData, aktif: checked })}
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Batal
                  </Button>
                  <Button type="submit">
                    {selectedPengumuman ? 'Simpan Perubahan' : 'Publikasikan'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-1/4 mt-2" />
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-muted rounded w-full mb-2" />
                <div className="h-4 bg-muted rounded w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : pengumumanList.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Belum ada pengumuman</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pengumumanList.map((pengumuman, index) => (
            <motion.div
              key={pengumuman.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className={`hover:shadow-lg transition-shadow ${!pengumuman.aktif ? 'opacity-60' : ''}`}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <CardTitle className="text-lg line-clamp-2">{pengumuman.judul}</CardTitle>
                      <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {pengumuman.tanggal_dibuat && new Date(pengumuman.tanggal_dibuat).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </div>
                        {getKategoriBadge(pengumuman.kategori)}
                        {!pengumuman.aktif && <Badge variant="secondary">Nonaktif</Badge>}
                      </div>
                    </div>
                    {canManage && (
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(pengumuman)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(pengumuman.id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-3 whitespace-pre-wrap">
                    {pengumuman.isi}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
