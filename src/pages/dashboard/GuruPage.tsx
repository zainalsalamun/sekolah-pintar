import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Guru {
  id: string;
  nip: string | null;
  user_id: string;
  created_at: string | null;
  profiles?: { nama: string; email: string } | null;
}

export default function GuruPage() {
  const [guruList, setGuruList] = useState<Guru[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedGuru, setSelectedGuru] = useState<Guru | null>(null);
  const [formData, setFormData] = useState({
    nip: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchGuru();
  }, []);

  const fetchGuru = async () => {
    setIsLoading(true);
    try {
      const { data: guruData, error } = await supabase
        .from('guru')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const userIds = guruData?.map(g => g.user_id) || [];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, nama, email')
        .in('id', userIds);

      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);
      
      const enrichedData = (guruData || []).map(g => ({
        ...g,
        profiles: profilesMap.get(g.user_id) || null,
      }));

      setGuruList(enrichedData as any);
    } catch (error) {
      console.error('Error fetching guru:', error);
      toast({
        title: 'Error',
        description: 'Gagal memuat data guru',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (selectedGuru) {
        const { error } = await supabase
          .from('guru')
          .update({ nip: formData.nip || null })
          .eq('id', selectedGuru.id);

        if (error) throw error;
        toast({ title: 'Berhasil', description: 'Data guru berhasil diperbarui' });
      }

      setIsDialogOpen(false);
      setSelectedGuru(null);
      fetchGuru();
    } catch (error: any) {
      console.error('Error saving guru:', error);
      toast({
        title: 'Error',
        description: error.message || 'Gagal menyimpan data guru',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (guru: Guru) => {
    setSelectedGuru(guru);
    setFormData({ nip: guru.nip || '' });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus data guru ini?')) return;

    try {
      const { error } = await supabase
        .from('guru')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: 'Berhasil', description: 'Data guru berhasil dihapus' });
      fetchGuru();
    } catch (error) {
      console.error('Error deleting guru:', error);
      toast({
        title: 'Error',
        description: 'Gagal menghapus data guru',
        variant: 'destructive',
      });
    }
  };

  const columns = [
    {
      header: 'NIP',
      accessor: (row: Guru) => row.nip || '-',
    },
    {
      header: 'Nama',
      accessor: (row: Guru) => row.profiles?.nama || '-',
    },
    {
      header: 'Email',
      accessor: (row: Guru) => row.profiles?.email || '-',
    },
    {
      header: 'Aksi',
      accessor: (row: Guru) => (
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
        title="Data Guru"
        description="Kelola data guru sekolah"
        icon={Users}
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Data Guru</DialogTitle>
            <DialogDescription>Perbarui informasi guru</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nip">NIP</Label>
              <Input
                id="nip"
                value={formData.nip}
                onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Batal
              </Button>
              <Button type="submit">Simpan Perubahan</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <DataTable
        columns={columns}
        data={guruList}
        searchKey="nip"
        searchPlaceholder="Cari NIP guru..."
        isLoading={isLoading}
        emptyMessage="Belum ada data guru"
      />
    </motion.div>
  );
}
