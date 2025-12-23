import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, GraduationCap, BookOpen, Bell, TrendingUp, Calendar, CheckCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/integrations/supabase/client';

interface DashboardStats {
  totalSiswa: number;
  totalGuru: number;
  totalKelas: number;
  totalPengumuman: number;
}

interface Announcement {
  id: string;
  judul: string;
  kategori: string;
  tanggal_dibuat: string;
}

export default function DashboardHome() {
  const { role } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalSiswa: 0,
    totalGuru: 0,
    totalKelas: 0,
    totalPengumuman: 0,
  });
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch all counts in parallel
      const [siswaRes, guruRes, kelasRes, pengumumanRes, announcementsRes] = await Promise.all([
        supabase.from('siswa').select('id', { count: 'exact', head: true }),
        supabase.from('guru').select('id', { count: 'exact', head: true }),
        supabase.from('kelas').select('id', { count: 'exact', head: true }),
        supabase.from('pengumuman').select('id', { count: 'exact', head: true }).eq('aktif', true),
        supabase.from('pengumuman').select('id, judul, kategori, tanggal_dibuat').eq('aktif', true).order('tanggal_dibuat', { ascending: false }).limit(3),
      ]);

      setStats({
        totalSiswa: siswaRes.count || 0,
        totalGuru: guruRes.count || 0,
        totalKelas: kelasRes.count || 0,
        totalPengumuman: pengumumanRes.count || 0,
      });

      setAnnouncements(announcementsRes.data || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleWelcome = () => {
    switch (role) {
      case 'admin': return 'Selamat datang, Admin';
      case 'guru': return 'Selamat datang, Guru';
      case 'siswa': return 'Selamat datang, Siswa';
      case 'orang_tua': return 'Selamat datang, Orang Tua';
      default: return 'Selamat datang';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const statCards = [
    { icon: Users, label: 'Total Siswa', value: stats.totalSiswa.toString(), color: 'primary' },
    { icon: GraduationCap, label: 'Total Guru', value: stats.totalGuru.toString(), color: 'accent' },
    { icon: BookOpen, label: 'Total Kelas', value: stats.totalKelas.toString(), color: 'info' },
    { icon: Bell, label: 'Pengumuman Aktif', value: stats.totalPengumuman.toString(), color: 'warning' },
  ];

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="page-title">{getRoleWelcome()}</h1>
        <p className="page-subtitle">Berikut ringkasan data sekolah hari ini</p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <Card className="stat-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-3xl font-bold mt-1">
                      {loading ? '...' : stat.value}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <stat.icon className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Announcements */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" />
                Pengumuman Terbaru
              </CardTitle>
              <CardDescription>Informasi penting dari sekolah</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {announcements.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Belum ada pengumuman
                  </p>
                ) : (
                  announcements.map((item) => (
                    <div key={item.id} className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                      <div className="flex-1">
                        <p className="font-medium">{item.judul}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="badge-status bg-primary/10 text-primary">{item.kategori}</span>
                          <span className="text-xs text-muted-foreground">{formatDate(item.tanggal_dibuat)}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Aktivitas Hari Ini
              </CardTitle>
              <CardDescription>Jadwal dan tugas Anda</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-3 rounded-lg bg-success/10">
                  <CheckCircle className="w-5 h-5 text-success" />
                  <div className="flex-1">
                    <p className="font-medium">Sistem Siap</p>
                    <p className="text-sm text-muted-foreground">Semua modul berfungsi normal</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-3 rounded-lg bg-warning/10">
                  <Clock className="w-5 h-5 text-warning" />
                  <div className="flex-1">
                    <p className="font-medium">Data Terbaru</p>
                    <p className="text-sm text-muted-foreground">
                      {stats.totalSiswa} siswa, {stats.totalGuru} guru terdaftar
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
