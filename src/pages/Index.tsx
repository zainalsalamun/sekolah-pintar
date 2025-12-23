import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GraduationCap, ArrowRight, Users, BookOpen, Calendar, ClipboardCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

const features = [
  { icon: Users, title: 'Manajemen Siswa & Guru', desc: 'Kelola data dengan mudah' },
  { icon: BookOpen, title: 'Kelas & Mata Pelajaran', desc: 'Struktur kurikulum rapi' },
  { icon: Calendar, title: 'Jadwal Pelajaran', desc: 'Atur jadwal efisien' },
  { icon: ClipboardCheck, title: 'Absensi & Nilai', desc: 'Rekap otomatis digital' },
];

export default function Index() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'var(--gradient-primary)' }} />
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.08'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
        
        <div className="relative z-10 container mx-auto px-4 py-20 md:py-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center text-primary-foreground"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary-foreground/20 backdrop-blur-sm mb-6">
              <GraduationCap className="w-10 h-10" />
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
              Sistem Informasi Sekolah
            </h1>
            <p className="text-lg md:text-xl opacity-90 max-w-2xl mx-auto mb-8">
              Platform terintegrasi untuk mengelola data siswa, guru, absensi, nilai, dan jadwal pelajaran dalam satu sistem.
            </p>
            <Button
              size="lg"
              onClick={() => navigate('/auth')}
              className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 h-12 px-8"
            >
              Masuk ke Sistem
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold mb-3">Fitur Utama</h2>
          <p className="text-muted-foreground">Semua yang Anda butuhkan dalam satu platform</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="stat-card text-center"
            >
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <feature.icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © 2024 Sistem Informasi Sekolah. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
