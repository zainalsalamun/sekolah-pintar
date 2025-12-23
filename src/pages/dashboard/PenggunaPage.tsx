import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Plus, Pencil, Trash2, Shield, UserCheck, UserX } from 'lucide-react';
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
import type { Database } from '@/integrations/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type AppRole = Database['public']['Enums']['app_role'];

interface UserWithRole extends Profile {
  role?: AppRole;
}

export default function PenggunaPage() {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const [formData, setFormData] = useState({
    nama: '',
    email: '',
    password: '',
    role: 'siswa' as AppRole,
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');

      if (rolesError) throw rolesError;

      const usersWithRoles: UserWithRole[] = (profiles || []).map(profile => ({
        ...profile,
        role: roles?.find(r => r.user_id === profile.id)?.role,
      }));

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Gagal memuat data pengguna',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (selectedUser) {
        // Update existing user
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ nama: formData.nama })
          .eq('id', selectedUser.id);

        if (profileError) throw profileError;

        // Update role
        const { error: roleError } = await supabase
          .from('user_roles')
          .upsert({
            user_id: selectedUser.id,
            role: formData.role,
          }, { onConflict: 'user_id' });

        if (roleError) throw roleError;

        toast({ title: 'Berhasil', description: 'Data pengguna berhasil diperbarui' });
      } else {
        // Create new user via Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: { nama: formData.nama },
          },
        });

        if (authError) throw authError;

        if (authData.user) {
          // Assign role
          const { error: roleError } = await supabase
            .from('user_roles')
            .insert({
              user_id: authData.user.id,
              role: formData.role,
            });

          if (roleError) throw roleError;
        }

        toast({ title: 'Berhasil', description: 'Pengguna baru berhasil ditambahkan' });
      }

      setIsDialogOpen(false);
      setSelectedUser(null);
      setFormData({ nama: '', email: '', password: '', role: 'siswa' });
      fetchUsers();
    } catch (error: any) {
      console.error('Error saving user:', error);
      toast({
        title: 'Error',
        description: error.message || 'Gagal menyimpan data pengguna',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (user: UserWithRole) => {
    setSelectedUser(user);
    setFormData({
      nama: user.nama,
      email: user.email,
      password: '',
      role: user.role || 'siswa',
    });
    setIsDialogOpen(true);
  };

  const handleToggleStatus = async (user: UserWithRole) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status_aktif: !user.status_aktif })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: 'Berhasil',
        description: `Pengguna ${user.status_aktif ? 'dinonaktifkan' : 'diaktifkan'}`,
      });
      fetchUsers();
    } catch (error) {
      console.error('Error toggling user status:', error);
      toast({
        title: 'Error',
        description: 'Gagal mengubah status pengguna',
        variant: 'destructive',
      });
    }
  };

  const getRoleBadgeVariant = (role?: AppRole) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'guru': return 'default';
      case 'siswa': return 'secondary';
      case 'orang_tua': return 'outline';
      default: return 'secondary';
    }
  };

  const getRoleLabel = (role?: AppRole) => {
    switch (role) {
      case 'admin': return 'Admin';
      case 'guru': return 'Guru';
      case 'siswa': return 'Siswa';
      case 'orang_tua': return 'Orang Tua';
      default: return '-';
    }
  };

  const columns = [
    {
      header: 'Nama',
      accessor: 'nama' as keyof UserWithRole,
    },
    {
      header: 'Email',
      accessor: 'email' as keyof UserWithRole,
    },
    {
      header: 'Peran',
      accessor: (row: UserWithRole) => (
        <Badge variant={getRoleBadgeVariant(row.role)}>
          {getRoleLabel(row.role)}
        </Badge>
      ),
    },
    {
      header: 'Status',
      accessor: (row: UserWithRole) => (
        <Badge variant={row.status_aktif ? 'default' : 'secondary'}>
          {row.status_aktif ? 'Aktif' : 'Nonaktif'}
        </Badge>
      ),
    },
    {
      header: 'Aksi',
      accessor: (row: UserWithRole) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => handleEdit(row)}>
            <Pencil className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => handleToggleStatus(row)}
          >
            {row.status_aktif ? (
              <UserX className="w-4 h-4 text-destructive" />
            ) : (
              <UserCheck className="w-4 h-4 text-green-500" />
            )}
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
        title="Manajemen Pengguna"
        description="Kelola semua pengguna sistem"
        icon={Users}
        action={
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setSelectedUser(null);
                setFormData({ nama: '', email: '', password: '', role: 'siswa' });
              }}>
                <Plus className="w-4 h-4 mr-2" />
                Tambah Pengguna
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {selectedUser ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}
                </DialogTitle>
                <DialogDescription>
                  {selectedUser 
                    ? 'Perbarui informasi pengguna' 
                    : 'Isi form berikut untuk menambah pengguna baru'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nama">Nama Lengkap</Label>
                  <Input
                    id="nama"
                    value={formData.nama}
                    onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                    required
                  />
                </div>
                {!selectedUser && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Kata Sandi</Label>
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                        minLength={6}
                      />
                    </div>
                  </>
                )}
                <div className="space-y-2">
                  <Label htmlFor="role">Peran</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value: AppRole) => setFormData({ ...formData, role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="guru">Guru</SelectItem>
                      <SelectItem value="siswa">Siswa</SelectItem>
                      <SelectItem value="orang_tua">Orang Tua</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Batal
                  </Button>
                  <Button type="submit">
                    {selectedUser ? 'Simpan Perubahan' : 'Tambah Pengguna'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <DataTable
        columns={columns}
        data={users}
        searchKey="nama"
        searchPlaceholder="Cari nama pengguna..."
        isLoading={isLoading}
        emptyMessage="Belum ada data pengguna"
      />
    </motion.div>
  );
}
