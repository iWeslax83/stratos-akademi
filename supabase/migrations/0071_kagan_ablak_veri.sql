-- Veri düzeltmesi (2026-10-20, kullanıcı teyitli):
-- 1) Kağan Değirmencioğlu: başvurudaki kagan_degirmencioglu@gmail.com geçerli bir Gmail değil
--    (alt çizgi yok). Numarayla girişte bu adrese ikinci bir hesap açılmıştı ve bir ders
--    tamamlanmıştı. Doğru adres kagandegirmencioglu@gmail.com: ilerleme oraya taşınır, ikinci
--    hesap silinir, okul numarası (811) ve ad doğru adresin izin satırına geçer.
-- 2) Okul numarası 861 Muhammed Emir Ablak'ındır. Ömer Çavdar'ın satırında yanlışlıkla
--    duruyordu; Çavdar'ın numarası boşaltılır (Google ile girişi etkilenmez).
-- Tekrar çalıştırmaya dayanıklıdır: hesaplar e-postayla bulunur, yoksa adım atlanır.

do $$
declare
  eski uuid;
  yeni uuid;
begin
  select id into eski from public.profiles where email = 'kagan_degirmencioglu@gmail.com';
  select id into yeni from public.profiles where email = 'kagandegirmencioglu@gmail.com';
  if eski is not null and yeni is not null then
    insert into public.lesson_progress (user_id, lesson_id, completed, completed_at, updated_at)
    select yeni, lesson_id, completed, completed_at, updated_at
    from public.lesson_progress where user_id = eski
    on conflict (user_id, lesson_id) do nothing;
    update public.quiz_attempts set user_id = yeni where user_id = eski;
    -- unique (user_id, task_id): asıl hesapta aynı görevin gönderimi varsa o kalır.
    update public.task_submissions s set user_id = yeni
    where s.user_id = eski
      and not exists (
        select 1 from public.task_submissions t where t.user_id = yeni and t.task_id = s.task_id
      );
    update public.lesson_questions set author_id = yeni where author_id = eski;
    update public.submission_comments set author_id = yeni where author_id = eski;
    -- profiles ve kalan türetilmiş kayıtlar (rozet, yetkinlik, bildirim) cascade ile silinir.
    delete from auth.users where id = eski;
  end if;
end;
$$;

delete from public.allowlist where email = 'kagan_degirmencioglu@gmail.com' and role = 'uye';
update public.allowlist
set student_no = coalesce(student_no, '811'), ad = 'Kağan Değirmencioğlu'
where email = 'kagandegirmencioglu@gmail.com'
  and not exists (
    select 1 from public.allowlist
    where student_no = '811' and email <> 'kagandegirmencioglu@gmail.com'
  );
update public.profiles set ad = 'Kağan Değirmencioğlu' where email = 'kagandegirmencioglu@gmail.com';

update public.allowlist set student_no = null
where email = 'cavdaromer1033@gmail.com' and student_no = '861';
update public.allowlist set student_no = '861'
where email = 'akhanim2116@gmail.com'
  and student_no is null
  and not exists (select 1 from public.allowlist where student_no = '861');
