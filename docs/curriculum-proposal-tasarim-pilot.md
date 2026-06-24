# Müfredat önerisi — Tasarım & Pilot dalları (TASLAK / kaptan doldurur)

Bu bir **öneri iskeletidir** — kod veya tohum verisi DEĞİL. Tasarım ve Pilot dalları
şu an boş ("yakında"). Aşağıdaki modül/ders yapısı, kaptanın `/admin/mufredat`
panelinden **kendi seçtiği YouTube videolarını** ekleyebilmesi için bir başlangıç
noktasıdır. Video ID'leri kasıtlı olarak boş — uydurma ID kırık ders demek olurdu.
Kulübün TEKNOFEST X-quadrotor odağına göre hazırlandı. İstediğini değiştir/sil.

Her ders için panelde gereken alanlar: başlık, YouTube video ID, açıklama, süre, sıra.

## Tasarım dalı (CAD + aerodinamik + üretim)

### Modül 1 — CAD Temelleri
- CAD arayüzüne giriş (Fusion 360 veya SolidWorks): sketch, constraint
- Extrude / revolve / fillet ile katı modelleme
- Parça vs montaj (assembly) mantığı

### Modül 2 — Drone Gövde (Frame) Tasarımı
- Frame tipleri: X, H, deadcat — avantaj/dezavantaj
- Malzeme seçimi: karbon fiber, alüminyum, 3D baskı plastikleri
- Ağırlık merkezi ve simetri; motor-motor mesafesi (wheelbase)

### Modül 3 — Aerodinamik & İtki
- Pervane teorisi: pitch, çap, itki üretimi
- İtki/ağırlık oranı (thrust-to-weight) hesabı
- Hava akışı ve gövde sürtünmesi (drag) temelleri

### Modül 4 — Yapısal Analiz
- Gerilim/gerinim temelleri; zayıf noktalar
- Titreşim ve rezonans (uçuşta görüntü/sensör etkisi)
- Basit FEA (sonlu elemanlar) bakışı

### Modül 5 — Üretim & 3D Baskı
- Toleranslar ve geçmeler (montaj parçaları)
- 3D baskı ayarları (dolgu, yönlendirme, dayanım)
- Kablo yönetimi ve montaj için tasarım (DfM/DfA)

## Pilot dalı (uçuş + görev + güvenlik)

### Modül 1 — Uçuş Temelleri
- Eksenler: roll / pitch / yaw / throttle
- Kumanda modları: angle/horizon/acro; mode tuşları
- Ön-uçuş kontrol listesi mantığı

### Modül 2 — Simülatörde Pratik
- Neden simülatör (güvenli, ucuz tekrar)
- Liftoff / DRL / Velocidrone ile temel manevralar
- Hover ve daire/sekiz çizme alıştırmaları

### Modül 3 — Manuel & Otonom Uçuş
- GPS, return-to-home, failsafe kavramları
- Waypoint ve otonom uçuş temelleri
- Batarya yönetimi ve uçuş süresi planlama

### Modül 4 — Görev Planlama
- Mission Planner / QGroundControl arayüzü
- Otonom görev (waypoint, survey) kurma
- Telemetri okuma ve uçuş-sonrası log analizi

### Modül 5 — Güvenlik & Mevzuat
- SHGM/İHA sınıfları ve uçuş kuralları (Türkiye)
- LiPo batarya güvenliği (şarj, saklama, hasar)
- Acil durum prosedürleri ve risk değerlendirme

## Notlar
- Sıralama "Ortak Temel"den sonra gelmeli (önce temel, sonra dal).
- Video dili karışık olabilir; kalite önceliklidir (üyeler İngilizce anlıyor).
- Her modülün sonuna bir quiz ve bir pratik görev eklemek akışı tamamlar
  (video izle → quiz → pratik görev — platformun çekirdek döngüsü).
