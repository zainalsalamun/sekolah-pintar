import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users2, Plus, Pencil, Trash2, Loader2, Upload, Link2 } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';

const createOrangTuaSchema = z.object({
  nama: z.string().min(2, 'Nama minimal 2 karakter').max(100),
  email: z.string().email('Email tidak valid').max(255),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  telepon: z.string().max(20).optional(),
  alamat: z.string().max(500).optional(),
});

interface OrangTua {
  id: string;
  user_id: string;
  telepon: string | null;
  alamat: string | null;
  created_at: string | null;
  profiles?: { nama: string; email: string } | null;
  siswa?: { id: string; nis: string; profiles?: { nama: string } | null }[];
}

interface Siswa {
  id: string;
  nis: string;
  user_id: string;
  orang_tua_id: string | null;
  profiles?: { nama: string } | null;
}

export default function OrangTuaPage() {
  const [orangTuaList, setOrangTuaList] = useState<OrangTua[]>([]);
  const [siswaList, setSiswaList] = useState<Siswa[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [selectedOrangTua, setSelectedOrangTua] = useState<OrangTua | null>(null);
  const [selectedSiswaIds, setSelectedSiswaIds] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    nama: '',
    email: '',
    password: '',
    telepon: '',
    alamat: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  useEffect(() => {
    fetchOrangTua();
    fetchSiswa();
  }, []);

  const fetchOrangTua = async () => {
    setIsLoading(true);
    try {
      const { data: orangTuaData, error } = await supabase
        .from('orang_tua')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const userIds = orangTuaData?.map(ot => ot.user_id) || [];
      const orangTuaIds = orangTuaData?.map(ot => ot.id) || [];

      // Fetch profiles
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, nama, email')
        .in('id', userIds);

      // Fetch linked siswa
      const { data: siswaData } = await supabase
        .from('siswa')
        .select('id, nis, user_id, orang_tua_id')
        .in('orang_tua_id', orangTuaIds);

      // Fetch siswa profiles
      const siswaUserIds = siswaData?.map(s => s.user_id) || [];
      const { data: siswaProfilesData } = await supabase
        .from('profiles')
        .select('id, nama')
        .in('id', siswaUserIds);

      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);
      const siswaProfilesMap = new Map(siswaProfilesData?.map(p => [p.id, p]) || []);

      const enrichedData = (orangTuaData || []).map(ot => ({
        ...ot,
        profiles: profilesMap.get(ot.user_id) || null,
        siswa: (siswaData || [])
          .filter(s => s.orang_tua_id === ot.id)
          .map(s => ({
            ...s,
            profiles: siswaProfilesMap.get(s.user_id) || null,
          })),
      }));

      setOrangTuaList(enrichedData);
    } catch (error) {
      console.error('Error fetching orang tua:', error);
      toast({
        title: 'Error',
        description: 'Gagal memuat data orang tua',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSiswa = async () => {
    try {
      const { data: siswaData, error } = await supabase
        .from('siswa')
        .select('id, nis, user_id, orang_tua_id')
        .order('nis');

      if (error) throw error;

      const userIds = siswaData?.map(s => s.user_id) || [];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, nama')
        .in('id', userIds);

      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);

      const enrichedData = (siswaData || []).map(s => ({
        ...s,
        profiles: profilesMap.get(s.user_id) || null,
      }));

      setSiswaList(enrichedData);
    } catch (error) {
      console.error('Error fetching siswa:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      nama: '',
      email: '',
      password: '',
      telepon: '',
      alamat: '',
    });
    setErrors({});
    setSelectedOrangTua(null);
    setIsCreateMode(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsSaving(true);

    try {
      if (isCreateMode) {
        const result = createOrangTuaSchema.safeParse(formData);
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

        // Assign role as orang_tua
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({ user_id: authData.user.id, role: 'orang_tua' });

        if (roleError) throw roleError;

        // Create orang_tua record
        const { error: orangTuaError } = await supabase
          .from('orang_tua')
          .insert({
            user_id: authData.user.id,
            telepon: formData.telepon || null,
            alamat: formData.alamat || null,
          });

        if (orangTuaError) throw orangTuaError;

        toast({ title: 'Berhasil', description: 'Orang tua baru berhasil ditambahkan' });
      } else if (selectedOrangTua) {
        // Update existing
        const { error } = await supabase
          .from('orang_tua')
          .update({
            telepon: formData.telepon || null,
            alamat: formData.alamat || null,
          })
          .eq('id', selectedOrangTua.id);

        if (error) throw error;
        toast({ title: 'Berhasil', description: 'Data orang tua berhasil diperbarui' });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchOrangTua();
    } catch (error: any) {
      console.error('Error saving orang tua:', error);
      if (error.message?.includes('already registered')) {
        toast({
          title: 'Error',
          description: 'Email sudah terdaftar',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          description: error.message || 'Gagal menyimpan data orang tua',
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

  const handleEdit = (orangTua: OrangTua) => {
    setSelectedOrangTua(orangTua);
    setIsCreateMode(false);
    setFormData({
      nama: orangTua.profiles?.nama || '',
      email: orangTua.profiles?.email || '',
      password: '',
      telepon: orangTua.telepon || '',
      alamat: orangTua.alamat || '',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus data orang tua ini?')) return;

    try {
      // Unlink all siswa first
      await supabase
        .from('siswa')
        .update({ orang_tua_id: null })
        .eq('orang_tua_id', id);

      const { error } = await supabase
        .from('orang_tua')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: 'Berhasil', description: 'Data orang tua berhasil dihapus' });
      fetchOrangTua();
      fetchSiswa();
    } catch (error) {
      console.error('Error deleting orang tua:', error);
      toast({
        title: 'Error',
        description: 'Gagal menghapus data orang tua',
        variant: 'destructive',
      });
    }
  };

  const handleOpenLinkDialog = (orangTua: OrangTua) => {
    setSelectedOrangTua(orangTua);
    setSelectedSiswaIds(orangTua.siswa?.map(s => s.id) || []);
    setIsLinkDialogOpen(true);
  };

  const handleLinkSiswa = async () => {
    if (!selectedOrangTua) return;
    setIsSaving(true);

    try {
      // First, unlink all siswa from this orang tua
      await supabase
        .from('siswa')
        .update({ orang_tua_id: null })
        .eq('orang_tua_id', selectedOrangTua.id);

      // Then link selected siswa
      if (selectedSiswaIds.length > 0) {
        const { error } = await supabase
          .from('siswa')
          .update({ orang_tua_id: selectedOrangTua.id })
          .in('id', selectedSiswaIds);

        if (error) throw error;
      }

      toast({ title: 'Berhasil', description: 'Siswa berhasil dihubungkan' });
      setIsLinkDialogOpen(false);
      setSelectedOrangTua(null);
      setSelectedSiswaIds([]);
      fetchOrangTua();
      fetchSiswa();
    } catch (error: any) {
      console.error('Error linking siswa:', error);
      toast({
        title: 'Error',
        description: error.message || 'Gagal menghubungkan siswa',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleSiswaSelection = (siswaId: string) => {
    setSelectedSiswaIds(prev =>
      prev.includes(siswaId)
        ? prev.filter(id => id !== siswaId)
        : [...prev, siswaId]
    );
  };

  const columns = [
    {
      header: 'Nama',
      accessor: (row: OrangTua) => row.profiles?.nama || '-',
    },
    {
      header: 'Email',
      accessor: (row: OrangTua) => row.profiles?.email || '-',
    },
    {
      header: 'Telepon',
      accessor: (row: OrangTua) => row.telepon || '-',
    },
    {
      header: 'Anak',
      accessor: (row: OrangTua) => (
        <div className="flex flex-wrap gap-1">
          {row.siswa && row.siswa.length > 0 ? (
            row.siswa.map(s => (
              <Badge key={s.id} variant="secondary">
                {s.profiles?.nama || s.nis}
              </Badge>
            ))
          ) : (
            <span className="text-muted-foreground text-sm">Belum ada</span>
          )}
        </div>
      ),
    },
    {
      header: 'Aksi',
      accessor: (row: OrangTua) => (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleOpenLinkDialog(row)}
          >
            <Link2 className="w-4 h-4 mr-1" />
            Hubungkan
          </Button>
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

  // Get available siswa (not linked or linked to current orang tua)
  const availableSiswa = siswaList.filter(
    s => !s.orang_tua_id || s.orang_tua_id === selectedOrangTua?.id
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <PageHeader
        title="Data Orang Tua"
        description="Kelola data orang tua/wali murid"
        icon={Users2}
        action={
          <Button onClick={handleCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Tambah Orang Tua
          </Button>
        }
      />

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {isCreateMode ? 'Tambah Orang Tua Baru' : 'Edit Data Orang Tua'}
            </DialogTitle>
            <DialogDescription>
              {isCreateMode
                ? 'Isi form berikut untuk menambah orang tua baru'
                : 'Perbarui informasi orang tua'}
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
                    placeholder="email@example.com"
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
              <Label htmlFor="telepon">Nomor Telepon</Label>
              <Input
                id="telepon"
                value={formData.telepon}
                onChange={(e) => setFormData({ ...formData, telepon: e.target.value })}
                placeholder="08xxxxxxxxxx"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="alamat">Alamat</Label>
              <Textarea
                id="alamat"
                value={formData.alamat}
                onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                placeholder="Alamat lengkap"
                rows={3}
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
                  isCreateMode ? 'Tambah' : 'Simpan Perubahan'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Link Siswa Dialog */}
      <Dialog open={isLinkDialogOpen} onOpenChange={(open) => {
        setIsLinkDialogOpen(open);
        if (!open) {
          setSelectedOrangTua(null);
          setSelectedSiswaIds([]);
        }
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Hubungkan dengan Siswa</DialogTitle>
            <DialogDescription>
              Pilih siswa yang merupakan anak dari {selectedOrangTua?.profiles?.nama || 'orang tua ini'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="max-h-[300px] overflow-y-auto border rounded-lg divide-y">
              {availableSiswa.length > 0 ? (
                availableSiswa.map(siswa => (
                  <label
                    key={siswa.id}
                    className="flex items-center gap-3 p-3 hover:bg-muted cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedSiswaIds.includes(siswa.id)}
                      onChange={() => toggleSiswaSelection(siswa.id)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <div>
                      <p className="font-medium">{siswa.profiles?.nama || 'Tanpa Nama'}</p>
                      <p className="text-sm text-muted-foreground">NIS: {siswa.nis}</p>
                    </div>
                  </label>
                ))
              ) : (
                <p className="p-4 text-center text-muted-foreground">
                  Semua siswa sudah terhubung dengan orang tua lain
                </p>
              )}
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsLinkDialogOpen(false)}>
                Batal
              </Button>
              <Button onClick={handleLinkSiswa} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  'Simpan'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <DataTable
        columns={columns}
        data={orangTuaList}
        searchKey="telepon"
        searchPlaceholder="Cari nomor telepon..."
        isLoading={isLoading}
        emptyMessage="Belum ada data orang tua"
      />
    </motion.div>
  );
}
