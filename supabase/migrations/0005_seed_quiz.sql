-- Örnek quizler. Yalnız bir kez, quiz tabloları boşken çalıştırın.

do $$
declare v_module uuid; v_quiz uuid; v_q uuid;
begin
  select id into v_module from public.modules where ad = 'Drone Temelleri' limit 1;
  if v_module is null then raise notice 'Drone Temelleri modülü yok, atlanıyor'; return; end if;
  insert into public.quizzes (module_id, baslik, gecme_esigi, sira)
    values (v_module, 'Drone Temelleri Quizi', 70, 1) returning id into v_quiz;

  insert into public.questions (quiz_id, metin, sira)
    values (v_quiz, 'Bir quadcopter''da kaç motor bulunur?', 1) returning id into v_q;
  insert into public.question_options (question_id, metin, dogru, sira) values
    (v_q, '2', false, 1), (v_q, '3', false, 2), (v_q, '4', true, 3), (v_q, '6', false, 4);

  insert into public.questions (quiz_id, metin, sira)
    values (v_quiz, 'Aşağıdakilerden hangileri bir drone''un temel bileşenlerindendir? (birden çok)', 2) returning id into v_q;
  insert into public.question_options (question_id, metin, dogru, sira) values
    (v_q, 'Motor', true, 1), (v_q, 'Uçuş kontrol kartı', true, 2), (v_q, 'Pervane', true, 3), (v_q, 'Klavye', false, 4);

  insert into public.questions (quiz_id, metin, sira)
    values (v_quiz, 'İtki (thrust) kuvveti drone''da neyi sağlar?', 3) returning id into v_q;
  insert into public.question_options (question_id, metin, dogru, sira) values
    (v_q, 'Havalanma ve havada kalma', true, 1), (v_q, 'Renk değişimi', false, 2),
    (v_q, 'Veri depolama', false, 3), (v_q, 'Ses üretimi', false, 4);

  insert into public.questions (quiz_id, metin, sira)
    values (v_quiz, 'Pervanelerin dönüş yönü (CW/CCW) drone dengesi için önemlidir.', 4) returning id into v_q;
  insert into public.question_options (question_id, metin, dogru, sira) values
    (v_q, 'Doğru', true, 1), (v_q, 'Yanlış', false, 2);
end $$;

do $$
declare v_module uuid; v_quiz uuid; v_q uuid;
begin
  select id into v_module from public.modules where ad = 'Temel Elektronik' limit 1;
  if v_module is null then raise notice 'Temel Elektronik modülü yok, atlanıyor'; return; end if;
  insert into public.quizzes (module_id, baslik, gecme_esigi, sira)
    values (v_module, 'Temel Elektronik Quizi', 70, 1) returning id into v_quiz;

  insert into public.questions (quiz_id, metin, sira)
    values (v_quiz, 'Ohm yasası neyi tanımlar?', 1) returning id into v_q;
  insert into public.question_options (question_id, metin, dogru, sira) values
    (v_q, 'Gerilim, akım ve direnç ilişkisini', true, 1), (v_q, 'Işık hızını', false, 2),
    (v_q, 'Sıcaklığı', false, 3), (v_q, 'Frekansı', false, 4);

  insert into public.questions (quiz_id, metin, sira)
    values (v_quiz, 'Aşağıdakilerden hangileri gerilim birimidir? (birden çok)', 2) returning id into v_q;
  insert into public.question_options (question_id, metin, dogru, sira) values
    (v_q, 'Volt (V)', true, 1), (v_q, 'Milivolt (mV)', true, 2), (v_q, 'Amper (A)', false, 3), (v_q, 'Ohm (Ω)', false, 4);

  insert into public.questions (quiz_id, metin, sira)
    values (v_quiz, 'DC (doğru akım) için doğru olan nedir?', 3) returning id into v_q;
  insert into public.question_options (question_id, metin, dogru, sira) values
    (v_q, 'Tek yönde akar', true, 1), (v_q, 'Sürekli yön değiştirir', false, 2),
    (v_q, 'Ölçülemez', false, 3), (v_q, 'Sadece şehir şebekesinde bulunur', false, 4);

  insert into public.questions (quiz_id, metin, sira)
    values (v_quiz, 'Multimetre ile aşağıdakilerden hangileri ölçülebilir? (birden çok)', 4) returning id into v_q;
  insert into public.question_options (question_id, metin, dogru, sira) values
    (v_q, 'Gerilim', true, 1), (v_q, 'Direnç', true, 2), (v_q, 'Akım', true, 3), (v_q, 'Ağırlık', false, 4);
end $$;
