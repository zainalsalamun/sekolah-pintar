import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Plus, Pencil, Trash2, Loader2, Upload } from 'lucide-react';
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
import { z } from 'zod';
import { BulkImportDialog } from '@/components/bulk-import/BulkImportDialog';

const createGuruSchema = z.object({
  nama: z.string().min(2, 'Nama minimal 2 karakter').max(100),
  email: z.string().email('Email tidak valid').max(255),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  nip: z.string().max(50).optional(),
});

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
  const [isSaving, setIsSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [selectedGuru, setSelectedGuru] = useState<Guru | null>(null);
  const [formData, setFormData] = useState({
    nama: '',
    email: '',
    password: '',
    nip: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
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

  const resetForm = () => {
    setFormData({
      nama: '',
      email: '',
      password: '',
      nip: '',
    });
    setErrors({});
    setSelectedGuru(null);
    setIsCreateMode(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsSaving(true);
    
    try {
      if (isCreateMode) {
        // Validate form data
        const result = createGuruSchema.safeParse(formData);
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

        // Assign role as guru
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({ user_id: authData.user.id, role: 'guru' });

        if (roleError) throw roleError;

        // Create guru record
        const { error: guruError } = await supabase
          .from('guru')
          .insert({
            user_id: authData.user.id,
            nip: formData.nip || null,
          });

        if (guruError) throw guruError;

        toast({ title: 'Berhasil', description: 'Guru baru berhasil ditambahkan' });
      } else if (selectedGuru) {
        // Update existing guru
        const { error } = await supabase
          .from('guru')
          .update({ nip: formData.nip || null })
          .eq('id', selectedGuru.id);

        if (error) throw error;
        toast({ title: 'Berhasil', description: 'Data guru berhasil diperbarui' });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchGuru();
    } catch (error: any) {
      console.error('Error saving guru:', error);
      if (error.message?.includes('already registered')) {
        toast({
          title: 'Error',
          description: 'Email sudah terdaftar',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          description: error.message || 'Gagal menyimpan data guru',
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

  const handleEdit = (guru: Guru) => {
    setSelectedGuru(guru);
    setIsCreateMode(false);
    setFormData({
      nama: guru.profiles?.nama || '',
      email: guru.profiles?.email || '',
      password: '',
      nip: guru.nip || '',
    });
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
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsBulkImportOpen(true)}>
              <Upload className="w-4 h-4 mr-2" />
              Bulk Import
            </Button>
            <Button onClick={handleCreate}>
              <Plus className="w-4 h-4 mr-2" />
              Tambah Guru
            </Button>
          </div>
        }
      />
      
      <BulkImportDialog
        open={isBulkImportOpen}
        onOpenChange={setIsBulkImportOpen}
        type="guru"
        onSuccess={fetchGuru}
      />

      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isCreateMode ? 'Tambah Guru Baru' : 'Edit Data Guru'}
            </DialogTitle>
            <DialogDescription>
              {isCreateMode 
                ? 'Isi form berikut untuk menambah guru baru' 
                : 'Perbarui informasi guru'}
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
              <Label htmlFor="nip">NIP</Label>
              <Input
                id="nip"
                value={formData.nip}
                onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                placeholder="Nomor Induk Pegawai"
              />
              {errors.nip && <p className="text-sm text-destructive">{errors.nip}</p>}
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
                  isCreateMode ? 'Tambah Guru' : 'Simpan Perubahan'
                )}
              </Button>
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
