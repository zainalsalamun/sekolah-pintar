import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GraduationCap,
  LayoutDashboard,
  Users,
  BookOpen,
  Calendar,
  ClipboardCheck,
  FileText,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  UserCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';

interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
  roles: string[];
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard', roles: ['admin', 'guru', 'siswa', 'orang_tua'] },
  { icon: Users, label: 'Pengguna', href: '/dashboard/pengguna', roles: ['admin'] },
  { icon: Users, label: 'Data Siswa', href: '/dashboard/siswa', roles: ['admin', 'guru'] },
  { icon: Users, label: 'Data Guru', href: '/dashboard/guru', roles: ['admin'] },
  { icon: BookOpen, label: 'Kelas', href: '/dashboard/kelas', roles: ['admin'] },
  { icon: BookOpen, label: 'Mata Pelajaran', href: '/dashboard/mapel', roles: ['admin'] },
  { icon: Calendar, label: 'Jadwal', href: '/dashboard/jadwal', roles: ['admin', 'guru', 'siswa'] },
  { icon: ClipboardCheck, label: 'Absensi', href: '/dashboard/absensi', roles: ['admin', 'guru', 'siswa', 'orang_tua'] },
  { icon: FileText, label: 'Nilai', href: '/dashboard/nilai', roles: ['admin', 'guru', 'siswa', 'orang_tua'] },
  { icon: Bell, label: 'Pengumuman', href: '/dashboard/pengumuman', roles: ['admin', 'guru', 'siswa', 'orang_tua'] },
];

export default function DashboardLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, role, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    // Close mobile menu on route change
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const filteredNavItems = navItems.filter(item => 
    !role || item.roles.includes(role)
  );

  const getRoleLabel = (role: string | null) => {
    switch (role) {
      case 'admin': return 'Admin Sekolah';
      case 'guru': return 'Guru';
      case 'siswa': return 'Siswa';
      case 'orang_tua': return 'Orang Tua';
      default: return 'Pengguna';
    }
  };

  const getInitials = (email: string | undefined) => {
    if (!email) return 'U';
    return email.substring(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse-soft">
          <GraduationCap className="w-12 h-12 text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 hidden lg:block",
          isSidebarOpen ? "w-64" : "w-20"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center h-16 px-4 border-b border-sidebar-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-primary-foreground" />
              </div>
              <AnimatePresence>
                {isSidebarOpen && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    className="font-bold text-sidebar-foreground whitespace-nowrap overflow-hidden"
                  >
                    SIS Sekolah
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 px-3 py-4">
            <nav className="space-y-1">
              {filteredNavItems.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <button
                    key={item.href}
                    onClick={() => navigate(item.href)}
                    className={cn(
                      "sidebar-link w-full",
                      isActive && "sidebar-link-active"
                    )}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    <AnimatePresence>
                      {isSidebarOpen && (
                        <motion.span
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: 'auto' }}
                          exit={{ opacity: 0, width: 0 }}
                          className="whitespace-nowrap overflow-hidden"
                        >
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </button>
                );
              })}
            </nav>
          </ScrollArea>

          {/* Toggle Button */}
          <div className="p-3 border-t border-sidebar-border">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="w-full justify-center"
            >
              <ChevronDown className={cn(
                "w-5 h-5 transition-transform duration-300",
                isSidebarOpen ? "-rotate-90" : "rotate-90"
              )} />
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 z-50 h-screen w-72 bg-sidebar border-r border-sidebar-border lg:hidden"
            >
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between h-16 px-4 border-b border-sidebar-border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                      <GraduationCap className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <span className="font-bold text-sidebar-foreground">SIS Sekolah</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                <ScrollArea className="flex-1 px-3 py-4">
                  <nav className="space-y-1">
                    {filteredNavItems.map((item) => {
                      const isActive = location.pathname === item.href;
                      return (
                        <button
                          key={item.href}
                          onClick={() => navigate(item.href)}
                          className={cn(
                            "sidebar-link w-full",
                            isActive && "sidebar-link-active"
                          )}
                        >
                          <item.icon className="w-5 h-5" />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </nav>
                </ScrollArea>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className={cn(
        "min-h-screen transition-all duration-300",
        isSidebarOpen ? "lg:ml-64" : "lg:ml-20"
      )}>
        {/* Header */}
        <header className="sticky top-0 z-30 h-16 bg-card/80 backdrop-blur-md border-b border-border">
          <div className="flex items-center justify-between h-full px-4 md:px-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setIsMobileMenuOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </Button>
              <h1 className="text-lg font-semibold text-foreground hidden sm:block">
                {filteredNavItems.find(item => item.href === location.pathname)?.label || 'Dashboard'}
              </h1>
            </div>

            <div className="flex items-center gap-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 h-auto py-2">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src="" />
                      <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                        {getInitials(user?.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden md:flex flex-col items-start">
                      <span className="text-sm font-medium">{user?.email}</span>
                      <span className="text-xs text-muted-foreground">{getRoleLabel(role)}</span>
                    </div>
                    <ChevronDown className="w-4 h-4 text-muted-foreground hidden md:block" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Akun Saya</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/dashboard/profil')}>
                    <UserCircle className="w-4 h-4 mr-2" />
                    Profil
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/dashboard/pengaturan')}>
                    <Settings className="w-4 h-4 mr-2" />
                    Pengaturan
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                    <LogOut className="w-4 h-4 mr-2" />
                    Keluar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
