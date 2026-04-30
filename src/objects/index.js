// 7 etkileşim nesnesi. Faz 3'te statik lore yerine AI çağrılarına geçtik;
// her nesne bir 'role' (inner_voice ya da mom) ve sahnesini AI'ya açıklayan
// bir 'context' taşır. 'opener' ise diyalog kutusu açılırken oyuncuya
// gösterilen sahne kuran tek satırlık metin (AI çağrısından önce).

export const objects = {
    letter: {
        id: 'letter',
        name: 'Askerlik Celbi',
        kind: 'letter',
        blocking: true,
        role: 'inner_voice',
        questionTarget: 3,
        opener: "Beyaz zarftan siyah mürekkep akıyor — sanki kâğıt kanıyor.",
        context: "Karakter elinde Vietnam askerlik celbini tutuyor. Geri dönüşsüz bir emir. Bu mektup, çocukluğunu kapatan ve onu cennetin kapısına yönlendiren ilk dokunuş."
    },
    toy: {
        id: 'toy',
        name: 'Çocukluk Oyuncağı',
        kind: 'toy',
        blocking: true,
        role: 'inner_voice',
        questionTarget: 3,
        opener: "Tüyleri yıpranmış, gözleri matlaşmış bir oyuncak ayı yerde duruyor.",
        context: "Karakterin çocukken her gece kucakladığı oyuncak ayı. Geride bırakılan masumiyetin somut hali. Onu ardında bırakacak."
    },
    guitar: {
        id: 'guitar',
        name: 'Gitar',
        kind: 'guitar',
        blocking: true,
        role: 'inner_voice',
        questionTarget: 3,
        opener: "Tellerden biri kopmuş. Tahtasında çalınmamış şarkıların izi var.",
        context: "Karakterin sanatçı kimliği, yaşamadığı bir kariyer, çalmadığı şarkılar. Belki başka bir hayatta o, savaşçı değil, müzisyen olurdu. Bu gitar, kaybolmuş bir gelecektir."
    },
    gun: {
        id: 'gun',
        name: 'Eski Silah',
        kind: 'gun',
        blocking: true,
        role: 'inner_voice',
        questionTarget: 3,
        opener: "Babanın silahı duvarda asılı. Ağırlığı havayı çökertiyor.",
        context: "Babadan kalma eski tüfek. Şarkının 'put my guns in the ground' satırına dokunan nesne. Silah, hem mirası hem de ona biçilen rolü temsil eder."
    },
    badge: {
        id: 'badge',
        name: 'Rozet',
        kind: 'badge',
        blocking: true,
        role: 'inner_voice',
        questionTarget: 3,
        opener: "Masada soğuk bir parıltı. Üzerinde sırtlanması gereken bir isim.",
        context: "Pirinçten yıldız rozet. Şarkının 'take this badge off of me' satırının somut karşılığı. Karakter bu rozeti üzerinde taşımak zorunda — ama içten içe atmak ister."
    },
    window: {
        id: 'window',
        name: 'Pencere',
        kind: 'window',
        blocking: true,
        role: 'inner_voice',
        questionTarget: 3,
        opener: "Camda fırtına. Ufukta o uzun, kara bulut iniyor.",
        context: "Mutfak penceresinin önünde dururken dışarıdaki fırtınayı izliyor. 'That long black cloud is comin' down' satırının görsel karşılığı. Gökyüzü adeta bir kapı gibi çalınıyor."
    },
    mom: {
        id: 'mom',
        name: 'Anne',
        kind: 'npc',
        blocking: true,
        role: 'mom',
        questionTarget: 6,
        opener: "Annen masada oturuyor. Elleri dizinde, gözleri seninle.",
        context: "Final veda sahnesi. Anne henüz konuşmadı; oğlunu süzüyor."
    },
    record_player: {
        id: 'record_player',
        name: 'Eski Pikap',
        kind: 'record_player',
        blocking: true,
        role: 'inner_voice',
        questionTarget: 3,
        opener: "Pikabın iğnesi cızırtıyla iniyor. Bob Dylan'ın sesi odayı dolduruyor.",
        context: "Pikabın üzerinde 1973 yapımı 'Knockin' on Heaven's Door' plağı dönüyor. Şarkının melankolisi, karakterin gitme zorunluluğuyla birleşiyor. Müzik ona kaçmak istediği her şeyi hatırlatıyor."
    },
};
