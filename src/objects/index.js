// 7 etkileşim nesnesi. Faz 3'te statik lore yerine AI çağrılarına geçtik;
// her nesne bir 'role' (inner_voice ya da mom) ve sahnesini AI'ya açıklayan
// bir 'context' taşır. 'opener' ise diyalog kutusu açılırken oyuncuya
// gösterilen sahne kuran tek satırlık metin (AI çağrısından önce).

export const objects = {
    // qaPattern: her turun tipi (open=açık uçlu, choice=3 şıklı).
    // 8 nesne × 3 tur = 24 tur. 4 nesne O-C-O, 4 nesne C-O-C → tam 12 açık + 12 şıklı.

    letter: {
        id: 'letter',
        name: 'Askerlik Celbi',
        kind: 'letter',
        blocking: true,
        role: 'inner_voice',
        questionTarget: 3,
        qaPattern: ['open', 'choice', 'open'],
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
        qaPattern: ['choice', 'open', 'choice'],
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
        qaPattern: ['open', 'choice', 'open'],
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
        qaPattern: ['choice', 'open', 'choice'],
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
        qaPattern: ['open', 'choice', 'open'],
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
        qaPattern: ['open', 'choice', 'open'],
        opener: "Camda fırtına. Ufukta o uzun, kara bulut iniyor.",
        context: "Mutfak penceresinin önünde dururken dışarıdaki fırtınayı izliyor. 'That long black cloud is comin' down' satırının görsel karşılığı. Gökyüzü adeta bir kapı gibi çalınıyor."
    },
    mom: {
        id: 'mom',
        name: 'Anne',
        kind: 'npc',
        blocking: true,
        role: 'mom',
        questionTarget: 3,
        qaPattern: ['choice', 'open', 'choice'],
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
        qaPattern: ['choice', 'open', 'choice'],
        opener: "Pikabın iğnesi cızırtıyla iniyor. Bob Dylan'ın sesi odayı dolduruyor.",
        context: "Pikabın üzerinde 1973 yapımı 'Knockin' on Heaven's Door' plağı dönüyor. Şarkının melankolisi, karakterin gitme zorunluluğuyla birleşiyor. Müzik ona kaçmak istediği her şeyi hatırlatıyor."
    },

    // ─── STATİK LORE NESNELERİ (Easter Egg) ─────────────────────────
    // AI çağırmaz, burden değiştirmez, sadece sabit Türkçe metin gösterir.
    // Pat Garrett & Billy the Kid (1973) referansları.

    movie_ticket: {
        id: 'movie_ticket',
        name: 'Sinema Bileti',
        kind: 'movie_ticket',
        blocking: true,
        lore: true,
        loreText: "Masada 1973 yazından kalma yıpranmış bir sinema bileti duruyor: 'Pat Garrett & Billy the Kid'. İki eski dostun birbirine silah çektiği, kanun ve özgürlüğün çarpıştığı o hikaye... Bugün nedense bana çok tanıdık geliyor."
    },
    lore_record: {
        id: 'lore_record',
        name: 'Plak Çalar',
        kind: 'lore_record',
        blocking: true,
        lore: true,
        loreText: "Pikabın iğnesi çoktan susmuş bir plağın üzerinde duruyor. Çiziklerin arasında kalan o akustik gitar tınısı, tozlu yollarda yankılanan eski bir batı ağıdını andırıyor."
    },
    faded_photo: {
        id: 'faded_photo',
        name: 'Solmuş Fotoğraf',
        kind: 'faded_photo',
        blocking: true,
        lore: true,
        loreText: "Duvarda iki adamın solmuş bir fotoğrafı var. Biri göğsünde parlak bir teneke taşıyor, diğeri ise sadece kendi kurallarına inanıyor. İkisi de günün birinde aynı kapıyı çalacaklarını o günlerde bilmiyorlardı."
    },
    dusty_boots: {
        id: 'dusty_boots',
        name: 'Tozlu Çizmeler',
        kind: 'dusty_boots',
        blocking: true,
        lore: true,
        loreText: "Köşede duran eski, yıpranmış deri çizmeler... Tıpkı nehir kenarında göğsünden vurulup son nefesini veren o yorgun şerifin giydiklerine benziyor. Yürünecek ne kadar yol kaldı ki?"
    },
    old_radio: {
        id: 'old_radio',
        name: 'Eski Radyo',
        kind: 'old_radio',
        blocking: true,
        lore: true,
        loreText: "Radyodan boğuk bir cızırtı yükseliyor. Spiker uzaklardaki, ormanların içindeki o anlamsız savaşın bilançosunu okuyor. Anlaşılan o ki, silahlar sadece eski vahşi batıda patlamıyor."
    },
};
