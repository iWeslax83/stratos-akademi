-- Bu projede SQL editor ile oluşturulan tablolara service_role otomatik GRANT almıyor.
-- submitQuiz server action'ı doğru cevapları service_role ile okur; bu yüzden okuma yetkisi şart.
grant select on public.quizzes to service_role;
grant select on public.questions to service_role;
grant select on public.question_options to service_role;
