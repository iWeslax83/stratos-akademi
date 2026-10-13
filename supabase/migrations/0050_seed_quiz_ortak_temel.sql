-- Ortak Temel dalı quizleri (orta ve zor). Idempotent: (modül, zorluk) için quiz varsa atlanır.
-- 0048_quiz_zorluk.sql uygulanmış olmalı. Modül yoksa (örn. 0049 uygulanmadıysa) notice verip atlar.

do $q$
declare v_module uuid; v_quiz uuid; v_q uuid; r jsonb; o jsonb; i int := 0; j int;
begin
  select m.id into v_module from public.modules m join public.tracks t on t.id = m.track_id
   where t.slug = 'ortak-temel' and m.ad = 'Drone Temelleri' limit 1;
  if v_module is null then raise notice 'Modül yok, atlanıyor: Drone Temelleri'; return; end if;
  if exists (select 1 from public.quizzes where module_id = v_module and zorluk = 'zor') then return; end if;
  insert into public.quizzes (module_id, baslik, gecme_esigi, sira, zorluk)
    values (v_module, 'Drone Temelleri Quizi (Zor)', 70, 1, 'zor') returning id into v_quiz;
  for r in select * from jsonb_array_elements($json$[{"m":"4S bir LiPo bataryanın nominal gerilimi yaklaşık kaç volttur?","a":"Hücre başına nominal 3,7 V: 4 x 3,7 = 14,8 V. 16,8 V tam dolu gerilimdir.","o":[["11,1 V",false],["14,8 V",true],["16,8 V",false],["22,2 V",false]]},{"m":"Toplam kalkış ağırlığı 1,2 kg olan bir quadcopter'da, itki/ağırlık oranı 2:1 hedefleniyorsa dört motorun toplam maksimum itkisi en az ne olmalıdır?","a":"2:1 oran: 1,2 kg x 2 = 2,4 kg. Motor başına 600 g.","o":[["1,2 kg",false],["2,4 kg",true],["4,8 kg",false],["0,6 kg",false]]},{"m":"Çok rotorlu İHA'nın sabit kanatlıya göre avantajları hangileridir? (birden çok)","a":"Çok rotorlu hava araçları hover ve dikey kalkışta üstündür; menzil ve hızda sabit kanat öndedir.","o":[["Olduğu yerde asılı kalabilme (hover)",true],["Aynı enerjiyle daha uzun menzil",false],["Pist gerektirmeden dikey kalkış-iniş",true],["Daha yüksek seyir hızı",false]]},{"m":"Quadcopter'da iki motor saat yönünde (CW), ikisi saat yönünün tersine (CCW) döner. Yaw (kendi ekseninde dönme) nasıl oluşturulur?","a":"Toplam itki sabit kalırken CW ve CCW çiftleri arasındaki tork farkı gövdeyi yaw ekseninde döndürür.","o":[["Dört motorun devri aynı oranda artırılır",false],["CW çiftinin devri artırılıp CCW çiftinin devri azaltılır",true],["Yalnız ön iki motor durdurulur",false],["Pervaneler ters çevrilir",false]]},{"m":"KV değeri 1000 olan bir fırçasız motor 11,1 V ile yüksüz yaklaşık kaç devir/dakika döner?","a":"KV, volt başına yüksüz devirdir: 1000 x 11,1 = 11 100 rpm.","o":[["1 110",false],["11 100",true],["111 000",false],["1 000",false]]},{"m":"ESC (Electronic Speed Controller) ne yapar?","a":"ESC, bataryanın DC gücünü üç fazlı olarak motora uygular ve hızı FC komutuna göre ayarlar.","o":[["Uçuş kontrol kartının kullandığı yönü hesaplar",false],["Bataryayı şarj eder",false],["Uçuş kontrolden gelen sinyale göre fırçasız motorun hızını ayarlar",true],["Kameradan gelen görüntüyü yer istasyonuna iletir",false]]}]$json$::jsonb) loop
    i := i + 1;
    insert into public.questions (quiz_id, metin, sira, aciklama)
      values (v_quiz, r->>'m', i, r->>'a') returning id into v_q;
    j := 0;
    for o in select * from jsonb_array_elements(r->'o') loop
      j := j + 1;
      insert into public.question_options (question_id, metin, dogru, sira)
        values (v_q, o->>0, (o->>1)::boolean, j);
    end loop;
  end loop;
end $q$;

do $q$
declare v_module uuid; v_quiz uuid; v_q uuid; r jsonb; o jsonb; i int := 0; j int;
begin
  select m.id into v_module from public.modules m join public.tracks t on t.id = m.track_id
   where t.slug = 'ortak-temel' and m.ad = 'Uçuş Kontrol & Kurulum' limit 1;
  if v_module is null then raise notice 'Modül yok, atlanıyor: Uçuş Kontrol & Kurulum'; return; end if;
  if exists (select 1 from public.quizzes where module_id = v_module and zorluk = 'orta') then return; end if;
  insert into public.quizzes (module_id, baslik, gecme_esigi, sira, zorluk)
    values (v_module, 'Uçuş Kontrol & Kurulum Quizi (Orta)', 70, 0, 'orta') returning id into v_quiz;
  for r in select * from jsonb_array_elements($json$[{"m":"Uçuş kontrol kartındaki IMU hangi sensörleri içerir?","a":"IMU (Inertial Measurement Unit) jiroskop ve ivmeölçerden oluşur; duruş (attitude) bilgisi buradan gelir.","o":[["Barometre ve GPS",false],["Jiroskop ve ivmeölçer",true],["Kamera ve mikrofon",false],["Akım ve sıcaklık sensörü",false]]},{"m":"Barometre drone'da ne için kullanılır?","a":"Basınç irtifa arttıkça düşer; barometre bu farktan irtifayı kestirir.","o":[["Yön bulmak",false],["Hava basıncından irtifa tahmin etmek",true],["Hız ölçmek",false],["Batarya durumunu izlemek",false]]},{"m":"Pusula (magnetometre) hangi bilgiyi sağlar?","a":"Magnetometre manyetik alanı ölçerek aracın baş yönünü (heading) belirler.","o":[["Yön (baş açısı)",true],["Batarya gerilimi",false],["Pervane devri",false],["Yer hızı",false]]},{"m":"Failsafe nedir?","a":"Sinyal kaybı veya düşük batarya gibi durumlarda araç RTL, iniş gibi önceden seçilen davranışı uygular.","o":[["Motorların daha hızlı dönmesi",false],["Kumanda sinyali kaybında devreye giren güvenlik davranışı",true],["Pervane balans ayarı",false],["Batarya kalibrasyonu",false]]},{"m":"İvmeölçer kalibrasyonu sırasında araç nasıl durmalıdır?","a":"Kalibrasyon için araç düz, sabit zeminde istenen konumlara getirilir.","o":[["Titreşen bir yüzeyde",false],["Düz ve sabit bir zeminde, her yöne ayrı ayrı",true],["Havada asılı kalırken",false],["Bataryasız",false]]},{"m":"Betaflight genellikle hangi tür hava araçlarında kullanılır?","a":"Betaflight, FPV/yarış odaklı çok rotorlu uçuş kontrol yazılımıdır.","o":[["Sabit kanat uçaklar",false],["Çok rotorlu, özellikle FPV ve yarış drone'ları",true],["Roketler",false],["Karasal robotlar",false]]}]$json$::jsonb) loop
    i := i + 1;
    insert into public.questions (quiz_id, metin, sira, aciklama)
      values (v_quiz, r->>'m', i, r->>'a') returning id into v_q;
    j := 0;
    for o in select * from jsonb_array_elements(r->'o') loop
      j := j + 1;
      insert into public.question_options (question_id, metin, dogru, sira)
        values (v_q, o->>0, (o->>1)::boolean, j);
    end loop;
  end loop;
end $q$;

do $q$
declare v_module uuid; v_quiz uuid; v_q uuid; r jsonb; o jsonb; i int := 0; j int;
begin
  select m.id into v_module from public.modules m join public.tracks t on t.id = m.track_id
   where t.slug = 'ortak-temel' and m.ad = 'Uçuş Kontrol & Kurulum' limit 1;
  if v_module is null then raise notice 'Modül yok, atlanıyor: Uçuş Kontrol & Kurulum'; return; end if;
  if exists (select 1 from public.quizzes where module_id = v_module and zorluk = 'zor') then return; end if;
  insert into public.quizzes (module_id, baslik, gecme_esigi, sira, zorluk)
    values (v_module, 'Uçuş Kontrol & Kurulum Quizi (Zor)', 70, 1, 'zor') returning id into v_quiz;
  for r in select * from jsonb_array_elements($json$[{"m":"PID kontrolcüsündeki I (integral) teriminin görevi nedir?","a":"I terimi hatayı zaman içinde toplayarak kalıcı sapmayı (steady-state error) yok eder.","o":[["Ani değişimleri sönümlemek",false],["Hata ile orantılı tepki vermek",false],["Kalıcı hatayı zamanla biriktirip gidermek",true],["Motor yönünü belirlemek",false]]},{"m":"İlk kurulumda motor yönlerini Betaflight'ta test ederken hangi güvenlik kuralı geçerlidir?","a":"Motor testi sırasında pervane takılıyken beklenmedik dönüş yaralanmaya yol açar.","o":[["Pervaneler takılı olmalı",false],["Pervaneler takılı olmamalı",true],["Batarya çıkarılmalı ve USB takılı olmamalı",false],["Araç havada tutulmalı",false]]},{"m":"Bir motor ters yönde dönüyor. En doğru çözüm hangisidir?","a":"Fırçasız motorda üç fazdan ikisinin yeri değişince yön tersine döner; ESC yazılımıyla da çevrilebilir.","o":[["Pervaneyi ters takmak",false],["ESC üzerinden motor yönünü değiştirmek (ya da iki faz kablosunu yer değiştirmek)",true],["Bataryayı ters bağlamak",false],["Alıcıyı değiştirmek",false]]},{"m":"Aşağıdakilerden hangileri bir aracın arm edilmesini (motorların açılmasını) engelleyebilir? (birden çok)","a":"Pre-arm kontrolleri sensör kalibrasyonu, GPS ve batarya durumunu denetler.","o":[["Pusula kalibre edilmemiş olması",true],["GPS fix alınamaması",true],["Düşük batarya gerilimi",true],["Pervane renginin farklı olması",false]]},{"m":"Sensör füzyonu (sensor fusion) nedir?","a":"Kalman filtresi gibi kestiriciler IMU, barometre, GPS verisini birleştirir.","o":[["Sensörleri tek parça halinde üretmek",false],["Birden çok sensörün verisini birleştirerek daha doğru durum kestirimi yapmak",true],["Sensör gürültüsünü artırmak",false],["Yalnız GPS verisini kullanmak",false]]},{"m":"Test uçuşuna geçmeden önce yapılması gereken doğru sıra hangisidir?","a":"Kademeli test, hatayı düşük riskli aşamada yakalamayı sağlar.","o":[["Doğrudan tam gaz uçuş",false],["Yer kontrolleri, kalibrasyonlar, pervanesiz motor testi, sonra kısa hover testi",true],["Önce uzun menzil uçuşu",false],["Yalnız kamera testi",false]]}]$json$::jsonb) loop
    i := i + 1;
    insert into public.questions (quiz_id, metin, sira, aciklama)
      values (v_quiz, r->>'m', i, r->>'a') returning id into v_q;
    j := 0;
    for o in select * from jsonb_array_elements(r->'o') loop
      j := j + 1;
      insert into public.question_options (question_id, metin, dogru, sira)
        values (v_q, o->>0, (o->>1)::boolean, j);
    end loop;
  end loop;
end $q$;

do $q$
declare v_module uuid; v_quiz uuid; v_q uuid; r jsonb; o jsonb; i int := 0; j int;
begin
  select m.id into v_module from public.modules m join public.tracks t on t.id = m.track_id
   where t.slug = 'ortak-temel' and m.ad = 'Aerodinamik ve Uçuş Mekaniği' limit 1;
  if v_module is null then raise notice 'Modül yok, atlanıyor: Aerodinamik ve Uçuş Mekaniği'; return; end if;
  if exists (select 1 from public.quizzes where module_id = v_module and zorluk = 'orta') then return; end if;
  insert into public.quizzes (module_id, baslik, gecme_esigi, sira, zorluk)
    values (v_module, 'Aerodinamik Quizi (Orta)', 70, 0, 'orta') returning id into v_quiz;
  for r in select * from jsonb_array_elements($json$[{"m":"Bir hava aracına etki eden dört temel kuvvet hangileridir?","a":"Ağırlık yere, taşıma yukarı, itki ileri, sürükleme geri doğrudur.","o":[["Ağırlık, taşıma, sürükleme, itki",true],["Hız, ivme, basınç, sıcaklık",false],["Yerçekimi, manyetizma, sürtünme, ses",false],["Taşıma, enerji, güç, tork",false]]},{"m":"Taşıma kuvvetinin karşıtı hangisidir?","a":"Sabit seyirde taşıma ağırlığı, itki sürüklemeyi dengeler.","o":[["Sürükleme",false],["İtki",false],["Ağırlık",true],["Tork",false]]},{"m":"Hücum açısı (angle of attack) nedir?","a":"Hücum açısı, kanat profili kirişinin göreli hava akımı ile yaptığı açıdır.","o":[["Kanat ile gövde arasındaki açı",false],["Kanat kirişi ile hava akımı yönü arasındaki açı",true],["Uçağın yere göre açısı",false],["Kuyruk açısı",false]]},{"m":"Stall (perdövites) neden olur?","a":"Kritik hücum açısının üzerinde akım kanattan ayrılır ve taşıma aniden azalır.","o":[["Motor durduğunda",false],["Hücum açısı kritik değeri aşınca kanat üstünde akımın ayrılıp taşımanın düşmesiyle",true],["Batarya bitince",false],["Yüksek hızda",false]]},{"m":"Kanat profilinin ön kenarına ne ad verilir?","a":"Leading edge: hücum kenarı. Trailing edge: firar kenarı.","o":[["Trailing edge",false],["Leading edge",true],["Chord",false],["Camber",false]]},{"m":"Sürükleme kuvveti hangi yöndedir?","a":"Sürükleme, araca hava akımına karşı koyar ve hareket yönünün tersindedir.","o":[["Hareket yönünün tersine",true],["Hareket yönünde",false],["Yukarı",false],["Aşağı",false]]}]$json$::jsonb) loop
    i := i + 1;
    insert into public.questions (quiz_id, metin, sira, aciklama)
      values (v_quiz, r->>'m', i, r->>'a') returning id into v_q;
    j := 0;
    for o in select * from jsonb_array_elements(r->'o') loop
      j := j + 1;
      insert into public.question_options (question_id, metin, dogru, sira)
        values (v_q, o->>0, (o->>1)::boolean, j);
    end loop;
  end loop;
end $q$;

do $q$
declare v_module uuid; v_quiz uuid; v_q uuid; r jsonb; o jsonb; i int := 0; j int;
begin
  select m.id into v_module from public.modules m join public.tracks t on t.id = m.track_id
   where t.slug = 'ortak-temel' and m.ad = 'Aerodinamik ve Uçuş Mekaniği' limit 1;
  if v_module is null then raise notice 'Modül yok, atlanıyor: Aerodinamik ve Uçuş Mekaniği'; return; end if;
  if exists (select 1 from public.quizzes where module_id = v_module and zorluk = 'zor') then return; end if;
  insert into public.quizzes (module_id, baslik, gecme_esigi, sira, zorluk)
    values (v_module, 'Aerodinamik Quizi (Zor)', 70, 1, 'zor') returning id into v_quiz;
  for r in select * from jsonb_array_elements($json$[{"m":"Taşıma L = ½·ρ·V²·S·CL ifadesine göre diğer her şey sabitken hız iki katına çıkarsa taşıma kaç katına çıkar?","a":"Taşıma hızın karesiyle orantılıdır: 2² = 4.","o":[["2 katı",false],["4 katı",true],["8 katı",false],["Değişmez",false]]},{"m":"Sabit irtifada, sabit hızda düz uçuşta hangi eşitlikler geçerlidir? (birden çok)","a":"Dengeli seyirde dikey kuvvetler ve yatay kuvvetler ayrı ayrı dengelenir.","o":[["Taşıma = Ağırlık",true],["İtki = Sürükleme",true],["Taşıma = Sürükleme",false],["İtki = Ağırlık",false]]},{"m":"Uçağın kalkış ağırlığı artarsa stall hızı nasıl değişir?","a":"Daha fazla ağırlığı taşımak için daha yüksek hız (veya hücum açısı) gerekir; stall hızı artar.","o":[["Azalır",false],["Artar",true],["Değişmez",false],["Sıfırlanır",false]]},{"m":"Ağırlık merkezi (CG) nötr noktanın çok gerisine kayarsa ne olur?","a":"Stabilite için CG nötr noktanın önünde olmalıdır; gerisinde araç kontrol edilemez hale gelir.","o":[["Boyuna stabilite artar",false],["Boyuna stabilite azalır, araç kararsızlaşır",true],["Hiçbir şey olmaz",false],["Kanat daha fazla taşıma üretir",false]]},{"m":"İndüklenmiş sürükleme (induced drag) neyle doğrudan ilişkilidir?","a":"Taşıma üreten her kanat uç girdapları yoluyla indüklenmiş sürükleme yaratır.","o":[["Gövdenin yüzey pürüzlülüğü",false],["Taşıma üretilmesi ve kanat uçlarındaki vorteksler",true],["Pervane devri",false],["Hava sıcaklığı",false]]},{"m":"Hava yoğunluğu düştüğünde (yüksek irtifa, sıcak hava) hangileri doğrudur? (birden çok)","a":"Aerodinamik kuvvetler yoğunlukla orantılıdır; kütle ise değişmez.","o":[["Aynı hızda taşıma azalır",true],["Aynı taşıma için daha yüksek hız gerekir",true],["Pervane itkisi azalır",true],["Araç ağırlığı azalır",false]]}]$json$::jsonb) loop
    i := i + 1;
    insert into public.questions (quiz_id, metin, sira, aciklama)
      values (v_quiz, r->>'m', i, r->>'a') returning id into v_q;
    j := 0;
    for o in select * from jsonb_array_elements(r->'o') loop
      j := j + 1;
      insert into public.question_options (question_id, metin, dogru, sira)
        values (v_q, o->>0, (o->>1)::boolean, j);
    end loop;
  end loop;
end $q$;

do $q$
declare v_module uuid; v_quiz uuid; v_q uuid; r jsonb; o jsonb; i int := 0; j int;
begin
  select m.id into v_module from public.modules m join public.tracks t on t.id = m.track_id
   where t.slug = 'ortak-temel' and m.ad = 'Sabit Kanat Tasarımı' limit 1;
  if v_module is null then raise notice 'Modül yok, atlanıyor: Sabit Kanat Tasarımı'; return; end if;
  if exists (select 1 from public.quizzes where module_id = v_module and zorluk = 'orta') then return; end if;
  insert into public.quizzes (module_id, baslik, gecme_esigi, sira, zorluk)
    values (v_module, 'Sabit Kanat Tasarımı Quizi (Orta)', 70, 0, 'orta') returning id into v_quiz;
  for r in select * from jsonb_array_elements($json$[{"m":"Roll (yatış) hareketini kontrol eden yüzey hangisidir?","a":"Aileronlar kanat arka kenarında zıt yönde hareket ederek yatış sağlar.","o":[["Elevatör",false],["Rudder",false],["Aileron",true],["Flap",false]]},{"m":"Pitch (yunuslama) hareketini kontrol eden yüzey hangisidir?","a":"Elevatör yatay kuyrukta bulunur ve burnu yukarı-aşağı hareket ettirir.","o":[["Elevatör",true],["Aileron",false],["Rudder",false],["Spoiler",false]]},{"m":"Yaw (sapma) hareketini hangi yüzey kontrol eder?","a":"Rudder dikey kuyrukta bulunur ve burnu sağa-sola çevirir.","o":[["Aileron",false],["Elevatör",false],["Rudder",true],["Flap",false]]},{"m":"Flap (kanatçık) ne işe yarar?","a":"Flap kanat kamburluğunu/alanını artırarak düşük hızda taşımayı artırır.","o":[["Hızı artırır",false],["Kalkış ve inişte kanadın taşımasını artırır",true],["Yönü değiştirir",false],["Motoru soğutur",false]]},{"m":"Kanat açıklığı (span) neyi ifade eder?","a":"Span, uçtan uca toplam kanat uzunluğudur.","o":[["Kanadın kalınlığı",false],["Bir kanat ucundan diğer kanat ucuna mesafe",true],["Kanat kirişi uzunluğu",false],["Kanat ağırlığı",false]]},{"m":"Gövde (fuselage) görevi nedir?","a":"Gövde yapısal omurgadır; payload, batarya ve elektronik burada taşınır.","o":[["Yalnız aerodinamik süs",false],["Kanat ve kuyruğu birbirine bağlayıp yük ve ekipmanı taşımak",true],["Tek başına taşıma üretmek",false],["Motor gürültüsünü azaltmak",false]]}]$json$::jsonb) loop
    i := i + 1;
    insert into public.questions (quiz_id, metin, sira, aciklama)
      values (v_quiz, r->>'m', i, r->>'a') returning id into v_q;
    j := 0;
    for o in select * from jsonb_array_elements(r->'o') loop
      j := j + 1;
      insert into public.question_options (question_id, metin, dogru, sira)
        values (v_q, o->>0, (o->>1)::boolean, j);
    end loop;
  end loop;
end $q$;

do $q$
declare v_module uuid; v_quiz uuid; v_q uuid; r jsonb; o jsonb; i int := 0; j int;
begin
  select m.id into v_module from public.modules m join public.tracks t on t.id = m.track_id
   where t.slug = 'ortak-temel' and m.ad = 'Sabit Kanat Tasarımı' limit 1;
  if v_module is null then raise notice 'Modül yok, atlanıyor: Sabit Kanat Tasarımı'; return; end if;
  if exists (select 1 from public.quizzes where module_id = v_module and zorluk = 'zor') then return; end if;
  insert into public.quizzes (module_id, baslik, gecme_esigi, sira, zorluk)
    values (v_module, 'Sabit Kanat Tasarımı Quizi (Zor)', 70, 1, 'zor') returning id into v_quiz;
  for r in select * from jsonb_array_elements($json$[{"m":"Yüksek en-boy oranlı (aspect ratio) kanat hangi avantajı sağlar?","a":"Uzun ve ince kanatlar uç girdaplarını azaltır; planörler bu yüzden yüksek AR kullanır.","o":[["Daha yüksek stall hızı",false],["Daha az indüklenmiş sürükleme, uzun havada kalış",true],["Daha kısa kanat açıklığı",false],["Daha kolay üretim",false]]},{"m":"Kanat yükü (wing loading) neyi ifade eder?","a":"Wing loading = ağırlık / kanat alanı; yükseldikçe stall ve iniş hızı artar.","o":[["Kanat başına düşen motor sayısı",false],["Toplam ağırlığın kanat alanına oranı",true],["Kanadın dayanabileceği maksimum G",false],["Kanat kalınlığı",false]]},{"m":"Dihedral (kanat uçlarının yukarı açısı) neyi sağlar?","a":"Dihedral, yan kayma ile oluşan yatışı kendiliğinden düzelten bir etki yaratır.","o":[["Daha fazla itki",false],["Roll eksenindeki stabiliteyi",true],["Pitch kontrolünü",false],["Daha az sürükleme",false]]},{"m":"V-kuyruk (V-tail) için hangisi doğrudur?","a":"V-kuyruk yüzeyleri ruddervator olarak hem pitch hem yaw kontrolü sağlar.","o":[["Yalnız aileron görevi yapar",false],["Elevatör ve rudder işlevlerini birleştirir",true],["Hiçbir kontrol sağlamaz",false],["Yalnız kalkışta kullanılır",false]]},{"m":"Stabil bir uçak için CG nerede olmalıdır?","a":"CG, nötr noktanın önünde olursa araç dengesini kendiliğinden korur (statik marj).","o":[["Nötr noktanın hemen önünde (belirli bir stabilite payı ile)",true],["Nötr noktanın çok gerisinde",false],["Kuyruğun ucunda",false],["Fark etmez",false]]},{"m":"Kanat tipi seçerken hangi kriterler dikkate alınır? (birden çok)","a":"Renk performansı etkilemez; diğer kriterler tasarımı belirler.","o":[["Görev (dayanıklılık, hız, taşınacak yük)",true],["Üretim ve onarım kolaylığı",true],["Düşük hız ve stall karakteristiği",true],["Gövdenin rengi",false]]}]$json$::jsonb) loop
    i := i + 1;
    insert into public.questions (quiz_id, metin, sira, aciklama)
      values (v_quiz, r->>'m', i, r->>'a') returning id into v_q;
    j := 0;
    for o in select * from jsonb_array_elements(r->'o') loop
      j := j + 1;
      insert into public.question_options (question_id, metin, dogru, sira)
        values (v_q, o->>0, (o->>1)::boolean, j);
    end loop;
  end loop;
end $q$;

do $q$
declare v_module uuid; v_quiz uuid; v_q uuid; r jsonb; o jsonb; i int := 0; j int;
begin
  select m.id into v_module from public.modules m join public.tracks t on t.id = m.track_id
   where t.slug = 'ortak-temel' and m.ad = 'İHA Tasarım Süreci' limit 1;
  if v_module is null then raise notice 'Modül yok, atlanıyor: İHA Tasarım Süreci'; return; end if;
  if exists (select 1 from public.quizzes where module_id = v_module and zorluk = 'orta') then return; end if;
  insert into public.quizzes (module_id, baslik, gecme_esigi, sira, zorluk)
    values (v_module, 'İHA Tasarım Süreci Quizi (Orta)', 70, 0, 'orta') returning id into v_quiz;
  for r in select * from jsonb_array_elements($json$[{"m":"Bir İHA tasarım sürecinin ilk adımı hangisidir?","a":"Gereksinimler (menzil, süre, yük) sonraki tüm seçimleri yönlendirir.","o":[["Motor satın almak",false],["Görevi ve gereksinimleri belirlemek",true],["Boyamak",false],["Test uçuşu yapmak",false]]},{"m":"Sistem mimarisi / devre şeması neyi gösterir?","a":"Mimari, hangi bileşenin hangisiyle bağlandığını ve veri/güç akışını ortaya koyar.","o":[["Yalnız gövde rengini",false],["Alt sistemler ve aralarındaki bağlantıları",true],["Pilotun maaşını",false],["Pervane boyutunu",false]]},{"m":"Aşağıdakilerden hangisi hedef performans parametresidir?","a":"Menzil, havada kalış, yük kapasitesi ve hız tipik performans hedefleridir.","o":[["Havada kalış süresi",true],["Boya kalitesi",false],["Kutunun boyutu",false],["Logo rengi",false]]},{"m":"Kavramsal tasarımda ne yapılır?","a":"Kavramsal aşamada görev gereksinimlerine uygun genel yapı belirlenir.","o":[["Vidalar sıkılır",false],["Genel konfigürasyon (çok rotor, sabit kanat vb.) seçilir",true],["Yazılım yüklenir",false],["Uçuş izni alınır",false]]},{"m":"Elektronik bileşen seçerken öncelikli olarak hangi uyum gözetilir?","a":"Motorun çektiği akım ESC ve bataryanın sınırları içinde olmalıdır.","o":[["Motor, ESC ve batarya uyumu",true],["Kablo rengi",false],["Kutunun şekli",false],["Kameranın markası",false]]},{"m":"Prototip neden üretilir?","a":"Prototip, tasarım varsayımlarını gerçek testle doğrular.","o":[["Satış için",false],["Tasarımı gerçek koşullarda test edip iyileştirmek için",true],["Raporu uzatmak için",false],["Zorunlu olduğu için",false]]}]$json$::jsonb) loop
    i := i + 1;
    insert into public.questions (quiz_id, metin, sira, aciklama)
      values (v_quiz, r->>'m', i, r->>'a') returning id into v_q;
    j := 0;
    for o in select * from jsonb_array_elements(r->'o') loop
      j := j + 1;
      insert into public.question_options (question_id, metin, dogru, sira)
        values (v_q, o->>0, (o->>1)::boolean, j);
    end loop;
  end loop;
end $q$;

do $q$
declare v_module uuid; v_quiz uuid; v_q uuid; r jsonb; o jsonb; i int := 0; j int;
begin
  select m.id into v_module from public.modules m join public.tracks t on t.id = m.track_id
   where t.slug = 'ortak-temel' and m.ad = 'İHA Tasarım Süreci' limit 1;
  if v_module is null then raise notice 'Modül yok, atlanıyor: İHA Tasarım Süreci'; return; end if;
  if exists (select 1 from public.quizzes where module_id = v_module and zorluk = 'zor') then return; end if;
  insert into public.quizzes (module_id, baslik, gecme_esigi, sira, zorluk)
    values (v_module, 'İHA Tasarım Süreci Quizi (Zor)', 70, 1, 'zor') returning id into v_quiz;
  for r in select * from jsonb_array_elements($json$[{"m":"Kalkış ağırlığı hedefi 2,4 kg. Dört motor toplam 480 g, batarya 600 g, uçuş kontrol 40 g, dört ESC toplam 120 g, gövde 800 g. Yük (payload) için en çok ne kadar kütle kalır?","a":"480 + 600 + 40 + 120 + 800 = 2 040 g. 2 400 - 2 040 = 360 g.","o":[["200 g",false],["360 g",true],["560 g",false],["1 000 g",false]]},{"m":"Batarya kapasitesini artırmanın tasarımdaki dezavantajı nedir?","a":"Her ek Ah ağırlık getirir; belli bir noktadan sonra uçuş süresi kazancı azalır.","o":[["Hiçbiri yoktur",false],["Ağırlık artar, bu da gereken itkiyi ve akımı artırır (azalan getiri)",true],["Motor daha az güç çeker",false],["Uçuş kontrol bozulur",false]]},{"m":"Tasarım gereksinimleri değişirse en uygun yaklaşım nedir?","a":"Tasarım iteratif bir süreçtir; gereksinim değişimi zincirleme etki eder.","o":[["Hiçbir şey değiştirmeden devam etmek",false],["Etkilenen aşamalara (konsept, boyutlandırma, seçim) iteratif olarak dönmek",true],["Projeyi bırakmak",false],["Yalnız rengi değiştirmek",false]]},{"m":"Aşağıdakilerden hangileri ölçülebilir sistem gereksinimi örneğidir? (birden çok)","a":"Gereksinimler ölçülebilir ve doğrulanabilir olmalıdır.","o":[["Havada kalış süresi en az 30 dakika",true],["Kalkış ağırlığı en çok 5 kg",true],["En az 100 m irtifaya çıkabilme",true],["Güzel görünmesi",false]]},{"m":"Prototip, test ve iyileştirme döngüsünün tekrarlanması hangi yaklaşımdır?","a":"İteratif tasarım her turda öğrenilenleri bir sonraki sürüme taşır.","o":[["Şelale (waterfall)",false],["İteratif tasarım",true],["Rastgele deneme",false],["Dondurulmuş tasarım",false]]},{"m":"İlk uçuştan önce yapılması gereken hangisidir?","a":"Kontrol listesi unutulan bir adımın kazaya yol açmasını önler.","o":[["Hiç kontrol yapmadan uçurmak",false],["Yer testleri ve yazılı kontrol listesi",true],["Yalnız fotoğraf çekmek",false],["Bataryayı tam boşaltmak",false]]}]$json$::jsonb) loop
    i := i + 1;
    insert into public.questions (quiz_id, metin, sira, aciklama)
      values (v_quiz, r->>'m', i, r->>'a') returning id into v_q;
    j := 0;
    for o in select * from jsonb_array_elements(r->'o') loop
      j := j + 1;
      insert into public.question_options (question_id, metin, dogru, sira)
        values (v_q, o->>0, (o->>1)::boolean, j);
    end loop;
  end loop;
end $q$;

