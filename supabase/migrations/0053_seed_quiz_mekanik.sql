-- Mekanik dalı quizleri (orta ve zor). Idempotent: (modül, zorluk) için quiz varsa atlanır.
-- 0048_quiz_zorluk.sql uygulanmış olmalı. Modül yoksa (örn. 0049 uygulanmadıysa) notice verip atlar.

do $q$
declare v_module uuid; v_quiz uuid; v_q uuid; r jsonb; o jsonb; i int := 0; j int;
begin
  select m.id into v_module from public.modules m join public.tracks t on t.id = m.track_id
   where t.slug = 'mekanik' and m.ad = 'CAD Temelleri: Taslak Çizim Araçları' limit 1;
  if v_module is null then raise notice 'Modül yok, atlanıyor: CAD Temelleri: Taslak Çizim Araçları'; return; end if;
  if exists (select 1 from public.quizzes where module_id = v_module and zorluk = 'orta') then return; end if;
  insert into public.quizzes (module_id, baslik, gecme_esigi, sira, zorluk)
    values (v_module, 'Taslak Çizim Araçları Quizi (Orta)', 70, 0, 'orta') returning id into v_quiz;
  for r in select * from jsonb_array_elements($json$[{"m":"SolidWorks'te bir eskize (sketch) başlamak için ne seçilir?","a":"Eskiz Front, Top, Right düzlemlerinden veya düz bir yüzeyden başlatılır.","o":[["Bir düzlem veya düz yüzey",true],["Bir malzeme",false],["Bir montaj",false],["Bir render ayarı",false]]},{"m":"Smart Dimension komutu ne yapar?","a":"Ölçüler eskizi tanımlar ve boyutları sürücü olarak belirler.","o":[["Eskiz elemanlarını ölçülendirir",true],["Eskizi siler",false],["Eskizi renklendirir",false],["Parçayı kaydeder",false]]},{"m":"Fillet (eskizde) ne yapar?","a":"Fillet köşeye radius uygular.","o":[["İki çizgi arasındaki köşeyi yarıçapla yuvarlar",true],["Çizgiyi uzatır",false],["Elemanı siler",false],["Aynalar",false]]},{"m":"Chamfer (pah kırma) ne yapar?","a":"Chamfer köşeyi iki mesafe veya mesafe-açı ile düz keser.","o":[["Köşeyi açılı olarak keser",true],["Köşeyi yuvarlar",false],["Çizgiyi böler",false],["Elemanı kopyalar",false]]},{"m":"Mirror komutu ne işe yarar?","a":"Simetrik parçalarda yarısı çizilir, diğer yarısı Mirror ile elde edilir.","o":[["Elemanı bir simetri eksenine göre aynalar",true],["Elemanı döndürür",false],["Ölçeklendirir",false],["Siler",false]]},{"m":"Aşağıdakilerden hangileri eskiz araçlarıdır? (birden çok)","a":"Extruded Boss bir katı model özelliğidir (feature), eskiz aracı değildir.","o":[["Line",true],["Circle",true],["Arc",true],["Extruded Boss",false]]}]$json$::jsonb) loop
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
   where t.slug = 'mekanik' and m.ad = 'CAD Temelleri: Taslak Çizim Araçları' limit 1;
  if v_module is null then raise notice 'Modül yok, atlanıyor: CAD Temelleri: Taslak Çizim Araçları'; return; end if;
  if exists (select 1 from public.quizzes where module_id = v_module and zorluk = 'zor') then return; end if;
  insert into public.quizzes (module_id, baslik, gecme_esigi, sira, zorluk)
    values (v_module, 'Taslak Çizim Araçları Quizi (Zor)', 70, 1, 'zor') returning id into v_quiz;
  for r in select * from jsonb_array_elements($json$[{"m":"Tam tanımlı (fully defined) bir eskizin çizgileri hangi renkte görünür?","a":"Mavi eksik tanımlı, siyah tam tanımlı, kırmızı fazla tanımlıdır.","o":[["Mavi",false],["Siyah",true],["Kırmızı",false],["Yeşil",false]]},{"m":"Eskiz çizgileri mavi görünüyorsa bu ne anlama gelir?","a":"Eksik tanımlı elemanların serbestlik derecesi kalmıştır.","o":[["Eskiz eksik tanımlıdır, hareket edebilir",true],["Eskiz tam tanımlıdır",false],["Eskiz fazla tanımlıdır",false],["Eskiz silinmiştir",false]]},{"m":"Trim komutu ne yapar?","a":"Power Trim ile fazla kısımlar kesişimlere kadar silinir.","o":[["Eskiz elemanlarını kesişim noktalarına göre budar",true],["Elemanları çoğaltır",false],["Elemanı aynalar",false],["Ölçülendirir",false]]},{"m":"Offset komutu ne yapar?","a":"Offset, kontur boyunca sabit mesafede kopya oluşturur.","o":[["Seçilen geometrinin belirli mesafede paralel kopyasını üretir",true],["Geometriyi siler",false],["Geometriyi bölüp kırar",false],["Eskizi 3B yapar",false]]},{"m":"Circular Pattern (dairesel çoğaltma) ne yapar?","a":"Linear Pattern doğrusal, Circular Pattern dairesel çoğaltmadır.","o":[["Elemanı bir merkez etrafında dairesel olarak çoğaltır",true],["Elemanı doğrusal çoğaltır",false],["Elemanı aynalar",false],["Elemanı döndürüp siler",false]]},{"m":"Aşağıdakilerden hangileri eskiz ilişkileridir (relations)? (birden çok)","a":"Extrude bir özellik komutudur.","o":[["Horizontal",true],["Tangent",true],["Coincident",true],["Extrude",false]]}]$json$::jsonb) loop
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
   where t.slug = 'mekanik' and m.ad = 'CAD Temelleri: 2D Çizim Uygulamaları' limit 1;
  if v_module is null then raise notice 'Modül yok, atlanıyor: CAD Temelleri: 2D Çizim Uygulamaları'; return; end if;
  if exists (select 1 from public.quizzes where module_id = v_module and zorluk = 'orta') then return; end if;
  insert into public.quizzes (module_id, baslik, gecme_esigi, sira, zorluk)
    values (v_module, '2D Çizim Uygulamaları Quizi (Orta)', 70, 0, 'orta') returning id into v_quiz;
  for r in select * from jsonb_array_elements($json$[{"m":"Karmaşık bir eskize başlarken en iyi yaklaşım hangisidir?","a":"Ana hatlar çizilir, ilişkiler ve ölçülerle tam tanımlanır.","o":[["Önce ana geometriyi çizip sonra ilişkilerle ve ölçülerle tanımlamak",true],["Rastgele çizim yapmak",false],["Önce tüm ölçüleri yazmak",false],["Çizime hiç ilişki eklememek",false]]},{"m":"Bir çemberi Smart Dimension ile ölçülendirince varsayılan olarak hangi ölçü verilir?","a":"SolidWorks çemberin çapını verir.","o":[["Çap",true],["Yarıçap",false],["Çevre",false],["Alan",false]]},{"m":"Midpoint ilişkisi ne sağlar?","a":"Midpoint noktayı çizginin ortasına bağlar.","o":[["Bir noktanın çizginin orta noktasında olmasını",true],["Çizgilerin paralel olmasını",false],["İki çemberin eşit olmasını",false],["Çizginin yatay olmasını",false]]},{"m":"Construction (yardımcı) geometri nedir?","a":"Eksen çizgileri gibi yardımcı elemanlar construction yapılır.","o":[["Referans için çizilen ve katı modele dönüşmeyen geometri",true],["Silinemeyen geometri",false],["Kırmızı çizgiler",false],["3B çizgiler",false]]},{"m":"Tam tanımlı eskizin avantajı nedir?","a":"Tam tanımlı eskiz sonraki özelliklerin sağlam kalmasını sağlar.","o":[["Beklenmedik şekil değişimlerini önler, model kararlı olur",true],["Dosyayı küçültür",false],["Eskizi renklendirir",false],["Hiçbir avantajı yoktur",false]]},{"m":"Simetrik şekillerde zaman kazanmak için ne yapılır?","a":"Mirror ve merkez çizgi simetriyi garanti eder.","o":[["Yarısını çizip Mirror kullanmak",true],["Her şeyi iki kere çizmek",false],["Rastgele kopyalamak",false],["Ölçüleri yazmamak",false]]}]$json$::jsonb) loop
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
   where t.slug = 'mekanik' and m.ad = 'CAD Temelleri: 2D Çizim Uygulamaları' limit 1;
  if v_module is null then raise notice 'Modül yok, atlanıyor: CAD Temelleri: 2D Çizim Uygulamaları'; return; end if;
  if exists (select 1 from public.quizzes where module_id = v_module and zorluk = 'zor') then return; end if;
  insert into public.quizzes (module_id, baslik, gecme_esigi, sira, zorluk)
    values (v_module, '2D Çizim Uygulamaları Quizi (Zor)', 70, 1, 'zor') returning id into v_quiz;
  for r in select * from jsonb_array_elements($json$[{"m":"Zaten tanımlı bir ölçüyü yeniden eklemeye çalışınca SolidWorks hangi seçeneği sunar?","a":"Driven ölçü geometriyi sürmez, yalnız bilgi verir.","o":[["Ölçüyü referans (driven) ölçü olarak eklemek",true],["Dosyayı kapatmak",false],["Eskizi silmek",false],["Hiçbir şey",false]]},{"m":"İki çemberin aynı merkeze sahip olmasını sağlayan ilişki hangisidir?","a":"Concentric: eş merkezlilik.","o":[["Concentric",true],["Parallel",false],["Tangent",false],["Equal",false]]},{"m":"Birden fazla çemberin aynı çapta olmasını sağlayan ilişki hangisidir?","a":"Equal ilişkisi çap veya uzunlukları eşitler.","o":[["Equal",true],["Coincident",false],["Vertical",false],["Fix",false]]},{"m":"Bir daire üzerinde eşit aralıklı 6 delik oluşturmak için dairesel çoğaltmada her delik arası açı kaçtır?","a":"360 / 6 = 60°.","o":[["30°",false],["45°",false],["60°",true],["90°",false]]},{"m":"Eskizi tam tanımlamak için hangi yollar kullanılır? (birden çok)","a":"Renk tanımlılığı etkilemez.","o":[["Ölçü eklemek",true],["Geometrik ilişki eklemek",true],["Orijine bağlamak",true],["Çizgi rengini değiştirmek",false]]},{"m":"Revolved Boss için eskizde ayrıca ne gerekir?","a":"Döndürme için bir eksen seçilmelidir.","o":[["Dönme ekseni (merkez çizgisi veya bir kenar)",true],["Ekstra bir malzeme",false],["Birkaç farklı düzlem",false],["Renk ataması",false]]}]$json$::jsonb) loop
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
   where t.slug = 'mekanik' and m.ad = 'CAD Temelleri: Katı Modelleme' limit 1;
  if v_module is null then raise notice 'Modül yok, atlanıyor: CAD Temelleri: Katı Modelleme'; return; end if;
  if exists (select 1 from public.quizzes where module_id = v_module and zorluk = 'orta') then return; end if;
  insert into public.quizzes (module_id, baslik, gecme_esigi, sira, zorluk)
    values (v_module, 'Katı Modelleme Quizi (Orta)', 70, 0, 'orta') returning id into v_quiz;
  for r in select * from jsonb_array_elements($json$[{"m":"Extruded Boss/Base ne yapar?","a":"Extrude, eskizi kalınlık vererek katı yapar.","o":[["Eskizi belirli bir mesafe boyunca uzatarak hacim oluşturur",true],["Malzeme keser",false],["Eskizi eksen etrafında döndürür",false],["Kenarı yuvarlar",false]]},{"m":"Revolved Boss ne yapar?","a":"Mil, tekerlek, şişe gibi dönel parçalar için kullanılır.","o":[["Eskizi bir eksen etrafında döndürerek katı oluşturur",true],["Eskizi uzatır",false],["Parçayı keser",false],["Parçayı aynalar",false]]},{"m":"Extruded Cut ne yapar?","a":"Cut komutları mevcut katıdan malzeme kaldırır.","o":[["Malzeme keser/çıkarır",true],["Malzeme ekler",false],["Parçayı döndürür",false],["Parçayı boyar",false]]},{"m":"Swept Boss ne yapar?","a":"Profil ve yol gerekir.","o":[["Bir profili bir yol (path) boyunca tarayarak katı oluşturur",true],["İki yüzey arasını doldurur",false],["Katıyı keser",false],["Katıyı kabuk yapar",false]]},{"m":"Lofted Boss ne yapar?","a":"Loft, farklı kesitler arasında yumuşak geçiş sağlar.","o":[["İki veya daha fazla profil arasında geçiş yaparak katı oluşturur",true],["Tek profili uzatır",false],["Parçayı döndürür",false],["Kenar yuvarlar",false]]},{"m":"Section View (kesit görünümü) ne işe yarar?","a":"Section View görüntüleme aracıdır, modeli kalıcı değiştirmez.","o":[["Modeli bir düzlemle keserek iç yapıyı gösterir",true],["Modeli boyar",false],["Parçayı keser ve kalıcı siler",false],["Ölçüm yapar",false]]}]$json$::jsonb) loop
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
   where t.slug = 'mekanik' and m.ad = 'CAD Temelleri: Katı Modelleme' limit 1;
  if v_module is null then raise notice 'Modül yok, atlanıyor: CAD Temelleri: Katı Modelleme'; return; end if;
  if exists (select 1 from public.quizzes where module_id = v_module and zorluk = 'zor') then return; end if;
  insert into public.quizzes (module_id, baslik, gecme_esigi, sira, zorluk)
    values (v_module, 'Katı Modelleme Quizi (Zor)', 70, 1, 'zor') returning id into v_quiz;
  for r in select * from jsonb_array_elements($json$[{"m":"Swept Boss için hangi iki eskiz gerekir?","a":"Profil, yol boyunca taranır.","o":[["Profil ve yol (path)",true],["İki aynı profil",false],["İki yol",false],["Yalnız bir profil",false]]},{"m":"Farklı şekilli iki kesit arasındaki loft geçişini daha iyi kontrol etmek için ne kullanılır?","a":"Guide curve ve centerline geçişin şeklini kontrol eder.","o":[["Guide curves (kılavuz eğriler) veya centerline",true],["Hiçbir şey",false],["Daha fazla renk",false],["Extrude",false]]},{"m":"Revolved Boss eskizinde profil dönme eksenini keserse ne olur?","a":"Kendi kendini kesen katı oluşamaz.","o":[["Hata verir, profil eksenin bir tarafında olmalıdır",true],["Daha güçlü olur",false],["Otomatik düzeltilir",false],["Hiçbir fark olmaz",false]]},{"m":"Helisel bir yay modellemek için genellikle hangi yöntem kullanılır?","a":"Helix yol, daire profil ise Swept ile yay elde edilir.","o":[["Helix/Spiral eğrisi ve Swept Boss",true],["Extruded Boss",false],["Fillet",false],["Shell",false]]},{"m":"Mevcut yüzey olmayan bir konumda eskiz çizmek için ne yapılır?","a":"Reference Geometry > Plane ile yeni düzlem tanımlanır.","o":[["New Plane ile referans düzlem oluşturmak",true],["Eskizi çizmemek",false],["Parçayı silmek",false],["Montaj açmak",false]]},{"m":"Extrude başlangıç/bitiş koşulları hangileridir? (birden çok)","a":"Revolve ayrı bir özelliktir.","o":[["Blind (belirli mesafe)",true],["Through All (tümünden geçir)",true],["Mid Plane (düzlemden iki yöne)",true],["Revolve",false]]}]$json$::jsonb) loop
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
   where t.slug = 'mekanik' and m.ad = 'CAD Temelleri: İleri Özellikler' limit 1;
  if v_module is null then raise notice 'Modül yok, atlanıyor: CAD Temelleri: İleri Özellikler'; return; end if;
  if exists (select 1 from public.quizzes where module_id = v_module and zorluk = 'orta') then return; end if;
  insert into public.quizzes (module_id, baslik, gecme_esigi, sira, zorluk)
    values (v_module, 'İleri Özellikler Quizi (Orta)', 70, 0, 'orta') returning id into v_quiz;
  for r in select * from jsonb_array_elements($json$[{"m":"Shell komutu ne yapar?","a":"Shell, içi boş kapalı veya açık kabuk üretir.","o":[["Parçanın içini boşaltıp belirli et kalınlığı bırakır",true],["Parçayı keser",false],["Parçayı döndürür",false],["Parçayı kopyalar",false]]},{"m":"Hole Wizard ne için kullanılır?","a":"Hole Wizard standart delik özelliklerini hazır sunar.","o":[["Standart delik tiplerini (vida, havşa vb.) hızlıca açmak",true],["Eskiz çizmek",false],["Montaj yapmak",false],["Malzeme atamak",false]]},{"m":"Fillet katı modelde ne yapar?","a":"Fillet kenara yarıçap verir.","o":[["Kenarları yuvarlar",true],["Kenarları keser",false],["Kenarları siler",false],["Yüzeyleri birleştirir",false]]},{"m":"Rib komutu ne için kullanılır?","a":"Rib, ince bir eskiz profilinden destek duvarı oluşturur.","o":[["Parçaya destek kaburgası eklemek",true],["Parçayı delmek",false],["Parçayı aynalamak",false],["Parçayı döndürmek",false]]},{"m":"Parçaya malzeme atandığında hangi bilgi hesaplanabilir?","a":"Yoğunluk bilgisiyle hacimden kütle hesaplanır.","o":[["Kütle (ağırlık)",true],["Rengin hex değeri",false],["Uçuş süresi",false],["Fiyat",false]]},{"m":"Mirror özelliği ne yapar?","a":"Simetrik parçalarda zaman kazandırır.","o":[["Seçilen özellik veya gövdeyi bir düzleme göre simetrik kopyalar",true],["Parçayı büyütür",false],["Parçayı bölüp siler",false],["Parçayı renklendirir",false]]}]$json$::jsonb) loop
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
   where t.slug = 'mekanik' and m.ad = 'CAD Temelleri: İleri Özellikler' limit 1;
  if v_module is null then raise notice 'Modül yok, atlanıyor: CAD Temelleri: İleri Özellikler'; return; end if;
  if exists (select 1 from public.quizzes where module_id = v_module and zorluk = 'zor') then return; end if;
  insert into public.quizzes (module_id, baslik, gecme_esigi, sira, zorluk)
    values (v_module, 'İleri Özellikler Quizi (Zor)', 70, 1, 'zor') returning id into v_quiz;
  for r in select * from jsonb_array_elements($json$[{"m":"Shell uygularken bir yüz seçilirse ne olur?","a":"Seçilen yüzler açık bırakılır, diğer duvarlar belirlenen kalınlıkta kalır.","o":[["Seçilen yüz kaldırılarak açık bir kap oluşur",true],["Seçilen yüz kalınlaşır",false],["Hiçbir şey olmaz",false],["Parça silinir",false]]},{"m":"Variable Size Fillet ne sağlar?","a":"Kenar üzerindeki noktalara farklı radius verilebilir.","o":[["Kenar boyunca değişen yarıçaplı fillet",true],["Sabit yarıçaplı fillet",false],["Fillet silme",false],["Chamfer",false]]},{"m":"Full Round Fillet ne yapar?","a":"Ortadaki yüzey tam yuvarlak olarak kaybolur.","o":[["Üç bitişik yüzey arasındaki orta yüzeyi tam yuvarlak ile değiştirir",true],["Tüm kenarları keser",false],["Parçayı döndürür",false],["İç boşluk açar",false]]},{"m":"Hem fillet hem shell uygulanacak parçada iç ve dış köşelerin uyumlu yuvarlanması için doğru sıra nedir?","a":"Fillet'li geometri shell edilince iç ve dış radyus uyumlu offset alır.","o":[["Önce fillet, sonra shell",true],["Önce shell, sonra fillet",false],["Fark etmez",false],["İkisi birlikte olamaz",false]]},{"m":"Sketch Driven Pattern neye göre çoğaltma yapar?","a":"Eskizdeki her nokta bir kopya konumudur.","o":[["Bir eskizdeki noktalara göre",true],["Düzlem açısına göre",false],["Parçanın ağırlığına göre",false],["Rastgele",false]]},{"m":"Wrap komutu ne yapar?","a":"Wrap, yazı veya logoyu silindirik yüzeye uygular.","o":[["Eskizi silindirik yüzeye sarar (kabartma/oyma)",true],["Parçayı paketler",false],["Katıyı keser",false],["Montaj kurar",false]]}]$json$::jsonb) loop
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
   where t.slug = 'mekanik' and m.ad = 'CAD Temelleri: 3D Çizim Uygulamaları' limit 1;
  if v_module is null then raise notice 'Modül yok, atlanıyor: CAD Temelleri: 3D Çizim Uygulamaları'; return; end if;
  if exists (select 1 from public.quizzes where module_id = v_module and zorluk = 'orta') then return; end if;
  insert into public.quizzes (module_id, baslik, gecme_esigi, sira, zorluk)
    values (v_module, '3D Çizim Uygulamaları Quizi (Orta)', 70, 0, 'orta') returning id into v_quiz;
  for r in select * from jsonb_array_elements($json$[{"m":"Karmaşık bir parçayı modellemeye başlamadan önce ne yapılmalıdır?","a":"Planlama gereksiz özellik ve hataları azaltır.","o":[["Parçayı analiz edip ana gövdeyi ve özellik sırasını planlamak",true],["Rastgele çizim yapmak",false],["Fillet ile başlamak",false],["Önce render almak",false]]},{"m":"Simetrik bir parçayı daha hızlı modellemek için ne yapılır?","a":"Mirror feature simetrik yarıyı otomatik üretir.","o":[["Yarısını modelleyip Mirror kullanmak",true],["Her yarıyı baştan çizmek",false],["Simetriyi yok saymak",false],["Yalnız sketch kullanmak",false]]},{"m":"FeatureManager Design Tree neyi gösterir?","a":"Ağaç, özelliklerin sırasıyla listesidir.","o":[["Parçanın özellikleri ve oluşturulma sırasını",true],["Dosya boyutunu",false],["Bilgisayar belleğini",false],["Kullanıcı listesini",false]]},{"m":"Rollback bar ne işe yarar?","a":"Özellik ekleme ve inceleme için geçmişe gidilir.","o":[["Ağaçta belirli bir özelliğe geri dönüp o noktaya kadar olan modeli göstermek",true],["Dosyayı yedeklemek",false],["Parçayı silmek",false],["Parçayı boyamak",false]]},{"m":"Ölçülerin kolay değiştirilebilmesi için nasıl bir eskiz çizilmelidir?","a":"Tam tanımlı eskiz parametrik değişikliklere uyum sağlar.","o":[["Tam tanımlı ve anlamlı ölçülerle",true],["Ölçüsüz",false],["Rastgele ilişkilerle",false],["Tek eskizde tüm parça",false]]},{"m":"İyi modelleme pratikleri hangileridir? (birden çok)","a":"Tek eskizde karmaşık şekil düzenlemeyi zorlaştırır.","o":[["Eskizleri basit tutmak",true],["Eskizleri tam tanımlamak",true],["Fillet ve chamfer gibi özellikleri sona bırakmak",true],["Tüm şekli tek eskizde çizmek",false]]}]$json$::jsonb) loop
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
   where t.slug = 'mekanik' and m.ad = 'CAD Temelleri: 3D Çizim Uygulamaları' limit 1;
  if v_module is null then raise notice 'Modül yok, atlanıyor: CAD Temelleri: 3D Çizim Uygulamaları'; return; end if;
  if exists (select 1 from public.quizzes where module_id = v_module and zorluk = 'zor') then return; end if;
  insert into public.quizzes (module_id, baslik, gecme_esigi, sira, zorluk)
    values (v_module, '3D Çizim Uygulamaları Quizi (Zor)', 70, 1, 'zor') returning id into v_quiz;
  for r in select * from jsonb_array_elements($json$[{"m":"Özellik sırasını değiştirmek bazen hata üretir. Bunun sebebi nedir?","a":"Bir özellik başka bir özelliğin yüzeyine veya eskizine bağlıysa sırası değiştirilemez.","o":[["Parent-child (ebeveyn-çocuk) bağımlılıkları",true],["Dosya adı",false],["Ekran çözünürlüğü",false],["Bellek",false]]},{"m":"Aynı parçanın farklı boyutlu varyasyonlarını tek dosyada tutmak için ne kullanılır?","a":"Yapılandırmalar tek parça dosyasında değişken boyutlar tutar.","o":[["Configurations (Design Table)",true],["Kopyalamak",false],["Mirror",false],["Render",false]]},{"m":"Bir eskizi silince ona bağlı özellikler ne olur?","a":"Bağımlılık nedeniyle sonraki özellikler hata verir.","o":[["Hata verir veya referansı kaybeder",true],["Daha hızlı çalışır",false],["Otomatik yenilenir",false],["Değişmez",false]]},{"m":"Equations (denklemler) ne işe yarar?","a":"Örneğin bir ölçü diğerinin yarısı olacak şekilde tanımlanabilir.","o":[["Ölçüleri birbirine veya değişkenlere bağlamak",true],["Dosyayı sıkıştırmak",false],["Rengi değiştirmek",false],["Montajı kilitlemek",false]]},{"m":"Kütle (mass properties) hesabının güvenilir olması için ne gerekir?","a":"Kütle = hacim x yoğunluk.","o":[["Doğru malzeme (yoğunluk) atanmış olması",true],["Renk seçilmiş olması",false],["Dosyanın kaydedilmesi",false],["Montaj olması",false]]},{"m":"Yeniden oluşturma (rebuild) hatalarına sebep olabilecekler hangileridir? (birden çok)","a":"Ekran çözünürlüğü modeli etkilemez.","o":[["Silinen referans yüzey/kenar",true],["Fazla tanımlı, çelişen ölçüler",true],["Eksik ilişkiler",true],["Ekran çözünürlüğü",false]]}]$json$::jsonb) loop
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
   where t.slug = 'mekanik' and m.ad = 'CAD Temelleri: Teknik Resim' limit 1;
  if v_module is null then raise notice 'Modül yok, atlanıyor: CAD Temelleri: Teknik Resim'; return; end if;
  if exists (select 1 from public.quizzes where module_id = v_module and zorluk = 'orta') then return; end if;
  insert into public.quizzes (module_id, baslik, gecme_esigi, sira, zorluk)
    values (v_module, 'Teknik Resim Quizi (Orta)', 70, 0, 'orta') returning id into v_quiz;
  for r in select * from jsonb_array_elements($json$[{"m":"Birinci açı (first angle) projeksiyonda üstten görünüş önden görünüşe göre nereye çizilir?","a":"Birinci açı yönteminde üstten görünüş önden görünüşün altındadır.","o":[["Altına",true],["Üstüne",false],["Sağına",false],["Soluna",false]]},{"m":"Kesit görünüşte kesilen yüzeyler nasıl gösterilir?","a":"Kesilen malzeme taranır.","o":[["Tarama (hatching) çizgileriyle",true],["Kırmızıya boyanarak",false],["Kesik çizgiyle",false],["Boş bırakılarak",false]]},{"m":"Detay görünüş (detail view) ne işe yarar?","a":"Dar bölgeler büyütülerek ölçülendirilir.","o":[["Küçük bir bölgeyi büyütüp ayrıntıyı göstermek",true],["Parçayı döndürmek",false],["Ölçüyü silmek",false],["Malzeme belirtmek",false]]},{"m":"Antet (title block) neleri içerir?","a":"Antet çizimin kimlik bilgileridir.","o":[["Parça adı, malzeme, ölçek, çizen, tarih gibi bilgileri",true],["Yalnız logo",false],["Yalnız ölçüleri",false],["Parçanın fiyatını",false]]},{"m":"2:1 ölçeği ne anlama gelir?","a":"İlk sayı çizim, ikinci sayı gerçek ölçüdür.","o":[["Büyütme: çizim gerçeğin iki katıdır",true],["Küçültme",false],["Aynı boyut",false],["Hata",false]]},{"m":"Yarım kesit ne zaman kullanılır?","a":"Simetri sayesinde hem iç hem dış görünüş tek görünüşte verilir.","o":[["Simetrik parçalarda yarısı kesit yarısı dış görünüş verilirken",true],["Parça asimetrikken",false],["Hiç kullanılmaz",false],["Renkli çizimde",false]]}]$json$::jsonb) loop
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
   where t.slug = 'mekanik' and m.ad = 'CAD Temelleri: Teknik Resim' limit 1;
  if v_module is null then raise notice 'Modül yok, atlanıyor: CAD Temelleri: Teknik Resim'; return; end if;
  if exists (select 1 from public.quizzes where module_id = v_module and zorluk = 'zor') then return; end if;
  insert into public.quizzes (module_id, baslik, gecme_esigi, sira, zorluk)
    values (v_module, 'Teknik Resim Quizi (Zor)', 70, 1, 'zor') returning id into v_quiz;
  for r in select * from jsonb_array_elements($json$[{"m":"Boyuna kesitte federler (kaburgalar) neden taranmaz?","a":"Standartlara göre boyuna kesilen feder, mil, vida gibi elemanlar taranmaz.","o":[["Kesitte dolu görünüp parçanın kalınlığı hakkında yanlış izlenim vermemesi için standart gereği",true],["Boyanması zor olduğu için",false],["Çizim hızlı olsun diye",false],["Tarama kalem renginden dolayı",false]]},{"m":"Yardımcı görünüş (auxiliary view) ne zaman kullanılır?","a":"Eğik yüzeyin asıl şekli ona dik bakış yönündeki yardımcı görünüşte görülür.","o":[["Eğik bir yüzeyin gerçek şeklini göstermek için",true],["Renk göstermek için",false],["Ölçek değiştirmek için",false],["Montaj için",false]]},{"m":"Teknik resimde görünmeyen kenarlar hangi çizgi türüyle gösterilir?","a":"Görünmeyen kenar: kesikli çizgi. Eksen: ince çizgi-nokta.","o":[["Kesik (kesikli) çizgi",true],["Kalın sürekli çizgi",false],["Çizgi-nokta çizgi",false],["Dalgalı çizgi",false]]},{"m":"Aynı ölçünün birden fazla yerde verilmesi için ne denir ve ne yapılmalıdır?","a":"Her ölçü bir kez verilmelidir; fazla ölçü yanlış anlaşılma riski yaratır.","o":[["Mükerrer ölçülendirme; kaçınılmalıdır",true],["Doğru bir uygulamadır",false],["Zorunludur",false],["Renkle gösterilir",false]]},{"m":"Kopuk (broken) görünüş ne işe yarar?","a":"Aynı kesitli uzun parçalar kağıda sığsın diye kısaltılır.","o":[["Uzun ve düzgün kesitli parçaların orta kısmını kısaltarak çizmeyi sağlar",true],["Parçayı kırıp göstermek",false],["Montaj sırasını gösterir",false],["Renk değiştirir",false]]},{"m":"Teknik resim şablonunda genellikle bulunan öğeler hangileridir? (birden çok)","a":"Şablon standartlaştırılmış kağıt, çerçeve ve antet içerir.","o":[["Antet",true],["Kağıt biçimi ve çerçeve",true],["Ölçek bilgisi",true],["Parçanın boya rengi",false]]}]$json$::jsonb) loop
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
   where t.slug = 'mekanik' and m.ad = 'CAD Temelleri: Montaj' limit 1;
  if v_module is null then raise notice 'Modül yok, atlanıyor: CAD Temelleri: Montaj'; return; end if;
  if exists (select 1 from public.quizzes where module_id = v_module and zorluk = 'orta') then return; end if;
  insert into public.quizzes (module_id, baslik, gecme_esigi, sira, zorluk)
    values (v_module, 'Montaj Quizi (Orta)', 70, 0, 'orta') returning id into v_quiz;
  for r in select * from jsonb_array_elements($json$[{"m":"Montaj (assembly) dosyası nedir?","a":"SolidWorks montaj dosyası .sldasm uzantılıdır.","o":[["Birden fazla parçanın bir araya getirildiği dosya",true],["Tek parçalık dosya",false],["Teknik resim",false],["Bir resim formatı",false]]},{"m":"Mate (ilişki) ne işe yarar?","a":"Mate ile parçalar arasındaki serbestlik derecesi sınırlanır.","o":[["Parçaları birbirine göre konumlandıran kısıtlar tanımlar",true],["Parçaları boyar",false],["Parçayı siler",false],["Malzeme atar",false]]},{"m":"Montaja eklenen ilk parça için genellikle ne yapılır?","a":"İlk parça referans olarak sabitlenir.","o":[["Sabitlenir (Fix)",true],["Silinir",false],["Boyanır",false],["Hareket ettirilir",false]]},{"m":"Concentric mate ne sağlar?","a":"Delik ve mil ekseninin çakışmasını sağlar.","o":[["Silindirik elemanların (delik-mil) eş merkezli olmasını",true],["Yüzeylerin çakışmasını",false],["Paralelliği",false],["Mesafeyi",false]]},{"m":"Coincident mate ne sağlar?","a":"Yüzeylerin birbirine temas etmesi için kullanılır.","o":[["Yüzey, kenar veya noktaların çakışmasını",true],["Eş merkezliliği",false],["Açıyı",false],["Kilitlemeyi",false]]},{"m":"Mechanical mate örnekleri hangileridir?","a":"Mekanik mate'ler dişli ve kam gibi hareket ilişkilerini tanımlar.","o":[["Gear (dişli), Cam, Hinge",true],["Coincident, Parallel",false],["Fillet, Shell",false],["Extrude, Revolve",false]]}]$json$::jsonb) loop
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
   where t.slug = 'mekanik' and m.ad = 'CAD Temelleri: Montaj' limit 1;
  if v_module is null then raise notice 'Modül yok, atlanıyor: CAD Temelleri: Montaj'; return; end if;
  if exists (select 1 from public.quizzes where module_id = v_module and zorluk = 'zor') then return; end if;
  insert into public.quizzes (module_id, baslik, gecme_esigi, sira, zorluk)
    values (v_module, 'Montaj Quizi (Zor)', 70, 1, 'zor') returning id into v_quiz;
  for r in select * from jsonb_array_elements($json$[{"m":"Bir milin deliğe oturması için en az hangi iki mate gerekir?","a":"Concentric eksenleri hizalar, Coincident eksenel konumu belirler.","o":[["Concentric ve Coincident (yüzey)",true],["Fillet ve Chamfer",false],["Extrude ve Cut",false],["Mirror ve Pattern",false]]},{"m":"Bir montajda fazla tanımlı (over defined) mate durumu ne anlama gelir?","a":"Çelişen kısıtlar çözüm hatası verir.","o":[["Çelişen veya fazla mate'ler vardır",true],["Montaj eksiktir",false],["Parçalar silinmiştir",false],["Dosya bozuktur",false]]},{"m":"Uzayda hiçbir mate'i olmayan serbest bir parçanın serbestlik derecesi kaçtır?","a":"3 öteleme + 3 dönme = 6.","o":[["3",false],["4",false],["6",true],["12",false]]},{"m":"Interference Detection ne işe yarar?","a":"Birbirine girmiş parçaları ve hacmi raporlar.","o":[["Parçaların çakışıp çakışmadığını bulmak",true],["Rengi değiştirmek",false],["Ağırlığı hesaplamak",false],["Resim almak",false]]},{"m":"Exploded View (patlatılmış görünüm) ne işe yarar?","a":"Montaj kılavuzlarında kullanılır.","o":[["Parçaları ayrı ayrı göstererek montaj sırasını anlatmak",true],["Parçayı büyütmek",false],["Parçayı silmek",false],["Malzeme belirtmek",false]]},{"m":"Aşağıdakilerden hangileri standart mate türleridir? (birden çok)","a":"Extrude bir özellik komutudur, mate değildir.","o":[["Coincident",true],["Parallel",true],["Distance",true],["Extrude",false]]}]$json$::jsonb) loop
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
   where t.slug = 'mekanik' and m.ad = '3D Baskı ve Üretim' limit 1;
  if v_module is null then raise notice 'Modül yok, atlanıyor: 3D Baskı ve Üretim'; return; end if;
  if exists (select 1 from public.quizzes where module_id = v_module and zorluk = 'orta') then return; end if;
  insert into public.quizzes (module_id, baslik, gecme_esigi, sira, zorluk)
    values (v_module, '3D Baskı ve Üretim Quizi (Orta)', 70, 0, 'orta') returning id into v_quiz;
  for r in select * from jsonb_array_elements($json$[{"m":"FDM yöntemi nasıl çalışır?","a":"FDM, ısıtılmış nozuldan filaman çıkarıp katman katman parça oluşturur.","o":[["Eritilmiş filamanı katman katman biriktirir",true],["Lazerle metal tozunu kaynaştırır",false],["Işığa duyarlı reçineyi kürler",false],["Plastiği enjekte eder",false]]},{"m":"Dilimleyici (slicer) ne yapar?","a":"Dilimleyici yazıcının izleyeceği yolu hesaplar.","o":[["3B modeli katmanlara bölüp yazıcı için G-code üretir",true],["Modeli çizer",false],["Modeli boyar",false],["Yazıcıyı soğutur",false]]},{"m":"PLA ve ABS için hangisi doğrudur?","a":"ABS yüksek sıcaklık ister ve bükülme (warping) yapabilir.","o":[["PLA daha kolay basılır, ABS ısıya daha dayanıklıdır",true],["ABS her zaman daha kolay basılır",false],["İkisi aynıdır",false],["PLA metaldir",false]]},{"m":"Kompozit malzeme nedir?","a":"Örneğin karbon fiber elyaf ve epoksi reçine.","o":[["İki veya daha fazla malzemenin birleşimiyle elde edilen malzeme",true],["Tek bir metal",false],["Kâğıt",false],["Plastik torba",false]]},{"m":"Destek yapısı (support) ne için kullanılır?","a":"Eğimi fazla çıkıntılar destek olmadan düşebilir.","o":[["Havada kalan kısımları desteklemek",true],["Parçayı boyamak",false],["Hız artırmak",false],["Isıtmak",false]]},{"m":"Infill (iç dolgu) ne ifade eder?","a":"Düşük infill hafif ve hızlı, yüksek infill dayanıklıdır.","o":[["Parça içindeki doluluk oranı",true],["Dış renk",false],["Katman kalınlığı",false],["Yazıcı hızı",false]]}]$json$::jsonb) loop
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
   where t.slug = 'mekanik' and m.ad = '3D Baskı ve Üretim' limit 1;
  if v_module is null then raise notice 'Modül yok, atlanıyor: 3D Baskı ve Üretim'; return; end if;
  if exists (select 1 from public.quizzes where module_id = v_module and zorluk = 'zor') then return; end if;
  insert into public.quizzes (module_id, baslik, gecme_esigi, sira, zorluk)
    values (v_module, '3D Baskı ve Üretim Quizi (Zor)', 70, 1, 'zor') returning id into v_quiz;
  for r in select * from jsonb_array_elements($json$[{"m":"FDM ile basılan parçada en zayıf yön hangisidir ve yönlendirme nasıl yapılmalıdır?","a":"FDM parçalar anizotropiktir; katmanlar arası ayrılma tipik hata modudur.","o":[["Katmanlar arası yapışma zayıftır; yük katmanları birbirinden ayırmayacak şekilde yönlendirilmelidir",true],["Katman içi zayıftır, yük hiçbir zaman önemli değildir",false],["Parça her yönde aynı dayanıklıdır",false],["Yönlendirmenin etkisi yoktur",false]]},{"m":"Genel kural olarak yaklaşık kaç dereceden fazla çıkıntıda (overhang) destek gerekir?","a":"45° üzerindeki çıkıntılar genelde desteksiz basılamaz.","o":[["Yaklaşık 45°",true],["Yaklaşık 5°",false],["Hiçbir zaman",false],["180°",false]]},{"m":"İHA yapımında yaygın kullanılan hafif malzemeler hangileridir? (birden çok)","a":"Ağırlık kritik olduğu için çelik gövde tipik tercih değildir.","o":[["Karbon fiber",true],["EPP/EPO köpük",true],["Balsa",true],["Çelik (gövde için)",false]]},{"m":"Kompozit levhada elyaf yönü nasıl seçilmelidir?","a":"Elyaf yönünde dayanım yüksek, enine yönde düşüktür.","o":[["Yük yönüne göre, çünkü malzeme anizotropiktir",true],["Rastgele",false],["Hiç önemli değil",false],["Her zaman 90°",false]]},{"m":"3B baskıda delik çapı genellikle neden istenenden küçük çıkar ve ne yapılır?","a":"Delikler küçük basıldığı için telafi payı verilir.","o":[["Malzeme büzülür/akar; tasarımda tolerans payı bırakılır",true],["Yazıcı çalışmaz",false],["Boyutlar hep tam çıkar",false],["Delik yazılımda silinir",false]]},{"m":"Karbon fiberin İHA'da tercih edilme sebebi nedir?","a":"Yüksek özgül dayanım ve rijitlik hafif yapı sağlar.","o":[["Ağırlığına göre yüksek dayanım ve rijitlik",true],["Ucuz olması",false],["Esnemesi",false],["Kolay erimesi",false]]}]$json$::jsonb) loop
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

