-- Drone Programlama, Emrehan İnci serisinin 3. ve 4. videosu altyazıları: LS_24cvTFRg (Kullanılacak programlar), ayDVGnf2BvQ (Sanal makineye Ubuntu kurulumu). 5-10. videolar (kurulum ve kod uygulamaları) henüz eklenmedi.
-- Kaynak: oynatıcının otomatik Türkçe altyazısı (hızlı oynatılıp toplandı; ASR hataları olabilir).
-- Her sorunun kaynak video id ve altyazıdan alıntısı aşağıdaki yorumlardadır.
-- Drone Programlama orta/zor quizlerine EKLENİR. Idempotent: aynı soru metni varsa atlanır.

begin;

-- LS_24cvTFRg kaynak: Python 1990 yılında geliştirilmiş bir programlama dili... kullanılması ve öğrenmesi oldukça kolay, geniş bir kullanım alanı var, yapay zeka ve makine öğrenmesi uygulamalarında da... ismi yılandan değil, çok sevdiği bir komedi grubundan geliyor.
-- ayDVGnf2BvQ kaynak: sanal makine programının ücretsiz versiyonu ticari olmayan kullanım için... Ubuntu 18.04 sürümünü indireceğiz.
-- ayDVGnf2BvQ kaynak: klavye dilimizi değiştireceğiz... Türkçe... saat yanlış, İstanbul seçtim.
do $q$
declare v_quiz uuid; v_q uuid; v_sira int; r jsonb; o jsonb; j int;
begin
  select z.id into v_quiz from public.quizzes z join public.modules m on m.id = z.module_id
   where m.ad = 'Drone Programlama' and z.zorluk = 'orta' limit 1;
  if v_quiz is null then raise notice 'Quiz yok, atlanıyor: Drone Programlama orta'; return; end if;
  select coalesce(max(sira), 0) into v_sira from public.questions where quiz_id = v_quiz;
  for r in select * from jsonb_array_elements($json$[{"m":"Videoya göre Python için hangisi doğrudur?","a":"Seride dron kontrol kodları Python ile yazılır.","o":[["Kullanımı ve öğrenmesi kolay, geniş kullanım alanlı bir dildir; yapay zeka ve makine öğrenmesinde de yaygındır",true],["Yalnızca drone için yazılmış bir dildir",false],["Öğrenmesi çok zordur",false],["Adı yılan türünden gelir ve yalnızca web için kullanılır",false]]},{"m":"Videoda sanal makine ve Ubuntu için hangi seçimler yapılır?","a":"Seride kullanılacak programlar Ubuntu ile uyumludur.","o":[["Sanal makine programının ücretsiz (ticari olmayan) sürümü ve Ubuntu 18.04 kullanılır",true],["Ücretli kurumsal sürüm ve Ubuntu 22.04",false],["Windows 7 sanal makinesi",false],["Docker konteyneri ve Ubuntu 12.04",false]]},{"m":"Ubuntu kurulumundan sonra videoda hangi temel ayarlar yapılır?","a":"Güncellemeler de kontrol edilir; 18.04 sürümü kullanıldığı için sürüm yükseltme yapılmaz.","o":[["Klavye düzeni Türkçe yapılır ve saat dilimi İstanbul olarak ayarlanır",true],["İnternet bağlantısı kapatılır",false],["Ekran çözünürlüğü minimuma alınır",false],["Hiçbir ayar yapılmaz",false]]}]$json$::jsonb) loop
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

-- LS_24cvTFRg kaynak: DroneKit tam olarak bir program değil, araçlar için çeşitli uygulamalar geliştirilmesine olanak sağlayan bir Python kütüphanesi... insansız hava araçlarına komutlar gönderebiliyoruz veya anlık veriler alabiliyoruz... yardımcı bilgisayar (Raspberry Pi) üzerinde çalışan bir kütüphane, düşük gecikmeli bağlantı kuruyor.
-- LS_24cvTFRg kaynak: ArduPilot açık kaynak kodlu insansız araç yazılımı... uçuş kontrol kartına yazılım yüklenmesi gerekiyor, bunlardan bir tanesi ArduPilot... SITL bu yazılımın simülasyon hali, bilgisayarınız üzerinde çalıştırarak gerçek hayatta drona vereceğiniz komutları verebiliyorsunuz, ek donanıma gerek duymadan uçuş simülasyonları yapabiliyorsunuz.
-- LS_24cvTFRg kaynak: Gazebo açık kaynak kodlu üç boyutlu bir robot simülasyon yazılımıdır... çoklu fizik motoruyla gerçekçi bir simülasyon ortamı sağlar, birçok sensör ve modele sahiptir... SITL ile çalıştırdığımız simülasyonu üç boyutlu bir dünyada görüntüleyebiliriz.
-- ayDVGnf2BvQ kaynak: disk için ne kadar alan verilmesi gerektiğini istiyor, ben 30 GB vereceğim, yeriniz varsa 32 vermenizi tavsiye ederim... sanal diski tek parça halinde depolamak daha hızlı olacak... RAM: 4 GB otomatik seçilen, 16 GB RAM'iniz varsa 8 GB vermenizi tavsiye ederim.
do $q$
declare v_quiz uuid; v_q uuid; v_sira int; r jsonb; o jsonb; j int;
begin
  select z.id into v_quiz from public.quizzes z join public.modules m on m.id = z.module_id
   where m.ad = 'Drone Programlama' and z.zorluk = 'zor' limit 1;
  if v_quiz is null then raise notice 'Quiz yok, atlanıyor: Drone Programlama zor'; return; end if;
  select coalesce(max(sira), 0) into v_sira from public.questions where quiz_id = v_quiz;
  for r in select * from jsonb_array_elements($json$[{"m":"DroneKit nedir ve nerede çalışır?","a":"DroneKit uçuş kontrol kartının kendisinde değil, yardımcı bilgisayarda çalışır.","o":[["İHA'lara komut gönderip anlık veri almayı sağlayan bir Python kütüphanesidir; Raspberry Pi gibi yardımcı bilgisayarda çalışır ve uçuş kontrol kartıyla düşük gecikmeli bağlantı kurar",true],["Uçuş kontrol kartının yazılımıdır",false],["Bir 3B simülatördür",false],["Yalnızca kumandaya yüklenir",false]]},{"m":"ArduPilot SITL'in rolü videoda nasıl anlatılır?","a":"ArduPilot yalnızca uçaklar için değil, rover ve su altı araçları gibi farklı araçları da kontrol edebilen açık kaynak bir yazılımdır.","o":[["Uçuş kontrol kartı yazılımının (ArduPilot) bilgisayarda çalışan simülasyon halidir; ek donanım olmadan gerçek droneda verilecek komutlar denenebilir",true],["Dronun pervane tasarım programıdır",false],["Gazebo'nun kamera eklentisidir",false],["Kumanda yazılımıdır",false]]},{"m":"Gazebo videoda ne işe yarar?","a":"Yalnızca SITL ile kodlardan gelen verileri takip etmek yerine 3B ortamda hareketler görülebilir.","o":[["Açık kaynaklı 3B robot simülasyon yazılımıdır; SITL ile çalışan drone'u üç boyutlu bir dünyada görmeyi sağlar",true],["Python kütüphanesidir",false],["Uçuş kontrol kartı yazılımıdır",false],["Kumanda sinyali iletim protokolüdür",false]]},{"m":"Videoda sanal makine disk ve RAM için hangi öneriler verilir?","a":"Bilgisayarın tüm belleğini sanal makineye vermek önerilmez, ana sistemin de ihtiyacı vardır.","o":[["Disk için yaklaşık 30-32 GB ve tek parça depolama (daha hızlı); RAM için 4 GB varsayılan, bilgisayarda yeterliyse 8 GB",true],["Disk 2 GB, RAM 512 MB",false],["Disk çok parçalı olmalıdır, RAM mümkün olan en yüksek değer verilmelidir",false],["Disk 500 GB, RAM 32 GB",false]]}]$json$::jsonb) loop
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
