// O'zbek lotin alifbosidan kirill alifbosiga o'girish
class UzbekTransliterator {
    constructor() {
        // Kengaytirilgan so'zlar lug'ati
        this.wordDictionary = {
            // Salomlashish
            'assalomu': 'ассалому',
            'alaykum': 'алайкум',
            'salom': 'салом',
            'xayrli': 'хайрли',
            'kun': 'кун',
            'tong': 'тонг',
            'kech': 'кеч',
            'ertalab': 'эрталаб',
            'kechqurun': 'кечкурун',
            
            // Muhim so'zlar
            'xabar': 'хабар',
            'muhim': 'мухим',
            'diqqat': 'диккат',
            'e\'tibor': 'этибор',
            'hurmatli': 'хурматли',
            'aziz': 'азиз',
            'qadrli': 'кадрли',
            
            // Bank/moliya
            'bank': 'банк',
            'mijoz': 'мижоз',
            'foydalanuvchi': 'фойдаланувчи',
            'hisob': 'хисоб',
            'karta': 'карта',
            'to\'lov': 'тулов',
            'pul': 'пул',
            'summa': 'сумма',
            'kredit': 'кредит',
            'foiz': 'фоиз',
            
            // Harakatlar
            'bosing': 'босинг',
            'tanlang': 'танланг',
            'kiriting': 'киритинг',
            'kuting': 'кутинг',
            'tekshiring': 'текширинг',
            'tasdiqlang': 'тасдикланг',
            'bekor': 'бекор',
            'qiling': 'килинг',
            'eshiting': 'эшитинг',
            'qaytaring': 'кайтаринг',
            
            // Raqamlar
            'bir': 'бир',
            'ikki': 'икки',
            'uch': 'уч',
            'to\'rt': 'турт',
            'besh': 'беш',
            'olti': 'олти',
            'yetti': 'етти',
            'sakkiz': 'саккиз',
            'to\'qqiz': 'туккиз',
            'o\'n': 'ун',
            'nol': 'нол',
            'raqam': 'ракам',
            'raqamini': 'ракамини',
            'tugma': 'тугма',
            'tugmani': 'тугмани',
            
            // Vaqt
            'soat': 'соат',
            'daqiqa': 'дакика',
            'soniya': 'сония',
            'bugun': 'бугун',
            'ertaga': 'эртага',
            'kecha': 'кеча',
            
            // Umumiy
            'ha': 'ха',
            'yo\'q': 'йук',
            'rahmat': 'рахмат',
            'iltimos': 'илтимос',
            'kechirasiz': 'кечирасиз',
            'uzr': 'узр',
            'uchun': 'учун',
            'bilan': 'билан',
            'haqida': 'хакида',
            'bo\'yicha': 'буйича',
            'orqali': 'оркали',
            'kerak': 'керак',
            'mumkin': 'мумкин',
            'mavjud': 'мавжуд',
            'yo\'q': 'йук',
            'bor': 'бор',
            'yangi': 'янги',
            'eski': 'эски',
            'katta': 'катта',
            'kichik': 'кичик',
            'yaxshi': 'яхши',
            'yomon': 'ёмон',
            'to\'g\'ri': 'тугри',
            'xato': 'хато',
            'muvaffaqiyatli': 'муваффакиятли',
            'tugallandi': 'тугалланди',
            'bajarildi': 'бажарилди',
            
            // Maxsus iboralar
            'e\'tiboringiz': 'этиборингиз',
            'ma\'lumot': 'малумот',
            'so\'rov': 'суров',
            'javob': 'жавоб',
            'xizmat': 'хизмат',
            'yordam': 'ёрдам',
            'qo\'llab-quvvatlash': 'куллаб-кувватлаш',
            'aloqa': 'алока',
            'markaz': 'марказ',
            'bo\'lim': 'булим',
            'tizim': 'тизим',
            'dastur': 'дастур',
            'ilova': 'илова',
            
            // O'zbekiston
            'o\'zbekiston': 'Ўзбекистон',
            'toshkent': 'Тошкент',
            'qashqadaryo': 'Қашкадарё',
            'samarqand': 'Самарканд',
            'buxoro': 'Бухоро',
            'xorazm': 'Хоразм',
            'navoiy': 'Навоий',
            'jizzax': 'Жиззах',
            'sirdaryo': 'Сирдарё',
            'surxondaryo': 'Сурхондарё',
            'andijon': 'Андижон',
            'farg\'ona': 'Фаргона',
            'namangan': 'Наманган'
        };
        
        // Harflar mapping (faqat rus harflari)
        this.letterMapping = {
            'a': 'а', 'b': 'б', 'd': 'д', 'e': 'э',
            'f': 'ф', 'g': 'г', 'h': 'х', 'i': 'и',  // h -> x (rus)
            'j': 'ж', 'k': 'к', 'l': 'л', 'm': 'м',
            'n': 'н', 'o': 'о', 'p': 'п', 'q': 'к',   // q -> k (rus)
            'r': 'р', 's': 'с', 't': 'т', 'u': 'у',
            'v': 'в', 'x': 'х', 'y': 'й', 'z': 'з'
        };
    }
    
    transliterate(text) {
        if (!text) return '';
        
        let result = text.toLowerCase();
        
        // 1. Maxsus belgilarni almashtirish (faqat rus harflari)
        result = result.replace(/o'/g, 'у');  // o' -> u
        result = result.replace(/g'/g, 'г');  // g' -> g
        result = result.replace(/sh/g, 'ш');
        result = result.replace(/ch/g, 'ч');
        result = result.replace(/ng/g, 'нг');
        result = result.replace(/'/g, '');
        
        // 2. Yo, ye, yu, ya kombinatsiyalarini almashtirish
        result = result.replace(/yo/g, 'ё');
        result = result.replace(/ye/g, 'е');
        result = result.replace(/yu/g, 'ю');
        result = result.replace(/ya/g, 'я');
        
        // 3. So'zlarni lug'atdan almashtirish
        Object.keys(this.wordDictionary).forEach(word => {
            const regex = new RegExp(`\\b${word}\\b`, 'gi');
            result = result.replace(regex, this.wordDictionary[word]);
        });
        
        // 4. Qolgan harflarni almashtirish
        result = result.split('').map(char => {
            return this.letterMapping[char] || char;
        }).join('');
        
        // 5. Bosh harflarni to'g'rilash (gap boshi)
        result = result.charAt(0).toUpperCase() + result.slice(1);
        result = result.replace(/\. ([а-я])/g, (match, p1) => '. ' + p1.toUpperCase());
        
        console.log(`Transliteration: "${text}" -> "${result}"`);
        return result;
    }
}

module.exports = new UzbekTransliterator();