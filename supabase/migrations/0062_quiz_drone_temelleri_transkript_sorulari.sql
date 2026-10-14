-- Drone Temelleri (T3 1.x ve 2) altyazıları: yN4Zo7AuWz4 (1.1), rv8_niOHkxk (1.2), DPgL0QA5Es0 (1.3), Ssz-_CnKCZI (2).
-- Kaynak: oynatıcının otomatik Türkçe altyazısı (hızlı oynatılıp toplandı; ASR hataları olabilir).
-- Her sorunun kaynak video id ve altyazıdan alıntısı aşağıdaki yorumlardadır.
-- Drone Temelleri orta/zor quizlerine EKLENİR. Idempotent: aynı soru metni varsa atlanır.

begin;

-- yN4Zo7AuWz4 kaynak: insansız hava araçlarının erişim kolaylığı düşük maliyeti ve her şeyden önemlisi insan kaybı riskinin olmaması sebebiyle insanlı uçaklara göre büyük avantajları vardır.
-- rv8_niOHkxk kaynak: gelişimleri 19. yüzyıla kadar uzanmaktadır, bu dönemde balonlar özellikle askeri amaçlarla kullanılmıştır. Rüzgarın etkisiyle hareket eden bu balonlar içlerine yerleştirilen patlayıcılarla hedef bölgeye ulaşıyordu. Ancak bu balonların uzaktan kontrol edilmesi mümkün değildi.
-- DPgL0QA5Es0 kaynak: sabit kanat, döner kanat, çırpan kanat ve dikey iniş kalkışlı İHA... çalışma prensiplerine göre birbirinden farklılaşıyor.
-- DPgL0QA5Es0 kaynak: çırpan kanatlı hava araçları tıpkı kuşlar ve böcekler gibi kanat çırparak taşıma kuvveti üretirler, genellikle ornitop olarak adlandırılırlar... henüz yaygın değildir.
-- Ssz-_CnKCZI kaynak: irtifa havacılıkta bir nesnenin yer seviyesinden veya deniz seviyesinden olan yüksekliğini ifade eder.
-- Ssz-_CnKCZI kaynak: bir uçağın havada kalabilmesi için dört temel kuvvetin dengede olması gerekir: taşıma, ağırlık, itki ve sürükleme... Eğer bu kuvvetlerden biri çok fazla artarsa uçak irtifa kaybedebilir, hızlanabilir veya yavaşlayabilir.
do $q$
declare v_quiz uuid; v_q uuid; v_sira int; r jsonb; o jsonb; j int;
begin
  select z.id into v_quiz from public.quizzes z join public.modules m on m.id = z.module_id
   where m.ad = 'Drone Temelleri' and z.zorluk = 'orta' limit 1;
  if v_quiz is null then raise notice 'Quiz yok, atlanıyor: Drone Temelleri orta'; return; end if;
  select coalesce(max(sira), 0) into v_sira from public.questions where quiz_id = v_quiz;
  for r in select * from jsonb_array_elements($json$[{"m":"Videoya göre insansız hava araçlarının insanlı uçaklara göre avantajları hangileridir? (birden çok)","a":"Bu avantajlar nedeniyle bazı görevlerde insansız araçlara ihtiyaç duyulmuştur.","o":[["Erişim kolaylığı",true],["Düşük maliyet",true],["İnsan kaybı riskinin olmaması",true],["Her koşulda daha yüksek hız",false]]},{"m":"Videoya göre İHA'ların tarihçesindeki ilk askeri örnekler nelerdir?","a":"Teknolojinin ilerlemesiyle bilim insanları uçan araçları kontrol etme imkanı buldular.","o":[["19. yüzyılda patlayıcı taşıyan, rüzgarla hareket eden ve uzaktan kontrol edilemeyen balonlar",true],["20. yüzyılda dronlar",false],["Roketler",false],["Uydular",false]]},{"m":"Videoda İHA'lar çalışma prensiplerine göre hangi türlere ayrılır? (birden çok)","a":"Her türün kendine özgü tasarım özellikleri ve kullanım alanları vardır.","o":[["Sabit kanatlı",true],["Döner kanatlı",true],["Çırpan kanatlı",true],["Dikey iniş kalkışlı",true]]},{"m":"Çırpan kanatlı İHA'lar (ornitop) için hangisi doğrudur?","a":"Doğadaki canlıları tam anlamıyla taklit etmek son derece zor bir mühendislik problemidir.","o":[["Kuş ve böcekler gibi kanat çırparak taşıma üretir; doğayı taklit etmek zor olduğundan henüz yaygın değildir",true],["Pervaneyle uçar ve en yaygın türdür",false],["Sabit kanatlıdır",false],["Sadece balonla yükselir",false]]},{"m":"Havacılıkta irtifa nedir?","a":"Uçaklar, İHA'lar, balonlar ve dağların ne kadar yüksekte olduğunu belirlemek için kullanılır.","o":[["Bir nesnenin yer seviyesinden veya deniz seviyesinden olan yüksekliği",true],["Aracın yatay hızı",false],["Aracın ağırlığı",false],["Motor devri",false]]},{"m":"Dört temel kuvvetten biri diğerlerine göre çok artarsa ne olur?","a":"Denge, kuvvetlerin birbirini nötrlemesiyle sağlanır.","o":[["Uçak irtifa kaybedebilir, hızlanabilir veya yavaşlayabilir",true],["Uçak her zaman daha stabil olur",false],["Hiçbir şey değişmez",false],["Motor kendiliğinden kapanır",false]]}]$json$::jsonb) loop
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

-- yN4Zo7AuWz4 kaynak: Uzaktan kumandayla kontrol edilebiliyor, bunun yanında tamamen otonom olarak programlanmış olanları da var... askeri alanlarda gözetleme ve istihbarat, tarımda ilaçlama ve gübreleme, haritalama, altyapı denetimi, arama kurtarma, medya çekimleri ve çevre izleme.
-- rv8_niOHkxk kaynak: 1. Dünya Savaşı sırasında mühendisler pilotsuz uçaklar tasarlamaya başladı... 1950'lere gelindiğinde askeri alanda kullanılmak üzere geliştirilen daha gelişmiş İHA modelleri dünya çapında popülerlik kazandı... Türkiye'de ise bu gelişim 2000'li yıllarda hız kazandı. Bayraktar TB2 ve Anka gibi yerli insansız hava araçları.
-- DPgL0QA5Es0 kaynak: sabit kanatlı İHA'lar uzun menzil, yüksek hız ve enerji verimliliği... keşif gözetleme ve haritalama... ancak iniş ve kalkış için piste ihtiyaç duymaları kullanım alanlarını sınırlamaktadır.
-- DPgL0QA5Es0 kaynak: döner kanatlı İHA'larda motorlar aracı havada tutan taşıma kuvvetini oluşturur... dört motorlu olduğu için quadcopter, daha fazla motoru olan modeller hekzakopter veya oktokopter... piste ihtiyaç duymadan kalkış ve iniş, havada asılı kalabilmeleri... enerji verimliliklerinin düşük olması ve uçuş sürelerinin kısa olması dezavantaj.
-- DPgL0QA5Es0 kaynak: dikey iniş kalkışlı İHA'lar sabit kanatlı ve döner kanatlı hava araçlarının önemli avantajlarını bir araya getiren hibrit sistemlerdir... üç motor başlangıçta dikey... belirlenen yüksekliğe ulaştığında öndeki iki motor yatay pozisyona geçerek sabit kanatlı bir hava aracı gibi uçuşuna devam eder.
-- Ssz-_CnKCZI kaynak: türbülans hava akımlarındaki düzensizlik nedeniyle oluşur... sıcak ve soğuk hava kütlelerinin çarpıştığı bir bölge veya başka bir uçağın geride bıraktığı hava girdapları... uçaklar stabilite prensibi sayesinde bu tür sarsıntılardan sonra tekrar dengeli uçuş pozisyonuna dönme eğilimindedir.
-- Ssz-_CnKCZI kaynak: uzunlamasına eksen uçağın burnundan kuyruğuna doğru ve yatış hareketini belirler; enlemesine eksen kanatlardan geçen bu eksen yunuslama hareketini belirler; düşey eksen uçağın altından üstüne doğru uzanır ve sapma hareketini kontrol eder.
do $q$
declare v_quiz uuid; v_q uuid; v_sira int; r jsonb; o jsonb; j int;
begin
  select z.id into v_quiz from public.quizzes z join public.modules m on m.id = z.module_id
   where m.ad = 'Drone Temelleri' and z.zorluk = 'zor' limit 1;
  if v_quiz is null then raise notice 'Quiz yok, atlanıyor: Drone Temelleri zor'; return; end if;
  select coalesce(max(sira), 0) into v_sira from public.questions where quiz_id = v_quiz;
  for r in select * from jsonb_array_elements($json$[{"m":"Videoda İHA'ların kullanım alanı ve kontrol şekli için hangisi doğrudur?","a":"Tarım ilaçlama ve gübreleme verimlilik artırıcı uygulamalara örnektir.","o":[["Uzaktan kumandayla veya tamamen otonom programlanarak kontrol edilir; askeri gözetlemeden tarım, haritalama, arama kurtarma ve medya çekimine kadar geniş alanda kullanılır",true],["Yalnızca uzaktan kumandayla uçarlar ve yalnızca askeri alanda kullanılırlar",false],["Yalnızca tarımda kullanılır",false],["Yalnızca pilot ile birlikte uçurulur",false]]},{"m":"Videoya göre İHA tarihçesindeki sıralama hangisidir?","a":"Zamanla İHA'lar savaş alanı dışında tarım, arama kurtarma ve güvenlik gibi sivil alanlarda da yer almaya başlamıştır.","o":[["Askeri balonlar (19. yy), 1. Dünya Savaşı'nda pilotsuz uçaklar, 1950'lerde gelişmiş askeri İHA'lar ve sivil kullanım, Türkiye'de 2000'lerde hızlanma (TB2, Anka)",true],["1. Dünya Savaşı, 19. yüzyıl balonları, 2000'ler, 1950'ler",false],["Önce sivil kullanım, sonra askeri",false],["Türkiye'de 1950'lerde başladı",false]]},{"m":"Sabit kanatlı İHA'ların avantaj ve dezavantajı videoda nasıl anlatılır?","a":"Bayraktar TB2, Aksungur ve Kızılelma sabit kanatlı örnekler arasında sayılır.","o":[["Uzun menzil, yüksek hız ve enerji verimliliği sağlar; iniş ve kalkış için pist gerektirmesi kullanım alanını sınırlar",true],["Havada asılı kalabilir; enerji verimliliği düşüktür",false],["Pist gerektirmez; menzili kısadır",false],["Yalnızca düşük hızda uçar",false]]},{"m":"Döner kanatlı İHA'lar için hangisi doğrudur?","a":"Motor sayısına göre quadcopter (4), hekzakopter (6) ve oktokopter (8) gibi adlandırılırlar.","o":[["Motorlar aracı havada tutan taşımayı oluşturur; pist gerekmez ve havada asılı kalabilir, ancak enerji verimliliği düşük, uçuş süresi kısadır",true],["Kanatlar taşımayı oluşturur; uzun menzillidir",false],["Yalnızca tek motorludur",false],["Pist gerektirir ama enerji verimlidir",false]]},{"m":"Dikey iniş kalkışlı (VTOL) İHA'ların çalışması videoda nasıl anlatılır?","a":"Hibrit olduğu için gelişmiş kontrol sistemleri ve mekanik karmaşıklık mühendislik açısından ek zorluk getirir.","o":[["Motorlar önce dikey çalışıp döner kanatlı gibi kalkar; yükseklikte ön motorlar yatay pozisyona geçerek sabit kanatlı gibi uçar, inişte tekrar dikey olur",true],["Pist üzerinden koşarak kalkar",false],["Yalnızca balon gibi yükselir",false],["Kanatlarını çırparak uçar",false]]},{"m":"Videoya göre türbülansın nedeni ve uçağın tepkisi nedir?","a":"Pilotlar türbülanslı bölgeleri önceden tespit edip rotayı ona göre ayarlar.","o":[["Hava akımlarındaki düzensizlik (sıcak-soğuk hava kütleleri, başka uçağın bıraktığı girdaplar); uçak stabilite sayesinde dengeli uçuşa dönme eğilimindedir",true],["Motor arızası; uçak hemen düşer",false],["Yer çekiminin değişmesi",false],["Pilotun hatası",false]]},{"m":"Uçağın üç hareket ekseni ve hareketleri videoda nasıl eşleştirilir?","a":"Uçak, ağırlık merkezinden geçen hayali eksenler etrafında hareket eder.","o":[["Uzunlamasına eksen (burun-kuyruk): yatış; enlemesine eksen (kanatlardan geçen): yunuslama; düşey eksen (alt-üst): sapma",true],["Uzunlamasına eksen: sapma; enlemesine: yatış; düşey: yunuslama",false],["Uzunlamasına eksen: yunuslama; enlemesine: sapma; düşey: yatış",false],["Üçü de aynı harekete karşılık gelir",false]]}]$json$::jsonb) loop
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
