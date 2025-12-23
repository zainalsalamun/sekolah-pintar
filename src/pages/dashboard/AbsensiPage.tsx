import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ClipboardCheck, Plus, CheckCircle, XCircle, AlertCircle, MinusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth-context';
import type { Database } from '@/integrations/supabase/types';

type StatusKehadiran = Database['public']['Enums']['status_kehadiran'];

interface Absensi {
  id: string;
  tanggal: string;
  status: StatusKehadiran;
  keterangan: string | null;
  siswa_id: string;
  kelas_id: string;
  created_at: string | null;
  siswa?: { nis: string; profiles?: { nama: string } | null } | null;
  kelas?: { nama_kelas: string } | null;
}

export default function AbsensiPage() {
  const [absensiList, setAbsensiList] = useState<Absensi[]>([]);
  const [kelasList, setKelasList] = useState<{ id: string; nama_kelas: string }[]>([]);
  const [siswaList, setSiswaList] = useState<{ id: string; nama: string; nis: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    status: 'hadir' as StatusKehadiran,
    keterangan: '',
    siswa_id: '',
    kelas_id: '',
  });
  const { toast } = useToast();
  const { role } = useAuth();

  useEffect(() => {
    fetchAbsensi();
    fetchKelas();
  }, []);

  useEffect(() => {
    if (formData.kelas_id) {
      fetchSiswaByKelas(formData.kelas_id);
    }
  }, [formData.kelas_id]);

  const fetchAbsensi = async () => {
    setIsLoading(true);
    try {
      const { data: absensiData, error } = await supabase
        .from('absensi')
        .select(`*, siswa(nis, user_id), kelas(nama_kelas)`)
        .order('tanggal', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      const siswaUserIds = absensiData?.map(a => a.siswa?.user_id).filter(Boolean) || [];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, nama')
        .in('id', siswaUserIds);

      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);
      
      const enrichedData = (absensiData || []).map(a => ({
        ...a,
        siswa: a.siswa ? { ...a.siswa, profiles: profilesMap.get(a.siswa.user_id) || null } : null,
      }));

      setAbsensiList(enrichedData as any);
    } catch (error) {
      console.error('Error fetching absensi:', error);
      toast({
        title: 'Error',
        description: 'Gagal memuat data absensi',
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

  const fetchSiswaByKelas = async (kelasId: string) => {
    try {
      const { data: siswaData, error } = await supabase
        .from('siswa')
        .select('id, nis, user_id')
        .eq('kelas_id', kelasId);

      if (error) throw error;

      const userIds = siswaData?.map(s => s.user_id) || [];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, nama')
        .in('id', userIds);

      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);

      setSiswaList((siswaData || []).map(s => ({
        id: s.id,
        nama: profilesMap.get(s.user_id)?.nama || 'Tanpa Nama',
        nis: s.nis,
      })));
    } catch (error) {
      console.error('Error fetching siswa:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { error } = await supabase.from('absensi').insert({
        tanggal: formData.tanggal,
        status: formData.status,
        keterangan: formData.keterangan || null,
        siswa_id: formData.siswa_id,
        kelas_id: formData.kelas_id,
      });

      if (error) throw error;
      toast({ title: 'Berhasil', description: 'Absensi berhasil dicatat' });

      setIsDialogOpen(false);
      setFormData({
        tanggal: new Date().toISOString().split('T')[0],
        status: 'hadir',
        keterangan: '',
        siswa_id: '',
        kelas_id: '',
      });
      fetchAbsensi();
    } catch (error: any) {
      console.error('Error saving absensi:', error);
      toast({
        title: 'Error',
        description: error.message || 'Gagal menyimpan absensi',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: StatusKehadiran) => {
    switch (status) {
      case 'hadir':
        return <Badge className="bg-green-500/10 text-green-700 border-green-200"><CheckCircle className="w-3 h-3 mr-1" />Hadir</Badge>;
      case 'sakit':
        return <Badge className="bg-yellow-500/10 text-yellow-700 border-yellow-200"><AlertCircle className="w-3 h-3 mr-1" />Sakit</Badge>;
      case 'izin':
        return <Badge className="bg-blue-500/10 text-blue-700 border-blue-200"><MinusCircle className="w-3 h-3 mr-1" />Izin</Badge>;
      case 'alpha':
        return <Badge className="bg-red-500/10 text-red-700 border-red-200"><XCircle className="w-3 h-3 mr-1" />Alpha</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // Statistics
  const stats = {
    hadir: absensiList.filter(a => a.status === 'hadir').length,
    sakit: absensiList.filter(a => a.status === 'sakit').length,
    izin: absensiList.filter(a => a.status === 'izin').length,
    alpha: absensiList.filter(a => a.status === 'alpha').length,
  };

  const columns = [
    {
      header: 'Tanggal',
      accessor: (row: Absensi) => new Date(row.tanggal).toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
    },
    {
      header: 'Nama Siswa',
      accessor: (row: Absensi) => row.siswa?.profiles?.nama || '-',
    },
    {
      header: 'NIS',
      accessor: (row: Absensi) => row.siswa?.nis || '-',
    },
    {
      header: 'Kelas',
      accessor: (row: Absensi) => row.kelas?.nama_kelas || '-',
    },
    {
      header: 'Status',
      accessor: (row: Absensi) => getStatusBadge(row.status),
    },
    {
      header: 'Keterangan',
      accessor: (row: Absensi) => row.keterangan || '-',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <PageHeader
        title="Absensi Siswa"
        description="Kelola kehadiran siswa"
        icon={ClipboardCheck}
        action={(role === 'admin' || role === 'guru') && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Catat Absensi
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Catat Absensi</DialogTitle>
                <DialogDescription>Isi form berikut untuk mencatat kehadiran</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Tanggal</Label>
                  <Input
                    type="date"
                    value={formData.tanggal}
                    onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Kelas</Label>
                  <Select
                    value={formData.kelas_id}
                    onValueChange={(value) => setFormData({ ...formData, kelas_id: value, siswa_id: '' })}
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
                <div className="space-y-2">
                  <Label>Siswa</Label>
                  <Select
                    value={formData.siswa_id}
                    onValueChange={(value) => setFormData({ ...formData, siswa_id: value })}
                    disabled={!formData.kelas_id}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih siswa" />
                    </SelectTrigger>
                    <SelectContent>
                      {siswaList.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.nama} ({s.nis})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status Kehadiran</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: StatusKehadiran) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hadir">Hadir</SelectItem>
                      <SelectItem value="sakit">Sakit</SelectItem>
                      <SelectItem value="izin">Izin</SelectItem>
                      <SelectItem value="alpha">Alpha</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Keterangan (Opsional)</Label>
                  <Textarea
                    value={formData.keterangan}
                    onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                    placeholder="Tambahkan keterangan..."
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Batal
                  </Button>
                  <Button type="submit">Simpan</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      />

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-green-200 bg-green-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-700">Hadir</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-700">{stats.hadir}</p>
          </CardContent>
        </Card>
        <Card className="border-yellow-200 bg-yellow-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-700">Sakit</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-yellow-700">{stats.sakit}</p>
          </CardContent>
        </Card>
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">Izin</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-700">{stats.izin}</p>
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-red-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-700">Alpha</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-700">{stats.alpha}</p>
          </CardContent>
        </Card>
      </div>

      <DataTable
        columns={columns}
        data={absensiList}
        searchKey="tanggal"
        searchPlaceholder="Cari berdasarkan tanggal..."
        isLoading={isLoading}
        emptyMessage="Belum ada data absensi"
      />
    </motion.div>
  );
}
