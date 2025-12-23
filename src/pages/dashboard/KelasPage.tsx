import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Plus, Pencil, Trash2 } from 'lucide-react';
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
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Kelas {
  id: string;
  nama_kelas: string;
  tahun_ajaran_id: string | null;
  created_at: string | null;
  tahun_ajaran?: { nama: string; aktif: boolean } | null;
}

interface TahunAjaran {
  id: string;
  nama: string;
  aktif: boolean | null;
}

export default function KelasPage() {
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [tahunAjaranList, setTahunAjaranList] = useState<TahunAjaran[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedKelas, setSelectedKelas] = useState<Kelas | null>(null);
  const [formData, setFormData] = useState({
    nama_kelas: '',
    tahun_ajaran_id: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchKelas();
    fetchTahunAjaran();
  }, []);

  const fetchKelas = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('kelas')
        .select(`
          *,
          tahun_ajaran:tahun_ajaran_id(nama, aktif)
        `)
        .order('nama_kelas');

      if (error) throw error;
      setKelasList(data || []);
    } catch (error) {
      console.error('Error fetching kelas:', error);
      toast({
        title: 'Error',
        description: 'Gagal memuat data kelas',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTahunAjaran = async () => {
    try {
      const { data, error } = await supabase
        .from('tahun_ajaran')
        .select('id, nama, aktif')
        .order('nama', { ascending: false });

      if (error) throw error;
      setTahunAjaranList(data || []);
    } catch (error) {
      console.error('Error fetching tahun ajaran:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (selectedKelas) {
        const { error } = await supabase
          .from('kelas')
          .update({
            nama_kelas: formData.nama_kelas,
            tahun_ajaran_id: formData.tahun_ajaran_id || null,
          })
          .eq('id', selectedKelas.id);

        if (error) throw error;
        toast({ title: 'Berhasil', description: 'Data kelas berhasil diperbarui' });
      } else {
        const { error } = await supabase
          .from('kelas')
          .insert({
            nama_kelas: formData.nama_kelas,
            tahun_ajaran_id: formData.tahun_ajaran_id || null,
          });

        if (error) throw error;
        toast({ title: 'Berhasil', description: 'Kelas baru berhasil ditambahkan' });
      }

      setIsDialogOpen(false);
      setSelectedKelas(null);
      setFormData({ nama_kelas: '', tahun_ajaran_id: '' });
      fetchKelas();
    } catch (error: any) {
      console.error('Error saving kelas:', error);
      toast({
        title: 'Error',
        description: error.message || 'Gagal menyimpan data kelas',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (kelas: Kelas) => {
    setSelectedKelas(kelas);
    setFormData({
      nama_kelas: kelas.nama_kelas,
      tahun_ajaran_id: kelas.tahun_ajaran_id || '',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus kelas ini?')) return;

    try {
      const { error } = await supabase.from('kelas').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Berhasil', description: 'Kelas berhasil dihapus' });
      fetchKelas();
    } catch (error) {
      console.error('Error deleting kelas:', error);
      toast({
        title: 'Error',
        description: 'Gagal menghapus kelas. Pastikan tidak ada data terkait.',
        variant: 'destructive',
      });
    }
  };

  const columns = [
    {
      header: 'Nama Kelas',
      accessor: 'nama_kelas' as keyof Kelas,
    },
    {
      header: 'Tahun Ajaran',
      accessor: (row: Kelas) => (
        <div className="flex items-center gap-2">
          <span>{row.tahun_ajaran?.nama || '-'}</span>
          {row.tahun_ajaran?.aktif && (
            <Badge variant="default" className="text-xs">Aktif</Badge>
          )}
        </div>
      ),
    },
    {
      header: 'Aksi',
      accessor: (row: Kelas) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => handleEdit(row)}>
            <Pencil className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => handleDelete(row.id)}>
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
        title="Data Kelas"
        description="Kelola kelas sekolah"
        icon={BookOpen}
        action={
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setSelectedKelas(null);
                setFormData({ nama_kelas: '', tahun_ajaran_id: '' });
              }}>
                <Plus className="w-4 h-4 mr-2" />
                Tambah Kelas
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {selectedKelas ? 'Edit Kelas' : 'Tambah Kelas Baru'}
                </DialogTitle>
                <DialogDescription>
                  {selectedKelas ? 'Perbarui informasi kelas' : 'Isi form berikut untuk menambah kelas'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nama_kelas">Nama Kelas</Label>
                  <Input
                    id="nama_kelas"
                    value={formData.nama_kelas}
                    onChange={(e) => setFormData({ ...formData, nama_kelas: e.target.value })}
                    placeholder="Contoh: X IPA 1"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tahun_ajaran">Tahun Ajaran</Label>
                  <Select
                    value={formData.tahun_ajaran_id}
                    onValueChange={(value) => setFormData({ ...formData, tahun_ajaran_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih tahun ajaran" />
                    </SelectTrigger>
                    <SelectContent>
                      {tahunAjaranList.map((ta) => (
                        <SelectItem key={ta.id} value={ta.id}>
                          {ta.nama} {ta.aktif && '(Aktif)'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Batal
                  </Button>
                  <Button type="submit">
                    {selectedKelas ? 'Simpan Perubahan' : 'Tambah Kelas'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <DataTable
        columns={columns}
        data={kelasList}
        searchKey="nama_kelas"
        searchPlaceholder="Cari nama kelas..."
        isLoading={isLoading}
        emptyMessage="Belum ada data kelas"
      />
    </motion.div>
  );
}
