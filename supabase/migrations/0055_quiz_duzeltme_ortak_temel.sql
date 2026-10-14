-- Ortak Temel quiz düzeltmeleri (inceleme sonucu):
-- 1) Saçma şıklar makul yanlışlarla değiştirildi (İHA Tasarım Süreci).
-- 2) Uçuş Kontrol zor: arm engelleri sorusu ArduPilot/PixHawk'a bağlandı,
--    motor yönü sorusundaki çift cevaplı şık sadeleştirildi.
-- 3) Drone Temelleri orta quizine 2 soru eklendi (4 -> 6).
-- Idempotent: eski metin bulunamazsa ilgili satır etkilenmez.

begin;

-- Soru metni (şık düzeltmesinden önce)
update public.questions q set metin = 'ArduPilot/PixHawk gibi bir uçuş kontrolünde aşağıdakilerden hangileri aracın arm edilmesini (motorların açılmasını) engelleyebilir? (birden çok)'
  from public.quizzes z, public.modules m
 where q.quiz_id = z.id and z.module_id = m.id and m.ad = 'Uçuş Kontrol & Kurulum' and z.zorluk = 'zor'
   and q.metin like 'Aşağıdakilerden hangileri bir aracın arm edilmesini%';

-- Şık metni düzeltmeleri: (modül, zorluk, soru başlangıcı, eski şık, yeni şık)
do $q$
declare r record;
begin
  for r in select * from (values
    ('İHA Tasarım Süreci','orta','Sistem mimarisi','Yalnız gövde rengini','Yalnız bileşenlerin ağırlık listesini'),
    ('İHA Tasarım Süreci','orta','Sistem mimarisi','Pilotun maaşını','Uçuş sahasının koordinatlarını'),
    ('İHA Tasarım Süreci','orta','Aşağıdakilerden hangisi hedef performans','Boya kalitesi','Parça tedarikçisinin adı'),
    ('İHA Tasarım Süreci','orta','Aşağıdakilerden hangisi hedef performans','Kutunun boyutu','Kullanılan vida sayısı'),
    ('İHA Tasarım Süreci','orta','Aşağıdakilerden hangisi hedef performans','Logo rengi','Belgelerin sayfa sayısı'),
    ('İHA Tasarım Süreci','orta','Prototip neden','Satış için','Tasarım dosyalarını arşivlemek için'),
    ('İHA Tasarım Süreci','orta','Prototip neden','Raporu uzatmak için','Yalnız sponsorlara göstermek için'),
    ('İHA Tasarım Süreci','orta','Prototip neden','Zorunlu olduğu için','Seri üretim hattını kurmak için'),
    ('İHA Tasarım Süreci','zor','İlk uçuştan önce','Hiç kontrol yapmadan uçurmak','Önce uçurup sorunları havada gidermek'),
    ('İHA Tasarım Süreci','zor','İlk uçuştan önce','Yalnız fotoğraf çekmek','Yalnızca bataryayı şarj etmek'),
    ('İHA Tasarım Süreci','zor','İlk uçuştan önce','Bataryayı tam boşaltmak','Yalnızca yazılım sürümünü güncellemek'),
    ('Uçuş Kontrol & Kurulum','zor','ArduPilot/PixHawk gibi','GPS fix alınamaması','GPS fix alınamaması (GPS bağımlı modlarda)'),
    ('Uçuş Kontrol & Kurulum','zor','Bir motor ters yönde dönüyor','ESC üzerinden motor yönünü değiştirmek (ya da iki faz kablosunu yer değiştirmek)','Motorun üç faz kablosundan ikisinin yerini değiştirmek')
  ) as v(modul, zorluk, soru, eski, yeni) loop
    update public.question_options o set metin = r.yeni
      from public.questions q, public.quizzes z, public.modules m
     where o.question_id = q.id and q.quiz_id = z.id and z.module_id = m.id
       and m.ad = r.modul and z.zorluk = r.zorluk and q.metin like r.soru || '%'
       and o.metin = r.eski;
  end loop;
end $q$;

-- Drone Temelleri, orta: 2 yeni soru
do $q$
declare v_quiz uuid; v_q uuid; v_n int;
begin
  select z.id into v_quiz from public.quizzes z join public.modules m on m.id = z.module_id
   where m.ad = 'Drone Temelleri' and z.zorluk = 'orta' limit 1;
  if v_quiz is null then return; end if;
  select count(*) into v_n from public.questions where quiz_id = v_quiz;
  if v_n >= 6 then return; end if;

  insert into public.questions (quiz_id, metin, sira, aciklama) values
    (v_quiz, 'Bir quadcopter''ın olduğu yerde sabit asılı kalabilmesi (hover) için dört motorun toplam itkisi ne olmalıdır?', v_n + 1,
     'Hover''da net kuvvet sıfırdır: toplam itki araç ağırlığına eşit olur. Yükselmek için ağırlıktan büyük olmalıdır.') returning id into v_q;
  insert into public.question_options (question_id, metin, dogru, sira) values
    (v_q, 'Araç ağırlığından az', false, 1), (v_q, 'Araç ağırlığına eşit', true, 2),
    (v_q, 'Araç ağırlığının iki katı', false, 3), (v_q, 'Sıfır', false, 4);

  insert into public.questions (quiz_id, metin, sira, aciklama) values
    (v_quiz, 'Aynı motor devrinde pervanenin adımı (pitch) artırılırsa genel olarak ne olur?', v_n + 2,
     'Büyük adımlı pervane her turda havayı daha fazla iter: itki artar ama motordan çekilen akım da artar.') returning id into v_q;
  insert into public.question_options (question_id, metin, dogru, sira) values
    (v_q, 'İtki ve motorun çektiği akım artar', true, 1), (v_q, 'İtki artar, akım azalır', false, 2),
    (v_q, 'İtki azalır, akım artar', false, 3), (v_q, 'İkisi de değişmez', false, 4);
end $q$;

commit;
