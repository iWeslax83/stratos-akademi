-- Yazılım dalı quizleri (orta ve zor). Idempotent: (modül, zorluk) için quiz varsa atlanır.
-- 0048_quiz_zorluk.sql uygulanmış olmalı. Modül yoksa (örn. 0049 uygulanmadıysa) notice verip atlar.

do $q$
declare v_module uuid; v_quiz uuid; v_q uuid; r jsonb; o jsonb; i int := 0; j int;
begin
  select m.id into v_module from public.modules m join public.tracks t on t.id = m.track_id
   where t.slug = 'yazilim' and m.ad = 'Web Temelleri' limit 1;
  if v_module is null then raise notice 'Modül yok, atlanıyor: Web Temelleri'; return; end if;
  if exists (select 1 from public.quizzes where module_id = v_module and zorluk = 'orta') then return; end if;
  insert into public.quizzes (module_id, baslik, gecme_esigi, sira, zorluk)
    values (v_module, 'Web Temelleri Quizi (Orta)', 70, 0, 'orta') returning id into v_quiz;
  for r in select * from jsonb_array_elements($json$[{"m":"HTML'in görevi nedir?","a":"HTML içeriği (başlık, paragraf, görsel, bağlantı) işaretler.","o":[["Sayfaya stil vermek",false],["Sayfanın yapısını ve içeriğini tanımlamak",true],["Veritabanı yönetmek",false],["Sunucu kurmak",false]]},{"m":"CSS ne için kullanılır?","a":"CSS, HTML öğelerinin sunumunu tanımlar.","o":[["Sayfanın görünümünü (renk, yerleşim, yazı tipi) belirlemek",true],["Veritabanı sorgulamak",false],["Sunucu yazmak",false],["Resim sıkıştırmak",false]]},{"m":"JavaScript web sayfasına ne kazandırır?","a":"JavaScript tarayıcıda çalışarak sayfayı dinamik hale getirir.","o":[["Sayfaya davranış ve etkileşim",true],["Yalnız renkler",false],["Yalnız yazı tipleri",false],["Sunucu donanımı",false]]},{"m":"Bir görseli sayfaya eklemek için hangi HTML etiketi kullanılır?","a":"<img src=\"...\" alt=\"...\"> biçiminde kullanılır.","o":[["<image>",false],["<img>",true],["<picture-src>",false],["<photo>",false]]},{"m":"CSS'te sınıf (class) seçicisi hangi işaretle başlar?","a":".kart sınıf, #ana kimlik (id) seçicisidir.","o":[["# (diyez)",false],[". (nokta)",true],["@",false],["$",false]]},{"m":"Aşağıdakilerden hangileri HTML başlık etiketleridir? (birden çok)","a":"<h1>-<h6> başlıklardır; <p> paragraf, <div> genel kapsayıcıdır.","o":[["<h1>",true],["<h4>",true],["<p>",false],["<div>",false]]}]$json$::jsonb) loop
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
   where t.slug = 'yazilim' and m.ad = 'Web Temelleri' limit 1;
  if v_module is null then raise notice 'Modül yok, atlanıyor: Web Temelleri'; return; end if;
  if exists (select 1 from public.quizzes where module_id = v_module and zorluk = 'zor') then return; end if;
  insert into public.quizzes (module_id, baslik, gecme_esigi, sira, zorluk)
    values (v_module, 'Web Temelleri Quizi (Zor)', 70, 1, 'zor') returning id into v_quiz;
  for r in select * from jsonb_array_elements($json$[{"m":"JavaScript'te \"5\" == 5 ve \"5\" === 5 ifadelerinin sonuçları sırasıyla nedir?","a":"== tip dönüşümü yapar, === tipi de karşılaştırır.","o":[["true, true",false],["true, false",true],["false, true",false],["false, false",false]]},{"m":"let ile var arasındaki temel fark nedir?","a":"let blok ({ }) içinde geçerlidir; var fonksiyon kapsamındadır ve hoisting'e tabidir.","o":[["let blok kapsamlıdır, var fonksiyon kapsamlıdır",true],["Fark yoktur",false],["var daha yenidir",false],["let değişkeni sabitler",false]]},{"m":"CSS kutu modelinde (content-box) genişlik 200 px, padding her yönde 20 px, border 5 px ise elemanın toplam yatay genişliği nedir?","a":"200 + 2x20 + 2x5 = 250 px.","o":[["200 px",false],["240 px",false],["250 px",true],["270 px",false]]},{"m":"Flexbox'ta ana eksen boyunca hizalamayı hangi özellik yapar?","a":"justify-content ana eksen, align-items çapraz eksendir.","o":[["align-items",false],["justify-content",true],["flex-wrap",false],["z-index",false]]},{"m":"document.querySelector('.kart') ifadesi ne döndürür?","a":"querySelectorAll listeyi, querySelector ilk eşleşeni döndürür.","o":[["Tüm .kart elemanlarının listesini",false],["İlk eşleşen .kart elemanını",true],["Sayfanın başlığını",false],["Hiçbir şey",false]]},{"m":"Hangileri anlamsal (semantic) HTML5 etiketleridir? (birden çok)","a":"<marquee> kullanımdan kalkmış, anlamsal olmayan bir etikettir.","o":[["<header>",true],["<nav>",true],["<article>",true],["<marquee>",false]]}]$json$::jsonb) loop
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
   where t.slug = 'yazilim' and m.ad = 'Drone Programlama' limit 1;
  if v_module is null then raise notice 'Modül yok, atlanıyor: Drone Programlama'; return; end if;
  if exists (select 1 from public.quizzes where module_id = v_module and zorluk = 'orta') then return; end if;
  insert into public.quizzes (module_id, baslik, gecme_esigi, sira, zorluk)
    values (v_module, 'Drone Programlama Quizi (Orta)', 70, 0, 'orta') returning id into v_quiz;
  for r in select * from jsonb_array_elements($json$[{"m":"SITL (Software In The Loop) ne işe yarar?","a":"SITL ile uçuş yazılımı bilgisayarda gerçek araç olmadan çalıştırılır.","o":[["Gerçek drone'a yazılım yükler",false],["Donanım olmadan ArduPilot'u bilgisayarda simüle eder",true],["Bataryayı test eder",false],["Kamera görüntüsünü işler",false]]},{"m":"DroneKit hangi programlama dilinde kullanılır?","a":"DroneKit-Python, MAVLink üzerinden araç kontrolü sağlar.","o":[["Python",true],["Swift",false],["Rust",false],["PHP",false]]},{"m":"MAVLink nedir?","a":"MAVLink hafif bir telemetri ve komut protokolüdür.","o":[["Bir batarya türü",false],["Drone ile yer istasyonu/yazılım arasında kullanılan mesajlaşma protokolü",true],["Bir kamera formatı",false],["Bir pervane tipi",false]]},{"m":"Gazebo ne için kullanılır?","a":"Gazebo, ArduPilot SITL ile birlikte kullanılabilen simülatördür.","o":[["3B fizik tabanlı robot ve drone simülasyonu",true],["Video düzenleme",false],["Dosya sıkıştırma",false],["Veritabanı yönetimi",false]]},{"m":"GUIDED mod ne anlama gelir?","a":"GUIDED modda komutla irtifa ve konum verilebilir.","o":[["Aracın yer istasyonu veya programdan gelen komutlarla yönetildiği mod",true],["Motorların kapalı olduğu mod",false],["Pilotun doğrudan kumanda ettiği mod",false],["Aracın otomatik şarj olduğu mod",false]]},{"m":"Drone'u 'arm' etmek ne demektir?","a":"Arm edilmemiş araçta motorlar dönmez.","o":[["Motorları çalıştırmaya hazır hale getirmek",true],["Bataryayı şarj etmek",false],["Kamerayı açmak",false],["Pervane takmak",false]]}]$json$::jsonb) loop
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
   where t.slug = 'yazilim' and m.ad = 'Drone Programlama' limit 1;
  if v_module is null then raise notice 'Modül yok, atlanıyor: Drone Programlama'; return; end if;
  if exists (select 1 from public.quizzes where module_id = v_module and zorluk = 'zor') then return; end if;
  insert into public.quizzes (module_id, baslik, gecme_esigi, sira, zorluk)
    values (v_module, 'Drone Programlama Quizi (Zor)', 70, 1, 'zor') returning id into v_quiz;
  for r in select * from jsonb_array_elements($json$[{"m":"simple_takeoff komutunun çalışması için hangi koşullar gerekir? (birden çok)","a":"DroneKit kalkışı GUIDED modda ve arm edilmiş araçla yapılır.","o":[["Araç GUIDED modda olmalı",true],["Araç arm edilmiş olmalı",true],["Araç AUTO modda olmalı",false],["Araç yerde ve hazır (armable) olmalı",true]]},{"m":"LocationGlobalRelative(lat, lon, alt) içindeki alt değeri neye göre ölçülür?","a":"Relative çerçevede irtifa home konumuna göredir.","o":[["Deniz seviyesine",false],["Kalkış (home) noktasına",true],["Yer istasyonuna",false],["En yakın binaya",false]]},{"m":"vehicle.mode = VehicleMode(\"RTL\") ne yapar?","a":"RTL: Return To Launch.","o":[["Aracı durdurur",false],["Aracın kalkış noktasına dönüp inmesini sağlar",true],["Aracı arm eder",false],["Görevi siler",false]]},{"m":"Yön NED (North-East-Down) çerçevesinde hız verilirken yukarı çıkmak için z hızı nasıl olmalıdır?","a":"NED'de Down pozitiftir; yukarı çıkmak için z negatif verilir.","o":[["Pozitif",false],["Negatif",true],["Sıfır",false],["Fark etmez",false]]},{"m":"Drone kodunu gerçek araca vermeden önce SITL'de denemenin başlıca nedeni nedir?","a":"Simülasyonda hata zararsızdır; gerçekte araç kaybı veya yaralanma olabilir.","o":[["Daha hızlı uçması",false],["Donanımı ve çevreyi riske atmadan hataları yakalamak",true],["Daha az kod yazılması",false],["Lisans gereği",false]]},{"m":"vehicle.commands.upload() çağrısı ne yapar?","a":"Görev komutları önce listeye eklenir, upload ile araca aktarılır.","o":[["Videoları buluta gönderir",false],["Oluşturulan görev komutlarını (waypoint) araca yükler",true],["Aracı arm eder",false],["Bataryayı kalibre eder",false]]}]$json$::jsonb) loop
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
   where t.slug = 'yazilim' and m.ad = 'Yapay Zeka ve Derin Öğrenme' limit 1;
  if v_module is null then raise notice 'Modül yok, atlanıyor: Yapay Zeka ve Derin Öğrenme'; return; end if;
  if exists (select 1 from public.quizzes where module_id = v_module and zorluk = 'orta') then return; end if;
  insert into public.quizzes (module_id, baslik, gecme_esigi, sira, zorluk)
    values (v_module, 'Yapay Zeka ve Derin Öğrenme Quizi (Orta)', 70, 0, 'orta') returning id into v_quiz;
  for r in select * from jsonb_array_elements($json$[{"m":"Derin öğrenme (deep learning) nedir?","a":"Derin öğrenme, çok sayıda gizli katmanlı sinir ağlarını kullanır.","o":[["Çok katmanlı yapay sinir ağlarıyla öğrenen makine öğrenmesi alt alanı",true],["Bir veritabanı türü",false],["Bir programlama dili",false],["Bir donanım markası",false]]},{"m":"Keras'ta Sequential model ne demektir?","a":"Sequential, katman listesini sırayla çalıştırır.","o":[["Katmanların sırayla üst üste eklendiği model yapısı",true],["Yalnız tek katmanlı model",false],["Eğitilmeyen model",false],["Yalnız görüntü modeli",false]]},{"m":"ReLU aktivasyon fonksiyonu ne yapar?","a":"ReLU(x) = max(0, x).","o":[["Negatif değerleri sıfırlar, pozitifleri aynen geçirir",true],["Tüm değerleri 0-1 aralığına sıkıştırır",false],["Değerleri karesini alır",false],["Değerleri tersler",false]]},{"m":"Sigmoid fonksiyonunun çıkış aralığı nedir?","a":"Sigmoid çıkışı 0 ile 1 arasındadır; olasılık gibi yorumlanır.","o":[["-1 ile 1",false],["0 ile 1",true],["0 ile sonsuz",false],["-sonsuz ile sonsuz",false]]},{"m":"Binary crossentropy kayıp fonksiyonu hangi tür problemde kullanılır?","a":"İki sınıf için sigmoid çıkışlı modellerde kullanılır.","o":[["İkili (iki sınıflı) sınıflandırma",true],["Regresyon",false],["Kümeleme",false],["Görüntü sıkıştırma",false]]},{"m":"CNN (Convolutional Neural Network) en çok hangi veri türünde kullanılır?","a":"Evrişim katmanları görüntülerdeki yerel örüntüleri yakalar.","o":[["Görüntü",true],["Yalnız metin tablosu",false],["Yalnız ses seviyesi",false],["Yalnız zaman damgası",false]]}]$json$::jsonb) loop
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
   where t.slug = 'yazilim' and m.ad = 'Yapay Zeka ve Derin Öğrenme' limit 1;
  if v_module is null then raise notice 'Modül yok, atlanıyor: Yapay Zeka ve Derin Öğrenme'; return; end if;
  if exists (select 1 from public.quizzes where module_id = v_module and zorluk = 'zor') then return; end if;
  insert into public.quizzes (module_id, baslik, gecme_esigi, sira, zorluk)
    values (v_module, 'Yapay Zeka ve Derin Öğrenme Quizi (Zor)', 70, 1, 'zor') returning id into v_quiz;
  for r in select * from jsonb_array_elements($json$[{"m":"Üç veya daha fazla sınıfı olan, her örneğin tek sınıfa ait olduğu bir problemde çıkış katmanında hangi aktivasyon kullanılır?","a":"Softmax çıkışları toplamı 1 olan olasılık dağılımına dönüştürür.","o":[["Sigmoid",false],["ReLU",false],["Softmax",true],["Doğrusal olmayan hiçbiri",false]]},{"m":"ReLU(x) = max(0, x) fonksiyonuna x = -3 ve x = 2 verilirse çıkışlar sırasıyla nedir?","a":"Negatif girdi 0'a, pozitif girdi aynen geçer.","o":[["-3 ve 2",false],["0 ve 2",true],["0 ve 0",false],["3 ve 2",false]]},{"m":"Sigmoid(0) değeri nedir?","a":"1 / (1 + e^0) = 1 / 2 = 0,5.","o":[["0",false],["0,5",true],["1",false],["-1",false]]},{"m":"LSTM neden basit RNN'e tercih edilir?","a":"LSTM kapıları bilginin ne kadarının saklanacağını ve unutulacağını öğrenir.","o":[["Daha az parametre kullandığı için",false],["Bellek hücresi ve kapılarla uzun dizilerde kaybolan gradyan sorununu hafiflettiği için",true],["Yalnız görüntüde çalıştığı için",false],["Eğitim gerektirmediği için",false]]},{"m":"28x28 boyutlu bir özellik haritasına 2x2 pencereli, adımı 2 olan max pooling uygulanırsa çıkış boyutu ne olur?","a":"Pencere ve adım 2 olduğu için her boyut yarıya iner.","o":[["28x28",false],["14x14",true],["7x7",false],["2x2",false]]},{"m":"Eğitim doğruluğu çok yüksek, doğrulama (validation) doğruluğu düşükse ne olmuştur?","a":"Model eğitim verisini ezberlemiş, genelleme yapamıyordur.","o":[["Underfitting",false],["Overfitting (aşırı öğrenme)",true],["Veri sızıntısı olmaması",false],["Normalleşme",false]]},{"m":"Hangileri hiperparametredir? (birden çok)","a":"Ağırlıklar eğitimle öğrenilir; hiperparametreler eğitimden önce seçilir.","o":[["Öğrenme oranı (learning rate)",true],["Epoch sayısı",true],["Batch size",true],["Eğitimle öğrenilen ağırlıklar",false]]}]$json$::jsonb) loop
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
   where t.slug = 'yazilim' and m.ad = 'Yapay Zeka ile Yazılım Geliştirme' limit 1;
  if v_module is null then raise notice 'Modül yok, atlanıyor: Yapay Zeka ile Yazılım Geliştirme'; return; end if;
  if exists (select 1 from public.quizzes where module_id = v_module and zorluk = 'orta') then return; end if;
  insert into public.quizzes (module_id, baslik, gecme_esigi, sira, zorluk)
    values (v_module, 'Yapay Zeka ile Yazılım Geliştirme Quizi (Orta)', 70, 0, 'orta') returning id into v_quiz;
  for r in select * from jsonb_array_elements($json$[{"m":"Cursor nedir?","a":"Cursor, kod yazmayı, açıklamayı ve düzenlemeyi yapay zeka ile destekleyen bir editördür.","o":[["Yapay zeka destekli bir kod editörü",true],["Bir veritabanı",false],["Bir işletim sistemi",false],["Bir tarayıcı eklentisi",false]]},{"m":"Backend (arka uç) ne yapar?","a":"Backend isteklere cevap verir, veriyi işler ve veritabanıyla konuşur.","o":[["Sunucu tarafında veri ve iş mantığını yönetir",true],["Yalnız sayfa renklerini belirler",false],["Yalnız animasyon üretir",false],["Ekran kartını yönetir",false]]},{"m":"API endpoint nedir?","a":"Örneğin /api/kullanicilar bir endpoint'tir.","o":[["İstemcinin istek gönderdiği, belirli bir işlevi karşılayan adres",true],["Bir veritabanı tablosu",false],["Bir CSS dosyası",false],["Bir ekran çözünürlüğü",false]]},{"m":"DNS ne işe yarar?","a":"DNS, insanlar için okunabilir adı makine adresine çözümler.","o":[["Alan adını IP adresine çevirir",true],["Dosyaları sıkıştırır",false],["Şifreleri saklar",false],["Kodu derler",false]]},{"m":"Session (oturum) mantığı neyi sağlar?","a":"Sunucu veya token ile kimlik doğrulanmış kullanıcının durumu takip edilir.","o":[["Kullanıcının giriş yaptıktan sonra isteklerde tanınmasını",true],["Sayfanın daha hızlı yüklenmesini",false],["Resimlerin sıkıştırılmasını",false],["Kodun derlenmesini",false]]},{"m":"Nginx genellikle hangi amaçla kullanılır?","a":"Nginx istekleri uygulama sunucusuna iletir ve statik dosyaları sunar.","o":[["Web sunucusu ve ters vekil (reverse proxy) olarak",true],["Metin düzenleyici olarak",false],["Veritabanı olarak",false],["Programlama dili olarak",false]]}]$json$::jsonb) loop
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
   where t.slug = 'yazilim' and m.ad = 'Yapay Zeka ile Yazılım Geliştirme' limit 1;
  if v_module is null then raise notice 'Modül yok, atlanıyor: Yapay Zeka ile Yazılım Geliştirme'; return; end if;
  if exists (select 1 from public.quizzes where module_id = v_module and zorluk = 'zor') then return; end if;
  insert into public.quizzes (module_id, baslik, gecme_esigi, sira, zorluk)
    values (v_module, 'Yapay Zeka ile Yazılım Geliştirme Quizi (Zor)', 70, 1, 'zor') returning id into v_quiz;
  for r in select * from jsonb_array_elements($json$[{"m":"Uvicorn ne işe yarar?","a":"Uvicorn, ASGI uygulamalarını HTTP üzerinden sunan hafif bir sunucudur.","o":[["FastAPI gibi Python ASGI uygulamalarını çalıştıran sunucudur",true],["Bir CSS çerçevesidir",false],["Bir veritabanıdır",false],["Bir Android emülatörüdür",false]]},{"m":"Uvicorn'un önüne Nginx konmasının nedenleri hangileridir? (birden çok)","a":"Nginx derleme yapmaz; ağ ve proxy katmanını üstlenir.","o":[["TLS/HTTPS sonlandırma",true],["Statik dosyaları verimli sunma",true],["İstekleri uygulamaya yönlendirme (reverse proxy)",true],["Python kodunu derlemek",false]]},{"m":"Yapay zekanın ürettiği kodu neden gözden geçirmek gerekir?","a":"Model hata yapabilir; testler ve kod incelemesi gereklidir.","o":[["Hatalı veya güvensiz olabilir; sorumluluk geliştiricidedir",true],["Yapay zeka her zaman doğru yazar",false],["Kod hiçbir zaman çalışmaz",false],["Gözden geçirmeye gerek yoktur",false]]},{"m":"401 ve 404 HTTP durum kodlarının anlamları sırasıyla nedir?","a":"401 kimlik doğrulaması gerekir, 404 kaynak bulunamadı demektir.","o":[["Yetkisiz/kimlik doğrulanmamış, bulunamadı",true],["Bulunamadı, yetkisiz",false],["Başarılı, yönlendirme",false],["Sunucu hatası, başarılı",false]]},{"m":"DNS'te A kaydı ne yapar?","a":"AAAA kaydı IPv6, CNAME ise takma ad içindir.","o":[["Alan adını bir IPv4 adresine eşler",true],["E-posta yönlendirir",false],["Dosya yükler",false],["Sertifika üretir",false]]},{"m":"Oturum güvenliği için hangileri doğrudur? (birden çok)","a":"Parola düz metin saklanmaz ve istemciye verilmez.","o":[["Oturum kimliği tahmin edilemez rastgele bir değer olmalıdır",true],["Oturum kimliği HTTPS üzerinden iletilmelidir",true],["Yetkilendirme sunucu tarafında kontrol edilmelidir",true],["Parola düz metin olarak cookie'de saklanmalıdır",false]]}]$json$::jsonb) loop
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
   where t.slug = 'yazilim' and m.ad = 'Görüntü İşleme' limit 1;
  if v_module is null then raise notice 'Modül yok, atlanıyor: Görüntü İşleme'; return; end if;
  if exists (select 1 from public.quizzes where module_id = v_module and zorluk = 'orta') then return; end if;
  insert into public.quizzes (module_id, baslik, gecme_esigi, sira, zorluk)
    values (v_module, 'Görüntü İşleme Quizi (Orta)', 70, 0, 'orta') returning id into v_quiz;
  for r in select * from jsonb_array_elements($json$[{"m":"Piksel nedir?","a":"Dijital görüntü piksellerden oluşan ızgaradır.","o":[["Görüntünün en küçük birimi",true],["Bir kamera türü",false],["Bir renk adı",false],["Bir dosya formatı",false]]},{"m":"OpenCV nedir?","a":"OpenCV görüntü işleme ve bilgisayarlı görü için yaygın kütüphanedir.","o":[["Bir drone modeli",false],["Açık kaynaklı bilgisayarlı görü kütüphanesi",true],["Bir kamera markası",false],["Bir işletim sistemi",false]]},{"m":"RGB kısaltması neyi ifade eder?","a":"Renkli görüntü genelde üç kanalın birleşimidir.","o":[["Kırmızı, yeşil, mavi renk kanalları",true],["Radyo, GPS, batarya",false],["Rota, görev, bölge",false],["Hiçbiri",false]]},{"m":"Nesne tanıma (object detection) ne yapar?","a":"Tespit; nesnenin konumunu (kutu) ve sınıfını verir.","o":[["Görüntüyü sıkıştırır",false],["Görüntüde nesneleri bulup sınıflandırır",true],["Görüntünün rengini değiştirir",false],["Kamerayı kalibre eder",false]]},{"m":"GSD (Ground Sample Distance) neyi ifade eder?","a":"GSD havadan görüntülemede ayrıntı düzeyini belirler.","o":[["Bir pikselin yerdeki karşılığı olan mesafe",true],["Kameranın ağırlığı",false],["Uçuş hızı",false],["Batarya süresi",false]]},{"m":"Çözünürlük arttıkça ne olur?","a":"Daha fazla piksel daha fazla bilgi ve daha fazla işlem demektir.","o":[["Ayrıntı artar, işlem ve depolama yükü artar",true],["Ayrıntı azalır",false],["Dosya küçülür",false],["Hiçbir şey olmaz",false]]}]$json$::jsonb) loop
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
   where t.slug = 'yazilim' and m.ad = 'Görüntü İşleme' limit 1;
  if v_module is null then raise notice 'Modül yok, atlanıyor: Görüntü İşleme'; return; end if;
  if exists (select 1 from public.quizzes where module_id = v_module and zorluk = 'zor') then return; end if;
  insert into public.quizzes (module_id, baslik, gecme_esigi, sira, zorluk)
    values (v_module, 'Görüntü İşleme Quizi (Zor)', 70, 1, 'zor') returning id into v_quiz;
  for r in select * from jsonb_array_elements($json$[{"m":"İrtifa arttıkça GSD nasıl değişir (kamera sabitken)?","a":"Yükseldikçe her piksel yerde daha geniş alanı kapsar.","o":[["Küçülür, ayrıntı artar",false],["Büyür, ayrıntı azalır",true],["Değişmez",false],["Sıfırlanır",false]]},{"m":"Gimbal'in amacı nedir?","a":"Gimbal kamerayı sabit tutarak bulanıklığı azaltır.","o":[["Kameranın gücünü artırmak",false],["Kamerayı aracın hareket ve titreşiminden bağımsız stabilize etmek",true],["Menzili artırmak",false],["Görüntüyü kaydetmek",false]]},{"m":"Hareket bulanıklığını (motion blur) azaltmak için kamera ayarlarında ne yapılır?","a":"Kısa pozlama hareket sırasında oluşan bulanıklığı azaltır.","o":[["Pozlama süresini uzatmak",false],["Deklanşör hızını artırmak (pozlamayı kısaltmak)",true],["ISO'yu sıfırlamak",false],["Rengi değiştirmek",false]]},{"m":"Nesne tanıma başarısını artıran etkenler hangileridir? (birden çok)","a":"Veri kalitesi ve görüntü kalitesi model başarısını belirler.","o":[["İyi aydınlatma",true],["Yeterli çözünürlük",true],["Çeşitli ve dengeli eğitim verisi",true],["Titreyen, bulanık görüntü",false]]},{"m":"Bir modelin precision (kesinlik) değeri neyi ölçer?","a":"Precision = doğru pozitifler / tüm pozitif tahminler. Recall gerçek nesnelerin bulunma oranıdır.","o":[["Gerçek nesnelerin ne kadarının bulunduğunu",false],["Modelin pozitif dediği tespitlerin ne kadarının doğru olduğunu",true],["Modelin hızını",false],["Eğitim süresini",false]]},{"m":"Renge dayalı tespitte HSV uzayı neden sıklıkla RGB'ye tercih edilir?","a":"HSV'de H renk tonunu verir ve parlaklık V'den ayrıdır.","o":[["Daha az bellek kullandığı için",false],["Renk tonunu parlaklıktan ayırdığı için aydınlatma değişimlerine daha dayanıklıdır",true],["Daha renkli olduğu için",false],["Zorunlu olduğu için",false]]}]$json$::jsonb) loop
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

