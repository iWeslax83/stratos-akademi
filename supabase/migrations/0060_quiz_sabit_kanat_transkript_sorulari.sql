-- Sabit Kanat Tasarımı (T3 3.x) transkriptleri: IuhS70GZkts (3.1), hnVm6sr8b3c (3.2), iMfPygGD408 (3.4), vG4_AIuvvRk (3.5).
-- Altyazı: YouTube otomatik Türkçe transkript. 3.3 ve 3.6 transkriptleri alınamadı.
-- Her sorunun zaman damgası ve kanıt cümlesi aşağıdaki yorumlardadır.
-- Sabit Kanat Tasarımı orta/zor quizlerine EKLENİR. Idempotent: aynı soru metni varsa atlanır.

begin;

-- IuhS70GZkts 00:40: bir uçağın havada dengesini koruyabilmesi ve istenen şekilde hareket edebilmesi için dört temel bileşenden oluştuğunu... gövde, kanatlar, kuyruk ve kontrol yüzeyleri.
-- hnVm6sr8b3c 00:04: gövde bir hava aracının omurgası gibidir, yapısal bütünlüğünü sağlayarak tüm bileşenleri bir arada tutar... kanat ve kuyruk gibi temel aerodinamik yapılar gövdeye monte edilir.
-- iMfPygGD408 00:19: kuyruk dikey ve yatay dengeleyiciler oluşur; dikey dengeleyici uçağın sağa sola savrulmasını önleyerek yön stabilitesini korur, yatay dengeleyici ise burun yukarı burun aşağı hareketini dengeler.
-- vG4_AIuvvRk 00:29: tablonun sütunlarına değerlendirmek istediğiniz kanat ve kuyruk tasarımlarını yazın; satırlarda tasarımı seçerken dikkate almanız gereken kriterler... her bir kriter için tasarımlara puan vererek objektif bir karşılaştırma yapabilirsiniz.
do $q$
declare v_quiz uuid; v_q uuid; v_sira int; r jsonb; o jsonb; j int;
begin
  select z.id into v_quiz from public.quizzes z join public.modules m on m.id = z.module_id
   where m.ad = 'Sabit Kanat Tasarımı' and z.zorluk = 'orta' limit 1;
  if v_quiz is null then raise notice 'Quiz yok, atlanıyor: Sabit Kanat Tasarımı orta'; return; end if;
  select coalesce(max(sira), 0) into v_sira from public.questions where quiz_id = v_quiz;
  for r in select * from jsonb_array_elements($json$[{"m":"Videoya göre sabit kanat hava aracının dört temel bileşeni hangileridir? (birden çok)","a":"Her bir bileşenin farklı bir işlevi ve uçağın performansını etkileyen tasarım çeşitleri vardır.","o":[["Gövde",true],["Kanatlar",true],["Kuyruk",true],["Kontrol yüzeyleri",true]]},{"m":"Videoya göre gövdenin görevi nedir?","a":"Gövde, bileşenlerin üzerinde toplandığı taşıyıcı yapıdır.","o":[["Omurga gibi yapısal bütünlüğü sağlar; elektronik sistemleri, uçuş bilgisayarını, görüntüleme cihazlarını ve faydalı yükü barındırır, kanat ve kuyruk ona monte edilir",true],["Tek başına taşıma kuvveti üretir",false],["Yalnızca yakıt depolar",false],["Kontrol yüzeylerini hareket ettirir",false]]},{"m":"Kuyruktaki dikey ve yatay dengeleyicilerin görevi nedir?","a":"Kuyruk, hava aracının stabilitesini sağlayan kritik bir yapıdır.","o":[["Dikey: sağa sola savrulmayı önleyip yön stabilitesini korur; yatay: burun yukarı-aşağı hareketini dengeler",true],["Dikey: burun yukarı-aşağıyı, yatay: sağa sola savrulmayı dengeler",false],["İkisi de yalnızca taşıma üretir",false],["İkisi de itki sağlar",false]]},{"m":"Videoya göre kanat ve kuyruk tipini seçerken hangi yöntem önerilir?","a":"Aerodinamik verimlilik, stabilite, manevra kabiliyeti, üretim kolaylığı, yakıt tüketimi ve maliyet kriter örnekleridir.","o":[["Tasarımlar sütunlarda, kriterler satırlarda olan bir değerlendirme tablosu hazırlayıp puanlamak",true],["En ucuz olanı seçmek",false],["Her zaman geleneksel kuyruğu seçmek",false],["Yalnızca pilotun tercihine bırakmak",false]]}]$json$::jsonb) loop
    if exists (select 1 from public.questions where quiz_id = v_quiz and metin = r->>'m') then continue; end if;
    v_sira := v_sira + 1;
    insert into public.questions (quiz_id, metin, sira, aciklama)
      values (v_quiz, r->>'m', v_sira, r->>'a') returning id into v_q;
    j := 0;
    for o in select * from jsonb_array_elements(r->'o') loop
      j := j + 1;
      insert into public.question_options (question_id, metin, dogru, sira)
        values (v_q, o->>0, (o->>1)::boolean, j);
    end loop;
  end loop;
end $q$;

-- hnVm6sr8b3c 00:42: kargo taşıma amaçlı tasarlanan insansız hava araçları daha geniş ve hacimli gövdelere sahiptir çünkü öncelikleri hız veya gizlilik değil yük kapasitesidir.
-- hnVm6sr8b3c 00:27: savaş görevleri için tasarlanan Bayraktar Kızılelma yüksek hızlara ulaşmak için sivri bir burun ve aerodinamik bir gövdeye sahiptir; silah sistemlerini gövde içinde entegre ederek radardan gizlenmesini artırır.
-- iMfPygGD408 01:36: geleneksel kuyruk tasarımı dikey ve yatay dengeleyicilerin ayrı konumlandırıldığı yapıdır... büyük kuyruk yüzeyi manevra kabiliyetini sınırlayabilir.
-- iMfPygGD408 02:25: V kuyruklu bir uçak tasarımı iki eğimli kuyruk yüzeyinden oluşur; bu yüzeyler hem yatay hem dikey dengeleyici olarak işlev görür; hava direncini azaltarak yüksek hızlara ulaşılmasını mümkün kılar, manevra kabiliyeti yüksektir.
-- iMfPygGD408 02:44: V kuyruk... yüksek hücum açılarında kanatlardan ayrılan hava akımı doğrudan kuyruk yüzeylerine çarpar bu durum uçuş kontrolünü zorlaştırabilir... en uygun açının belirlenmesi detaylı hesaplamalar ve testler gerektirir.
-- iMfPygGD408 03:56: Anka 3 gibi bazı hava araçları aerodinamik tasarımları ve akıllı kontrol sistemleri sayesinde kuyruksuz olarak da havada dengede kalabiliyor... radar izini azaltmak ve aerodinamik verimi arttırmak amacıyla.
-- vG4_AIuvvRk 00:58: savaş uçağı tasarlıyorsanız hız ve manevra kabiliyeti ön planda olmalıdır; gözlem ve keşif İHA'sı tasarlıyorsanız yakıt verimliliği, stabilite ve düşük hız daha kritik faktörlerdir.
do $q$
declare v_quiz uuid; v_q uuid; v_sira int; r jsonb; o jsonb; j int;
begin
  select z.id into v_quiz from public.quizzes z join public.modules m on m.id = z.module_id
   where m.ad = 'Sabit Kanat Tasarımı' and z.zorluk = 'zor' limit 1;
  if v_quiz is null then raise notice 'Quiz yok, atlanıyor: Sabit Kanat Tasarımı zor'; return; end if;
  select coalesce(max(sira), 0) into v_sira from public.questions where quiz_id = v_quiz;
  for r in select * from jsonb_array_elements($json$[{"m":"Kargo taşıyan insansız hava araçlarının gövdesi neden geniş ve hacimlidir?","a":"Gövde tasarımı, hava aracının göreviyle belirlenir.","o":[["Öncelikleri hız veya gizlilik değil, yük kapasitesi olduğu için",true],["Daha az yakıt harcamak için",false],["Radardan gizlenmek için",false],["Daha yüksek hıza çıkmak için",false]]},{"m":"Videoya göre savaş görevli bir hava aracında silah sistemlerinin gövde içine entegre edilmesinin avantajı nedir?","a":"Sivri burun ve aerodinamik gövde ise yüksek hıza ulaşmak içindir.","o":[["Radardan gizlenmeyi artırır",true],["Yük kapasitesini artırır",false],["Motor gücünü artırır",false],["Bakımı kolaylaştırır",false]]},{"m":"Geleneksel kuyruk tasarımı için hangisi doğrudur?","a":"Yolcu uçaklarında konfor, güvenlik ve verimlilik için yaygındır.","o":[["Dikey ve yatay dengeleyici ayrıdır; yüksek stabilite, bakım/üretim kolaylığı sağlar, ancak büyük kuyruk yüzeyi manevra kabiliyetini sınırlayabilir",true],["Tek eğimli yüzeyden oluşur, manevra kabiliyeti çok yüksektir",false],["Kuyruk bulunmaz, kanatlar stabiliteyi sağlar",false],["Yalnızca yüksek hızlı araçlarda kullanılır",false]]},{"m":"V kuyruk tasarımının avantajları nelerdir?","a":"Çevik hareket gerektiren hava araçlarına avantaj sunar.","o":[["İki eğimli yüzey hem yatay hem dikey dengeleyici görevi yapar, hava direncini azaltarak yüksek hızı mümkün kılar ve manevra kabiliyeti yüksektir",true],["Kuyruk yüzeyi sayısını artırarak stabiliteyi artırır",false],["Yalnızca düşük hızlı araçlarda kullanılır",false],["Gövdeyi hafifletir ama kontrolü zorlaştırır",false]]},{"m":"V kuyruğun dezavantajlarından biri hangisidir?","a":"Ayrıca en uygun V açısı hesap ve testle belirlenmeli, yapı daha karmaşıktır ve ek destek gerektirir.","o":[["Yüksek hücum açılarında kanattan ayrılan hava akımı doğrudan kuyruk yüzeylerine çarpıp kontrolü zorlaştırabilir",true],["Hava direncini artırır",false],["Hiç manevra yapamaz",false],["Stabilite sağlamaz",false]]},{"m":"Videoya göre kuyruksuz bir hava aracı (örn. Anka 3) stabilitesini nasıl sağlar ve neden böyle tasarlanır?","a":"Bu tür tasarımlar ileri düzey bilgisayar sistemleri ve hassas kontrol mekanizmaları gerektirir.","o":[["Kanat tasarımı ve gelişmiş uçuş kontrol sistemleriyle; radar izini azaltmak ve aerodinamik verimi artırmak için",true],["Pervaneleri döndürerek; yakıt tasarrufu için",false],["Gövdeyi ağırlaştırarak; daha ucuz olduğu için",false],["Yalnızca pilot kontrolüyle; üretim kolaylığı için",false]]},{"m":"Videoya göre bir gözlem ve keşif İHA'sı için hangi kriterler daha kritiktir?","a":"Savaş uçaklarında önce hız ve manevra kabiliyeti öne çıkar.","o":[["Yakıt verimliliği, stabilite ve düşük hız",true],["Hız ve manevra kabiliyeti",false],["Gizlilik ve yüksek hız",false],["Yalnızca yük kapasitesi",false]]}]$json$::jsonb) loop
    if exists (select 1 from public.questions where quiz_id = v_quiz and metin = r->>'m') then continue; end if;
    v_sira := v_sira + 1;
    insert into public.questions (quiz_id, metin, sira, aciklama)
      values (v_quiz, r->>'m', v_sira, r->>'a') returning id into v_q;
    j := 0;
    for o in select * from jsonb_array_elements(r->'o') loop
      j := j + 1;
      insert into public.question_options (question_id, metin, dogru, sira)
        values (v_q, o->>0, (o->>1)::boolean, j);
    end loop;
  end loop;
end $q$;

commit;
