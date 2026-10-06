# Dashboard ve Rapor Yaz ayrımı

- **Dashboard:** Genel tamamlanma, imalat yüzdeleri ve mevcut özet göstergeleri yalnızca bu sayfada kalacak.
- **Alt menü:** Dashboard ve Rapor Yaz için iki büyük, sürekli erişilebilir bağlantı; mevcut karanlık mod korunacak.
- **Rapor Yaz:** Sırasıyla 36 istasyon, 4 bölge, 18 sıra ve seçilen sıranın 4 masa kartı gösterilecek. Önceki adımlar aynı anda listelenmeyecek.
- **Veri girişi:** Her masada Kolon 24, Kiriş 12, Payanda 12, Aşık 40 ve Panel 56 hedefleri; miktar alanı, +/− butonları ve ayrı yüzde çubukları bulunacak.
- **Geri dönüş:** Seçim yolu ve geri butonu üst kademelere dönüş sağlayacak.
- **Kontrol:** Sayfalar arası geçişte girişlerin korunması, Dashboard yüzdelerinin güncellenmesi ve dar ekranlarda taşma olmaması doğrulanacak.

## Teknik yaklaşım
İki ayrı TanStack sayfası ortak React state sağlayıcısını kullanacak. Örnek veriler mevcut deterministik dağılımla korunacak; yenilemede sıfırlanacak, kalıcı kayıt eklenmeyecek. Mevcut renkler, yazı tipleri ve shadcn/ui kontrolleri kullanılacak.