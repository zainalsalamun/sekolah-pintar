import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Plus, Pencil, Trash2 } from 'lucide-react';
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

interface Jadwal {
  id: string;
  hari: string;
  jam_mulai: string;
  jam_selesai: string;
  kelas_id: string;
  mata_pelajaran_id: string;
  guru_id: string;
  created_at: string | null;
  kelas?: { nama_kelas: string } | null;
  mata_pelajaran?: { nama_mapel: string } | null;
  guru?: { profiles?: { nama: string } | null } | null;
}

const HARI_LIST = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

export default function JadwalPage() {
  const [jadwalList, setJadwalList] = useState<Jadwal[]>([]);
  const [kelasList, setKelasList] = useState<{ id: string; nama_kelas: string }[]>([]);
  const [mapelList, setMapelList] = useState<{ id: string; nama_mapel: string }[]>([]);
  const [guruList, setGuruList] = useState<{ id: string; nama: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedJadwal, setSelectedJadwal] = useState<Jadwal | null>(null);
  const [formData, setFormData] = useState({
    hari: '',
    jam_mulai: '',
    jam_selesai: '',
    kelas_id: '',
    mata_pelajaran_id: '',
    guru_id: '',
  });
  const { toast } = useToast();
  const { role } = useAuth();

  useEffect(() => {
    fetchJadwal();
    fetchOptions();
  }, []);

  const fetchJadwal = async () => {
    setIsLoading(true);
    try {
      const { data: jadwalData, error } = await supabase
        .from('jadwal')
        .select(`*, kelas(nama_kelas), mata_pelajaran(nama_mapel), guru(user_id)`)
        .order('hari')
        .order('jam_mulai');

      if (error) throw error;

      const guruUserIds = jadwalData?.map(j => j.guru?.user_id).filter(Boolean) || [];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, nama')
        .in('id', guruUserIds);

      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);
      
      const enrichedData = (jadwalData || []).map(j => ({
        ...j,
        guru: j.guru ? { ...j.guru, profiles: profilesMap.get(j.guru.user_id) || null } : null,
      }));

      setJadwalList(enrichedData as any);
    } catch (error) {
      console.error('Error fetching jadwal:', error);
      toast({
        title: 'Error',
        description: 'Gagal memuat data jadwal',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOptions = async () => {
    try {
      const [kelasRes, mapelRes, guruRes] = await Promise.all([
        supabase.from('kelas').select('id, nama_kelas').order('nama_kelas'),
        supabase.from('mata_pelajaran').select('id, nama_mapel').order('nama_mapel'),
        supabase.from('guru').select('id, user_id'),
      ]);

      if (kelasRes.data) setKelasList(kelasRes.data);
      if (mapelRes.data) setMapelList(mapelRes.data);
      
      if (guruRes.data) {
        const userIds = guruRes.data.map(g => g.user_id);
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, nama')
          .in('id', userIds);

        const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);

        setGuruList(guruRes.data.map(g => ({
          id: g.id,
          nama: profilesMap.get(g.user_id)?.nama || 'Tanpa Nama',
        })));
      }
    } catch (error) {
      console.error('Error fetching options:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (selectedJadwal) {
        const { error } = await supabase
          .from('jadwal')
          .update(formData)
          .eq('id', selectedJadwal.id);

        if (error) throw error;
        toast({ title: 'Berhasil', description: 'Jadwal berhasil diperbarui' });
      } else {
        const { error } = await supabase.from('jadwal').insert(formData);
        if (error) throw error;
        toast({ title: 'Berhasil', description: 'Jadwal baru berhasil ditambahkan' });
      }

      setIsDialogOpen(false);
      setSelectedJadwal(null);
      setFormData({
        hari: '',
        jam_mulai: '',
        jam_selesai: '',
        kelas_id: '',
        mata_pelajaran_id: '',
        guru_id: '',
      });
      fetchJadwal();
    } catch (error: any) {
      console.error('Error saving jadwal:', error);
      toast({
        title: 'Error',
        description: error.message || 'Gagal menyimpan jadwal',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (jadwal: Jadwal) => {
    setSelectedJadwal(jadwal);
    setFormData({
      hari: jadwal.hari,
      jam_mulai: jadwal.jam_mulai,
      jam_selesai: jadwal.jam_selesai,
      kelas_id: jadwal.kelas_id,
      mata_pelajaran_id: jadwal.mata_pelajaran_id,
      guru_id: jadwal.guru_id,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus jadwal ini?')) return;

    try {
      const { error } = await supabase.from('jadwal').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Berhasil', description: 'Jadwal berhasil dihapus' });
      fetchJadwal();
    } catch (error) {
      console.error('Error deleting jadwal:', error);
      toast({
        title: 'Error',
        description: 'Gagal menghapus jadwal',
        variant: 'destructive',
      });
    }
  };

  const getHariBadgeColor = (hari: string) => {
    const colors: Record<string, string> = {
      Senin: 'bg-blue-500/10 text-blue-700 border-blue-200',
      Selasa: 'bg-green-500/10 text-green-700 border-green-200',
      Rabu: 'bg-yellow-500/10 text-yellow-700 border-yellow-200',
      Kamis: 'bg-purple-500/10 text-purple-700 border-purple-200',
      Jumat: 'bg-pink-500/10 text-pink-700 border-pink-200',
      Sabtu: 'bg-orange-500/10 text-orange-700 border-orange-200',
    };
    return colors[hari] || '';
  };

  const columns = [
    {
      header: 'Hari',
      accessor: (row: Jadwal) => (
        <Badge className={getHariBadgeColor(row.hari)}>{row.hari}</Badge>
      ),
    },
    {
      header: 'Jam',
      accessor: (row: Jadwal) => `${row.jam_mulai} - ${row.jam_selesai}`,
    },
    {
      header: 'Mata Pelajaran',
      accessor: (row: Jadwal) => row.mata_pelajaran?.nama_mapel || '-',
    },
    {
      header: 'Kelas',
      accessor: (row: Jadwal) => row.kelas?.nama_kelas || '-',
    },
    {
      header: 'Guru',
      accessor: (row: Jadwal) => row.guru?.profiles?.nama || '-',
    },
    ...(role === 'admin' ? [{
      header: 'Aksi',
      accessor: (row: Jadwal) => (
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
        title="Jadwal Pelajaran"
        description="Kelola jadwal pelajaran sekolah"
        icon={Calendar}
        action={role === 'admin' && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setSelectedJadwal(null);
                setFormData({
                  hari: '',
                  jam_mulai: '',
                  jam_selesai: '',
                  kelas_id: '',
                  mata_pelajaran_id: '',
                  guru_id: '',
                });
              }}>
                <Plus className="w-4 h-4 mr-2" />
                Tambah Jadwal
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {selectedJadwal ? 'Edit Jadwal' : 'Tambah Jadwal Baru'}
                </DialogTitle>
                <DialogDescription>
                  {selectedJadwal ? 'Perbarui informasi jadwal' : 'Isi form berikut'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Hari</Label>
                    <Select
                      value={formData.hari}
                      onValueChange={(value) => setFormData({ ...formData, hari: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih hari" />
                      </SelectTrigger>
                      <SelectContent>
                        {HARI_LIST.map((h) => (
                          <SelectItem key={h} value={h}>{h}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Kelas</Label>
                    <Select
                      value={formData.kelas_id}
                      onValueChange={(value) => setFormData({ ...formData, kelas_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih kelas" />
                      </SelectTrigger>
                      <SelectContent>
                        {kelasList.map((k) => (
                          <SelectItem key={k.id} value={k.id}>{k.nama_kelas}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Jam Mulai</Label>
                    <Input
                      type="time"
                      value={formData.jam_mulai}
                      onChange={(e) => setFormData({ ...formData, jam_mulai: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Jam Selesai</Label>
                    <Input
                      type="time"
                      value={formData.jam_selesai}
                      onChange={(e) => setFormData({ ...formData, jam_selesai: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Mata Pelajaran</Label>
                  <Select
                    value={formData.mata_pelajaran_id}
                    onValueChange={(value) => setFormData({ ...formData, mata_pelajaran_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih mata pelajaran" />
                    </SelectTrigger>
                    <SelectContent>
                      {mapelList.map((m) => (
                        <SelectItem key={m.id} value={m.id}>{m.nama_mapel}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Guru</Label>
                  <Select
                    value={formData.guru_id}
                    onValueChange={(value) => setFormData({ ...formData, guru_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih guru" />
                    </SelectTrigger>
                    <SelectContent>
                      {guruList.map((g) => (
                        <SelectItem key={g.id} value={g.id}>{g.nama}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Batal
                  </Button>
                  <Button type="submit">
                    {selectedJadwal ? 'Simpan Perubahan' : 'Tambah Jadwal'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      />

      <DataTable
        columns={columns}
        data={jadwalList}
        searchKey="hari"
        searchPlaceholder="Cari berdasarkan hari..."
        isLoading={isLoading}
        emptyMessage="Belum ada data jadwal"
      />
    </motion.div>
  );
}
