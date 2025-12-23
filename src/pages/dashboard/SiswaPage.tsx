import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Plus, Pencil, Trash2 } from 'lucide-react';
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
import { useAuth } from '@/lib/auth-context';

interface Siswa {
  id: string;
  nis: string;
  user_id: string;
  kelas_id: string | null;
  orang_tua_id: string | null;
  tanggal_lahir: string | null;
  alamat: string | null;
  created_at: string | null;
  profiles?: { nama: string; email: string } | null;
  kelas?: { nama_kelas: string } | null;
}

interface Kelas {
  id: string;
  nama_kelas: string;
}

export default function SiswaPage() {
  const [siswaList, setSiswaList] = useState<Siswa[]>([]);
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedSiswa, setSelectedSiswa] = useState<Siswa | null>(null);
  const [formData, setFormData] = useState({
    nis: '',
    kelas_id: '',
    tanggal_lahir: '',
    alamat: '',
  });
  const { toast } = useToast();
  const { role } = useAuth();

  useEffect(() => {
    fetchSiswa();
    fetchKelas();
  }, []);

  const fetchSiswa = async () => {
    setIsLoading(true);
    try {
      const { data: siswaData, error } = await supabase
        .from('siswa')
        .select(`*, kelas(nama_kelas)`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch profiles separately
      const userIds = siswaData?.map(s => s.user_id) || [];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, nama, email')
        .in('id', userIds);

      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);
      
      const enrichedData = (siswaData || []).map(s => ({
        ...s,
        profiles: profilesMap.get(s.user_id) || null,
      }));

      setSiswaList(enrichedData as any);
    } catch (error) {
      console.error('Error fetching siswa:', error);
      toast({
        title: 'Error',
        description: 'Gagal memuat data siswa',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchKelas = async () => {
    try {
      const { data, error } = await supabase
        .from('kelas')
        .select('id, nama_kelas')
        .order('nama_kelas');

      if (error) throw error;
      setKelasList(data || []);
    } catch (error) {
      console.error('Error fetching kelas:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (selectedSiswa) {
        const { error } = await supabase
          .from('siswa')
          .update({
            nis: formData.nis,
            kelas_id: formData.kelas_id || null,
            tanggal_lahir: formData.tanggal_lahir || null,
            alamat: formData.alamat || null,
          })
          .eq('id', selectedSiswa.id);

        if (error) throw error;
        toast({ title: 'Berhasil', description: 'Data siswa berhasil diperbarui' });
      }

      setIsDialogOpen(false);
      setSelectedSiswa(null);
      fetchSiswa();
    } catch (error: any) {
      console.error('Error saving siswa:', error);
      toast({
        title: 'Error',
        description: error.message || 'Gagal menyimpan data siswa',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (siswa: Siswa) => {
    setSelectedSiswa(siswa);
    setFormData({
      nis: siswa.nis,
      kelas_id: siswa.kelas_id || '',
      tanggal_lahir: siswa.tanggal_lahir || '',
      alamat: siswa.alamat || '',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus data siswa ini?')) return;

    try {
      const { error } = await supabase
        .from('siswa')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: 'Berhasil', description: 'Data siswa berhasil dihapus' });
      fetchSiswa();
    } catch (error) {
      console.error('Error deleting siswa:', error);
      toast({
        title: 'Error',
        description: 'Gagal menghapus data siswa',
        variant: 'destructive',
      });
    }
  };

  const columns = [
    {
      header: 'NIS',
      accessor: 'nis' as keyof Siswa,
    },
    {
      header: 'Nama',
      accessor: (row: Siswa) => row.profiles?.nama || '-',
    },
    {
      header: 'Email',
      accessor: (row: Siswa) => row.profiles?.email || '-',
    },
    {
      header: 'Kelas',
      accessor: (row: Siswa) => (
        <Badge variant="outline">{row.kelas?.nama_kelas || '-'}</Badge>
      ),
    },
    {
      header: 'Alamat',
      accessor: (row: Siswa) => row.alamat || '-',
    },
    ...(role === 'admin' ? [{
      header: 'Aksi',
      accessor: (row: Siswa) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => handleEdit(row)}>
            <Pencil className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => handleDelete(row.id)}>
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        </div>
      ),
    }] : []),
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <PageHeader
        title="Data Siswa"
        description="Kelola data siswa sekolah"
        icon={Users}
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Data Siswa</DialogTitle>
            <DialogDescription>Perbarui informasi siswa</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nis">NIS</Label>
              <Input
                id="nis"
                value={formData.nis}
                onChange={(e) => setFormData({ ...formData, nis: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="kelas">Kelas</Label>
              <Select
                value={formData.kelas_id}
                onValueChange={(value) => setFormData({ ...formData, kelas_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kelas" />
                </SelectTrigger>
                <SelectContent>
                  {kelasList.map((kelas) => (
                    <SelectItem key={kelas.id} value={kelas.id}>
                      {kelas.nama_kelas}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tanggal_lahir">Tanggal Lahir</Label>
              <Input
                id="tanggal_lahir"
                type="date"
                value={formData.tanggal_lahir}
                onChange={(e) => setFormData({ ...formData, tanggal_lahir: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="alamat">Alamat</Label>
              <Input
                id="alamat"
                value={formData.alamat}
                onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
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
        data={siswaList}
        searchKey="nis"
        searchPlaceholder="Cari NIS siswa..."
        isLoading={isLoading}
        emptyMessage="Belum ada data siswa"
      />
    </motion.div>
  );
}
