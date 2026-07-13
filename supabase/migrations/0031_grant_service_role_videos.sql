-- KÖK NEDEN DÜZELTMESİ: video tarama hiç öneri üretmiyordu.
--
-- Tarama tamamen service_role (RLS bypass) ile çalışır. Ama 0006'da not edildiği gibi
-- bu projede SQL editor ile açılan tablolara service_role otomatik GRANT almıyor.
-- Quiz tablolarına 0004/0006'da elle grant verilmiş; müfredat ve video tablolarına
-- hiç verilmemişti. Sonuç: tarama daha ilk adımda "permission denied for table tracks"
-- alıp 0 modül görüyor → 0 arama sorgusu → 0 öneri. Hata da yutuluyordu.

-- Tarama okur: müfredat + mevcut dersler (tekrar önermemek için).
grant select on public.tracks to service_role;
grant select on public.modules to service_role;
grant select on public.lessons to service_role;

-- Tarama yazar: aday kuyruğu + kalıcı kara liste.
grant select, insert, update, delete on public.video_suggestions to service_role;
grant select, insert, delete on public.video_blacklist to service_role;

-- Tarama sonunda adminlere bildirim atar (admin id'lerini profiles'tan okur).
grant select on public.profiles to service_role;
grant insert on public.notifications to service_role;

-- Teşhis kaydı (0030).
grant insert, select on public.video_scan_runs to service_role;
