-- Fix function search_path warnings
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.calculate_nilai_akhir()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.nilai_akhir = ROUND(
    (COALESCE(NEW.nilai_tugas, 0) * 0.3) +
    (COALESCE(NEW.nilai_uts, 0) * 0.3) +
    (COALESCE(NEW.nilai_uas, 0) * 0.4),
    2
  );
  RETURN NEW;
END;
$$;