-- Evde Elektronik serisi altyazıları: U2hcYfQbAv8 (#1), -1agE4RSpiQ (#6 Breadboard), BlDvU7xjxps (#8 Direnç, yalnızca ilk ~7 dk; videoda yoğun reklam nedeniyle kalanı toplanamadı).
-- Kaynak: oynatıcının otomatik Türkçe altyazısı (hızlı oynatılıp toplandı; ASR hataları olabilir).
-- Her sorunun kaynak video id ve altyazıdan alıntısı aşağıdaki yorumlardadır.
-- Temel Elektronik orta/zor quizlerine EKLENİR. Idempotent: aynı soru metni varsa atlanır.

begin;

-- U2hcYfQbAv8 kaynak: elektronik parçaların genel çalışma prensiplerini, kullanım şekillerini, teknik verilerini çok fazla formüllere ve karışık hesaplamalara girmeden basit ve anlaşılır şekilde incelemeye çalışacağım... Arduino gibi kontrol mekanizmaları kullanarak akıllı projeler.
-- U2hcYfQbAv8 kaynak: programlanabilir mikro işlemcim Arduino Uno ve küçük kardeşleri Arduino Nano ve Arduino Pro Mini; Pro Mini'yi programlamak için USB-TTL dönüştürücü; devre tasarımı için breadboard ve jumper kablolar; transistörler ve MOSFET'ler; 5 volt voltaj düzenleyici 7805; ledler, dirençler, butonlar, diyotlar, kapasitörler, ışığa duyarlı dirençler (LDR); 7 transistörü birleştiren ULN2003A; röle.
-- -1agE4RSpiQ kaynak: breadboard birbirlerine geçmeli şekilde üretiliyor... her beşli grubu birbirine bağlayan bağlantı noktaları ve çevrede uzun güç hatları... üst ve alt beşli gruplar arasındaki boşluk üstteki ve alttaki grupları birbirinden ayırıyor.
-- -1agE4RSpiQ kaynak: potu breadboard'un orta kısmına taktım, yanına bir led taktım... potun bir bacağıyla ledin bir bacağını birleştirdim... artı hattından gelen elektrik önce pota giriyor ardından tek bacaktan çıkıp kablo aracılığıyla ledin bir bacağına giriyor, diğer bacağından eksi uca... pot üzerindeki direnç değeri değiştikçe ledin yanma şiddeti değişiyor.
-- -1agE4RSpiQ kaynak: deneme yaptığımız devreyi bitirdik, parçaların hiçbiri zarar görmedi, hepsini bir bir çıkararak farklı bir devrede kullanmak için saklayabiliriz. Aynı işi lehimle yapmaya kalksaydık hem çok zaman gidecekti hem de parçaların tekrar kullanımı problem olacaktı.
-- BlDvU7xjxps kaynak: dirençler temel olarak devreden geçen akım miktarını sınırlandırmaya yarayan devre elemanlarıdır, bunu fazlalık akımı ısı enerjisine çevirerek yaparlar. Üzerinden geçecek akım miktarına göre çeyrek watt, yarım watt, 1 watt gibi modelleri vardır. Ohm ölçü birimi ile ölçülür.
-- BlDvU7xjxps kaynak: 100 ohmluk direnç takınca led 6,1 mA çekiyor, direnci 150 ohm yaptım led 4,2 mA... direncin ohm değeri arttıkça devreden geçmesine izin verdiği akım miktarı azalıyor.
-- BlDvU7xjxps kaynak: dirençlerin renk kodlarını ezberlemek yerine cep telefonlarında ve internette bu hesaplamaları yapan uygulamalar var; ayrıca multimetre ile de doğrudan direncin değerini ölçebiliyoruz.
do $q$
declare v_quiz uuid; v_q uuid; v_sira int; r jsonb; o jsonb; j int;
begin
  select z.id into v_quiz from public.quizzes z join public.modules m on m.id = z.module_id
   where m.ad = 'Temel Elektronik' and z.zorluk = 'orta' limit 1;
  if v_quiz is null then raise notice 'Quiz yok, atlanıyor: Temel Elektronik orta'; return; end if;
  select coalesce(max(sira), 0) into v_sira from public.questions where quiz_id = v_quiz;
  for r in select * from jsonb_array_elements($json$[{"m":"Evde Elektronik serisinin yaklaşımı videoda nasıl anlatılır?","a":"Seri, elektronikte temelden başlamak isteyenlere yöneliktir.","o":[["Parçaların çalışma prensiplerini ve kullanımını formüllere fazla girmeden, basit ve anlaşılır biçimde anlatmak; Arduino ile akıllı projeler yapmak",true],["Yalnızca ileri düzey matematiksel devre analizi",false],["Yalnızca endüstriyel otomasyon",false],["Yalnızca lehim teknikleri",false]]},{"m":"Videoda başlangıç için tanıtılan parçalar arasında hangisi yer almaz?","a":"Parçaların hepsine baştan sahip olmak gerekmez; yöntem ve maliyet sonraki videoda anlatılır.","o":[["Step-up konvertör ve OLED ekran",true],["Arduino Uno, Nano ve Pro Mini",false],["Breadboard ve jumper kablolar",false],["7805 gerilim regülatörü, LDR ve ULN2003A",false]]},{"m":"Breadboard'un iç bağlantı yapısı videoda nasıl anlatılır?","a":"Birden çok breadboard geçmeli yapı sayesinde birleştirilebilir.","o":[["Beşerli gruplar halinde birbirine bağlı sıralar ve kenarlarda uzun güç hatları vardır; ortadaki boşluk üst ve alt grupları ayırır",true],["Tüm delikler birbirine bağlıdır",false],["Yalnızca kenar hatları bağlıdır",false],["Her delik ayrı bir devredir",false]]},{"m":"Videodaki ilk devrede potansiyometre ne işe yarar?","a":"Güç kaynağı gerilimi yükseltildikçe LED daha parlak yanar.","o":[["Direnç değeri değiştirilerek LED'in parlaklığını (üzerinden geçen akımı) ayarlar",true],["LED'i yakıp söndürür, parlaklık değişmez",false],["Gerilimi sabit tutar",false],["Yalnızca devreyi korur",false]]},{"m":"Videoya göre breadboard'un asıl avantajı nedir?","a":"Bir sonraki videoda multimetre kullanımı anlatılır.","o":[["Deneme devreleri lehimsiz ve hızlı kurulur, değişiklik kolaydır, parçalar zarar görmeden yeniden kullanılabilir",true],["Daha az akım çeker",false],["Devreyi kalıcı hale getirir",false],["Parçaları daha güvenli lehimler",false]]},{"m":"Videoya göre direncin temel görevi ve çeşitleri nedir?","a":"İç yapılarında genelde karbon silindir veya karbon film bulunur; birimi ohmdur.","o":[["Devreden geçen akımı sınırlar, fazlasını ısıya çevirir; güç değerine göre çeyrek, yarım, 1 watt gibi modelleri vardır",true],["Akımı artırır ve gerilimi yükseltir",false],["Yalnızca gerilimi depolar",false],["Akımı hiç etkilemez",false]]},{"m":"Aynı gerilimde direncin ohm değeri artırılırsa devreden geçen akım nasıl değişir?","a":"Ohm yasasına göre sabit gerilimde akım direnç arttıkça düşer.","o":[["Azalır (örnekte 100 ohmda 6,1 mA iken 150 ohmda 4,2 mA)",true],["Artar",false],["Değişmez",false],["Önce artar sonra azalır",false]]},{"m":"Direnç değerini okumak için videoda hangi yöntemler söylenir?","a":"Direnç değeri üzerlerine çekilen renkli çizgilerle gösterilir.","o":[["Renk kodu tablosu, bu hesabı yapan uygulamalar veya multimetreyle ölçüm",true],["Yalnızca renk kodunu ezberlemek zorunludur",false],["Yalnızca direncin boyutuna bakmak",false],["Yalnızca osiloskop",false]]}]$json$::jsonb) loop
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

-- U2hcYfQbAv8 kaynak: devrelerde kolay kullanım için 7 transistörü birleştiren ULN2003A ... röle yüksek voltaj veya akımları kontrol edebilmek için kullanacağız... Pro Mini'yi programlamak için USB'den TTL dönüştürücü.
-- -1agE4RSpiQ kaynak: güç kaynağının gerilimini 12 volta kadar yükselttik, ledim daha aydınlık yanmaya başladı... ledden ve pottan kıvılcım gördüm ve duman çıkıyor, bu led patladı. Bu seferki ledim patlamasın diye araya bir direnç koyacağız.
-- -1agE4RSpiQ kaynak: ışığa duyarlı direnç transistörün geçirgenlik miktarını ayarlayacak... PNP türü bir transistör: sol bacak emiter, en sağ bacak kolektör; kolektör her zaman yüke bağlanır, emiter güç kaynağının ilgili bacağına, PNP için artı bacağına bağlanır... PNP transistörlerde baz eksiye bağlanmalı.
-- -1agE4RSpiQ kaynak: yanlış olan parçayı hiçbir zorluk olmadan hemen yerinden çıkarıp doğru parçayla değiştirebilirim... direnci hemen yerinden söktüm ve aradaki bağlantıyı bir jumper kabloyla sağladım... bu defa ışığa duyarlı direncin üstündeki değişken ışık hemen lede yansıyor.
-- BlDvU7xjxps kaynak: dirençleri birbirine paralel bağlayarak iki direncin ayrı ayrı verdiği akımın toplamını elde ettik... seri bağladığımız zaman direnç değerlerini birbirine eklemiş oluyoruz, devreden daha az akım (2,6 mA) geçti.
-- BlDvU7xjxps kaynak: 5 mm kırmızı led ideal voltajı olan 2,1 voltta 20 mA akım çekiyor; güç kaynağı 2,7 volta çıkınca 100 mA çekti; 5 voltluk USB gibi bir çıkıştan güç alırsak led bozuldu ve üzerinden 1 amper akım geçiyor.
do $q$
declare v_quiz uuid; v_q uuid; v_sira int; r jsonb; o jsonb; j int;
begin
  select z.id into v_quiz from public.quizzes z join public.modules m on m.id = z.module_id
   where m.ad = 'Temel Elektronik' and z.zorluk = 'zor' limit 1;
  if v_quiz is null then raise notice 'Quiz yok, atlanıyor: Temel Elektronik zor'; return; end if;
  select coalesce(max(sira), 0) into v_sira from public.questions where quiz_id = v_quiz;
  for r in select * from jsonb_array_elements($json$[{"m":"Videodaki parçalardan hangisi yüksek voltaj/akımları düşük seviyeli bir kontrol devresiyle anahtarlamak için ve hangisi Pro Mini'yi programlamak için kullanılır?","a":"ULN2003A, tek kılıfta 7 transistör içeren bir sürücü entegresidir.","o":[["Röle yüksek voltaj/akım anahtarlamak için; USB-TTL dönüştürücü Pro Mini'yi programlamak için",true],["7805 yüksek akım anahtarlamak için; LDR programlamak için",false],["Breadboard anahtarlamak için; jumper programlamak için",false],["Diyot anahtarlamak için; buton programlamak için",false]]},{"m":"Videodaki ilk deneyde LED neden patlar ve ikinci devrede ne değişir?","a":"LED'ler akım sınırlama olmadan yüksek gerilimde hızla bozulur.","o":[["Gerilim 12 V'a çıkarılıp LED akım sınırlayıcı bir dirençsiz sürüldüğü için patlar; ikinci devrede LED'e seri direnç konur",true],["LED ters bağlandığı için patlar; ikinci devrede LED'siz çalışılır",false],["Breadboard bozuk olduğu için patlar",false],["Pot çok düşük dirençte olduğu için hiçbir şey olmaz",false]]},{"m":"Videodaki ikinci devrede PNP transistörün bağlantısı nasıl yapılır?","a":"Bazda akım olmadığında transistör kapalıdır ve LED yanmaz.","o":[["Emiter güç kaynağının artı hattına, kolektör yüke (LED), baz ise (LDR üzerinden) eksiye bağlanır",true],["Emiter yüke, kolektör artı hatta, baz artıya bağlanır",false],["Kolektör toprağa, emiter bazla birleşir",false],["Üç bacak da artı hatta bağlanır",false]]},{"m":"Videodaki ikinci devrede LED parlaklığı LDR'ye tepki vermediğinde ne yapılır?","a":"Yazar bu devrenin 'pek doğru bir devre olmadığını', yalnızca örnek olduğunu belirtir.","o":[["LED'e seri takılan direnç sökülüp yerine jumper kablo takılır; bu sayede LDR'deki ışık değişimi LED'e yansır",true],["Transistör PNP'den NPN'e çevrilir",false],["Breadboard değiştirilir",false],["Pil çıkarılır",false]]},{"m":"Dirençlerin paralel ve seri bağlanmasının etkisi videoda nasıl gösterilir?","a":"Örnekte seri bağlantıda geçen akım 2,6 mA'e düşmüştür.","o":[["Paralelde ayrı ayrı akımların toplamı geçer (akım artar); seri bağlamada direnç değerleri toplanır ve akım azalır",true],["Paralelde akım azalır; seride artar",false],["İkisinde de akım aynı kalır",false],["Seri bağlamada dirençler birbirini sıfırlar",false]]},{"m":"Videodaki LED deneyinde gerilim yükseltildikçe ne olur?","a":"2 voltluk bir LED'i 5 voltluk kaynağa bağlamak için akımı sınırlayan direnç gerekir.","o":[["Ideal 2,1 V'ta 20 mA çeken LED, 2,7 V'ta 100 mA, 5 V'ta 1 A çeker ve bozulur",true],["LED akımı sabit kalır",false],["LED daha az akım çeker",false],["LED 5 V'ta daha uzun ömürlü olur",false]]}]$json$::jsonb) loop
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
