import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/lib/auth-context";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import DashboardLayout from "./components/layout/DashboardLayout";
import DashboardHome from "./pages/dashboard/DashboardHome";
import PenggunaPage from "./pages/dashboard/PenggunaPage";
import SiswaPage from "./pages/dashboard/SiswaPage";
import GuruPage from "./pages/dashboard/GuruPage";
import KelasPage from "./pages/dashboard/KelasPage";
import MapelPage from "./pages/dashboard/MapelPage";
import JadwalPage from "./pages/dashboard/JadwalPage";
import AbsensiPage from "./pages/dashboard/AbsensiPage";
import NilaiPage from "./pages/dashboard/NilaiPage";
import PengumumanPage from "./pages/dashboard/PengumumanPage";
import TahunAjaranPage from "./pages/dashboard/TahunAjaranPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<DashboardHome />} />
              <Route path="pengguna" element={<PenggunaPage />} />
              <Route path="siswa" element={<SiswaPage />} />
              <Route path="guru" element={<GuruPage />} />
              <Route path="kelas" element={<KelasPage />} />
              <Route path="mapel" element={<MapelPage />} />
              <Route path="jadwal" element={<JadwalPage />} />
              <Route path="absensi" element={<AbsensiPage />} />
              <Route path="nilai" element={<NilaiPage />} />
              <Route path="pengumuman" element={<PengumumanPage />} />
              <Route path="tahun-ajaran" element={<TahunAjaranPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
