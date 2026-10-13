-- Aviyonik dalı quizleri (orta ve zor). Idempotent: (modül, zorluk) için quiz varsa atlanır.
-- 0048_quiz_zorluk.sql uygulanmış olmalı. Modül yoksa (örn. 0049 uygulanmadıysa) notice verip atlar.

do $q$
declare v_module uuid; v_quiz uuid; v_q uuid; r jsonb; o jsonb; i int := 0; j int;
begin
  select m.id into v_module from public.modules m join public.tracks t on t.id = m.track_id
   where t.slug = 'aviyonik' and m.ad = 'Temel Elektronik' limit 1;
  if v_module is null then raise notice 'Modül yok, atlanıyor: Temel Elektronik'; return; end if;
  if exists (select 1 from public.quizzes where module_id = v_module and zorluk = 'zor') then return; end if;
  insert into public.quizzes (module_id, baslik, gecme_esigi, sira, zorluk)
    values (v_module, 'Temel Elektronik Quizi (Zor)', 70, 1, 'zor') returning id into v_quiz;
  for r in select * from jsonb_array_elements($json$[{"m":"12 V kaynağa seri bağlı 100 Ω ve 200 Ω dirençten geçen akım kaç mA'dır?","a":"Toplam direnç 300 Ω. I = 12 / 300 = 0,04 A = 40 mA.","o":[["40 mA",true],["60 mA",false],["120 mA",false],["400 mA",false]]},{"m":"Paralel bağlı iki adet 100 Ω direncin eşdeğer direnci kaç Ω'dur?","a":"Aynı değerli iki direnç paralelde yarıya iner: 100 / 2 = 50 Ω.","o":[["200 Ω",false],["100 Ω",false],["50 Ω",true],["25 Ω",false]]},{"m":"Bir direncin uçlarında 10 V var ve üzerinden 0,5 A geçiyor. Harcanan güç kaç watt'tır?","a":"P = V x I = 10 x 0,5 = 5 W.","o":[["5 W",true],["20 W",false],["0,05 W",false],["10,5 W",false]]},{"m":"Seri bir devre için hangileri doğrudur? (birden çok)","a":"Seri devrede akım ortaktır, gerilim bölüşülür; bir eleman kopunca devre açılır.","o":[["Akım her elemanda aynıdır",true],["Eleman gerilimleri toplanarak kaynak gerilimini verir",true],["Her elemanın gerilimi kaynak gerilimine eşittir",false],["Bir eleman koparsa diğerleri çalışmaya devam eder",false]]},{"m":"5 V kaynakla 2 V / 20 mA bir LED'i sürmek için seri direnç kaç Ω olmalıdır?","a":"R = (5 - 2) / 0,02 = 150 Ω.","o":[["100 Ω",false],["150 Ω",true],["250 Ω",false],["330 Ω",false]]},{"m":"9 V'luk kaynağa bağlı 1 kΩ ve 2 kΩ'luk gerilim bölücüde 2 kΩ'luk direncin uçlarındaki gerilim kaç volttur?","a":"Vout = 9 x 2 / (1 + 2) = 6 V.","o":[["3 V",false],["4,5 V",false],["6 V",true],["9 V",false]]}]$json$::jsonb) loop
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
   where t.slug = 'aviyonik' and m.ad = 'Devre Elemanları' limit 1;
  if v_module is null then raise notice 'Modül yok, atlanıyor: Devre Elemanları'; return; end if;
  if exists (select 1 from public.quizzes where module_id = v_module and zorluk = 'orta') then return; end if;
  insert into public.quizzes (module_id, baslik, gecme_esigi, sira, zorluk)
    values (v_module, 'Devre Elemanları Quizi (Orta)', 70, 0, 'orta') returning id into v_quiz;
  for r in select * from jsonb_array_elements($json$[{"m":"Diyot akımı hangi yönde geçirir?","a":"Doğru polarmada (anot +) akım anottan katoda akar.","o":[["Katottan anoda",false],["Anottan katoda",true],["Her iki yönde eşit",false],["Hiçbir yönde",false]]},{"m":"Kapasitör (kondansatör) ne yapar?","a":"Kapasitör iki plaka arasında elektrik alanında enerji depolar.","o":[["Elektrik yükünü depolar",true],["Akımı üretir",false],["Gerilimi yükseltir",false],["Isı üretir",false]]},{"m":"BJT transistörün üç bacağı hangisidir?","a":"Source, drain, gate MOSFET bacaklarıdır.","o":[["Anot, katot, kapı",false],["Emiter, baz, kollektör",true],["Source, drain, gate",false],["Plus, minus, toprak",false]]},{"m":"Röle hakkında hangileri doğrudur? (birden çok)","a":"Röle DC veya AC bobinli olabilir; kontaklar bobinden yalıtılmıştır.","o":[["Küçük bir akımla büyük akımlı devreyi anahtarlar",true],["Elektromekanik bir anahtardır",true],["Yalnız AC'de çalışır",false],["Bobin ile kontak arasında elektriksel yalıtım vardır",true]]},{"m":"LED'e neden seri direnç bağlanır?","a":"LED akım sınırlamadan çalışırsa aşırı akımdan yanar.","o":[["Parlaklığı artırmak için",false],["Akımı güvenli değerle sınırlamak için",true],["Rengini değiştirmek için",false],["Gerilimi artırmak için",false]]},{"m":"Sigortanın görevi nedir?","a":"Sigorta devreyi aşırı akımdan korumak için kasıtlı olarak zayıf halkadır.","o":[["Gerilimi sabitlemek",false],["Aşırı akımda eriyip devreyi açmak",true],["Akımı artırmak",false],["Frekansı ayarlamak",false]]}]$json$::jsonb) loop
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
   where t.slug = 'aviyonik' and m.ad = 'Devre Elemanları' limit 1;
  if v_module is null then raise notice 'Modül yok, atlanıyor: Devre Elemanları'; return; end if;
  if exists (select 1 from public.quizzes where module_id = v_module and zorluk = 'zor') then return; end if;
  insert into public.quizzes (module_id, baslik, gecme_esigi, sira, zorluk)
    values (v_module, 'Devre Elemanları Quizi (Zor)', 70, 1, 'zor') returning id into v_quiz;
  for r in select * from jsonb_array_elements($json$[{"m":"Zener diyot hangi çalışma bölgesinde gerilim regülasyonu yapar?","a":"Ters kırılma bölgesinde Zener gerilimi yaklaşık sabit kalır.","o":[["İleri yönde, küçük gerilimde",false],["Ters yönde, zener (kırılma) geriliminde",true],["Hiç iletmediği bölgede",false],["Yalnız AC'de",false]]},{"m":"MOSFET ile BJT'nin temel farkı nedir?","a":"MOSFET gerilim kontrollüdür ve gate'den neredeyse akım çekmez; BJT baz akımı ister.","o":[["MOSFET akımla, BJT gerilimle kontrol edilir",false],["MOSFET gate gerilimiyle, BJT baz akımıyla kontrol edilir",true],["İkisi de aynıdır",false],["MOSFET'in üç bacağı yoktur",false]]},{"m":"10 kΩ direnç ve 100 µF kapasitörden oluşan RC devresinin zaman sabiti (τ = R·C) kaç saniyedir?","a":"10 000 Ω x 0,0001 F = 1 s.","o":[["0,1 s",false],["1 s",true],["10 s",false],["100 s",false]]},{"m":"%25 duty cycle'lı, 12 V genlikli bir PWM sinyalinin ortalama gerilimi kaç volttur?","a":"Ortalama = 12 x 0,25 = 3 V.","o":[["1 V",false],["3 V",true],["6 V",false],["12 V",false]]},{"m":"Röle bobinine paralel (ters yönlü) bağlanan diyodun (flyback diyodu) amacı nedir?","a":"Endüktans akımı aniden kesilince büyük bir ters gerilim üretir; diyot bunu bastırır.","o":[["Rölenin hızını artırmak",false],["Bobin akımı kesilince oluşan ters gerilim sivriliğinden sürücü elemanı korumak",true],["Rölenin ısınmasını sağlamak",false],["Gerilimi iki katına çıkarmak",false]]},{"m":"7805 regülatörün girişi 12 V, çıkışı 5 V, yük akımı 500 mA. Regülatörde ısı olarak harcanan güç yaklaşık kaç watt'tır?","a":"(12 - 5) x 0,5 = 3,5 W. Lineer regülatör fazla gerilimi ısıya çevirir.","o":[["0,5 W",false],["2,5 W",false],["3,5 W",true],["6 W",false]]}]$json$::jsonb) loop
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
   where t.slug = 'aviyonik' and m.ad = 'Aktüatör ve Haberleşme' limit 1;
  if v_module is null then raise notice 'Modül yok, atlanıyor: Aktüatör ve Haberleşme'; return; end if;
  if exists (select 1 from public.quizzes where module_id = v_module and zorluk = 'orta') then return; end if;
  insert into public.quizzes (module_id, baslik, gecme_esigi, sira, zorluk)
    values (v_module, 'Aktüatör ve Haberleşme Quizi (Orta)', 70, 0, 'orta') returning id into v_quiz;
  for r in select * from jsonb_array_elements($json$[{"m":"Hobi servo motoru genellikle hangi sinyalle kontrol edilir?","a":"Servo, tipik olarak 50 Hz'de 1-2 ms genişlikli darbelerle konumlandırılır.","o":[["Analog gerilim seviyesi",false],["PWM (darbe genişliği) sinyali",true],["Bluetooth",false],["Yalnız I2C",false]]},{"m":"Step (adım) motorun özelliği nedir?","a":"Step motor sürücüden gelen her darbede sabit bir açı döner.","o":[["Sürekli sabit hızda döner",false],["Adım adım hareket eder, konum geri besleme olmadan da kontrol edilebilir",true],["Yalnız AC ile çalışır",false],["Dişlisi yoktur",false]]},{"m":"HC-05 modülü hangi tür haberleşmeyi sağlar?","a":"HC-05, Bluetooth SPP profiliyle kablosuz seri iletişim sağlar.","o":[["Wi-Fi",false],["Bluetooth (seri UART arayüzü ile)",true],["LoRa",false],["GPS",false]]},{"m":"Kızılötesi (IR) uzaktan kumanda ile RF kumandanın farkı nedir?","a":"IR ışık kullandığı için alıcıyı görmek zorundadır; RF radyo dalgasıdır.","o":[["IR görüş hattı ister, RF genellikle istemez",true],["RF görüş hattı ister, IR istemez",false],["İkisi de duvarlardan geçer",false],["Fark yoktur",false]]},{"m":"Servo motorun içinde hangi bileşenler bulunur?","a":"Potansiyometre/enkoder konumu ölçer, kontrol devresi hedefle karşılaştırır.","o":[["Yalnız mıknatıs",false],["DC motor, dişli kutusu, konum geri bildirimi ve kontrol devresi",true],["Yalnız kristal",false],["Batarya",false]]},{"m":"HC-05 hangi amaçlarla kullanılabilir? (birden çok)","a":"HC-05 yalnız Bluetooth seri köprüsüdür; Wi-Fi veya GPS içermez.","o":[["Telefon ile mikrodenetleyici arasında kablosuz seri iletişim",true],["İki mikrodenetleyici arasında kablosuz seri bağ",true],["İnternete Wi-Fi ile bağlanmak",false],["GPS konumu almak",false]]}]$json$::jsonb) loop
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
   where t.slug = 'aviyonik' and m.ad = 'Aktüatör ve Haberleşme' limit 1;
  if v_module is null then raise notice 'Modül yok, atlanıyor: Aktüatör ve Haberleşme'; return; end if;
  if exists (select 1 from public.quizzes where module_id = v_module and zorluk = 'zor') then return; end if;
  insert into public.quizzes (module_id, baslik, gecme_esigi, sira, zorluk)
    values (v_module, 'Aktüatör ve Haberleşme Quizi (Zor)', 70, 1, 'zor') returning id into v_quiz;
  for r in select * from jsonb_array_elements($json$[{"m":"1,8° adım açılı bir step motor bir tam tur için kaç adım atar?","a":"360 / 1,8 = 200 adım.","o":[["100",false],["180",false],["200",true],["360",false]]},{"m":"50 Hz'lik servo sinyalinde (20 ms periyot) 1,5 ms'lik darbenin duty cycle değeri nedir?","a":"1,5 / 20 = 0,075 = %7,5. Genellikle orta (nötr) konumdur.","o":[["%1,5",false],["%7,5",true],["%15",false],["%75",false]]},{"m":"Bir mikrodenetleyici pinini motora doğrudan bağlamak neden uygun değildir?","a":"GPIO pini genelde 20-40 mA verir; motor yüksek akım ve endüktif gerilim sivrilikleri üretir.","o":[["Pin akım sınırı düşüktür ve motor ters gerilim üretir; sürücü/transistör gerekir",true],["Motor pinden daha az akım ister",false],["Pinlerin rengi uyuşmaz",false],["Her zaman sorunsuzdur",false]]},{"m":"5 V mantık seviyeli bir Arduino'nun TX pinini HC-05'in RX pinine bağlarken ne önerilir?","a":"HC-05'in RX girişi 3,3 V mantıklıdır; direnç bölücü ile korunur.","o":[["Doğrudan bağlamak",false],["Gerilim bölücü ile 3,3 V seviyesine düşürmek",true],["Pini toprağa bağlamak",false],["Hiç bağlamamak",false]]},{"m":"Step motorun servo motordan farkları hangileridir? (birden çok)","a":"Servo kapalı çevrimdir ve konum geri bildirimi içerir; step motor genelde açık çevrimlidir.","o":[["Açık çevrimli konumlandırma yapabilir",true],["Duruşta tutma torku verir",true],["Yük fazlaysa adım kaçırabilir",true],["İçinde mutlaka potansiyometre vardır",false]]},{"m":"Fırçalı DC motorun yönünü değiştirmek için en yaygın yöntem nedir?","a":"H-köprüsü motor uçlarına uygulanan gerilimin yönünü yazılımla değiştirir.","o":[["Voltajın kutuplarını ters çevirmek (H-köprüsü ile)",true],["Pervaneyi söküp takmak",false],["Gerilimi sıfırlamak",false],["Motoru ısıtmak",false]]}]$json$::jsonb) loop
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
   where t.slug = 'aviyonik' and m.ad = 'İHA Elektronik Sistemleri' limit 1;
  if v_module is null then raise notice 'Modül yok, atlanıyor: İHA Elektronik Sistemleri'; return; end if;
  if exists (select 1 from public.quizzes where module_id = v_module and zorluk = 'orta') then return; end if;
  insert into public.quizzes (module_id, baslik, gecme_esigi, sira, zorluk)
    values (v_module, 'İHA Elektronik Sistemleri Quizi (Orta)', 70, 0, 'orta') returning id into v_quiz;
  for r in select * from jsonb_array_elements($json$[{"m":"Bir LiPo hücresinin nominal gerilimi kaç volttur?","a":"Nominal 3,7 V, tam dolu 4,2 V'tur.","o":[["1,2 V",false],["3,7 V",true],["5 V",false],["12 V",false]]},{"m":"GNSS nedir?","a":"GNSS; GPS, GLONASS, Galileo, BeiDou gibi sistemleri kapsar.","o":[["Yalnız ABD'nin GPS sistemi",false],["Tüm küresel uydu seyrüsefer sistemlerinin genel adı",true],["Bir batarya türü",false],["Bir uçuş modu",false]]},{"m":"Fırçasız motorun KV değeri neyi ifade eder?","a":"KV = rpm/V (yüksüz).","o":[["Volt başına yüksüz devir sayısı",true],["Motorun kilovolt değeri",false],["Motor ağırlığı",false],["Maksimum akım",false]]},{"m":"Bataryadaki 'C' değeri ne anlama gelir?","a":"Maksimum sürekli akım = kapasite (Ah) x C.","o":[["Sıcaklık",false],["Kapasiteye göre deşarj hız sınırı",true],["Renk kodu",false],["Hücre sayısı",false]]},{"m":"RTK'nın amacı nedir?","a":"RTK, baz istasyonundan gelen düzeltmelerle faz ölçümü hassasiyetini kullanır.","o":[["Menzili artırmak",false],["Konum doğruluğunu santimetre seviyesine çıkarmak",true],["Bataryayı şarj etmek",false],["Görüntü kalitesini iyileştirmek",false]]},{"m":"Aşağıdakilerden hangileri bir İHA'nın elektronik sistem bileşenleridir? (birden çok)","a":"Karbon fiber gövde yapısal bir parçadır.","o":[["Uçuş kontrol kartı",true],["ESC",true],["GNSS modülü",true],["Karbon fiber gövde",false]]}]$json$::jsonb) loop
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
   where t.slug = 'aviyonik' and m.ad = 'İHA Elektronik Sistemleri' limit 1;
  if v_module is null then raise notice 'Modül yok, atlanıyor: İHA Elektronik Sistemleri'; return; end if;
  if exists (select 1 from public.quizzes where module_id = v_module and zorluk = 'zor') then return; end if;
  insert into public.quizzes (module_id, baslik, gecme_esigi, sira, zorluk)
    values (v_module, 'İHA Elektronik Sistemleri Quizi (Zor)', 70, 1, 'zor') returning id into v_quiz;
  for r in select * from jsonb_array_elements($json$[{"m":"5000 mAh kapasiteli 30C bir bataryadan çekilebilecek maksimum sürekli akım yaklaşık kaç amperdir?","a":"5 Ah x 30 = 150 A.","o":[["30 A",false],["50 A",false],["150 A",true],["1 500 A",false]]},{"m":"6S LiPo bataryanın tam dolu gerilimi kaç volttur?","a":"6 x 4,2 = 25,2 V. Nominal 22,2 V'tur.","o":[["22,2 V",false],["25,2 V",true],["24 V",false],["16,8 V",false]]},{"m":"800 KV bir motor 4S (14,8 V) bataryayla yüksüz yaklaşık kaç devir/dakika döner?","a":"800 x 14,8 = 11 840 rpm.","o":[["3 200",false],["5 920",false],["11 840",true],["59 200",false]]},{"m":"Her motoru 20 A çeken dört motorlu bir araçta 5000 mAh batarya tam güçte yaklaşık ne kadar dayanır?","a":"Toplam 80 A. 5 Ah / 80 A = 0,0625 saat = 3,75 dk. Hover'da çekim çok daha düşüktür.","o":[["Yaklaşık 3,75 dakika",true],["Yaklaşık 15 dakika",false],["Yaklaşık 1 saat",false],["Yaklaşık 10 saniye",false]]},{"m":"RTK'da iki alıcı (baz ve gezgin) kullanılmasının sebebi nedir?","a":"Yakın iki alıcıda hatalar benzerdir; baz istasyonu bu hatayı kestirip gezgine iletir.","o":[["Uydu sayısını ikiye katlamak",false],["Ortak hataları (atmosfer, saat) bilinen baz konumu üzerinden hesaplayıp düzeltme olarak göndermek",true],["Menzili artırmak",false],["Daha az güç harcamak",false]]},{"m":"2,4 GHz radyo kontrol bağlantısının menzilini ve güvenilirliğini etkileyen etkenler hangileridir? (birden çok)","a":"Radyo bağlantısı güç, anten ve engellerden etkilenir; renk etkisizdir.","o":[["Anten yönü ve yerleşimi",true],["Verici çıkış gücü",true],["Verici ile alıcı arasındaki görüş hattı",true],["Pervane rengi",false]]}]$json$::jsonb) loop
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
   where t.slug = 'aviyonik' and m.ad = 'Lehimleme' limit 1;
  if v_module is null then raise notice 'Modül yok, atlanıyor: Lehimleme'; return; end if;
  if exists (select 1 from public.quizzes where module_id = v_module and zorluk = 'orta') then return; end if;
  insert into public.quizzes (module_id, baslik, gecme_esigi, sira, zorluk)
    values (v_module, 'Lehimleme Quizi (Orta)', 70, 0, 'orta') returning id into v_quiz;
  for r in select * from jsonb_array_elements($json$[{"m":"Kurşunsuz lehime göre kurşunlu (Sn63/Pb37) lehimin avantajı nedir?","a":"Sn63/Pb37 yaklaşık 183 °C'de erir ve işlemesi kolaydır; sağlık açısından kurşunsuz tercih edilir.","o":[["Sağlığa daha güvenlidir",false],["Daha düşük sıcaklıkta erir ve akışkandır",true],["Daha yüksek sıcaklıkta erir",false],["Havyaya yapışmaz",false]]},{"m":"İyi bir lehim bağlantısı için hangileri doğrudur? (birden çok)","a":"Fazla lehim bağlantıyı sağlamlaştırmaz, hata riskini artırır.","o":[["Hem pad hem bacak ısıtılır",true],["Lehim ısınmış bağlantıya verilir, havya ucuna değil",true],["Lehim ne kadar çoksa o kadar sağlamdır",false],["Bağlantı parlak ve konik görünür",true]]},{"m":"Soğuk lehim (cold joint) neden oluşur?","a":"Soğuk lehim mat, pürüzlü görünür ve elektriksel olarak güvenilmezdir.","o":[["Bağlantı yeterince ısınmadan veya soğurken oynadığı için",true],["Çok fazla flux kullanıldığı için",false],["Havya çok sıcak olduğu için",false],["Lehim parlak olduğu için",false]]},{"m":"Flux ne işe yarar?","a":"Flux oksidasyonu giderir ve ıslanmayı (wetting) iyileştirir.","o":[["Lehimi sertleştirir",false],["Yüzeydeki oksidi temizleyip lehimin akmasını sağlar",true],["Havyayı soğutur",false],["Devreye akım iletir",false]]},{"m":"Havya ucunu temizlemek ve kalaylamak neden önemlidir?","a":"Kalaylı uç ısıyı bağlantıya daha iyi iletir ve ömrü uzar.","o":[["Isı aktarımını iyileştirir ve ucun oksitlenmesini önler",true],["Havyayı kapatmak için",false],["Lehimi renklendirir",false],["Pad'i soğutur",false]]},{"m":"Lehimleme sırasında havalandırma kullanmak (duman solumamak) gereklidir.","a":"Flux dumanı solunum yolu için zararlıdır.","o":[["Doğru",true],["Yanlış",false]]}]$json$::jsonb) loop
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
   where t.slug = 'aviyonik' and m.ad = 'Lehimleme' limit 1;
  if v_module is null then raise notice 'Modül yok, atlanıyor: Lehimleme'; return; end if;
  if exists (select 1 from public.quizzes where module_id = v_module and zorluk = 'zor') then return; end if;
  insert into public.quizzes (module_id, baslik, gecme_esigi, sira, zorluk)
    values (v_module, 'Lehimleme Quizi (Zor)', 70, 1, 'zor') returning id into v_quiz;
  for r in select * from jsonb_array_elements($json$[{"m":"Kurşunsuz (örneğin SAC305) lehimin kurşunluya göre erime sıcaklığı nasıldır?","a":"Kurşunsuz lehimler yaklaşık 217-220 °C'de erir; havya sıcaklığı buna göre ayarlanır.","o":[["Daha düşüktür",false],["Daha yüksektir (yaklaşık 217-220 °C)",true],["Aynıdır",false],["Erimez",false]]},{"m":"Bir bağlantı mat, gri ve pürüzlü görünüyor. En doğru müdahale nedir?","a":"Mat görünüm soğuk lehimdir; yeniden ısıtıp taze lehim/flux ile düzeltilir.","o":[["Olduğu gibi bırakmak",false],["Flux ekleyip bağlantıyı yeniden ısıtarak lehimi akıtmak",true],["Üzerine yapıştırıcı sürmek",false],["Havyayı daha uzun süre bağlantıya bastırmak",false]]},{"m":"SMD direnç lehimlerken doğru yöntem hangileridir? (birden çok)","a":"Uzun süre ısıtmak pad'in kalkmasına ve parçanın zarar görmesine yol açar.","o":[["Bir pad'i önceden kalaylamak",true],["Parçayı cımbızla tutup bir ucunu lehimlemek, sonra diğerini lehimlemek",true],["Flux kullanmak",true],["Havyayı pad üzerinde 30 saniye bekletmek",false]]},{"m":"Aşırı ısıtılan bir pad'de hangi sorun görülür?","a":"Bakır folyo yapışkanı ısıdan zayıflar ve pad kalkar.","o":[["Pad kartın üzerinden kalkabilir (delaminasyon)",true],["Pad büyür",false],["Pad rengi değişir ve iletkenliği artar",false],["Hiçbir sorun olmaz",false]]},{"m":"Desoldering (lehim emme) örgüsü veya pompası ne için kullanılır?","a":"Örgü kılcallıkla erimiş lehimi çeker, pompa vakumla emer.","o":[["Lehimi eklemek",false],["Hatalı bağlantıdaki lehimi sökmek",true],["Havyayı soğutmak",false],["Kartı temizlemek için solvent olarak",false]]},{"m":"Kurşunlu lehimle çalışılan bir ortamda en önemli güvenlik önlemi nedir?","a":"Kurşun ve flux dumanı için havalandırma, ele bulaşan kurşun için hijyen önemlidir.","o":[["Eldiven takıp havyayı kapatmamak",false],["Havalandırma ve işlem sonrası el yıkama",true],["Odayı ısıtmak",false],["Yalnız karanlıkta çalışmak",false]]}]$json$::jsonb) loop
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
   where t.slug = 'aviyonik' and m.ad = 'PCB Tasarımı (KiCad)' limit 1;
  if v_module is null then raise notice 'Modül yok, atlanıyor: PCB Tasarımı (KiCad)'; return; end if;
  if exists (select 1 from public.quizzes where module_id = v_module and zorluk = 'orta') then return; end if;
  insert into public.quizzes (module_id, baslik, gecme_esigi, sira, zorluk)
    values (v_module, 'PCB Tasarımı Quizi (Orta)', 70, 0, 'orta') returning id into v_quiz;
  for r in select * from jsonb_array_elements($json$[{"m":"KiCad'de devre şemasının çizildiği editör hangisidir?","a":"Şematik Eeschema'da, kart yerleşimi Pcbnew'da yapılır.","o":[["Pcbnew",false],["Eeschema (Şematik editör)",true],["Gerbview",false],["Footprint editor",false]]},{"m":"Gerber dosyaları ne işe yarar?","a":"Üretici bakır, lehim maskesi, serigrafi katmanlarını Gerber'dan üretir.","o":[["Devreyi simüle eder",false],["PCB üreticisine gönderilen katman bazlı üretim dosyalarıdır",true],["Parça listesini tutar",false],["Yazılımı yükler",false]]},{"m":"Footprint nedir?","a":"Footprint pad konumlarını ve parça sınırlarını tanımlar.","o":[["Parçanın elektriksel modeli",false],["Parçanın PCB üzerindeki fiziksel ayak izi ve pad düzeni",true],["Kablo rengi",false],["Devre simülasyonu",false]]},{"m":"Aşağıdakilerden hangisi doğru PCB tasarım iş akışıdır?","a":"Şematikten başlanır; üretim dosyaları son adımdır.","o":[["Gerber, şematik, yerleşim",false],["Şematik, footprint atama, PCB'ye aktarma, yerleşim ve yönlendirme, DRC, Gerber",true],["Yerleşim, Gerber, şematik",false],["DRC, şematik, Gerber",false]]},{"m":"DRC (Design Rule Check) neyi denetler?","a":"DRC, kart üzerindeki kural ihlallerini bulur.","o":[["Şematikteki parça değerlerini",false],["PCB'nin üretim ve tasarım kurallarına (mesafe, iz genişliği vb.) uygunluğunu",true],["Yazılım hatalarını",false],["Batarya ömrünü",false]]},{"m":"ERC (Electrical Rule Check) hangi aşamada kullanılır?","a":"ERC şematikteki bağlanmamış pin, çakışan çıkış gibi hataları gösterir.","o":[["Şematikte elektriksel bağlantı hatalarını bulmak için",true],["Gerber çıktısında",false],["Kart yerleşiminde mesafe için",false],["Lehimleme sırasında",false]]}]$json$::jsonb) loop
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
   where t.slug = 'aviyonik' and m.ad = 'PCB Tasarımı (KiCad)' limit 1;
  if v_module is null then raise notice 'Modül yok, atlanıyor: PCB Tasarımı (KiCad)'; return; end if;
  if exists (select 1 from public.quizzes where module_id = v_module and zorluk = 'zor') then return; end if;
  insert into public.quizzes (module_id, baslik, gecme_esigi, sira, zorluk)
    values (v_module, 'PCB Tasarımı Quizi (Zor)', 70, 1, 'zor') returning id into v_quiz;
  for r in select * from jsonb_array_elements($json$[{"m":"Şematikteki parçaya footprint atanmadan PCB editörüne aktarım yapılırsa ne olur?","a":"Netlist aktarımı için her parçanın bir footprint'i olmalıdır.","o":[["Footprint'siz parçalar karta aktarılamaz, hata verir",true],["Parça otomatik oluşturulur",false],["Kart daha hızlı üretilir",false],["Hiçbir fark olmaz",false]]},{"m":"Yüksek akım taşıyacak bir iz için ne yapılmalıdır?","a":"İzin akım taşıma kapasitesi genişliği ve bakır kalınlığıyla artar.","o":[["İzi inceltmek",false],["İz genişliğini artırmak (veya bakır kalınlığını/izi paralel kullanmak)",true],["İzi rastgele yönlendirmek",false],["Bir önemi yoktur",false]]},{"m":"Toprak düzlemi (ground plane) kullanmanın faydası nedir?","a":"Geniş bakır düzlemi dönüş yolunu kısa ve düşük dirençli yapar.","o":[["Kartı kalınlaştırmak",false],["Düşük empedanslı dönüş yolu sağlayıp gürültüyü azaltmak",true],["Parça sayısını artırmak",false],["Güç tüketimini artırmak",false]]},{"m":"Via nedir?","a":"Via, farklı bakır katmanlarını birleştiren kaplamalı deliktir.","o":[["Bir tür direnç",false],["Katmanlar arasında bağlantı sağlayan delik",true],["Bir yazıcı ayarı",false],["Bir lehim türü",false]]},{"m":"Bypass (decoupling) kondansatörü yerleşiminde hangileri doğrudur? (birden çok)","a":"Uzak bağlantı endüktans ekler ve kondansatörü işlevsiz bırakır.","o":[["IC'nin güç pinine mümkün olduğunca yakın konulur",true],["Kısa izlerle bağlanır",true],["Kartın en uzak köşesine konur",false],["Toprağa kısa yoldan bağlanır",true]]},{"m":"Gerber dosyalarıyla birlikte üreticiye başka hangi dosya gönderilir?","a":"Delikler Gerber'da yer almaz; ayrı drill dosyasıyla tanımlanır.","o":[["Delik (drill/NC drill) dosyası",true],["Kaynak kod",false],["Sunum dosyası",false],["Ses dosyası",false]]}]$json$::jsonb) loop
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

