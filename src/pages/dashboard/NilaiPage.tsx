import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Plus, Pencil } from 'lucide-react';
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
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth-context';

interface Nilai {
  id: string;
  nilai_tugas: number | null;
  nilai_uts: number | null;
  nilai_uas: number | null;
  nilai_akhir: number | null;
  semester: number;
  siswa_id: string;
  mata_pelajaran_id: string;
  tahun_ajaran_id: string | null;
  created_at: string | null;
  siswa?: { nis: string; profiles?: { nama: string } | null } | null;
  mata_pelajaran?: { nama_mapel: string } | null;
  tahun_ajaran?: { nama: string } | null;
}

export default function NilaiPage() {
  const [nilaiList, setNilaiList] = useState<Nilai[]>([]);
  const [siswaList, setSiswaList] = useState<{ id: string; nama: string; nis: string }[]>([]);
  const [mapelList, setMapelList] = useState<{ id: string; nama_mapel: string }[]>([]);
  const [tahunAjaranList, setTahunAjaranList] = useState<{ id: string; nama: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedNilai, setSelectedNilai] = useState<Nilai | null>(null);
  const [formData, setFormData] = useState({
    siswa_id: '',
    mata_pelajaran_id: '',
    tahun_ajaran_id: '',
    semester: '1',
    nilai_tugas: '',
    nilai_uts: '',
    nilai_uas: '',
  });
  const { toast } = useToast();
  const { role } = useAuth();

  useEffect(() => {
    fetchNilai();
    fetchOptions();
  }, []);

  const fetchNilai = async () => {
    setIsLoading(true);
    try {
      const { data: nilaiData, error } = await supabase
        .from('nilai')
        .select(`*, siswa(nis, user_id), mata_pelajaran(nama_mapel), tahun_ajaran(nama)`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const siswaUserIds = nilaiData?.map(n => n.siswa?.user_id).filter(Boolean) || [];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, nama')
        .in('id', siswaUserIds);

      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);
      
      const enrichedData = (nilaiData || []).map(n => ({
        ...n,
        siswa: n.siswa ? { ...n.siswa, profiles: profilesMap.get(n.siswa.user_id) || null } : null,
      }));

      setNilaiList(enrichedData as any);
    } catch (error) {
      console.error('Error fetching nilai:', error);
      toast({
        title: 'Error',
        description: 'Gagal memuat data nilai',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOptions = async () => {
    try {
      const [siswaRes, mapelRes, taRes] = await Promise.all([
        supabase.from('siswa').select('id, nis, profiles:user_id(nama)'),
        supabase.from('mata_pelajaran').select('id, nama_mapel').order('nama_mapel'),
        supabase.from('tahun_ajaran').select('id, nama').order('nama', { ascending: false }),
      ]);

      if (siswaRes.data) {
        setSiswaList(siswaRes.data.map(s => ({
          id: s.id,
          nama: s.profiles?.nama || 'Tanpa Nama',
          nis: s.nis,
        })));
      }
      if (mapelRes.data) setMapelList(mapelRes.data);
      if (taRes.data) setTahunAjaranList(taRes.data);
    } catch (error) {
      console.error('Error fetching options:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const nilaiData = {
        siswa_id: formData.siswa_id,
        mata_pelajaran_id: formData.mata_pelajaran_id,
        tahun_ajaran_id: formData.tahun_ajaran_id || null,
        semester: parseInt(formData.semester),
        nilai_tugas: formData.nilai_tugas ? parseFloat(formData.nilai_tugas) : null,
        nilai_uts: formData.nilai_uts ? parseFloat(formData.nilai_uts) : null,
        nilai_uas: formData.nilai_uas ? parseFloat(formData.nilai_uas) : null,
      };

      if (selectedNilai) {
        const { error } = await supabase
          .from('nilai')
          .update(nilaiData)
          .eq('id', selectedNilai.id);

        if (error) throw error;
        toast({ title: 'Berhasil', description: 'Nilai berhasil diperbarui' });
      } else {
        const { error } = await supabase.from('nilai').insert(nilaiData);
        if (error) throw error;
        toast({ title: 'Berhasil', description: 'Nilai baru berhasil ditambahkan' });
      }

      setIsDialogOpen(false);
      setSelectedNilai(null);
      setFormData({
        siswa_id: '',
        mata_pelajaran_id: '',
        tahun_ajaran_id: '',
        semester: '1',
        nilai_tugas: '',
        nilai_uts: '',
        nilai_uas: '',
      });
      fetchNilai();
    } catch (error: any) {
      console.error('Error saving nilai:', error);
      toast({
        title: 'Error',
        description: error.message || 'Gagal menyimpan nilai',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (nilai: Nilai) => {
    setSelectedNilai(nilai);
    setFormData({
      siswa_id: nilai.siswa_id,
      mata_pelajaran_id: nilai.mata_pelajaran_id,
      tahun_ajaran_id: nilai.tahun_ajaran_id || '',
      semester: nilai.semester.toString(),
      nilai_tugas: nilai.nilai_tugas?.toString() || '',
      nilai_uts: nilai.nilai_uts?.toString() || '',
      nilai_uas: nilai.nilai_uas?.toString() || '',
    });
    setIsDialogOpen(true);
  };

  const getNilaiColor = (nilai: number | null) => {
    if (nilai === null) return 'text-muted-foreground';
    if (nilai >= 80) return 'text-green-600 font-semibold';
    if (nilai >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getNilaiBadge = (nilai: number | null) => {
    if (nilai === null) return <span className="text-muted-foreground">-</span>;
    if (nilai >= 80) return <Badge className="bg-green-500/10 text-green-700 border-green-200">{nilai.toFixed(1)}</Badge>;
    if (nilai >= 60) return <Badge className="bg-yellow-500/10 text-yellow-700 border-yellow-200">{nilai.toFixed(1)}</Badge>;
    return <Badge className="bg-red-500/10 text-red-700 border-red-200">{nilai.toFixed(1)}</Badge>;
  };

  const columns = [
    {
      header: 'Nama Siswa',
      accessor: (row: Nilai) => row.siswa?.profiles?.nama || '-',
    },
    {
      header: 'NIS',
      accessor: (row: Nilai) => row.siswa?.nis || '-',
    },
    {
      header: 'Mata Pelajaran',
      accessor: (row: Nilai) => row.mata_pelajaran?.nama_mapel || '-',
    },
    {
      header: 'Semester',
      accessor: (row: Nilai) => `Semester ${row.semester}`,
    },
    {
      header: 'Tugas',
      accessor: (row: Nilai) => <span className={getNilaiColor(row.nilai_tugas)}>{row.nilai_tugas?.toFixed(1) || '-'}</span>,
    },
    {
      header: 'UTS',
      accessor: (row: Nilai) => <span className={getNilaiColor(row.nilai_uts)}>{row.nilai_uts?.toFixed(1) || '-'}</span>,
    },
    {
      header: 'UAS',
      accessor: (row: Nilai) => <span className={getNilaiColor(row.nilai_uas)}>{row.nilai_uas?.toFixed(1) || '-'}</span>,
    },
    {
      header: 'Nilai Akhir',
      accessor: (row: Nilai) => getNilaiBadge(row.nilai_akhir),
    },
    ...((role === 'admin' || role === 'guru') ? [{
      header: 'Aksi',
      accessor: (row: Nilai) => (
        <Button variant="ghost" size="icon" onClick={() => handleEdit(row)}>
          <Pencil className="w-4 h-4" />
        </Button>
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
        title="Data Nilai"
        description="Kelola nilai siswa"
        icon={FileText}
        action={(role === 'admin' || role === 'guru') && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setSelectedNilai(null);
                setFormData({
                  siswa_id: '',
                  mata_pelajaran_id: '',
                  tahun_ajaran_id: '',
                  semester: '1',
                  nilai_tugas: '',
                  nilai_uts: '',
                  nilai_uas: '',
                });
              }}>
                <Plus className="w-4 h-4 mr-2" />
                Input Nilai
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {selectedNilai ? 'Edit Nilai' : 'Input Nilai Baru'}
                </DialogTitle>
                <DialogDescription>
                  {selectedNilai ? 'Perbarui nilai siswa' : 'Isi form berikut untuk menambah nilai'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Siswa</Label>
                  <Select
                    value={formData.siswa_id}
                    onValueChange={(value) => setFormData({ ...formData, siswa_id: value })}
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
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Mata Pelajaran</Label>
                    <Select
                      value={formData.mata_pelajaran_id}
                      onValueChange={(value) => setFormData({ ...formData, mata_pelajaran_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih mapel" />
                      </SelectTrigger>
                      <SelectContent>
                        {mapelList.map((m) => (
                          <SelectItem key={m.id} value={m.id}>{m.nama_mapel}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Semester</Label>
                    <Select
                      value={formData.semester}
                      onValueChange={(value) => setFormData({ ...formData, semester: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Semester 1</SelectItem>
                        <SelectItem value="2">Semester 2</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Tahun Ajaran</Label>
                  <Select
                    value={formData.tahun_ajaran_id}
                    onValueChange={(value) => setFormData({ ...formData, tahun_ajaran_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih tahun ajaran" />
                    </SelectTrigger>
                    <SelectContent>
                      {tahunAjaranList.map((ta) => (
                        <SelectItem key={ta.id} value={ta.id}>{ta.nama}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Nilai Tugas</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={formData.nilai_tugas}
                      onChange={(e) => setFormData({ ...formData, nilai_tugas: e.target.value })}
                      placeholder="0-100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Nilai UTS</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={formData.nilai_uts}
                      onChange={(e) => setFormData({ ...formData, nilai_uts: e.target.value })}
                      placeholder="0-100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Nilai UAS</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={formData.nilai_uas}
                      onChange={(e) => setFormData({ ...formData, nilai_uas: e.target.value })}
                      placeholder="0-100"
                    />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Nilai akhir dihitung otomatis: Tugas 30% + UTS 30% + UAS 40%
                </p>
                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Batal
                  </Button>
                  <Button type="submit">
                    {selectedNilai ? 'Simpan Perubahan' : 'Simpan Nilai'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      />

      <DataTable
        columns={columns}
        data={nilaiList}
        searchKey="siswa_id"
        searchPlaceholder="Cari data nilai..."
        isLoading={isLoading}
        emptyMessage="Belum ada data nilai"
      />
    </motion.div>
  );
}
