-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'guru', 'siswa', 'orang_tua');

-- Create enum for attendance status
CREATE TYPE public.status_kehadiran AS ENUM ('hadir', 'sakit', 'izin', 'alpha');

-- Create enum for announcement category
CREATE TYPE public.kategori_pengumuman AS ENUM ('akademik', 'libur', 'umum');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nama TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT,
  status_aktif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);

-- Create tahun_ajaran table
CREATE TABLE public.tahun_ajaran (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama TEXT NOT NULL,
  aktif BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create kelas table
CREATE TABLE public.kelas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_kelas TEXT NOT NULL,
  tahun_ajaran_id UUID REFERENCES public.tahun_ajaran(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create mata_pelajaran table
CREATE TABLE public.mata_pelajaran (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_mapel TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create guru table
CREATE TABLE public.guru (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nip TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create orang_tua table
CREATE TABLE public.orang_tua (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  telepon TEXT,
  alamat TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create siswa table
CREATE TABLE public.siswa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nis TEXT NOT NULL UNIQUE,
  kelas_id UUID REFERENCES public.kelas(id),
  orang_tua_id UUID REFERENCES public.orang_tua(id),
  tanggal_lahir DATE,
  alamat TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create jadwal table
CREATE TABLE public.jadwal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kelas_id UUID REFERENCES public.kelas(id) NOT NULL,
  mata_pelajaran_id UUID REFERENCES public.mata_pelajaran(id) NOT NULL,
  guru_id UUID REFERENCES public.guru(id) NOT NULL,
  hari TEXT NOT NULL,
  jam_mulai TIME NOT NULL,
  jam_selesai TIME NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create absensi table
CREATE TABLE public.absensi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  siswa_id UUID REFERENCES public.siswa(id) NOT NULL,
  kelas_id UUID REFERENCES public.kelas(id) NOT NULL,
  tanggal DATE NOT NULL,
  status status_kehadiran NOT NULL,
  keterangan TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(siswa_id, tanggal)
);

-- Create nilai table
CREATE TABLE public.nilai (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  siswa_id UUID REFERENCES public.siswa(id) NOT NULL,
  mata_pelajaran_id UUID REFERENCES public.mata_pelajaran(id) NOT NULL,
  nilai_tugas DECIMAL(5,2),
  nilai_uts DECIMAL(5,2),
  nilai_uas DECIMAL(5,2),
  nilai_akhir DECIMAL(5,2),
  semester INTEGER NOT NULL,
  tahun_ajaran_id UUID REFERENCES public.tahun_ajaran(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(siswa_id, mata_pelajaran_id, semester, tahun_ajaran_id)
);

-- Create pengumuman table
CREATE TABLE public.pengumuman (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  judul TEXT NOT NULL,
  isi TEXT NOT NULL,
  kategori kategori_pengumuman NOT NULL DEFAULT 'umum',
  dibuat_oleh UUID REFERENCES auth.users(id),
  tanggal_dibuat TIMESTAMPTZ DEFAULT NOW(),
  aktif BOOLEAN DEFAULT true
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tahun_ajaran ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kelas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mata_pelajaran ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guru ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orang_tua ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.siswa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jadwal ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.absensi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nilai ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pengumuman ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Admins can manage all profiles"
ON public.profiles FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own role"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
ON public.user_roles FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for tahun_ajaran (public read, admin write)
CREATE POLICY "Anyone authenticated can view tahun_ajaran"
ON public.tahun_ajaran FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage tahun_ajaran"
ON public.tahun_ajaran FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for kelas
CREATE POLICY "Anyone authenticated can view kelas"
ON public.kelas FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage kelas"
ON public.kelas FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for mata_pelajaran
CREATE POLICY "Anyone authenticated can view mata_pelajaran"
ON public.mata_pelajaran FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage mata_pelajaran"
ON public.mata_pelajaran FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for guru
CREATE POLICY "Guru can view their own data"
ON public.guru FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all guru"
ON public.guru FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage guru"
ON public.guru FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for orang_tua
CREATE POLICY "Orang tua can view their own data"
ON public.orang_tua FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all orang_tua"
ON public.orang_tua FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage orang_tua"
ON public.orang_tua FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for siswa
CREATE POLICY "Siswa can view their own data"
ON public.siswa FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Guru can view siswa in their class"
ON public.siswa FOR SELECT
USING (public.has_role(auth.uid(), 'guru'));

CREATE POLICY "Orang tua can view their children"
ON public.siswa FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.orang_tua ot
    WHERE ot.user_id = auth.uid()
    AND ot.id = siswa.orang_tua_id
  )
);

CREATE POLICY "Admins can manage siswa"
ON public.siswa FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for jadwal
CREATE POLICY "Anyone authenticated can view jadwal"
ON public.jadwal FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage jadwal"
ON public.jadwal FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for absensi
CREATE POLICY "Siswa can view their own absensi"
ON public.absensi FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.siswa s
    WHERE s.id = absensi.siswa_id
    AND s.user_id = auth.uid()
  )
);

CREATE POLICY "Guru can manage absensi"
ON public.absensi FOR ALL
USING (public.has_role(auth.uid(), 'guru'));

CREATE POLICY "Orang tua can view children absensi"
ON public.absensi FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.siswa s
    JOIN public.orang_tua ot ON ot.id = s.orang_tua_id
    WHERE s.id = absensi.siswa_id
    AND ot.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage absensi"
ON public.absensi FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for nilai
CREATE POLICY "Siswa can view their own nilai"
ON public.nilai FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.siswa s
    WHERE s.id = nilai.siswa_id
    AND s.user_id = auth.uid()
  )
);

CREATE POLICY "Guru can manage nilai"
ON public.nilai FOR ALL
USING (public.has_role(auth.uid(), 'guru'));

CREATE POLICY "Orang tua can view children nilai"
ON public.nilai FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.siswa s
    JOIN public.orang_tua ot ON ot.id = s.orang_tua_id
    WHERE s.id = nilai.siswa_id
    AND ot.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage nilai"
ON public.nilai FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for pengumuman
CREATE POLICY "Anyone authenticated can view active pengumuman"
ON public.pengumuman FOR SELECT
TO authenticated
USING (aktif = true);

CREATE POLICY "Guru can create pengumuman"
ON public.pengumuman FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'guru') AND auth.uid() = dibuat_oleh);

CREATE POLICY "Admins can manage pengumuman"
ON public.pengumuman FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Create trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nama, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'nama', NEW.email),
    NEW.email
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to calculate nilai_akhir
CREATE OR REPLACE FUNCTION public.calculate_nilai_akhir()
RETURNS TRIGGER AS $$
BEGIN
  NEW.nilai_akhir = ROUND(
    (COALESCE(NEW.nilai_tugas, 0) * 0.3) +
    (COALESCE(NEW.nilai_uts, 0) * 0.3) +
    (COALESCE(NEW.nilai_uas, 0) * 0.4),
    2
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_nilai_akhir_trigger
  BEFORE INSERT OR UPDATE ON public.nilai
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_nilai_akhir();