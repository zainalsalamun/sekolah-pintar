import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Mapel {
  id: string;
  nama_mapel: string;
  created_at: string | null;
}

export default function MapelPage() {
  const [mapelList, setMapelList] = useState<Mapel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedMapel, setSelectedMapel] = useState<Mapel | null>(null);
  const [formData, setFormData] = useState({ nama_mapel: '' });
  const { toast } = useToast();

  useEffect(() => {
    fetchMapel();
  }, []);

  const fetchMapel = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('mata_pelajaran')
        .select('*')
        .order('nama_mapel');

      if (error) throw error;
      setMapelList(data || []);
    } catch (error) {
      console.error('Error fetching mapel:', error);
      toast({
        title: 'Error',
        description: 'Gagal memuat data mata pelajaran',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (selectedMapel) {
        const { error } = await supabase
          .from('mata_pelajaran')
          .update({ nama_mapel: formData.nama_mapel })
          .eq('id', selectedMapel.id);

        if (error) throw error;
        toast({ title: 'Berhasil', description: 'Mata pelajaran berhasil diperbarui' });
      } else {
        const { error } = await supabase
          .from('mata_pelajaran')
          .insert({ nama_mapel: formData.nama_mapel });

        if (error) throw error;
        toast({ title: 'Berhasil', description: 'Mata pelajaran baru berhasil ditambahkan' });
      }

      setIsDialogOpen(false);
      setSelectedMapel(null);
      setFormData({ nama_mapel: '' });
      fetchMapel();
    } catch (error: any) {
      console.error('Error saving mapel:', error);
      toast({
        title: 'Error',
        description: error.message || 'Gagal menyimpan mata pelajaran',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (mapel: Mapel) => {
    setSelectedMapel(mapel);
    setFormData({ nama_mapel: mapel.nama_mapel });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus mata pelajaran ini?')) return;

    try {
      const { error } = await supabase.from('mata_pelajaran').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Berhasil', description: 'Mata pelajaran berhasil dihapus' });
      fetchMapel();
    } catch (error) {
      console.error('Error deleting mapel:', error);
      toast({
        title: 'Error',
        description: 'Gagal menghapus mata pelajaran. Pastikan tidak ada data terkait.',
        variant: 'destructive',
      });
    }
  };

  const columns = [
    {
      header: 'Nama Mata Pelajaran',
      accessor: 'nama_mapel' as keyof Mapel,
    },
    {
      header: 'Aksi',
      accessor: (row: Mapel) => (
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
        title="Mata Pelajaran"
        description="Kelola mata pelajaran sekolah"
        icon={BookOpen}
        action={
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setSelectedMapel(null);
                setFormData({ nama_mapel: '' });
              }}>
                <Plus className="w-4 h-4 mr-2" />
                Tambah Mapel
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {selectedMapel ? 'Edit Mata Pelajaran' : 'Tambah Mata Pelajaran'}
                </DialogTitle>
                <DialogDescription>
                  {selectedMapel ? 'Perbarui nama mata pelajaran' : 'Isi form berikut'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nama_mapel">Nama Mata Pelajaran</Label>
                  <Input
                    id="nama_mapel"
                    value={formData.nama_mapel}
                    onChange={(e) => setFormData({ nama_mapel: e.target.value })}
                    placeholder="Contoh: Matematika"
                    required
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Batal
                  </Button>
                  <Button type="submit">
                    {selectedMapel ? 'Simpan Perubahan' : 'Tambah Mapel'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <DataTable
        columns={columns}
        data={mapelList}
        searchKey="nama_mapel"
        searchPlaceholder="Cari mata pelajaran..."
        isLoading={isLoading}
        emptyMessage="Belum ada data mata pelajaran"
      />
    </motion.div>
  );
}
