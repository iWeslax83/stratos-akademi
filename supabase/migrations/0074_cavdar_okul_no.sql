-- Veri düzeltmesi (2026-10-20, kullanıcı teyitli): Ömer Çavdar'ın okul numarası 863.
-- Başvurusunda yanlışlıkla 861 yazıyordu; 861 Muhammed Emir Ablak'ın (bkz. 0071).
-- Tekrar çalıştırmaya dayanıklıdır; 863 başka satırdaysa hiçbir şey yapmaz.

update public.allowlist set student_no = '863'
where email = 'cavdaromer1033@gmail.com'
  and student_no is null
  and not exists (select 1 from public.allowlist where student_no = '863');
