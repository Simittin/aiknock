# Proje Katkı Rehberi (1973: Veda Yolu)

Bu döküman, "Veda Yolu" projesinde geliştirme yapan ekip üyelerinin uyması gereken standartları belirler.

## 1. Kod Yazım Standartları
- **Değişken İsimlendirme:** camelCase kullanılmalıdır.
- **Dökümantasyon:** Her ana fonksiyonun üzerinde JSDoc formatında açıklama bulunmalıdır.
- **ES6+ Kullanımı:** Proje modern JavaScript standartlarını (modules, async/await) temel alır.

## 2. Git ve Commit Düzeni
Commit mesajları şu formatta olmalıdır:
- `feat:` Yeni bir özellik eklendiğinde.
- `fix:` Bir hata düzeltildiğinde.
- `docs:` Sadece dökümantasyon değişikliğinde.
- `refactor:` Kod yapısı değiştiğinde (işlev değişmeden).
- `style:` Görsel veya CSS değişikliklerinde.

## 3. Yapay Zeka Entegrasyon Kuralları
- Gemini API anahtarları asla `.env` dışına çıkarılmamalıdır.
- Prompt mühendisliği değişiklikleri `src/ai/prompts.js` üzerinden merkezi olarak yönetilmelidir.

---
*CSE 358 - Yapay Zekaya Giriş Projesi*
