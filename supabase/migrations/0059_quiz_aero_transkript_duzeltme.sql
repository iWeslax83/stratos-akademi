-- Aerodinamik serisi (T3 modülleri) transkriptleri: g_-sytuNHds (4.1), lW2r_WgH6I8 (4.2), K7RvbcU4MaE (4.4).
-- Altyazı: YouTube otomatik Türkçe transkript. 4.3 ve 5. modül transkriptleri alınamadı.
-- Her sorunun zaman damgası ve kanıt cümlesi aşağıdaki yorumlardadır.
-- Aerodinamik ve Uçuş Mekaniği orta/zor quizlerine EKLENİR. Idempotent: aynı soru metni varsa atlanır.

begin;

-- Terim düzeltmesi: videoda "chord line" için "veter hattı" kullanılıyor, 0056'daki "akort/akord"
-- ifadesi videoyla uyuşmuyordu. Mevcut soru metni, şık ve açıklamalar güncellenir (idempotent).
update public.question_options o set metin = replace(replace(o.metin, 'Akort çizgisi', 'Veter hattı'), 'Akord çizgisi', 'Veter hattı')
  from public.questions q, public.quizzes z, public.modules m
 where o.question_id = q.id and q.quiz_id = z.id and z.module_id = m.id
   and m.ad = 'Aerodinamik ve Uçuş Mekaniği' and (o.metin like '%Akort çizgisi%' or o.metin like '%Akord çizgisi%');
update public.questions q set
    metin = replace(replace(q.metin, 'Akort çizgisi', 'Veter hattı'), 'Akord çizgisi', 'Veter hattı'),
    aciklama = replace(replace(q.aciklama, 'Akort çizgisi', 'Veter hattı'), 'Akord çizgisi', 'Veter hattı')
  from public.quizzes z, public.modules m
 where q.quiz_id = z.id and z.module_id = m.id and m.ad = 'Aerodinamik ve Uçuş Mekaniği'
   and (q.metin like '%Akort çizgisi%' or q.metin like '%Akord çizgisi%' or q.aciklama like '%Akort çizgisi%' or q.aciklama like '%Akord çizgisi%');

-- g_-sytuNHds 01:43: if one of these forces is bigger than the other, it does not continue at a constant speed; according to the dominant force the aircraft accelerates, slows down, rises or descends.
-- g_-sytuNHds 02:21: the total weight of an aircraft consists of the mass of all components such as the body, wings, engine, fuel and loads.
-- g_-sytuNHds 04:46: drag force arises from all surfaces of the aircraft that interact with the airflow. Wings, fuselage, tail and landing gear each contribute.
-- lW2r_WgH6I8 00:14: you hit the front part of the wing called the leading edge... the sharpest point farthest away, the trailing edge, where you leave the wing.
-- lW2r_WgH6I8 00:40: the straight line connecting the leading edge and the trailing edge is called the chord line. The length of this line is called the chord length.
-- K7RvbcU4MaE 00:22: Thrust is vital for fixed-wing aircraft because a certain speed is required to obtain lift from the wings. This speed is produced by the engines.
-- K7RvbcU4MaE 00:56: piston engines, jet engines, turboprops and electric motors... electric motors are widely used especially in unmanned aerial vehicles.
-- K7RvbcU4MaE 01:34: when you throw the paper plane you apply a thrust force to it... but since there is no engine in the paper plane, the thrust is applied only at the beginning and loses speed over time due to drag.
do $q$
declare v_quiz uuid; v_q uuid; v_sira int; r jsonb; o jsonb; j int;
begin
  select z.id into v_quiz from public.quizzes z join public.modules m on m.id = z.module_id
   where m.ad = 'Aerodinamik ve Uçuş Mekaniği' and z.zorluk = 'orta' limit 1;
  if v_quiz is null then raise notice 'Quiz yok, atlanıyor: Aerodinamik ve Uçuş Mekaniği orta'; return; end if;
  select coalesce(max(sira), 0) into v_sira from public.questions where quiz_id = v_quiz;
  for r in select * from jsonb_array_elements($json$[{"m":"Hava aracına etki eden kuvvetlerden biri diğerinden baskın olursa ne olur?","a":"Dört kuvvet dengedeyse uçak sabit hızda ve dengede uçar.","o":[["Uçak sabit hızla devam etmez; baskın kuvvete göre hızlanır, yavaşlar, yükselir veya alçalır",true],["Hiçbir şey olmaz",false],["Uçak her zaman durur",false],["Motor otomatik kapanır",false]]},{"m":"Videoya göre bir uçağın toplam ağırlığını hangi bileşenler oluşturur? (birden çok)","a":"Ağırlık, bütün bileşenlerin toplam kütlesinden doğar.","o":[["Gövde ve kanatlar",true],["Motor ve yakıt",true],["Taşınan yükler",true],["Hava akımı",false]]},{"m":"Sürükleme kuvvetine hangi parçalar katkıda bulunur?","a":"Bu yüzden uçaklar kalkıştan sonra iniş takımlarını kapatarak sürüklemeyi azaltır.","o":[["Hava akımıyla etkileşen tüm yüzeyler: kanatlar, gövde, kuyruk ve iniş takımları",true],["Yalnızca kanatlar",false],["Yalnızca motor",false],["Yalnızca pervane",false]]},{"m":"Videodaki hava molekülü örneğinde hücum kenarı ve firar kenarı nedir?","a":"Hava hücum kenarında ikiye ayrılıp üst ve alt yüzeyden geçer, firar kenarında kanadı terk eder.","o":[["Hücum kenarı havanın çarptığı ön bölüm, firar kenarı kanadın en uzaktaki keskin arka noktasıdır",true],["Hücum kenarı arka uçtur, firar kenarı ön uçtur",false],["İkisi de kanat uçlarıdır",false],["İkisi de gövdede bulunur",false]]},{"m":"Hücum kenarını firar kenarına birleştiren düz çizgiye ve uzunluğuna videoda ne denir?","a":"İngilizce terim chord line'dır; Türkçe kaynaklarda veter hattı olarak geçer.","o":[["Veter hattı ve veter uzunluğu",true],["Kamburluk eğrisi ve kamber uzunluğu",false],["Hücum açısı ve açı uzunluğu",false],["Kalınlık hattı ve kalınlık oranı",false]]},{"m":"İtki kuvveti sabit kanatlı hava araçları için neden hayati önemdedir?","a":"İtki olmadan uçak havada ilerleyemez, taşıma kuvveti de oluşmaz.","o":[["Kanatlardan taşıma elde edebilmek için belirli bir hız gerekir ve bu hızı motorlar sağlar",true],["Ağırlığı doğrudan taşıdığı için",false],["Sürüklemeyi sıfırladığı için",false],["Yalnızca kalkışta gerektiği için",false]]},{"m":"Videoya göre itki sağlayan motor türleri hangileridir? (birden çok)","a":"Küçük pervaneli uçaklar genellikle piston, büyük yolcu uçakları jet, insansız hava araçları ise çoğunlukla elektrik motoru kullanır.","o":[["Piston motorlar",true],["Jet motorlar ve turbopropler",true],["Elektrikli motorlar",true],["Yalnızca roket motorları",false]]},{"m":"Videodaki kağıt uçak örneğinde itki ne zaman uygulanır ve ne olur?","a":"Motor olmadığı için itki sürekli değildir.","o":[["Yalnızca fırlatılırken uygulanır, zamanla sürükleme yüzünden hız kaybeder",true],["Sürekli uygulanır",false],["Hiç uygulanmaz",false],["Rüzgâr tarafından uygulanır",false]]}]$json$::jsonb) loop
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

-- g_-sytuNHds 04:04: there is no need for special wing profiles all the time. A flat profile can produce lift when held at an angle to the airflow. (hand out of the car window)
-- g_-sytuNHds 05:14: wing shapes, smoothness of the fuselage surfaces and aerodynamic profile arrangements are optimized to minimize drag.
-- lW2r_WgH6I8 00:51: the curvature on the upper and lower surfaces... is called the camber curve, that is, it expresses how curved the wing is.
-- lW2r_WgH6I8 01:13: the angle of attack is the angle between the airflow lines and the chord line.
-- K7RvbcU4MaE 01:58: thrust force is a factor that accelerates fixed-wing aircraft. It does not contribute to carrying their weight.
-- K7RvbcU4MaE 02:07: Thrust depends on two basic factors: drag force and the acceleration needed... F is the required thrust, D the drag, M the mass, A the acceleration.
do $q$
declare v_quiz uuid; v_q uuid; v_sira int; r jsonb; o jsonb; j int;
begin
  select z.id into v_quiz from public.quizzes z join public.modules m on m.id = z.module_id
   where m.ad = 'Aerodinamik ve Uçuş Mekaniği' and z.zorluk = 'zor' limit 1;
  if v_quiz is null then raise notice 'Quiz yok, atlanıyor: Aerodinamik ve Uçuş Mekaniği zor'; return; end if;
  select coalesce(max(sira), 0) into v_sira from public.questions where quiz_id = v_quiz;
  for r in select * from jsonb_array_elements($json$[{"m":"Taşıma kuvveti üretmek için her zaman özel kanat profili gerekir mi?","a":"Videoda arabadan elini dışarı çıkarıp hafifçe yukarı eğme ve kağıt uçak örnekleri verilir.","o":[["Hayır, düz bir profil de hava akımına açılı tutulduğunda taşıma üretebilir",true],["Evet, yalnızca su damlası profili taşıma üretir",false],["Hayır, ama yalnızca hızla döner",false],["Evet, taşıma yalnızca motor gücüyle oluşur",false]]},{"m":"Videoya göre sürüklemeyi en aza indirmek için hangi tasarım unsurları iyileştirilir? (birden çok)","a":"Sürükleme hız kaybına, daha fazla enerji ve yakıt tüketimine yol açar.","o":[["Kanat şekilleri",true],["Gövde yüzeylerinin pürüzsüzlüğü",true],["Aerodinamik profil düzenlemeleri",true],["Pervane rengi",false]]},{"m":"Kanat profilinde kamburluk (camber) eğrisi neyi ifade eder?","a":"Kamburluk, üst ve alt yüzeylerdeki eğriliği tanımlar.","o":[["Kanadın ne kadar kavisli olduğunu",true],["Kanadın kalınlığını",false],["Kanat açıklığını",false],["Hava akımının hızını",false]]},{"m":"Videoya göre hücum açısı nedir?","a":"Hava molekülü kanada hangi açıyla temas ediyorsa o açı hücum açısıdır.","o":[["Hava akımı çizgileri ile veter hattı arasındaki açı",true],["Kanat ile gövde arasındaki açı",false],["Kanadın yere göre açısı",false],["Kuyruk ile kanat arasındaki açı",false]]},{"m":"Sabit kanatlı hava araçlarında itki kuvvetinin rolü hakkında hangisi doğrudur?","a":"Ağırlığı taşıyan kuvvet kanatların ürettiği taşımadır.","o":[["Aracı hızlandırır, ağırlığını taşımaya katkıda bulunmaz",true],["Doğrudan ağırlığı taşır",false],["Yalnızca yön değiştirir",false],["Taşıma kuvvetini sıfırlar",false]]},{"m":"Videodaki formüle göre (F = D + M·A) sürükleme kuvveti 20 N, araç kütlesi 5 kg ve istenen ivme 2 m/s² ise gereken itki kaç N'dur?","a":"F = D + M·A = 20 + 5·2 = 30 N.","o":[["10 N",false],["20 N",false],["30 N",true],["50 N",false]]}]$json$::jsonb) loop
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
