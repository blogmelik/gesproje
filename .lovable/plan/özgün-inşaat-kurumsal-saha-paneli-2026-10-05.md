# Özgün İnşaat Kurumsal Saha Paneli

## Görünüm
- Mevcut sarı/siyah, kalın çizgili tasarımı lacivert, antrasit ve nötr yüzeylerle değiştir; Inter tipografi, küçük köşeler, ince kenarlıklar ve hafif gölgeler kullan.
- Verilen Özgün İnşaat logosunu sabit üst çubuğa yerleştir; yanında proje adı ve proje detayını göster.
- Masaüstünde daraltılabilir yan menü, telefonda açılır yan menü kullan. Dashboard, Rapor Yaz ve Revizyon Yönetimi ekranlarını koru.
- Dashboard, seçim kartları, miktar alanları, hata/ekip pencereleri ve revizyon tablosunu aynı kurumsal tasarım dilinde birleştir; karanlık modu koru.

## Proje Ayarları
- Üst çubukta dişli simgesiyle açılan Proje Ayarları penceresi ekle.
- Proje Adı ve Proje Detayı alanlarını düzenlenebilir yap. Varsayılan ad: **Cezayir Hassi Delaa GES Projesi**. Detay alanı başlangıçta boş kalsın; doğrulanmamış kapasite bilgisi eklenmesin.
- Kaydedilen bilgileri cihazda sakla, üst çubukta anında güncelle ve yenileme sonrası koru.

## Teknik Yaklaşım
- Tema değerlerini global CSS tasarım tokenlarında tanımla; ortak shadcn kontrollerini kullan.
- Proje ayarlarını ayrı bir depolama kancasında, sayfa açıldıktan sonra oku. İmalat miktarları mevcut geçici React durumunda; hatalar ve ekipler mevcut kalıcı depolamada kalır.
- Mevcut sayfa yolları, Excel aktarımı, hata fotoğrafları ve ekip yönetimi işlevlerini değiştirme.

## Kontrol
- Proje ayarlarının kaydetme/yenileme akışını, menü açma/daraltmayı ve üç ana ekranı kontrol et.
- Dar ve geniş ekranlarda taşma, logo görünürlüğü ve karanlık mod kontrollerini yap; mevcut testleri çalıştır.