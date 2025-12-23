import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CalendarDays, Plus, Pencil, Trash2, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { PageHeader } from '@/components/ui/page-header';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

interface TahunAjaran {
  id: string;
  nama: string;
  aktif: boolean | null;
  created_at: string | null;
}

export default function TahunAjaranPage() {
  const [tahunAjaranList, setTahunAjaranList] = useState<TahunAjaran[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTahunAjaran, setSelectedTahunAjaran] = useState<TahunAjaran | null>(null);
  const [formData, setFormData] = useState({
    nama: '',
    aktif: false,
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchTahunAjaran();
  }, []);

  const fetchTahunAjaran = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('tahun_ajaran')
        .select('*')
        .order('nama', { ascending: false });

      if (error) throw error;
      setTahunAjaranList(data || []);
    } catch (error) {
      console.error('Error fetching tahun ajaran:', error);
      toast({
        title: 'Error',
        description: 'Gagal memuat data tahun ajaran',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ nama: '', aktif: false });
    setSelectedTahunAjaran(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      if (!formData.nama.trim()) {
        toast({
          title: 'Error',
          description: 'Nama tahun ajaran wajib diisi',
          variant: 'destructive',
        });
        setIsSaving(false);
        return;
      }

      // If setting this as active, deactivate others first
      if (formData.aktif) {
        await supabase
          .from('tahun_ajaran')
          .update({ aktif: false })
          .neq('id', selectedTahunAjaran?.id || '');
      }

      if (selectedTahunAjaran) {
        // Update existing
        const { error } = await supabase
          .from('tahun_ajaran')
          .update({
            nama: formData.nama,
            aktif: formData.aktif,
          })
          .eq('id', selectedTahunAjaran.id);

        if (error) throw error;
        toast({ title: 'Berhasil', description: 'Tahun ajaran berhasil diperbarui' });
      } else {
        // Create new
        const { error } = await supabase
          .from('tahun_ajaran')
          .insert({
            nama: formData.nama,
            aktif: formData.aktif,
          });

        if (error) throw error;
        toast({ title: 'Berhasil', description: 'Tahun ajaran baru berhasil ditambahkan' });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchTahunAjaran();
    } catch (error: any) {
      console.error('Error saving tahun ajaran:', error);
      toast({
        title: 'Error',
        description: error.message || 'Gagal menyimpan tahun ajaran',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreate = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleEdit = (tahunAjaran: TahunAjaran) => {
    setSelectedTahunAjaran(tahunAjaran);
    setFormData({
      nama: tahunAjaran.nama,
      aktif: tahunAjaran.aktif || false,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus tahun ajaran ini?')) return;

    try {
      const { error } = await supabase
        .from('tahun_ajaran')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: 'Berhasil', description: 'Tahun ajaran berhasil dihapus' });
      fetchTahunAjaran();
    } catch (error: any) {
      console.error('Error deleting tahun ajaran:', error);
      toast({
        title: 'Error',
        description: error.message || 'Gagal menghapus tahun ajaran',
        variant: 'destructive',
      });
    }
  };

  const handleSetActive = async (tahunAjaran: TahunAjaran) => {
    try {
      // Deactivate all first
      await supabase
        .from('tahun_ajaran')
        .update({ aktif: false })
        .neq('id', tahunAjaran.id);

      // Set this one as active
      const { error } = await supabase
        .from('tahun_ajaran')
        .update({ aktif: true })
        .eq('id', tahunAjaran.id);

      if (error) throw error;
      toast({ title: 'Berhasil', description: `${tahunAjaran.nama} sekarang aktif` });
      fetchTahunAjaran();
    } catch (error: any) {
      console.error('Error setting active:', error);
      toast({
        title: 'Error',
        description: 'Gagal mengubah status aktif',
        variant: 'destructive',
      });
    }
  };

  const columns = [
    {
      header: 'Nama Tahun Ajaran',
      accessor: 'nama' as keyof TahunAjaran,
    },
    {
      header: 'Status',
      accessor: (row: TahunAjaran) => (
        row.aktif ? (
          <Badge className="bg-green-500 hover:bg-green-600">
            <CheckCircle className="w-3 h-3 mr-1" />
            Aktif
          </Badge>
        ) : (
          <Badge variant="outline">Tidak Aktif</Badge>
        )
      ),
    },
    {
      header: 'Dibuat',
      accessor: (row: TahunAjaran) => 
        row.created_at 
          ? format(new Date(row.created_at), 'd MMM yyyy', { locale: localeId })
          : '-',
    },
    {
      header: 'Aksi',
      accessor: (row: TahunAjaran) => (
        <div className="flex items-center gap-2">
          {!row.aktif && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleSetActive(row)}
            >
              Set Aktif
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={() => handleEdit(row)}>
            <Pencil className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => handleDelete(row.id)}
            disabled={row.aktif || false}
          >
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <PageHeader
        title="Tahun Ajaran"
        description="Kelola tahun ajaran sekolah"
        icon={CalendarDays}
        action={
          <Button onClick={handleCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Tambah Tahun Ajaran
          </Button>
        }
      />

      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedTahunAjaran ? 'Edit Tahun Ajaran' : 'Tambah Tahun Ajaran'}
            </DialogTitle>
            <DialogDescription>
              {selectedTahunAjaran 
                ? 'Perbarui informasi tahun ajaran' 
                : 'Isi form berikut untuk menambah tahun ajaran baru'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nama">Nama Tahun Ajaran *</Label>
              <Input
                id="nama"
                value={formData.nama}
                onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                placeholder="Contoh: 2024/2025"
                required
              />
              <p className="text-xs text-muted-foreground">
                Format: Tahun awal/Tahun akhir (misal: 2024/2025)
              </p>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="aktif">Tahun Ajaran Aktif</Label>
                <p className="text-sm text-muted-foreground">
                  Hanya satu tahun ajaran yang dapat aktif
                </p>
              </div>
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
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  selectedTahunAjaran ? 'Simpan Perubahan' : 'Tambah'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <DataTable
        columns={columns}
        data={tahunAjaranList}
        searchKey="nama"
        searchPlaceholder="Cari tahun ajaran..."
        isLoading={isLoading}
        emptyMessage="Belum ada data tahun ajaran"
      />
    </motion.div>
  );
}
