-- Aviyonik / FPV ve Betaflight modülü quizleri (orta ve zor). Kaynak: ALL4FPV "Betaflight 10.6
-- Detaylı Türkçe Anlatım" 1. bölüm (kaYSmWefx3A) ve 2. bölüm (K-Khq7sYVcQ) Türkçe otomatik altyazıları.
-- Altyazı gürültülü; yalnız net anlaşılan anlatımdan soru yazıldı. 2. bölümdeki GPS Rescue
-- parametreleri ve anti-gravity kısmı okunamadığı için dışarıda bırakıldı.
-- Zaman damgaları (B1 = 1. bölüm, B2 = 2. bölüm):
--   Full chip erase B1 1:30 · target adı B1 1:00 · arming engelleri B1 7:30-8:30, 60:00
--   SmartAudio B1 10:00-10:30 · Quad X motor sırası B1 13:00 · bidirectional DShot + motor kutbu B1 14:00-15:00
--   PID döngüsü ve CPU yükü B1 17:00-18:00 · board alignment B1 18:30-20:00 · max arm açısı B1 20:00-20:30
--   telemetri B1 24:30-25:30 · Air Mode B1 26:00-26:30 · RSSI ADC B1 28:00-28:30 · 4,3 V hücre B1 29:00-30:30
--   Acro Trainer B1 36:30-38:00 · Blackbox B1 48:00-50:30 · CLI resource B1 51:30-58:00 · custom defaults B1 61:00-62:30
--   ESC telemetri hata oranı B2 10:00-10:30 · OSD video formatı B2 10:30-11:30 · VTX tablosu B2 19:00-22:30
--   PID kaydırıcıları B2 30:30-33:30 · Expo B2 40:00-41:00 · filtre ve motor ısısı B2 45:00-46:30
-- Idempotent: (modül, zorluk) için quiz varsa atlanır. 0072 uygulanmış olmalı.

do $q$
declare v_module uuid; v_quiz uuid; v_q uuid; r jsonb; o jsonb; i int := 0; j int;
begin
  select m.id into v_module from public.modules m join public.tracks t on t.id = m.track_id
   where t.slug = 'aviyonik' and m.ad = 'FPV ve Betaflight' limit 1;
  if v_module is null then raise notice 'Modül yok, atlanıyor: FPV ve Betaflight'; return; end if;
  if exists (select 1 from public.quizzes where module_id = v_module and zorluk = 'orta') then return; end if;
  insert into public.quizzes (module_id, baslik, gecme_esigi, sira, zorluk)
    values (v_module, 'FPV ve Betaflight Quizi (Orta)', 70, 0, 'orta') returning id into v_quiz;
  for r in select * from jsonb_array_elements($json$[
    {"m":"Betaflight firmware'ı yüklemeden önce mutlaka bilinmesi gereken bilgi hangisidir?","a":"Configurator, karta hangi firmware'ın yükleneceğini target adından seçer (videoda MATEKF405). Yanlış target ile kart çalışmaz.","o":[["Uçuş kontrol kartının target adı",true],["Motorların KV değeri",false],["ESC'lerin akım sınırı",false],["Pervane çapı",false]]},
    {"m":"Firmware yüklerken \"Full chip erase\" seçeneği neden işaretlenir?","a":"Videoda anlatıcı bu seçeneği her zaman açıyor: karttaki eski ayarlar tamamen silinir ve temiz bir kurulumla başlanır.","o":[["Karttaki önceki ayarları tamamen silip temiz kurulum yapmak için",true],["Yükleme işlemini hızlandırmak için",false],["ESC yazılımını da aynı anda güncellemek için",false],["Kumandayı alıcıya eşlemek için",false]]},
    {"m":"Drone arm olmuyor. Nedenini Configurator'da ilk nerede görürsünüz?","a":"Setup sekmesindeki bilgi panelinde arm'ı engelleyen bayraklar listelenir: örneğin RXLOSS (alıcıdan sinyal yok) ve MSP (Configurator bağlı).","o":[["Setup sekmesindeki arm engelleri (arming disable flags) listesinde",true],["Blackbox kayıtlarının ilk satırında",false],["Motors sekmesindeki motor sıcaklıklarında",false],["OSD önizlemesinde",false]]},
    {"m":"Video vericisinin (VTX) SmartAudio kablosu uçuş kontrol kartına bağlandığında ne kazanılır?","a":"SmartAudio sayesinde VTX'in kanalı, frekansı ve gücü uçuş kontrol kartı üzerinden, örneğin OSD menüsünden, değiştirilebilir.","o":[["VTX'in kanal, frekans ve güç ayarı uçuş kontrol kartı üzerinden değiştirilebilir",true],["Görüntü gecikmesi sıfıra iner",false],["Kameranın çözünürlüğü artar",false],["VTX'e ayrı bir pil gerekmez",false]]},
    {"m":"Betaflight'ta Quad X karışımında 1 numaralı motor hangisidir?","a":"Betaflight Quad X sırası: 1 sağ arka, 2 sağ ön, 3 sol arka, 4 sol ön. Motorlar fiziksel olarak bu sıraya uymazsa drone kalkışta takla atar.","o":[["Sağ arka",true],["Sol ön",false],["Sağ ön",false],["Sol arka",false]]},
    {"m":"Telemetri açıldığında kumanda ile drone arasındaki iletişim nasıl değişir?","a":"Telemetri olmadan iletişim tek yönlüdür (kumandadan drone'a). Telemetri ile alıcı pil gerilimi, akım, ESC sıcaklığı gibi verileri kumandaya geri gönderir.","o":[["Çift yönlü olur: alıcı drone'un pil, akım ve sıcaklık gibi verilerini kumandaya geri gönderir",true],["Kumanda komutları iki kat hızlı iletilir",false],["Görüntü kumandanın ekranına aktarılır",false],["Kumanda menzili iki katına çıkar",false]]},
    {"m":"Air Mode için hangisi doğrudur?","a":"Air Mode bir uçuş modu değildir. Gaz sıfıra yakınken bile PID kontrolünü sürdürür; böylece gaz kesilip serbest düşüşe geçildiğinde drone savrulmaz. Freestyle için gereklidir.","o":[["Bir uçuş modu değildir; gaz sıfıra yakınken bile kontrolü sürdürerek dalışta savrulmayı önler",true],["Drone'u sabit irtifada tutan bir uçuş modudur",false],["GPS ile eve dönüşü başlatır",false],["Motorların en yüksek devrini sınırlar",false]]},
    {"m":"Acro Trainer özelliği yeni başlayanlara nasıl yardım eder?","a":"Acro modda uçarken eğim açısı sınırlanır (varsayılan 20 derece). Pilot acro hissine alıştıkça sınır 30, 40 diye artırılır.","o":[["Acro modda eğim açısını sınırlayarak acro hissini güvenli şekilde öğretir",true],["Drone'u kendiliğinden yatay konuma döndürür",false],["Kumandadaki stick hareketlerini kaydedip tekrar oynatır",false],["Motor çıkışını yarıya düşürür",false]]},
    {"m":"Rates ayarındaki Expo değeri artırılırsa ne olur?","a":"Expo, stick ortasına yakın bölgede tepkiyi yumuşatır. Stick uçlarındaki en yüksek dönüş hızı değişmez.","o":[["Stick ortasında tepki yumuşar, uçlardaki en yüksek dönüş hızı değişmez",true],["Tüm stick aralığında dönüş hızı aynı oranda artar",false],["Stick ortasında tepki sertleşir",false],["Drone'un en yüksek hızı sınırlanır",false]]},
    {"m":"OSD'de video formatı (PAL/NTSC) seçerken dikkat edilmesi gereken nedir?","a":"Videoda anlatıcı kamerasını NTSC'ye alıyor ve Betaflight'ta da NTSC seçiyor. Formatlar uyuşmazsa OSD görüntü üzerinde doğru çıkmaz.","o":[["Kameranın formatıyla Betaflight'taki format aynı olmalıdır",true],["Her zaman PAL seçilmelidir, NTSC desteklenmez",false],["Format yalnız gözlükte seçilir, Betaflight'ta ayarı yoktur",false],["Kumandanın protokolüyle aynı olmalıdır",false]]},
    {"m":"Betaflight 4.1 ve sonrasında SmartAudio ile VTX'i kontrol edebilmek için ne yapılmalıdır?","a":"Video Transmitter sekmesine VTX tablosu (bant, kanal ve güç listesi) yüklenmelidir. Videoda tablo üreticinin sitesinden indirilip \"Load from file\" ile yükleniyor.","o":[["Video Transmitter sekmesine VTX'in bant, kanal ve güç tablosunu yüklemek",true],["VTX'in firmware'ını Betaflight ile güncellemek",false],["Receiver sekmesinde kanal sayısını 16'ya çıkarmak",false],["Blackbox'ı kapatmak",false]]},
    {"m":"Bidirectional DShot açıkken Motors sekmesinde hangi durum bir sorun olduğunu gösterir?","a":"Bu sekmede her motorun devri, sıcaklığı ve iletişim hata oranı görünür. Hata oranı sıfırdan farklıysa ESC ile iletişimde sorun var demektir.","o":[["Motorların iletişim hata oranının sıfırdan farklı olması",true],["Motor devirlerinin birbirinden biraz farklı olması",false],["Motor sıcaklığının oda sıcaklığına yakın olması",false],["Pil gerilimi değerinin görünmesi",false]]},
    {"m":"Betaflight 4.x'teki PID kaydırıcıları (slider) ayarı neden kolaylaştırır?","a":"Kaydırıcılar P, I ve D değerlerini aralarındaki oranı koruyarak birlikte değiştirir. Örneğin ana kaydırıcı hepsini birden yükseltir.","o":[["P, I ve D değerlerini aralarındaki oranı koruyarak birlikte değiştirir",true],["En uygun PID değerlerini uçuşta kendiliğinden bulur",false],["Yalnız D değerini değiştirmeye izin verir",false],["PID değerlerini fabrika ayarına kilitler",false]]}
  ]$json$::jsonb) loop
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
   where t.slug = 'aviyonik' and m.ad = 'FPV ve Betaflight' limit 1;
  if v_module is null then raise notice 'Modül yok, atlanıyor: FPV ve Betaflight'; return; end if;
  if exists (select 1 from public.quizzes where module_id = v_module and zorluk = 'zor') then return; end if;
  insert into public.quizzes (module_id, baslik, gecme_esigi, sira, zorluk)
    values (v_module, 'FPV ve Betaflight Quizi (Zor)', 70, 1, 'zor') returning id into v_quiz;
  for r in select * from jsonb_array_elements($json$[
    {"m":"Videodaki kurulumda bidirectional DShot'ı kullanabilmek için hangileri gerekir? (birden çok)","a":"ESC yazılımının (videoda BLHeli_32) bidirectional DShot'ı desteklemesi ve Configuration'a motorun kutup (mıknatıs) sayısının doğru girilmesi gerekir. Videodaki 2508 motorlarda bu sayı 14.","o":[["ESC yazılımının bidirectional DShot'ı desteklemesi",true],["Configuration'da motor kutup (mıknatıs) sayısının doğru girilmesi",true],["Motor Stop seçeneğinin açılması",false],["GPS modülünün bağlı olması",false]]},
    {"m":"F4 işlemcili bir kartta PID döngü frekansını gereğinden yüksek seçmenin sakıncası nedir?","a":"Yüksek döngü frekansı işlemci yükünü çok artırır, drone hiçbir şey yapmazken bile. Betaflight 4.0 bu yüzden 32 kHz desteğini kaldırdı; videoda F4 kart için 4 kHz seçiliyor.","o":[["İşlemci (CPU) yükü çok artar",true],["Motorlar ters yönde dönmeye başlar",false],["Pil hücre sayısı yanlış algılanır",false],["Alıcı ile bağlantı kopar",false]]},
    {"m":"Uçuş kontrol kartı, üzerindeki ok drone'un önünü göstermeyecek şekilde 90 derece döndürülerek takıldı. Doğru çözüm hangisidir?","a":"Configuration'daki board/sensor alignment ile yaw ofseti girilir. Sonra Setup'taki 3B model elle eğilerek yönlerin doğru olduğu kontrol edilir.","o":[["Board/sensor alignment'a yaw ofseti girip Setup'taki 3B modelle doğrulamak",true],["Kumandada roll ve pitch kanallarını ters çevirmek",false],["İvmeölçeri yeniden kalibre etmek",false],["Motor sırasını CLI'dan değiştirmek",false]]},
    {"m":"En büyük arm açısı (max arm angle) 25 derece iken ne olur, 180 yapılırsa ne değişir?","a":"Drone 25 dereceden fazla eğikken arm olmaz. 180 derece yapılırsa drone ters dönmüşken bile arm edilebilir.","o":[["25 dereceden fazla eğikken arm olmaz; 180 yapılırsa ters dönmüşken bile arm edilebilir",true],["Drone uçuşta 25 dereceden fazla eğilemez; 180 yapılırsa sınır kalkar",false],["Kalkışta 25 derecelik bir açıyla yükselir",false],["Kamera açısı 25 derecede sabitlenir",false]]},
    {"m":"Power & Battery'de en yüksek hücre gerilimini 4,2 V yerine 4,3 V yapmanın amacı nedir?","a":"Betaflight hücre sayısını, ölçülen gerilimi en yüksek hücre gerilimine bölerek tahmin eder. Yeni şarj edilmiş pil 4,2 V'u biraz aşarsa 4S pil 5S sanılabilir; 4,3 V bu hatayı önler.","o":[["Yeni şarjlı pil 4,2 V'u biraz aştığında hücre sayısının yanlış (örneğin 4S yerine 5S) algılanmasını önlemek",true],["Pili daha yüksek gerilime şarj edebilmek",false],["Düşük pil uyarısını daha geç almak",false],["Motorlara daha fazla güç vermek",false]]},
    {"m":"Firmware yükledikten sonra ilk bağlantıda Configurator karta özel varsayılan ayarları (custom defaults) yüklemeyi sorar. Videodaki öneri ve nedeni nedir?","a":"Evet denmelidir: sensör hizalaması gibi karta özgü pek çok ayar böylece otomatik gelir. Videodaki kartta 270 derece hizalama bu yolla gelmiş.","o":[["Evet denmeli; sensör hizalaması gibi karta özgü ayarlar otomatik gelir",true],["Hayır denmeli; varsayılanlar PID ayarlarını bozar",false],["Hayır denmeli; önce Blackbox kaydı alınmalı",false],["Fark etmez; bu ayarlar yalnız OSD'yi etkiler",false]]},
    {"m":"CLI'da \"resource\" komutu ne işe yarar ve bir pin yeniden atandıktan sonra ne yapılır?","a":"\"resource\", işlemci pinlerinin hangi işleve atandığını gösterir (örneğin motor 1 C06 pininde). Pin başka işleve atanmışsa çakışma uyarısı çıkar; önce eski atama boşaltılır, sonra \"save\" ile kaydedilip kart yeniden başlatılır.","o":[["Pinlerin hangi işleve atandığını gösterir; çakışan atama boşaltılıp yeni atama \"save\" ile kaydedilir",true],["Kartın işlemci yükünü gösterir; değişiklik kendiliğinden kaydedilir",false],["Yüklü firmware sürümünü gösterir; değişiklik için firmware yeniden yüklenir",false],["Bağlı sensörlerin listesini verir; değişiklik Setup sekmesinden kaydedilir",false]]},
    {"m":"Blackbox ayarları için hangileri doğrudur? (birden çok)","a":"Kayıt sıklığı yükseldikçe hafıza çabuk dolar. Videoda debug modu GYRO_SCALED seçilerek jiroskobun filtrelenmemiş verisi kaydediliyor; bu veri filtre ayarlarının doğru olup olmadığını ölçmeye yarar.","o":[["Kayıt sıklığı arttıkça hafıza daha çabuk dolar",true],["GYRO_SCALED debug modu jiroskobun filtrelenmemiş verisini kaydeder",true],["Blackbox kaydı yalnız GPS bağlıyken çalışır",false],["Kayıt sıklığının hafıza kullanımına etkisi yoktur",false]]},
    {"m":"Jiroskop filtrelerini azaltmadan önce ve sonra hangileri yapılmalıdır? (birden çok)","a":"Filtre çok azaltılırsa motorlar ısınabilir. Değişiklik Blackbox verisine bakılarak yapılmalı; ardından kısa bir uçuş yapılıp motor sıcaklığı kontrol edilmelidir.","o":[["Değişikliği Blackbox verisine bakarak yapmak",true],["Kısa bir uçuştan sonra motor sıcaklığını kontrol etmek",true],["Filtreleri tamamen kapatıp gecikmeyi sıfırlamak",false],["Değişiklikten sonra ivmeölçeri yeniden kalibre etmek",false]]},
    {"m":"RSSI bilgisi alıcıdan bir AUX kanal üzerinden geliyorsa Configuration'daki \"RSSI ADC\" seçeneği ne olmalıdır?","a":"RSSI ADC yalnız alıcıdan uçuş kontrol kartına ayrı bir RSSI kablosu çekildiğinde açılır. RSSI bir kanal üzerinden geliyorsa kapalı kalır.","o":[["Kapalı kalmalı; ayrı bir RSSI kablosu yoksa gerekmez",true],["Açılmalı; RSSI her zaman ADC üzerinden okunur",false],["Açılmalı ve AUX kanal kapatılmalı",false],["Seçenek yalnız GPS bağlıyken önemlidir",false]]}
  ]$json$::jsonb) loop
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
