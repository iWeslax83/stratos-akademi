-- Stratos sitesi kabul edilen başvurunun e-postasını /api/allowlist ile ekliyor.
-- service_role'ün allowlist'te yalnız select/delete yetkisi vardı (0033); insert eksikti.
-- Grant tuzağı için bkz. 0031 ve 0033. Tekrar çalıştırmaya dayanıklıdır.

grant insert on public.allowlist to service_role;
