// 7 etkileşim nesnesi + Anne NPC. Faz 2 statik metinler — şarkı sözlerinden
// (Knockin' on Heaven's Door, 1973) ilhamla. Faz 3'te lore dizileri Gemini
// API çağrılarına yer verecek; bu dosya tek değişim noktası kalacak.
//
// Her nesne:
//   id      — tekil anahtar
//   name    — etkileşim ipucunda ve diyalog başlığında görünür
//   kind    — renderer'ın hangi sprite'ı çizeceği
//   blocking— oyuncu üzerinden geçemiyor mu?
//   lore    — diyalog sayfaları (Enter ile ilerler). {name} oyuncu adıyla değişir.

export const objects = {
    letter: {
        id: 'letter',
        name: 'Askerlik Celbi',
        kind: 'letter',
        blocking: true,
        lore: [
            "Beyaz zarftan siyah mürekkep akıyor — sanki kâğıt kanıyor.",
            "'Görev yeri: Vietnam. Bu emir geri çevrilemez.'",
            "Her satır, çocukluğuna bir kapı kapatıyor, {name}."
        ]
    },
    toy: {
        id: 'toy',
        name: 'Çocukluk Oyuncağı',
        kind: 'toy',
        blocking: true,
        lore: [
            "Tüyleri yıpranmış, gözleri matlaşmış bir oyuncak ayı.",
            "Onu tutarken parmakların hâlâ küçük sandığını hissediyor.",
            "Ama artık değiller. Bu masumiyeti burada bırakıyorsun, {name}."
        ]
    },
    guitar: {
        id: 'guitar',
        name: 'Gitar',
        kind: 'guitar',
        blocking: true,
        lore: [
            "Tellerden biri kopmuş. Tahtasında çalınmamış şarkıların izi var.",
            "Bir başka hayatta belki onun çalanı sen olurdun.",
            "Bu hayatta ise eline tutuşturulan şey hiç bu kadar hafif değil."
        ]
    },
    gun: {
        id: 'gun',
        name: 'Eski Silah',
        kind: 'gun',
        blocking: true,
        lore: [
            "Babanın silahı duvarda asılı. Ağırlığı havayı çökertiyor.",
            "'Put my guns in the ground...'",
            "Toprağa gömseydim, içimde bu kadar yer eder miydi acaba?"
        ]
    },
    badge: {
        id: 'badge',
        name: 'Rozet',
        kind: 'badge',
        blocking: true,
        lore: [
            "Masada soğuk bir parıltı. Üzerinde sırtladığın isim yazılı.",
            "'Take this badge off of me, I can't use it anymore...'",
            "Bunu taşımak, kim olduğunu unutmaktan geçiyor, {name}."
        ]
    },
    window: {
        id: 'window',
        name: 'Pencere',
        kind: 'window',
        blocking: true,
        lore: [
            "Camda fırtına. Ufukta o uzun, kara bulut iniyor.",
            "'That long black cloud is comin' down...'",
            "Gökyüzü bir kapı çalıyor, {name}. Hangi kapıyı, henüz bilmiyorsun."
        ]
    },
    mom: {
        id: 'mom',
        name: 'Anne',
        kind: 'npc',
        blocking: true,
        lore: [
            "Annen masada oturuyor. Elleri dizinde, gözleri seninle.",
            "'Mama... gitmek zorunda olduğunu biliyorum, evlat.'",
            "'Bana söylemek istediğin son bir şey var mı, {name}?'"
        ]
    },
};
