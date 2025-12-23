import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Plus, Trash2, FileSpreadsheet, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface BulkImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'guru' | 'siswa';
  kelasList?: { id: string; nama_kelas: string }[];
  onSuccess: () => void;
}

interface UserEntry {
  id: string;
  nama: string;
  email: string;
  password: string;
  nip?: string;
  nis?: string;
  kelas_id?: string;
}

interface ImportResult {
  success: boolean;
  email: string;
  error?: string;
}

const generatePassword = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

const createEmptyEntry = (): UserEntry => ({
  id: crypto.randomUUID(),
  nama: '',
  email: '',
  password: generatePassword(),
  nip: '',
  nis: '',
  kelas_id: ''
});

export function BulkImportDialog({ open, onOpenChange, type, kelasList = [], onSuccess }: BulkImportDialogProps) {
  const [entries, setEntries] = useState<UserEntry[]>([createEmptyEntry()]);
  const [isImporting, setIsImporting] = useState(false);
  const [results, setResults] = useState<ImportResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetDialog = () => {
    setEntries([createEmptyEntry()]);
    setResults([]);
    setShowResults(false);
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      resetDialog();
    }
    onOpenChange(open);
  };

  const addEntry = () => {
    setEntries([...entries, createEmptyEntry()]);
  };

  const removeEntry = (id: string) => {
    if (entries.length > 1) {
      setEntries(entries.filter(e => e.id !== id));
    }
  };

  const updateEntry = (id: string, field: keyof UserEntry, value: string) => {
    setEntries(entries.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  const parseCSV = (content: string): UserEntry[] => {
    const lines = content.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
    const result: UserEntry[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const entry: UserEntry = {
        id: crypto.randomUUID(),
        nama: '',
        email: '',
        password: generatePassword()
      };

      headers.forEach((header, index) => {
        const value = values[index] || '';
        if (header === 'nama' || header === 'name') entry.nama = value;
        if (header === 'email') entry.email = value;
        if (header === 'password' && value) entry.password = value;
        if (header === 'nip') entry.nip = value;
        if (header === 'nis') entry.nis = value;
      });

      if (entry.nama && entry.email) {
        result.push(entry);
      }
    }

    return result;
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const parsed = parseCSV(content);
      if (parsed.length > 0) {
        setEntries(parsed);
        toast.success(`${parsed.length} data berhasil diparse dari CSV`);
      } else {
        toast.error('Tidak ada data valid ditemukan di CSV');
      }
    };
    reader.readAsText(file);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImport = async () => {
    const validEntries = entries.filter(e => e.nama && e.email && e.password);
    
    if (validEntries.length === 0) {
      toast.error('Tidak ada data valid untuk diimport');
      return;
    }

    setIsImporting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('Sesi tidak valid, silakan login ulang');
        return;
      }

      const users = validEntries.map(entry => ({
        nama: entry.nama,
        email: entry.email,
        password: entry.password,
        role: type,
        ...(type === 'guru' ? { nip: entry.nip } : {}),
        ...(type === 'siswa' ? { nis: entry.nis, kelas_id: entry.kelas_id || null } : {})
      }));

      const response = await supabase.functions.invoke('bulk-import-users', {
        body: { users }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const data = response.data as { results: ImportResult[], message: string };
      setResults(data.results);
      setShowResults(true);

      const successCount = data.results.filter(r => r.success).length;
      if (successCount > 0) {
        toast.success(`${successCount} ${type} berhasil diimport`);
        onSuccess();
      }
    } catch (error: any) {
      toast.error(`Import gagal: ${error.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  const downloadTemplate = () => {
    const headers = type === 'guru' 
      ? 'nama,email,password,nip'
      : 'nama,email,password,nis';
    const example = type === 'guru'
      ? 'Budi Santoso,budi@example.com,password123,123456789'
      : 'Siti Aminah,siti@example.com,password123,2024001';
    
    const content = `${headers}\n${example}`;
    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `template_${type}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Import {type === 'guru' ? 'Guru' : 'Siswa'}</DialogTitle>
          <DialogDescription>
            Import data {type === 'guru' ? 'guru' : 'siswa'} dari CSV atau input manual (maks. 50 per batch)
          </DialogDescription>
        </DialogHeader>

        {showResults ? (
          <div className="space-y-4">
            <h3 className="font-semibold">Hasil Import</h3>
            <div className="max-h-[400px] overflow-y-auto border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Keterangan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((result, index) => (
                    <TableRow key={index}>
                      <TableCell>{result.email}</TableCell>
                      <TableCell>
                        {result.success ? (
                          <Badge variant="default" className="bg-green-500">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Sukses
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <XCircle className="h-3 w-3 mr-1" />
                            Gagal
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {result.error || 'Berhasil ditambahkan'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => handleClose(false)}>
                Tutup
              </Button>
              <Button onClick={resetDialog}>
                Import Lagi
              </Button>
            </div>
          </div>
        ) : (
          <Tabs defaultValue="manual" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="manual">Input Manual</TabsTrigger>
              <TabsTrigger value="csv">Upload CSV</TabsTrigger>
            </TabsList>

            <TabsContent value="csv" className="space-y-4">
              <div className="flex items-center gap-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="h-4 w-4 mr-2" />
                  Pilih File CSV
                </Button>
                <Button variant="ghost" onClick={downloadTemplate}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Download Template
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Format CSV: nama, email, password, {type === 'guru' ? 'nip' : 'nis'}
              </p>
            </TabsContent>

            <TabsContent value="manual" className="space-y-4">
              <div className="max-h-[400px] overflow-y-auto border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Password</TableHead>
                      <TableHead>{type === 'guru' ? 'NIP' : 'NIS'}</TableHead>
                      {type === 'siswa' && <TableHead>Kelas</TableHead>}
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>
                          <Input
                            placeholder="Nama lengkap"
                            value={entry.nama}
                            onChange={(e) => updateEntry(entry.id, 'nama', e.target.value)}
                            className="min-w-[150px]"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="email"
                            placeholder="email@example.com"
                            value={entry.email}
                            onChange={(e) => updateEntry(entry.id, 'email', e.target.value)}
                            className="min-w-[180px]"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            placeholder="Password"
                            value={entry.password}
                            onChange={(e) => updateEntry(entry.id, 'password', e.target.value)}
                            className="min-w-[120px]"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            placeholder={type === 'guru' ? 'NIP' : 'NIS'}
                            value={type === 'guru' ? entry.nip : entry.nis}
                            onChange={(e) => updateEntry(entry.id, type === 'guru' ? 'nip' : 'nis', e.target.value)}
                            className="min-w-[120px]"
                          />
                        </TableCell>
                        {type === 'siswa' && (
                          <TableCell>
                            <Select
                              value={entry.kelas_id || ''}
                              onValueChange={(value) => updateEntry(entry.id, 'kelas_id', value)}
                            >
                              <SelectTrigger className="min-w-[120px]">
                                <SelectValue placeholder="Pilih kelas" />
                              </SelectTrigger>
                              <SelectContent>
                                {kelasList.map(kelas => (
                                  <SelectItem key={kelas.id} value={kelas.id}>
                                    {kelas.nama_kelas}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                        )}
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeEntry(entry.id)}
                            disabled={entries.length === 1}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <Button variant="outline" onClick={addEntry} disabled={entries.length >= 50}>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Baris
              </Button>
            </TabsContent>

            <div className="flex justify-between items-center pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                {entries.filter(e => e.nama && e.email).length} data siap diimport
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => handleClose(false)}>
                  Batal
                </Button>
                <Button onClick={handleImport} disabled={isImporting}>
                  {isImporting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Import {type === 'guru' ? 'Guru' : 'Siswa'}
                </Button>
              </div>
            </div>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
