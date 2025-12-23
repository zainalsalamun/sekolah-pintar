export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      absensi: {
        Row: {
          created_at: string | null
          id: string
          kelas_id: string
          keterangan: string | null
          siswa_id: string
          status: Database["public"]["Enums"]["status_kehadiran"]
          tanggal: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          kelas_id: string
          keterangan?: string | null
          siswa_id: string
          status: Database["public"]["Enums"]["status_kehadiran"]
          tanggal: string
        }
        Update: {
          created_at?: string | null
          id?: string
          kelas_id?: string
          keterangan?: string | null
          siswa_id?: string
          status?: Database["public"]["Enums"]["status_kehadiran"]
          tanggal?: string
        }
        Relationships: [
          {
            foreignKeyName: "absensi_kelas_id_fkey"
            columns: ["kelas_id"]
            isOneToOne: false
            referencedRelation: "kelas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "absensi_siswa_id_fkey"
            columns: ["siswa_id"]
            isOneToOne: false
            referencedRelation: "siswa"
            referencedColumns: ["id"]
          },
        ]
      }
      guru: {
        Row: {
          created_at: string | null
          id: string
          nip: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          nip?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          nip?: string | null
          user_id?: string
        }
        Relationships: []
      }
      jadwal: {
        Row: {
          created_at: string | null
          guru_id: string
          hari: string
          id: string
          jam_mulai: string
          jam_selesai: string
          kelas_id: string
          mata_pelajaran_id: string
        }
        Insert: {
          created_at?: string | null
          guru_id: string
          hari: string
          id?: string
          jam_mulai: string
          jam_selesai: string
          kelas_id: string
          mata_pelajaran_id: string
        }
        Update: {
          created_at?: string | null
          guru_id?: string
          hari?: string
          id?: string
          jam_mulai?: string
          jam_selesai?: string
          kelas_id?: string
          mata_pelajaran_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "jadwal_guru_id_fkey"
            columns: ["guru_id"]
            isOneToOne: false
            referencedRelation: "guru"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jadwal_kelas_id_fkey"
            columns: ["kelas_id"]
            isOneToOne: false
            referencedRelation: "kelas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jadwal_mata_pelajaran_id_fkey"
            columns: ["mata_pelajaran_id"]
            isOneToOne: false
            referencedRelation: "mata_pelajaran"
            referencedColumns: ["id"]
          },
        ]
      }
      kelas: {
        Row: {
          created_at: string | null
          id: string
          nama_kelas: string
          tahun_ajaran_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          nama_kelas: string
          tahun_ajaran_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          nama_kelas?: string
          tahun_ajaran_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kelas_tahun_ajaran_id_fkey"
            columns: ["tahun_ajaran_id"]
            isOneToOne: false
            referencedRelation: "tahun_ajaran"
            referencedColumns: ["id"]
          },
        ]
      }
      mata_pelajaran: {
        Row: {
          created_at: string | null
          id: string
          nama_mapel: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          nama_mapel: string
        }
        Update: {
          created_at?: string | null
          id?: string
          nama_mapel?: string
        }
        Relationships: []
      }
      nilai: {
        Row: {
          created_at: string | null
          id: string
          mata_pelajaran_id: string
          nilai_akhir: number | null
          nilai_tugas: number | null
          nilai_uas: number | null
          nilai_uts: number | null
          semester: number
          siswa_id: string
          tahun_ajaran_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          mata_pelajaran_id: string
          nilai_akhir?: number | null
          nilai_tugas?: number | null
          nilai_uas?: number | null
          nilai_uts?: number | null
          semester: number
          siswa_id: string
          tahun_ajaran_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          mata_pelajaran_id?: string
          nilai_akhir?: number | null
          nilai_tugas?: number | null
          nilai_uas?: number | null
          nilai_uts?: number | null
          semester?: number
          siswa_id?: string
          tahun_ajaran_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nilai_mata_pelajaran_id_fkey"
            columns: ["mata_pelajaran_id"]
            isOneToOne: false
            referencedRelation: "mata_pelajaran"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nilai_siswa_id_fkey"
            columns: ["siswa_id"]
            isOneToOne: false
            referencedRelation: "siswa"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nilai_tahun_ajaran_id_fkey"
            columns: ["tahun_ajaran_id"]
            isOneToOne: false
            referencedRelation: "tahun_ajaran"
            referencedColumns: ["id"]
          },
        ]
      }
      orang_tua: {
        Row: {
          alamat: string | null
          created_at: string | null
          id: string
          telepon: string | null
          user_id: string
        }
        Insert: {
          alamat?: string | null
          created_at?: string | null
          id?: string
          telepon?: string | null
          user_id: string
        }
        Update: {
          alamat?: string | null
          created_at?: string | null
          id?: string
          telepon?: string | null
          user_id?: string
        }
        Relationships: []
      }
      pengumuman: {
        Row: {
          aktif: boolean | null
          dibuat_oleh: string | null
          id: string
          isi: string
          judul: string
          kategori: Database["public"]["Enums"]["kategori_pengumuman"]
          tanggal_dibuat: string | null
        }
        Insert: {
          aktif?: boolean | null
          dibuat_oleh?: string | null
          id?: string
          isi: string
          judul: string
          kategori?: Database["public"]["Enums"]["kategori_pengumuman"]
          tanggal_dibuat?: string | null
        }
        Update: {
          aktif?: boolean | null
          dibuat_oleh?: string | null
          id?: string
          isi?: string
          judul?: string
          kategori?: Database["public"]["Enums"]["kategori_pengumuman"]
          tanggal_dibuat?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          id: string
          nama: string
          status_aktif: boolean | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          id: string
          nama: string
          status_aktif?: boolean | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          id?: string
          nama?: string
          status_aktif?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      siswa: {
        Row: {
          alamat: string | null
          created_at: string | null
          id: string
          kelas_id: string | null
          nis: string
          orang_tua_id: string | null
          tanggal_lahir: string | null
          user_id: string
        }
        Insert: {
          alamat?: string | null
          created_at?: string | null
          id?: string
          kelas_id?: string | null
          nis: string
          orang_tua_id?: string | null
          tanggal_lahir?: string | null
          user_id: string
        }
        Update: {
          alamat?: string | null
          created_at?: string | null
          id?: string
          kelas_id?: string | null
          nis?: string
          orang_tua_id?: string | null
          tanggal_lahir?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "siswa_kelas_id_fkey"
            columns: ["kelas_id"]
            isOneToOne: false
            referencedRelation: "kelas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "siswa_orang_tua_id_fkey"
            columns: ["orang_tua_id"]
            isOneToOne: false
            referencedRelation: "orang_tua"
            referencedColumns: ["id"]
          },
        ]
      }
      tahun_ajaran: {
        Row: {
          aktif: boolean | null
          created_at: string | null
          id: string
          nama: string
        }
        Insert: {
          aktif?: boolean | null
          created_at?: string | null
          id?: string
          nama: string
        }
        Update: {
          aktif?: boolean | null
          created_at?: string | null
          id?: string
          nama?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "guru" | "siswa" | "orang_tua"
      kategori_pengumuman: "akademik" | "libur" | "umum"
      status_kehadiran: "hadir" | "sakit" | "izin" | "alpha"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "guru", "siswa", "orang_tua"],
      kategori_pengumuman: ["akademik", "libur", "umum"],
      status_kehadiran: ["hadir", "sakit", "izin", "alpha"],
    },
  },
} as const
