import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Plus, Pencil, Trash2, Loader2, Upload } from 'lucide-react';
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
import { z } from 'zod';
import { BulkImportDialog } from '@/components/bulk-import/BulkImportDialog';

const createSiswaSchema = z.object({
  nama: z.string().min(2, 'Nama minimal 2 karakter').max(100),
  email: z.string().email('Email tidak valid').max(255),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  nis: z.string().min(1, 'NIS wajib diisi').max(50),
  kelas_id: z.string().optional(),
  tanggal_lahir: z.string().optional(),
  alamat: z.string().max(500).optional(),
});

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
  const [isSaving, setIsSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [selectedSiswa, setSelectedSiswa] = useState<Siswa | null>(null);
  const [formData, setFormData] = useState({
    nama: '',
    email: '',
    password: '',
    nis: '',
    kelas_id: '',
    tanggal_lahir: '',
    alamat: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
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

  const resetForm = () => {
    setFormData({
      nama: '',
      email: '',
      password: '',
      nis: '',
      kelas_id: '',
      tanggal_lahir: '',
      alamat: '',
    });
    setErrors({});
    setSelectedSiswa(null);
    setIsCreateMode(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsSaving(true);
    
    try {
      if (isCreateMode) {
        // Validate form data
        const result = createSiswaSchema.safeParse(formData);
        if (!result.success) {
          const fieldErrors: Record<string, string> = {};
          result.error.errors.forEach(err => {
            if (err.path[0]) {
              fieldErrors[err.path[0] as string] = err.message;
            }
          });
          setErrors(fieldErrors);
          setIsSaving(false);
          return;
        }

        // Create user account
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: { nama: formData.nama },
            emailRedirectTo: `${window.location.origin}/`,
          },
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error('Gagal membuat akun pengguna');

        // Assign role as siswa
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({ user_id: authData.user.id, role: 'siswa' });

        if (roleError) throw roleError;

        // Create siswa record
        const { error: siswaError } = await supabase
          .from('siswa')
          .insert({
            user_id: authData.user.id,
            nis: formData.nis,
            kelas_id: formData.kelas_id || null,
            tanggal_lahir: formData.tanggal_lahir || null,
            alamat: formData.alamat || null,
          });

        if (siswaError) throw siswaError;

        toast({ title: 'Berhasil', description: 'Siswa baru berhasil ditambahkan' });
      } else if (selectedSiswa) {
        // Update existing siswa
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
      resetForm();
      fetchSiswa();
    } catch (error: any) {
      console.error('Error saving siswa:', error);
      if (error.message?.includes('already registered')) {
        toast({
          title: 'Error',
          description: 'Email sudah terdaftar',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          description: error.message || 'Gagal menyimpan data siswa',
          variant: 'destructive',
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreate = () => {
    resetForm();
    setIsCreateMode(true);
    setIsDialogOpen(true);
  };

  const handleEdit = (siswa: Siswa) => {
    setSelectedSiswa(siswa);
    setIsCreateMode(false);
    setFormData({
      nama: siswa.profiles?.nama || '',
      email: siswa.profiles?.email || '',
      password: '',
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
        action={role === 'admin' && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsBulkImportOpen(true)}>
              <Upload className="w-4 h-4 mr-2" />
              Bulk Import
            </Button>
            <Button onClick={handleCreate}>
              <Plus className="w-4 h-4 mr-2" />
              Tambah Siswa
            </Button>
          </div>
        )}
      />
      
      <BulkImportDialog
        open={isBulkImportOpen}
        onOpenChange={setIsBulkImportOpen}
        type="siswa"
        kelasList={kelasList}
        onSuccess={fetchSiswa}
      />

      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {isCreateMode ? 'Tambah Siswa Baru' : 'Edit Data Siswa'}
            </DialogTitle>
            <DialogDescription>
              {isCreateMode 
                ? 'Isi form berikut untuk menambah siswa baru' 
                : 'Perbarui informasi siswa'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {isCreateMode && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="nama">Nama Lengkap *</Label>
                  <Input
                    id="nama"
                    value={formData.nama}
                    onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                    placeholder="Masukkan nama lengkap"
                    required
                  />
                  {errors.nama && <p className="text-sm text-destructive">{errors.nama}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@sekolah.com"
                    required
                  />
                  {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Minimal 6 karakter"
                    required
                  />
                  {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                </div>
              </>
            )}
            <div className="space-y-2">
              <Label htmlFor="nis">NIS *</Label>
              <Input
                id="nis"
                value={formData.nis}
                onChange={(e) => setFormData({ ...formData, nis: e.target.value })}
                placeholder="Nomor Induk Siswa"
                required
              />
              {errors.nis && <p className="text-sm text-destructive">{errors.nis}</p>}
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
                placeholder="Alamat lengkap"
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
                  isCreateMode ? 'Tambah Siswa' : 'Simpan Perubahan'
                )}
              </Button>
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
