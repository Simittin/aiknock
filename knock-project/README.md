# AI KNOCK - 1973 Retro Terminal Game

## 📜 Proje Hakkında
AI KNOCK, 1973 yılına ait deneysel bir terminal sistemini simüle eden, anlatı odaklı bir interaktif deneyimdir. Oyun, yerel yapay zeka (Transformers.js) ve bulut tabanlı yapay zeka (Gemini API) teknolojilerini birleştirerek oyuncuya "makine ile konuşma" hissini en ham haliyle yaşatır.

## 🚀 Teknolojik Altyapı
- **Frontend**: Saf HTML5 ve Modern Javascript (ESM).
- **Aesthetic**: 1973 Retro-Terminal teması (Vanilla CSS). CRT tarama çizgileri, flicker (titreme) efektleri ve fosforlu yazı fontları kullanılmıştır.
- **Local AI (Transformers.js)**: `Xenova/distilbert-base-uncased-finetuned-sst-2-english` modeli kullanılarak tarayıcı üzerinde gerçek zamanlı duygu analizi (Sentiment Analysis) yapılır.
- **Cloud AI (Gemini API)**: Gelişmiş anlatı ve dinamik diyaloglar için Google Gemini 1.5 Flash modeli entegre edilmiştir.

## 🛠️ Kurulum ve Kullanım
1. Proje dosyalarını bir web sunucusunda (veya VS Code Live Server ile) çalıştırın.
2. Terminal ekranı açıldığında `HELP` komutunu yazarak mevcut komutları görün.
3. Gemini API özelliklerini aktif etmek için `KEY [API_KEYINIZ]` komutuyla anahtarınızı girin.
4. `SCAN [METİN]` komutu ile yerel yapay zekanın gücünü test edin.

## 🎮 Komut Listesi
- `HELP`: Yardım menüsünü görüntüler.
- `STATUS`: Sistem sağlığını ve bağlantı durumunu kontrol eder.
- `KEY [VALUE]`: Gemini API anahtarını yerel depolamaya kaydeder.
- `CLEAR`: Terminal günlüğünü temizler.
- `SCAN [TEXT]`: Yerel Transformers.js modeli ile metni analiz eder.
- `[HERHANGİ BİR METİN]`: API anahtarı girildiyse, "Terminal Core" ile doğrudan iletişim kurmanızı sağlar.

## 🎨 Tasarım Notları
Oyunun tasarımı, 70'li yılların mainframe terminallerinden ilham alınarak yapılmıştır. Yeşil ve kehribar (amber) renk paleti, düşük yenileme hızı simülasyonu ve monospaced tipografi ile oyuncunun kendini eski bir laboratuvarda hissetmesi amaçlanmıştır.
