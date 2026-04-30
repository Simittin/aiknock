// Vite çevresel değişkenlerini kullanır. 
// VITE_GEMINI_API_KEY anahtarını .env dosyasından otomatik okur.

export async function getApiKey() {
    // Vite projesinde import.meta.env kullanılır
    const key = import.meta.env.VITE_GEMINI_API_KEY;
    return key || '';
}

export function clearApiKeyCache() {
    // Vite'de cache manuel yönetilmez, bu fonksiyonu uyumluluk için boş bıraktık.
}
