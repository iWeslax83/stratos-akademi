-- Rozet (badge) sistemi tamamen kaldırıldı. user_badges tablosu artık kullanılmıyor.
-- Bu migration tabloyu düşürür. (İNSAN uygular — uygulanmazsa tablo zararsız şekilde boş durur.)

drop table if exists public.user_badges;
