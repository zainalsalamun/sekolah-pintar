import { motion } from 'framer-motion';
import { Users, GraduationCap, BookOpen, Bell, TrendingUp, Calendar, CheckCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/auth-context';

const statCards = [
  { icon: Users, label: 'Total Siswa', value: '1,234', change: '+12%', color: 'primary' },
  { icon: GraduationCap, label: 'Total Guru', value: '85', change: '+3%', color: 'accent' },
  { icon: BookOpen, label: 'Total Kelas', value: '42', change: '0%', color: 'info' },
  { icon: Bell, label: 'Pengumuman', value: '8', change: '+2', color: 'warning' },
];

const recentAnnouncements = [
  { title: 'Ujian Tengah Semester', category: 'akademik', date: '20 Des 2024' },
  { title: 'Libur Natal dan Tahun Baru', category: 'libur', date: '18 Des 2024' },
  { title: 'Rapat Wali Murid', category: 'umum', date: '15 Des 2024' },
];

export default function DashboardHome() {
  const { role } = useAuth();

  const getRoleWelcome = () => {
    switch (role) {
      case 'admin': return 'Selamat datang, Admin';
      case 'guru': return 'Selamat datang, Guru';
      case 'siswa': return 'Selamat datang, Siswa';
      case 'orang_tua': return 'Selamat datang, Orang Tua';
      default: return 'Selamat datang';
    }
  };

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
                    <p className="text-3xl font-bold mt-1">{stat.value}</p>
                    <p className="text-xs text-success mt-1 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      {stat.change} dari bulan lalu
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
                {recentAnnouncements.map((item, index) => (
                  <div key={index} className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                    <div className="flex-1">
                      <p className="font-medium">{item.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="badge-status bg-primary/10 text-primary">{item.category}</span>
                        <span className="text-xs text-muted-foreground">{item.date}</span>
                      </div>
                    </div>
                  </div>
                ))}
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
                    <p className="font-medium">Absensi Terisi</p>
                    <p className="text-sm text-muted-foreground">Kelas 7A - Matematika</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-3 rounded-lg bg-warning/10">
                  <Clock className="w-5 h-5 text-warning" />
                  <div className="flex-1">
                    <p className="font-medium">Input Nilai UTS</p>
                    <p className="text-sm text-muted-foreground">Deadline: 25 Des 2024</p>
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
