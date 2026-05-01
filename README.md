# 1973: Veda Yolu

"1973: Veda Yolu", retro pixel art estetiğine sahip, anlatı odaklı bir 2D oyun projesidir. Google Gemini (LLM) ve Transformers.js (NLP) teknolojilerini kullanarak oyuncu ile dinamik ve duygusal bir etkileşim kurar.

## Özellikler

- **Dinamik Diyaloglar:** Google Gemini API kullanarak NPC'ler ve nesnelerle derinlikli diyaloglar.
- **Ruhsal Yük (Burden) Mekaniği:** Oyuncunun verdiği cevapların duygusal analizi (Transformers.js) üzerinden karakterin hareket hızı ve oyunun atmosferi değişir.
- **Retro Estetik:** CRT/Terminal efektli 2D pixel art görseller.
- **Prosedürel Ses:** Web Audio API ile atmosferik ve dinamik ses tasarımı.

## Kurulum

1. Depoyu klonlayın:
   ```bash
   git clone git@github.com:Simittin/aiknock.git
   cd aiknock
   ```

2. Gerekli bağımlılıkları yükleyin:
   ```bash
   npm install
   ```

3. `.env` dosyasını oluşturun ve Gemini API anahtarınızı ekleyin:
   ```bash
   cp .env.example .env
   ```

   `.env` dosyasında Vite'ın tarayıcıya aktarabileceği değişken adı kullanılmalıdır:

   ```env
   VITE_GEMINI_API_KEY=your_api_key_here
   ```

## Geliştirme Komutları

Geliştirme sunucusunu başlatmak için:

```bash
npm run dev
```

Production build almak için:

```bash
npm run build
```

Build çıktısını yerelde önizlemek için:

```bash
npm run preview
```

Tarayıcıda `http://localhost:5173` adresini ziyaret edin.

## Lisans

Bu proje Introduction to AI dersi kapsamında geliştirilmiştir.
