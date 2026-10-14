-- Pixhawk serisinin kalan videoları: U9WKzmjVDMU, VPeI6mjpZR4, gN57quvwwiw (transkript);
-- k2NFJGoWA3s, H6qiBPHNrd0, 9TdZIU6VYRY, 89qBadP0iEU, jtKLGYdLT4E (yalnız kanal açıklaması). Transkript (İngilizce çeviri)
-- ve açıklama metni kaynak alındı; her sorunun zaman damgası ve kanıt cümlesi aşağıdaki yorumlardadır.
-- Mevcut orta/zor quizlere (Uçuş Kontrol & Kurulum, Aktüatör ve Haberleşme, İHA Elektronik Sistemleri) EKLENİR. Idempotent: aynı soru metni varsa atlanır.

begin;

-- U9WKzmjVDMU 00:37: We do not connect the controller to the SBUS, we connect it to the RC in.
-- U9WKzmjVDMU 03:48: Now you're taking out the card first... then within 30 seconds you need to insert the card again.
-- U9WKzmjVDMU 15:38: Your flight card must be at the center of the frame... passing a thread to opposing motors or by determining the intersection point of approximately opposing motors.
-- VPeI6mjpZR4 00:28: The connector type to connect to the battery is XT60. Since the battery output I use is XT90, let's start by changing this connector first.
-- gN57quvwwiw 04:53: the pitch axis should be working reverse. If it was working normally... we would have to reverse the pitch output from the controller.
-- gN57quvwwiw 05:27: it says us to notice that the receiver and transmitter are turned on and that the propellers are not mounted to motors.
-- gN57quvwwiw 01:17: The main purpose of my use of this is that if an accident occurs and the battery does not fell off the drone... this device will start to give a warning sound.
-- jtKLGYdLT4E açıklama: Açıklama: rtos Real time operating system... Daha önce hangi işletim sistemi kullanıyordu? (nuttx)
do $q$
declare v_quiz uuid; v_q uuid; v_sira int; r jsonb; o jsonb; j int;
begin
  select z.id into v_quiz from public.quizzes z join public.modules m on m.id = z.module_id
   where m.ad = 'Uçuş Kontrol & Kurulum' and z.zorluk = 'orta' limit 1;
  if v_quiz is null then raise notice 'Quiz yok, atlanıyor: Uçuş Kontrol & Kurulum orta'; return; end if;
  select coalesce(max(sira), 0) into v_sira from public.questions where quiz_id = v_quiz;
  for r in select * from jsonb_array_elements($json$[{"m":"Kumanda alıcısının sinyal kablosu Pixhawk üzerinde hangi girişe bağlanır?","a":"Kartın arka tarafındaki SBUS çıkışına kumanda bağlanmaz; alıcı RC IN'e takılır.","o":[["RC IN girişine (SBUS OUT çıkışına değil)",true],["SBUS OUT çıkışına",false],["MAIN OUT girişine",false],["TELEM 1 girişine",false]]},{"m":"Mission Planner'da firmware yüklenirken kart ne zaman çıkarılıp tekrar takılır?","a":"Firmware indirilip yüklenirken kartın bağlantısı kesilir; bu işlem sırasında sesli ve yazılı uyarı verilene kadar kart çıkarılmaz.","o":[["Model seçilip onay verildikten sonra kart çıkarılır, OK denir ve 30 saniye içinde tekrar takılır",true],["Yükleme bittikten sonra pil çıkarılır",false],["Hiç çıkarılmaz, yükleme otomatik başlar",false],["Önce kart sıfırlanır, sonra Connect'e basılır",false]]},{"m":"Uçuş kartının çerçevedeki konumu nasıl belirlenir?","a":"Uçuş kartının çerçeve merkezinde olması gerekir.","o":[["Karşılıklı motorlar arasına iplik gerip kesişim noktası bulunarak, kart çerçevenin merkezine yerleştirilir",true],["Kart pilin yanına konur",false],["Kart herhangi bir kola takılır",false],["GPS'in tam altına monte edilir",false]]},{"m":"Videodaki güç modülünün pile bağlanan konnektörü hangi tiptir?","a":"Yazarın pili XT90 olduğu için güç modülünün konnektörünü değiştirmiştir.","o":[["XT60",true],["XT90",false],["Deans (T)",false],["JST",false]]},{"m":"Radio calibration ekranında pitch ekseni için videoda hangi uyarı yapılır?","a":"Mission Planner'daki çubuk yönü kumandanın pitch yönüne göre kontrol edilir.","o":[["Pitch kanalının ters çalışması gerekir; normal çalışıyorsa kumandadan pitch çıkışı reverse edilmelidir",true],["Pitch kanalı hiç kalibre edilmez",false],["Pitch ve roll yer değiştirir",false],["Yalnızca throttle kalibre edilir",false]]},{"m":"Radio calibration başlamadan önce hangi güvenlik uyarısı verilir?","a":"Kalibrasyon sırasında motorlara sinyal gittiğinden pervane takılı olmaz.","o":[["Alıcı ve verici açık olmalı, pervaneler motorlara takılı olmamalı",true],["Pil çıkarılmalı",false],["Pervaneler takılı olmalı",false],["GPS kapalı olmalı",false]]},{"m":"Videodaki düşük gerilim alarm modülünün yazar için asıl kullanım amacı nedir?","a":"Uçuşta pili zaten telemetriden izliyor; modül kaza sonrası bulma amacıyla kullanılıyor.","o":[["Kazadan sonra drone'u bulmayı kolaylaştırmak (bir süre sonra uyarı sesi vermesi)",true],["Uçuş sırasında pili izlemek",false],["Motor hızını ayarlamak",false],["GPS fix süresini kısaltmak",false]]},{"m":"Pixhawk 2.4.8'in ChibiOS'a geçişini anlatan videoda eski işletim sistemi hangisi olarak anılır?","a":"Video RTOS'un (gerçek zamanlı işletim sistemi) ne olduğunu ve NuttX'ten ChibiOS'a geçişin artılarını anlatır.","o":[["NuttX",true],["FreeRTOS",false],["Linux",false],["Windows CE",false]]}]$json$::jsonb) loop
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

-- U9WKzmjVDMU 01:53: This module converts the data coming from all channels into a different coding format so that it can be transferred over a single cable.
-- U9WKzmjVDMU 05:04: If ours were plus type, i.e. if the stationary engine was in the front and rear, we would choose it, but we choose it because it is on the sides.
-- U9WKzmjVDMU 06:15: Now it wants us to put the flight card on the left side... right side... nose is down... nose is going to stay up... on its back.
-- U9WKzmjVDMU 13:57: any loosening here will be reflected directly on the flight card as vibration.
-- VPeI6mjpZR4 02:36: We need to install the black cable on the top so that the white cable is at the bottom... I install the escs appropriately to the numbers underneath the main out.
-- VPeI6mjpZR4 03:52: I2c is the link we use to transfer the data from slow sensors to the flight card... There is only one socket... this is called the i2c board.
-- VPeI6mjpZR4 09:01: The six-pin one is the gps cable, which is wider. If it is shorter, smaller and has four pins, the cable is for the compass. We connect this to i2c.
-- VPeI6mjpZR4 08:43: The intersection of the front arrow of our flight card and the front arrow of the GPS... the flight card is showing this direction, and now I will mount the GPS so that it will show that side.
-- VPeI6mjpZR4 11:46: This MHz-value telemetry has no effect on the working distance. A second value is the miliwatt value. This value indicates the power of the telemetry module... The vast majority... is 100mW.
-- VPeI6mjpZR4 13:09: I will use telemetry devices... which sends telemetry information to the controller. This will only provide a one-way flow... I will connect it separately to the telemetry1 module.
-- gN57quvwwiw 07:01: I'm taking the power arm to the end for ESC calibration. Then I plug in the battery... I remove the battery connection... connect again... hold down the security button... power from zero to full.
-- gN57quvwwiw 09:08: the compass1, the external compass... Compass2 is the compass in the flight card itself... if the compasses give an error about the incompatibility, I will turn off the compass of the flight card.
-- gN57quvwwiw 10:17: I do not recommend doing this calibration work in the house. Especially when the computer and wifi exist, it can cause problems in areas with electromagnetic intensity.
-- gN57quvwwiw 10:48: Calibration is complete. You see the warning 'Please restart your flight card.' I say okay. Then I cut off the flight card's power.
-- gN57quvwwiw 12:00: when we give the motors power, the compass may makes certain disturbances... I enter optional hardware and then compass/motor calibration... I slowly increased it to full throttle.
-- gN57quvwwiw 13:39: Namely A right, it starts with the frontmost motor, clockwise B, C, D, E, F.
-- gN57quvwwiw 17:51: In all multicopters, even if only one propeller is mounted reverse, and the multicopter will roll over directly.
do $q$
declare v_quiz uuid; v_q uuid; v_sira int; r jsonb; o jsonb; j int;
begin
  select z.id into v_quiz from public.quizzes z join public.modules m on m.id = z.module_id
   where m.ad = 'Uçuş Kontrol & Kurulum' and z.zorluk = 'zor' limit 1;
  if v_quiz is null then raise notice 'Quiz yok, atlanıyor: Uçuş Kontrol & Kurulum zor'; return; end if;
  select coalesce(max(sira), 0) into v_sira from public.questions where quiz_id = v_quiz;
  for r in select * from jsonb_array_elements($json$[{"m":"SBUS çıkışı olmayan bir alıcıyla Pixhawk kullanılırken PPM encoder modülü neden gerekir?","a":"Her kanal için ayrı kablo Pixhawk'ta desteklenmez; PPM encoder kanalları tek kabloda birleştirir.","o":[["Pixhawk RC girişi tek sinyal kablosu kabul eder; modül tüm kanalları tek kablo üzerinden aktarılacak şekilde kodlar",true],["Alıcının menzilini artırmak için",false],["Alıcıyı pilden beslemek için",false],["Telemetri hızını yükseltmek için",false]]},{"m":"Frame type seçerken videodaki hekzakopter için neden 'plus' yerine hexa (X) seçilmiştir?","a":"Ön ve arkada sabit motor olsaydı plus seçilirdi; motorlar yanlarda olduğundan hexa seçilir.","o":[["Motorlar ön ve arka eksende değil, yanlarda (çapraz) konumlandığı için",true],["Pervane sayısı daha fazla olduğu için",false],["GPS yan tarafta olduğu için",false],["Pixhawk plus tipini desteklemediği için",false]]},{"m":"Calibrate accel sırasında kart hangi konumlara getirilir?","a":"Mission Planner her adımda bir konum ister; her konumda 'Click when done' denir ve altı konumdan sonra kalibrasyon biter.","o":[["Düz, sol yan, sağ yan, burun aşağı, burun yukarı, ters (sırtüstü)",true],["Yalnızca düz ve ters",false],["Düz, 45° sağ, 45° sol",false],["Yalnızca dört yan konum",false]]},{"m":"Anti-vibration plakasının vidalarının gevşemesi neden önemlidir?","a":"Yazar vidaları somunlarla ve ek somunla sıkıp damla sabitleyici kullanarak gevşemeyi önler.","o":[["Gevşeme doğrudan uçuş kartına titreşim olarak yansır, bu yüzden somunlar ve sabitleyici kullanılır",true],["Vidalar kart devresine zarar verir",false],["GPS sinyali zayıflar",false],["Pil ömrü kısalır",false]]},{"m":"ESC sinyal kabloları Pixhawk'ın MAIN OUT soketine takılırken kablo yönü nasıl olmalıdır?","a":"ESC'ler MAIN OUT altındaki numaralara göre bağlanır; kablo yönüne dikkat edilir.","o":[["Siyah kablo üstte, beyaz kablo altta",true],["Beyaz kablo üstte, siyah kablo altta",false],["Kırmızı kablo üstte",false],["Yön fark etmez",false]]},{"m":"I2C board neden kullanılır?","a":"I2C yavaş sensör verilerini (pusula, LED durumu) uçuş kartına taşır; board bir soketi birkaç cihaza böler.","o":[["Kartta tek I2C soketi olduğu için pusula, LED gibi birden çok yavaş sensörü bağlamak amacıyla soketi çoğaltır",true],["Motor hızını artırır",false],["Telemetri menzilini uzatır",false],["GPS verisini hızlandırır",false]]},{"m":"GPS modülünden çıkan iki kablodan hangisi hangi sokete bağlanır?","a":"GPS verisi GPS soketinden, harici pusula verisi I2C'den alınır.","o":[["6 pinli geniş kablo GPS soketine, 4 pinli küçük kablo (pusula) I2C'ye",true],["6 pinli kablo I2C'ye, 4 pinli kablo GPS soketine",false],["İkisi de TELEM 2'ye",false],["İkisi de MAIN OUT'a",false]]},{"m":"GPS modülü çerçeveye monte edilirken yön nasıl olmalıdır?","a":"Yanlış yönlendirilmiş GPS/pusula araç yönünü yanlış algılatır.","o":[["GPS üzerindeki ön ok, uçuş kartının ön oku ile aynı yönü göstermelidir",true],["Ok aşağı bakmalıdır",false],["Yön önemli değildir",false],["Ok arkaya bakmalıdır",false]]},{"m":"Telemetri modülü seçerken MHz ve mW değerleri için videoda ne söylenir?","a":"433 ve 915 MHz seçenekleri vardır; satılanların çoğu 100 mW'tır, 500 mW'lık sürümler de bulunur.","o":[["MHz yalnızca çalışma frekansıdır, mesafeyi etkilemez; mW modülün gücüdür ve uzun mesafe için önemlidir",true],["MHz değeri yükseldikçe menzil artar",false],["mW değeri yalnızca pil ömrünü belirler",false],["İkisinin de menzile etkisi yoktur",false]]},{"m":"Videoda TELEM 1 ve TELEM 2 portları nasıl paylaştırılır?","a":"Tek yönlü veri akışı yeterli cihazlar TELEM 2'ye, komut gönderilen yer istasyonu bağlantısı TELEM 1'e bağlanır.","o":[["TELEM 2: yalnızca uçuş kartından bilgi alan cihazlar (PRM02, LED); TELEM 1: bilgisayar/telefon ile iki yönlü yer istasyonu bağlantısı",true],["TELEM 1: LED'ler, TELEM 2: yer istasyonu",false],["İkisi de yalnızca GPS içindir",false],["TELEM 2 yalnızca ESC içindir",false]]},{"m":"Videodaki ESC kalibrasyonu hangi sırayla yapılır?","a":"LED yanıp sönme düzeni değişir; son adımda tüm motorlar eş zamanlı ve senkron döner.","o":[["USB çıkarılır, gaz tam yukarı alınır, pil takılır, pil çıkarılıp tekrar takılır, güvenlik butonu basılı tutulur, gaz sıfırdan tama çıkarılır",true],["Pil takılır, gaz sıfırda tutulur, USB bağlanır, buton basılır",false],["Yalnızca Mission Planner'da Calibrate ESC'ye basılır",false],["Pervaneler takılıyken gaz tam açılır",false]]},{"m":"Videoya göre uçuşta pusulalar uyumsuzluk hatası verirse hangi pusula kapatılır ve neden?","a":"Compass1 harici, Compass2 kart üzerindedir; kartın pusulası elektriksel parazitten etkilenebilir.","o":[["Uçuş kartının kendi pusulası; kart pil ve kabloların arasında olduğu için hatalı olabilir",true],["Harici pusula; GPS ile çakıştığı için",false],["İkisi de açık kalır",false],["Hiçbiri kapatılmaz",false]]},{"m":"Pusula kalibrasyonu için neden açık alan önerilir?","a":"Kalibrasyonda kart altı eksende yaklaşık 2 saniyeliğine döndürülür.","o":[["Bilgisayar ve Wi-Fi gibi kaynakların yarattığı elektromanyetik yoğunluk kalibrasyonu bozabilir",true],["İç mekanda GPS çalışmaz",false],["Pil açık alanda daha az ısınır",false],["Mission Planner iç mekanda bağlanmaz",false]]},{"m":"Onboard mag calibration tamamlandığında ne yapılmalıdır?","a":"Pusula kalibrasyonu kartın yeniden başlatılmasıyla tamamlanır.","o":[["Uyarı üzerine kartın gücü kesilip yeniden bağlanmalıdır",true],["Hemen uçuşa geçilir",false],["Pervaneler takılır",false],["Firmware yeniden yüklenir",false]]},{"m":"Compass/Motor calibration neden yapılır ve nasıl uygulanır?","a":"Initial Setup > Optional Hardware > Compass/Motor Calibration bölümünde yapılır.","o":[["Motorlar çalışırken pusuladaki parazitleri hesaba katmak için; gaz yavaşça tam gaza çıkarılıp Finish denir",true],["Motor yönlerini değiştirmek için",false],["ESC'leri kalibre etmek için",false],["GPS'i hızlandırmak için",false]]},{"m":"Mission Planner motor testinde motorlar nasıl adlandırılır?","a":"Motor testinde her motora sırayla %20 güç verilerek doğru sırayla çalıştıkları ve yönlerinin doğru olduğu kontrol edilir.","o":[["A en öndeki motordur, saat yönünde B, C, D, E, F diye devam eder",true],["1'den 6'ya soldan sağa",false],["A en arkadaki motordur, saat yönünün tersine",false],["Yalnızca CW ve CCW olarak",false]]},{"m":"Çok rotorlu araçta yalnızca bir pervane ters takılırsa ne olur?","a":"CW ve CCW pervaneler farklı eğimlidir; doğru motora takılmaları şarttır.","o":[["Araç doğrudan devrilir",true],["Hafifçe sola kayar",false],["Yalnızca verimi düşer",false],["Hiçbir etkisi olmaz",false]]}]$json$::jsonb) loop
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

-- k2NFJGoWA3s açıklama: Açıklama: TCP üzerinden yapılan ve 57600 band genişliğinde çalışan sistemin çekim alanı telemetriye göre biraz daha sınırlı olsa da...
-- k2NFJGoWA3s açıklama: Açıklama: harici bir ekipman kullanmadan doğrudan bilgisayarın veya cep telefonunun wifi özelliğini kullanarak yer istasyonuna bağlanmak mümkün olacak.
-- H6qiBPHNrd0 açıklama: Açıklama: andruav programı kullanımını kolaylaştırmak amacıyla kullandığım bluetooth modülü HC05...
do $q$
declare v_quiz uuid; v_q uuid; v_sira int; r jsonb; o jsonb; j int;
begin
  select z.id into v_quiz from public.quizzes z join public.modules m on m.id = z.module_id
   where m.ad = 'Aktüatör ve Haberleşme' and z.zorluk = 'orta' limit 1;
  if v_quiz is null then raise notice 'Quiz yok, atlanıyor: Aktüatör ve Haberleşme orta'; return; end if;
  select coalesce(max(sira), 0) into v_sira from public.questions where quiz_id = v_quiz;
  for r in select * from jsonb_array_elements($json$[{"m":"Pixhawk'a bağlanan Wi-Fi modülü hangi protokol ve baud hızıyla çalışır, menzili telemetriye göre nasıldır?","a":"Videonun açıklamasında TCP, 57600 band genişliği ve telemetriye göre sınırlı çekim alanı belirtilir.","o":[["TCP üzerinden 57600 baud; menzil telemetriye göre biraz daha sınırlıdır",true],["UDP üzerinden 115200 baud; menzil telemetriden fazladır",false],["TCP üzerinden 9600 baud; menzil aynıdır",false],["Bluetooth SPP üzerinden 38400 baud",false]]},{"m":"Uçuş kartına Wi-Fi modülü bağlamanın sağladığı avantaj nedir?","a":"Wi-Fi modülü yer istasyonu bağlantısını kolaylaştırır; menzili telemetriye göre sınırlıdır.","o":[["Ek bir ekipman gerekmeden bilgisayar veya telefonun Wi-Fi'siyle yer istasyonuna bağlanılır, uçuş öncesinde zaman kazandırır",true],["Menzili telemetriden çok daha uzun yapar",false],["GPS doğruluğunu artırır",false],["ESC kalibrasyonunu otomatik yapar",false]]},{"m":"Videoda HC-05 Bluetooth modülü ne amaçla kullanılmıştır?","a":"HC-05'in ayarları yapılıp uçuş kartına bağlanır; yer istasyonu veya Andruav üzerinden kullanılır.","o":[["Andruav programını ve yer istasyonu bağlantısını kolaylaştırmak için",true],["GPS konumunu iyileştirmek için",false],["ESC kalibrasyonu için",false],["Video aktarmak için",false]]}]$json$::jsonb) loop
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

-- 9TdZIU6VYRY açıklama: Açıklama: minimosd extra yazılımını kullanarak miniosd'nin mümkün olduğunca kişiselleştirilebilmesi için gereken ayarları... FTDI Tool ekipmanı...
-- 89qBadP0iEU açıklama: Açıklama: kamera (SJ7 star) video gönderici ve alıcı (2000mW BOSCAM ts582000 - eachine ev800) bağlantıları...
do $q$
declare v_quiz uuid; v_q uuid; v_sira int; r jsonb; o jsonb; j int;
begin
  select z.id into v_quiz from public.quizzes z join public.modules m on m.id = z.module_id
   where m.ad = 'İHA Elektronik Sistemleri' and z.zorluk = 'orta' limit 1;
  if v_quiz is null then raise notice 'Quiz yok, atlanıyor: İHA Elektronik Sistemleri orta'; return; end if;
  select coalesce(max(sira), 0) into v_sira from public.questions where quiz_id = v_quiz;
  for r in select * from jsonb_array_elements($json$[{"m":"Videoda MiniOSD'nin ayarları hangi yazılım ve araçla yapılır?","a":"MiniOSD genelde ayarsız da çalışır ama uçuş anındaki bilgiler için kişiselleştirilmesi önemlidir.","o":[["MinimOSD Extra yazılımı ve FTDI aracıyla",true],["Betaflight Configurator ve USB hub ile",false],["Yalnızca Mission Planner Full Parameter List ile",false],["Kumandadan menüyle",false]]},{"m":"Videodaki FPV sisteminin ana parçaları hangileridir? (birden çok)","a":"MiniOSD'nin Pixhawk ile bağlantısından sonra kamera, video vericisi ve alıcısı kurulur.","o":[["SJ7 Star kamera",true],["BOSCAM TS582000 (2000 mW) video göndericisi",true],["Eachine EV800 video alıcısı",true],["HC-05 Bluetooth modülü",false]]}]$json$::jsonb) loop
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
