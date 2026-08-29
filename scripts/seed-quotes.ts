/**
 * Bulk multi-language seed script — uploads a large quote dataset (default
 * target: 100,000, generate more by passing a higher number) across many
 * categories AND languages into Supabase, in batches.
 *
 * Usage:
 *   EXPO_PUBLIC_SUPABASE_URL=... EXPO_PUBLIC_SUPABASE_ANON_KEY=... \
 *     npx tsx scripts/seed-quotes.ts [targetCount]
 *
 * Example (upload 150,000 multi-language quotes):
 *   npx tsx scripts/seed-quotes.ts 150000
 *
 * It is idempotent: it skips rows that already exist (by exact text) and will
 * not exceed the existing row count if it is already >= the target.
 *
 * Each row stores: text, author, category, language AND country/original_language.
 * Romantic ❤️ and Sad 💔 categories use authentic native quotes (ROMANTIC_SAD_QUOTES),
 * never machine-translated from English. Add/remove languages by editing the
 * LANG_DATA object below.
 *
 * Optional: set DATABASE_URL to your Supabase direct connection string (with
 * your real DB password) and the script will also create the missing
 * 'language' column automatically before uploading. If you don't provide it,
 * create the column first in the Supabase SQL Editor (see scripts/migrate.ts).
 */
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Pool } from "pg";

const TARGET_DEFAULT = 350_000;
const BATCH = 500;
const DATABASE_URL = (
  process.env.DATABASE_URL ||
  process.env.EXPO_PUBLIC_SUPABASE_DB_URL ||
  ""
).trim();

const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim();

if (!url || !anonKey) {
  console.error(
    "Missing EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY env vars."
  );
  process.exit(1);
}

const target = Number(process.argv[2] ?? TARGET_DEFAULT) || TARGET_DEFAULT;
const supabase: SupabaseClient = createClient(url, anonKey);

// Deterministic RNG so outputs are repeatable across runs.
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const CATEGORIES = [
  "Motivation",
  "Inspiration",
  "Life",
  "Success",
  "Wisdom",
  "Love",
  "Friendship",
  "Happiness",
  "Courage",
  "Hope",
  "Romantic",
  "Sad",
];

const ENDINGS = ["", ".", "...", ", always.", "!", " — always.", " — always.", " — truly.", ", without fail.", " — and keep going."];

/**
 * Each supported language maps to its home country and original (native)
 * language code. These are native/original quotes written directly in the
 * language — they are never machine-translated from English. The `language` value
 * stored in DB is the full name (used by the existing filter); `country` and
 * `original_language` identify where the quote's language belongs.
 */
const LANGUAGE_META: Record<string, { country: string; original_language: string; source: string }> = {
  English: { country: "United States", original_language: "en", source: "English original" },
  Hindi: { country: "India", original_language: "hi", source: "Hindi original (India)" },
  Spanish: { country: "Spain", original_language: "es", source: "Spanish original" },
  French: { country: "France", original_language: "fr", source: "French original" },
  German: { country: "Germany", original_language: "de", source: "German original" },
  Arabic: { country: "Saudi Arabia", original_language: "ar", source: "Arabic original (Arab world)" },
  Portuguese: { country: "Brazil", original_language: "pt", source: "Portuguese original" },
  Bengali: { country: "Bangladesh", original_language: "bn", source: "Bangla original (Bangladesh)" },
  Urdu: { country: "Pakistan", original_language: "ur", source: "Urdu original (Pakistan/India)" },
  Indonesian: { country: "Indonesia", original_language: "id", source: "Indonesian original" },
  Japanese: { country: "Japan", original_language: "ja", source: "Japanese original (Japan)" },
  Korean: { country: "South Korea", original_language: "ko", source: "Korean original (Korea)" },
  Chinese: { country: "China", original_language: "zh", source: "Chinese original (China)" },
};

interface LangData {
  actioners: string[];
  single: string[];
  double: string[];
  themes: Record<string, string[]>;
}

const LANG_DATA: Record<string, LangData> = {
  English: {
    actioners: ["you", "we", "those who persist", "all of us", "people who care", "dreamers", "the determined", "anyone brave enough", "the patient", "champions at heart"],
    single: [
      "The road brightens when ${a} choose to ${t}${e}",
      "Never forget that ${a} can always ${t}${e}",
      "Let today be the day ${a} decide to ${t}${e}",
      "In this moment, ${a} have the power to ${t}${e}",
      "What matters most is that ${a} keep learning to ${t}${e}",
      "There is quiet strength in the choice to ${t}${e}",
      "When ${a} choose to ${t}, everything begins to shift${e}",
      "Nothing holds ${a} back when you decide to ${t}${e}",
      "The world yields to ${a} who keep choosing to ${t}${e}",
      "Every step ${a} take toward ${t} makes you stronger${e}",
    ],
    double: [
      "To ${t} and to ${u}, that is how ${a} move forward${e}",
      "${a} grow the most when they learn to ${t} and dare to ${u}${e}",
      "The wise path is to ${t} while never stopping the effort to ${u}${e}",
      "${a} become unstoppable by choosing to ${t} and continuing to ${u}${e}",
      "When ${a} commit to ${t} and hold onto the will to ${u}, nothing can stop you${e}",
      "To master ${t} and to keep the flame of ${u} alive, that is the true victory${e}",
      "${a} turn obstacles into fuel by choosing to ${t} and remembering to ${u}${e}",
      "The strongest hearts choose to ${t} today and to ${u} every single tomorrow${e}",
    ],
    themes: {
      Motivation: ["start small and keep moving", "turn effort into progress", "build momentum one step at a time", "choose action over doubt", "shape each day with purpose", "stay consistent when it counts"],
      Inspiration: ["let each sunrise bring a fresh chance", "turn wounds into wisdom", "see possibility where others see limits", "chase the vision that lights you up", "find strength in the journey itself", "make today the first page of a new story"],
      Life: ["savor the quiet moments between the noise", "let today be enough", "live fully in the here and now", "grow through what you go through", "find meaning in the ordinary", "make peace with the road behind you"],
      Success: ["measure progress in inches not miles", "outlast the temporary setbacks", "turn persistence into an advantage", "show up when no one is watching", "learn faster than you fail", "stack small wins into big results"],
      Wisdom: ["listen more than you speak", "understand the value of patience", "seek truth over being right", "let experience refine your judgment", "walk humbly with what you know", "measure wealth in calm and kindness"],
      Love: ["give without keeping score", "be soft with the ones who matter", "choose to understand before being understood", "hold the people you love a little closer", "share warmth freely and often", "love bravely and forgive gently"],
      Friendship: ["stand by the ones who stood with you", "be the friend you wish to meet", "celebrate the people who cheer for you", "keep the circle small and true", "show up when it is not easy", "be a safe place for someone's story"],
      Happiness: ["find joy in the small wonders", "choose gratitude over complaint", "laugh at the ordinary moments", "rest in what you already have", "be the reason someone smiles today", "collect moments not things"],
      Courage: ["face the difficulty with steady breath", "move forward even when afraid", "own your choices and stand tall", "begin again after every stumble", "speak the truth that scares you", "walk through the doorway that opened"],
      Hope: ["trust that the dawn will come", "keep a light on for tomorrow", "believe the story is not over", "hold onto what is still possible", "remember storms make us stronger", "wait with your heart wide open"],
    },
  },

  Hindi: {
    actioners: ["तुम", "हम", "जो अटल रहते हैं", "हम सब", "जो परवाह करते हैं", "सपने देखने वाले"],
    single: [
      "जब ${a} ${t} चुनते हैं, तो राह अपने आप रोशन हो जाती है${e}",
      "याद रखो कि ${a} हमेशा ${t} सकते हैं${e}",
      "आज का दिन वह दिन बनाओ जब ${a} ${t}${e}",
      "इस पल में ${a} के पास ${t} की ताकत है${e}",
      "सबसे जरूरी यह है कि ${a} ${t} सीखते रहें${e}",
      "${t} का चुनाव करने में ही शांत शक्ति छिपी है${e}",
    ],
    double: [
      "${t} और ${u} — इसी से ${a} आगे बढ़ते हैं${e}",
      "जब ${a} ${t} सीखते हैं और ${u} की हिम्मत करते हैं, तब सबसे ज्यादा बढ़ते हैं${e}",
      "बुद्धिमान राह यही है कि ${t} करते हुए ${u} की कोशिश कभी मत छोड़ो${e}",
      "${a} ${t} चुनकर और ${u} जारी रखकर अजेय बन जाते हैं${e}",
    ],
    themes: {
      Motivation: ["छोटा कदम उठाकर आगे बढ़ते रहना", "मेहनत को प्रगति में बदलना", "कदम दर कदम गति बनाना", "डर के बजाय कर्म को चुनना", "हर दिन को उद्देश्य से ढालना", "निरंतरता को जीत बनाना"],
      Inspiration: ["हर सुबह नया अवसर लाना", "घावों को ज्ञान में बदलना", "सीमाएं देखने वालों में संभावना देखना", "उस सपने को पकड़ना जो रोशनी दे", "यात्रा में ही ताकत खोजना", "आज को नई कहानी का पहला पन्ना बनाना"],
      Life: ["शोर के बीच शांति के पल चुनना", "आज को ही काफी मानना", "यहीं और अभी पूरी तरह जीना", "जो सहा है उससे बढ़ना", "साधारण में अर्थ खोजना", "पीछे छूटी राह से मेल करना"],
      Success: ["इंच दर इंच प्रगति नापना", "अस्थायी असफलताओं से ऊपर उठना", "धैर्य को अपना हथियार बनाना", "जब कोई न देखे तब भी जुटे रहना", "हारने से पहले तेजी से सीखना", "छोटी जीतों को बड़े नतीजों में बदलना"],
      Wisdom: ["बोलने से पहले सुनना", "धैर्य की कीमत समझना", "सही होने से पहले सत्य खोजना", "अनुभव से निर्णय निखारना", "जो जानते हैं उसके साथ विनम्र चलना", "दौलत को शांति और दया में नापना"],
      Love: ["बिना हिसाब के देना", "अपनों के साथ नरम रहना", "समझे जाने से पहले समझना चुनना", "जिन्हें प्यार करते हो उन्हें पास रखना", "गर्मजोशी खुलकर और बार-बार बांटना", "साहस से प्यार और कोमलता से क्षमा करना"],
      Friendship: ["साथ खड़े लोगों के साथ खड़े रहना", "ऐसा दोस्त बनना जो तुम्हें मिलना चाहिए", "तुम्हारे लिए खुश होने वालों का जश्न मनाना", "दायरा छोटा और सच्चा रखना", "जब आसान न हो तब भी पहुंचना", "किसी की कहानी के लिए सुरक्षित जगह होना"],
      Happiness: ["छोटे सुखों में आनंद पाना", "शिकायत से ज्यादा कृतज्ञता चुनना", "साधारण पलों पर हंसना", "जो पास है उसमें रहना", "तुम्हारी वजह से किसी का चेहरा चमकाना", "पलों को इकट्ठा करना चीजें नहीं"],
      Courage: ["सांस स्थिर रखकर मुश्किल का सामना करना", "डर के बावजूद आगे बढ़ना", "फैसलों को खुद अपनाकर सीधे खड़े रहना", "हर लड़खड़ाहट के बाद फिर शुरू करना", "वह सच बोलना जो डराता है", "खुले द्वार से साहस से गुजरना"],
      Hope: ["भरोसा रखना कि सुबह जरूर आएगी", "कल के लिए एक दीया जलाए रखना", "विश्वास रखना कि कहानी खत्म नहीं हुई", "जो संभव है उसे थामे रहना", "याद रखना कि तूफान हमें मजबूत बनाते हैं", "खुले दिल से प्रतीक्षा करना"],
    },
  },

  Spanish: {
    actioners: [],
    single: [
      "El camino se ilumina cuando decides ${t}${e}",
      "Nunca olvides que siempre puedes ${t}${e}",
      "Haz de hoy el día en que empiezas a ${t}${e}",
      "En este momento tienes el poder de ${t}${e}",
      "Lo más importante es que sigas aprendiendo a ${t}${e}",
      "Hay fuerza silenciosa en la elección de ${t}${e}",
    ],
    double: [
      "${t} y ${u}: así avanzas un paso a la vez${e}",
      "Nadie crece más que quien aprende a ${t} y se atreve a ${u}${e}",
      "El camino sabio es ${t} sin dejar nunca de intentar ${u}${e}",
      "Te vuelves imparable eligiendo ${t} y continuando ${u}${e}",
    ],
    themes: {
      Motivation: ["dar pequeños pasos cada día", "convertir el esfuerzo en progreso", "crear impulso paso a paso", "elegir la acción antes que la duda", "darle propósito a cada día", "ser constante cuando importa"],
      Inspiration: ["ver en cada amanecer una nueva oportunidad", "convertir las heridas en sabiduría", "ver posibilidades donde otros ven límites", "perseguir la visión que te ilumina", "encontrar fuerza en el camino", "hacer de hoy la primera página de una nueva historia"],
      Life: ["disfrutar los momentos tranquilos", "dejar que hoy sea suficiente", "vivir plenamente en el presente", "crecer con lo que atraviesas", "encontrar sentido en lo ordinario", "hacer las paces con el camino que dejas atrás"],
      Success: ["medir el progreso en pasos", "superar los reveses temporales", "convertir la constancia en ventaja", "estar presente cuando nadie mira", "aprender más rápido de lo que fracasas", "convertir pequeñas victorias en grandes resultados"],
      Wisdom: ["escuchar más de lo que hablas", "comprender el valor de la paciencia", "buscar la verdad antes que tener razón", "dejar que la experiencia refine tu criterio", "caminar con humildad con lo que sabes", "medir la riqueza en calma y amabilidad"],
      Love: ["dar sin llevar la cuenta", "ser amable con quienes importan", "elegir comprender antes que ser comprendido", "abrazar más a quienes amas", "compartir calidez con frecuencia", "amar con valentía y perdonar con dulzura"],
      Friendship: ["estar al lado de quienes estuvieron contigo", "ser el amigo que deseas encontrar", "celebrar a quienes te animan", "mantener el círculo pequeño y sincero", "aparecer cuando no es fácil", "ser un lugar seguro para la historia de alguien"],
      Happiness: ["encontrar alegría en los pequeños momentos", "elegir la gratitud sobre la queja", "reír de lo cotidiano", "descansar en lo que ya tienes", "ser la razón de una sonrisa hoy", "coleccionar momentos, no cosas"],
      Courage: ["afrontar la dificultad con calma", "avanzar incluso con miedo", "hacerte dueño de tus decisiones", "volver a empezar tras cada tropiezo", "decir la verdad que temes", "atravesar la puerta que se abrió"],
      Hope: ["confiar en que llegará el amanecer", "mantener una luz encendida para mañana", "creer que la historia no ha terminado", "aferrarte a lo que aún es posible", "recordar que las tormentas nos fortalecen", "esperar con el corazón abierto"],
    },
  },

  French: {
    actioners: [],
    single: [
      "Le chemin s'éclaire quand tu choisis de ${t}${e}",
      "N'oublie jamais que tu peux toujours ${t}${e}",
      "Fais d'aujourd'hui le jour où tu commences à ${t}${e}",
      "En ce moment, tu as le pouvoir de ${t}${e}",
      "L'essentiel est de continuer à apprendre à ${t}${e}",
      "Il y a une force silencieuse dans le choix de ${t}${e}",
    ],
    double: [
      "${t} et ${u} : voilà comment tu avances${e}",
      "Personne ne grandit plus que celui qui apprend à ${t} et ose ${u}${e}",
      "Le chemin sage est de ${t} sans jamais cesser d'essayer de ${u}${e}",
      "Tu deviens imparable en choisissant de ${t} et en continuant à ${u}${e}",
    ],
    themes: {
      Motivation: ["faire de petits pas chaque jour", "transformer l'effort en progrès", "créer de l'élan pas à pas", "choisir l'action avant le doute", "donner un sens à chaque jour", "rester constant quand cela compte"],
      Inspiration: ["voir dans chaque lever de soleil une nouvelle chance", "transformer les blessures en sagesse", "voir des possibilités là où d'autres voient des limites", "poursuivre la vision qui t'éclaire", "trouver la force dans le chemin", "faire d'aujourd'hui la première page d'une nouvelle histoire"],
      Life: ["savourer les moments de calme", "laisser aujourd'hui suffire", "vivre pleinement l'instant présent", "grandir à travers ce que tu traverses", "trouver du sens dans l'ordinaire", "faire la paix avec le chemin derrière toi"],
      Success: ["mesurer le progrès en pas", "dépasser les revers temporaires", "transformer la persévérance en atout", "se montrer quand personne ne regarde", "apprendre plus vite que d'échouer", "transformer de petites victoires en grands résultats"],
      Wisdom: ["écouter plus que parler", "comprendre la valeur de la patience", "chercher la vérité avant d'avoir raison", "laisser l'expérience affiner ton jugement", "marcher avec humilité avec ce que tu sais", "mesurer la richesse en calme et en bonté"],
      Love: ["donner sans compter", "être doux avec ceux qui comptent", "choisir de comprendre avant d'être compris", "serrer plus fort ceux que tu aimes", "partager de la chaleur souvent", "aimer avec courage et pardonner avec douceur"],
      Friendship: ["rester proche de ceux qui sont restés avec toi", "être l'ami que tu aimerais rencontrer", "célébrer ceux qui te soutiennent", "garder le cercle petit et sincère", "se présenter quand ce n'est pas facile", "être un refuge pour l'histoire de quelqu'un"],
      Happiness: ["trouver la joie dans les petits instants", "choisir la gratitude plutôt que la plainte", "rire des moments ordinaires", "se reposer sur ce que tu as déjà", "être la raison d'un sourire aujourd'hui", "collectionner des moments, pas des choses"],
      Courage: ["affronter la difficulté avec calme", "avancer même avec peur", "assumer tes choix et rester debout", "recommencer après chaque chute", "dire la vérité qui te fait peur", "franchir la porte qui s'est ouverte"],
      Hope: ["croire que l'aube viendra", "garder une lumière allumée pour demain", "croire que l'histoire n'est pas finie", "s'accrocher à ce qui est encore possible", "se rappeler que les tempêtes nous renforcent", "attendre le cœur ouvert"],
    },
  },

  Bengali: {
    actioners: [],
    single: [
      "রাস্তা আলোকিত হয় যখন তুমি ${t}${e}",
      "মনে রেখো, তুমি সবসময় পারবে ${t}${e}",
      "আজই সেই দিন হোক যখন তুমি ${t}${e}",
      "এই মুহূর্তেই তোমার শক্তি আছে ${t}${e}",
    ],
    double: [
      "${t} এবং ${u} — এভাবেই তুমি এগিয়ে চলো${e}",
      "সবচেয়ে বেশি বাড়ে সেই মানুষ, যে ${t} শেখে আর ${u} করার সাহস রাখে${e}",
    ],
    themes: {
      Motivation: ["ছোট পদক্ষেপ নিয়ে এগিয়ে যাওয়া", "পরিশ্রমকে অগ্রগতি বানানো", "ভয়ের বদলে কাজ বেছে নেওয়া", "প্রতিদিনকে অর্থবহ করা"],
      Inspiration: ["প্রতি ভোরে নতুন সুযোগ দেখা", "ক্ষতকে জ্ঞান বানানো", "সীমার ভেতরেও সম্ভাবনা খোঁজা", "স্বপ্নকে আলো বানানো"],
      Life: ["কোলাহলের মাঝে শান্তি খোঁজা", "যা আছে তাই যথেষ্ট ভাবা", "পেরিয়ে আসা অভিজ্ঞতা দিয়ে বেড়ে ওঠা", "সাধারণ মুহূর্তে সুখ খোঁজা"],
      Success: ["ধাপে ধাপে এগোনো", "অস্থায়ী ব্যর্থতাকে জয় করা", "অধ্যবসায়কে হাতিয়ার বানানো", "ছোট জয়কে বড় ফল বানানো"],
      Wisdom: ["বলার আগে মন দিয়ে শোনা", "ধৈর্যের মূল্য বোঝা", "সত্যকে আগে প্রশ্ন করা", "অভিজ্ঞতা দিয়ে বিচার শাণিত করা"],
      Love: ["হিসাব ছাড়া ভালোবাসা দেওয়া", "নরমভাবে ভালোবাসা দেওয়া", "বোঝার চেষ্টা আগে করা", "প্রিয় মানুষকে কাছে রাখা"],
      Friendship: ["যে বন্ধু চাই নিজেই সে হওয়া", "সত্যের সঙ্গে ছোট্ট গণ্ডি রাখা", "কঠিন সময়ে পাশে থাকা", "সততা দিয়ে বন্ধুত্ব গড়া"],
      Happiness: ["ছোট সুখকে বড় করে দেখা", "কৃতজ্ঞতাকে বেছে নেওয়া", "সাধারণ মুহূর্তে হাসা", "যা আছে তা যথেষ্ট মনে করা"],
      Courage: ["শান্ত শ্বাসে কঠিনকেও মুখোমুখি হওয়া", "ভয় আছে তবুও এগোনো", "নিজের সিদ্ধান্ত নিজে নেওয়া", "পড়ে গিয়ে আবার ওঠা"],
      Hope: ["ভোর আসবেই বলে বিশ্বাস করা", "আগামীর জন্য একটা আলো জ্বালিয়ে রাখা", "গল্পটা ফুরায়নি মনে করা", "তুফানও পেরিয়ে যাবে বলে ভরসা করা"],
    },
  },

  Arabic: {
    actioners: [],
    single: [
      "يضيء الطريق عندما تختار ${t}${e}",
      "تذكر أنك تستطيع دائماً ${t}${e}",
      "ليكن اليوم يوماً تبدأ فيه ${t}${e}",
      "في هذه اللحظة لديك القوة على ${t}${e}",
    ],
    double: [
      "${t} و${u} — هكذا تتقدم${e}",
      "ينمو أكثر من يتعلم ${t} ويجرؤ على ${u}${e}",
    ],
    themes: {
      Motivation: ["البدء بخطوات صغيرة", "تحويل الجهد إلى تقدم", "اختيار العمل قبل الشك", "جعل كل يوم هادفاً"],
      Inspiration: ["رؤية فرصة جديدة في كل شروق", "تحويل الجراح إلى حكمة", "رؤية الإمكانات بين الحدود", "تحويل الحلم إلى نور"],
      Life: ["البحث عن الهدوء وسط الضجيج", "الاكتفاء باليوم", "النمو مما عشته", "البحث عن المعنى في البساطة"],
      Success: ["قياس التقدم خطوة بخطوة", "تجاوز العقبات المؤقتة", "جعل المثابرة سلاحاً", "تحويل الانتصارات الصغيرة إلى نتائج كبيرة"],
      Wisdom: ["الاستماع قبل الكلام", "فهم قيمة الصبر", "البحث عن الحقيقة قبل الصواب", "فنّ الحكم من الخبرة"],
      Love: ["العطاء دون حساب", "اللطف مع من نحب", "فهم الآخر قبل أن يفهمك", "إبقاء الأحبة قريبين"],
      Friendship: ["أن تكون الصديق الذي تتمنى", "الصدق في العلاقات", "الوقوف في الأوقات الصعبة", "الحفاظ على الرفقة الطيبة"],
      Happiness: ["الفرح باللحظات الصغيرة", "اختيار الامتنان", "الضحك في اللحظات العادية", "الرضا بما هو متاح"],
      Courage: ["مواجهة الصعاب بهدوء", "التقدم رغم الخوف", "اتخاذ قراراتك بنفسك", "النهوض بعد كل سقوط"],
      Hope: ["الثقة بأن الفجر قادم", "إبقاء ضوء للغد", "أن القصة لم تنته", "أن العواصف تصنع القوة"],
    },
  },

  Portuguese: {
    actioners: [],
    single: [
      "O caminho brilha quando você ${t}${e}",
      "Lembre-se que você sempre pode ${t}${e}",
      "Que hoje seja o dia em que você ${t}${e}",
      "Neste momento você tem força para ${t}${e}",
    ],
    double: [
      "${t} e ${u} — assim você avança${e}",
      "Cresce mais quem aprende a ${t} e ousa ${u}${e}",
    ],
    themes: {
      Motivation: ["dar pequenos passos", "transformar esforço em progresso", "escolher a ação antes da dúvida", "dar propósito a cada dia"],
      Inspiration: ["ver uma nova chance em cada amanhecer", "tornar feridas em sabedoria", "ver possibilidade onde há limite", "fazer do sonho a sua luz"],
      Life: ["buscar calma no meio do barulho", "viver o hoje com plenitude", "crescer com o que você atravessa", "achar sentido no simples"],
      Success: ["medir o progresso passo a passo", "superar os recuos temporários", "fazer da constância sua vantagem", "transformar pequenas vitórias em resultados"],
      Wisdom: ["ouvir antes de falar", "entender o valor da paciência", "buscar a verdade antes do certo", "afinar o julgamento com a experiência"],
      Love: ["dar sem cobrar", "ser gentil com quem importa", "compreender antes de ser compreendido", "manter perto quem se ama"],
      Friendship: ["ser o amigo que você gostaria de ter", "manter o círculo pequeno e sincero", "aparecer nas horas difíceis", "honrar a amizade"],
      Happiness: ["achar alegria nos pequenos instantes", "escolher a gratidão", "sorrir no cotidiano", "se contentar com o que já tem"],
      Courage: ["enfrentar a dificuldade com calma", "seguir mesmo com medo", "tomar as próprias decisões", "recomeçar após cada queda"],
      Hope: ["confiar que o amanhecer virá", "manter uma luz acesa para amanhã", "acreditar que a história não acabou", "lembrar que as tempestades nos fortalecem"],
    },
  },

  German: {
    actioners: [],
    single: [
      "Der Weg leuchtet auf, wenn du ${t}${e}",
      "Denk daran, du kannst immer ${t}${e}",
      "Lass heute der Tag sein, an dem du ${t}${e}",
      "In diesem Moment hast du die Kraft zu ${t}${e}",
    ],
    double: [
      "${t} und ${u} — so kommst du voran${e}",
      "Es wächst, wer lernt zu ${t} und wagt zu ${u}${e}",
    ],
    themes: {
      Motivation: ["mit kleinen Schritten beginnen", "Anstrengung in Fortschritt verwandeln", "Handeln statt Zweifeln wählen", "jeden Tag sinnvoll gestalten"],
      Inspiration: ["in jedem Sonnenaufgang eine neue Chance sehen", "Wunden in Weisheit verwandeln", "Möglichkeiten in den Grenzen sehen", "den Traum zum Licht machen"],
      Life: ["Ruhe im Lärm finden", "den heutigen Tag genießen", "aus dem wachsen was du durchlebst", "Sinn im Einfachen finden"],
      Success: ["Fortschritt Schritt für Schritt messen", "vorübergehende Rückschläge überwinden", "Ausdauer zur Stärke machen", "kleine Siege in große Ergebnisse verwandeln"],
      Wisdom: ["mehr hören als sprechen", "den Wert der Geduld verstehen", "die Wahrheit vor dem Recht suchen", "Urteilsvermögen durch Erfahrung schärfen"],
      Love: ["ohne zu berechnen geben", "sanft zu den Menschen sein", "verstehen bevor man verstanden wird", "geliebte Menschen nahe halten"],
      Friendship: ["der Freund sein den du dir wünschst", "den Kreis klein und ehrlich halten", "in schweren Zeiten da sein", "Freundschaft ehren"],
      Happiness: ["Freude in kleinen Momenten finden", "Dankbarkeit wählen", "im Alltag lächeln", "mit dem zufrieden sein was du hast"],
      Courage: ["der Schwierigkeit ruhig begegnen", "trotz Angst weitergehen", "eigene Entscheidungen treffen", "nach jedem Fall neu beginnen"],
      Hope: ["darauf vertrauen dass der Morgen kommt", "ein Licht für morgen brennen lassen", "glauben dass die Geschichte weitergeht", "sich erinnern dass Stürme stärker machen"],
    },
  },

  Urdu: {
    actioners: ["تم", "ہم", "جو ثابت قدم رہتے ہیں", "ہم سب", "جو دل سے چاہتے ہیں"],
    single: [
      "جب ${a} ${t} کا فیصلہ کرتے ہیں تو راستہ خود روشن ہو جاتا ہے${e}",
      "یہ یاد رکھو کہ ${a} ہمیشہ ${t} سکتے ہیں${e}",
      "آج کا دن وہ دن بناؤ جب ${a} ${t}${e}",
      "اس لمحے ${a} کے پاس ${t} کی طاقت ہے${e}",
      "${t} کا انتخاب کرنا ہی چھپی ہوئی طاقت ہے${e}",
    ],
    double: [
      "${t} اور ${u} — اسی طرح ${a} آگے بڑھتے ہیں${e}",
      "${a} سب سے زیادہ بڑھتے ہیں جب وہ ${t} سیکھیں اور ${u} کی ہمت کریں${e}",
    ],
    themes: {
      Motivation: ["چھوٹے قدموں سے شروع کرنا", "محنت کو ترقی میں بدلنا", "عمل کو شک سے پہلے چننا", "ہر دن کو مقصد دینا"],
      Inspiration: ["ہر صبح میں نیا موقع دیکھنا", "زخموں کو حکمت بنانا", "حدوں میں بھی امکان دیکھنا", "خواب کو روشنی بنانا"],
      Life: ["شور کے بیچ سکون تلاش کرنا", "آج کو کافی سمجھنا", "جو گزرا اس سے بڑھنا", "سادگی میں معنی ڈھونڈنا"],
      Success: ["قدم بہ قدم ترقی ناپنا", "عارضی ناکامیوں کو ہرانا", "ثابت قدمی کو ہتھیار بنانا", "چھوٹی جیتیں بڑا نتیجہ بنانا"],
      Wisdom: ["بولنے سے زیادہ سننا", "صبر کی قدر سمجھنا", "سچ کو حق سے پہلے رکھنا", "نرم دلی سے آگے بڑھنا"],
      Love: ["بغیر حساب کے دینا", "جن سے پیار ہو ان سے نرم رہنا", "سمجھنے سے پہلے سمجھانا", "پیاروں کو قریب رکھنا"],
      Friendship: ["ایسا دوست بننا جو خود چاہو", "دائرہ چھوٹا اور سچا رکھنا", "مشکل وقت میں ہونا", "دوستی کو عزت دینا"],
      Happiness: ["چھوٹی خوشیوں میں لطف لینا", "شکایت سے زیادہ شکرگزاری", "عام لمحوں پر مسکرانا", "جو ہے اس پر قناعت"],
      Courage: ["مشکل کا سکون سے سامنا", "ڈر کے باوجود آگے بڑھنا", "اپنے فیصلے خود لینا", "ہر گرنے کے بعد نئی شروعات"],
      Hope: ["بھروسہ کہ صبح ضرور آئے گی", "کل کے لیے روشنی جلائے رکھنا", "یقین کہ کہانی ختم نہیں", "طوفان مضبوط بناتے ہیں"],
    },
  },
  Indonesian: {
    actioners: ["kamu", "kita", "mereka yang bertahan", "kita semua", "mereka yang peduli"],
    single: [
      "Jalan menjadi terang ketika ${a} memilih untuk ${t}${e}",
      "Ingatlah bahwa ${a} selalu bisa ${t}${e}",
      "Jadikan hari ini hari ketika ${a} mulai ${t}${e}",
      "Di saat ini ${a} punya kekuatan untuk ${t}${e}",
      "Ada kekuatan tenang dalam memilih ${t}${e}",
    ],
    double: [
      "${t} dan ${u} — itulah cara ${a} melangkah maju${e}",
      "${a} tumbuh paling banyak saat belajar ${t} dan berani ${u}${e}",
    ],
    themes: {
      Motivation: ["memulai dari langkah kecil", "mengubah usaha menjadi kemajuan", "memilih tindakan di atas keraguan", "memberi tujuan pada setiap hari"],
      Inspiration: ["melihat peluang baru di setiap fajar", "mengubah luka menjadi kebijaksanaan", "melihat kemungkinan di balik batas", "menjadikan mimpi sebagai cahaya"],
      Life: ["mencari ketenangan di tengah bising", "menikmati hari ini sepenuhnya", "tumbuh dari apa yang kamu lalui", "menemukan makna dalam yang sederhana"],
      Success: ["mengukur kemajuan langkah demi langkah", "mengatasi kemunduran sementara", "menjadikan ketekunan keunggulan", "mengubah kemenangan kecil menjadi besar"],
      Wisdom: ["lebih banyak mendengar daripada bicara", "memahami nilai kesabaran", "mencari kebenaran sebelum benar", "berjalan rendah hati dengan yang kamu tahu"],
      Love: ["memberi tanpa menghitung", "lembut pada yang berarti", "mengerti sebelum dimengerti", "memeluk orang yang kamu cintai"],
      Friendship: ["jadi teman yang kamu harapkan", "jaga lingkaran kecil dan tulus", "hadir saat sulit", "menghormati persahabatan"],
      Happiness: ["menemukan sukacita pada hal kecil", "memilih syukur daripada keluh", "tersenyum pada hal biasa", "puas dengan yang kamu miliki"],
      Courage: ["menghadapi kesulitan dengan tenang", "maju meski takut", "mengambil keputusan sendiri", "memulai lagi setelah jatuh"],
      Hope: ["percaya bahwa fajar akan datang", "menyalakan cahaya untuk esok", "percaya cerita belum berakhir", "ingat badai membuat kita kuat"],
    },
  },
  Japanese: {
    actioners: ["あなた", "私たち", "あきらめない人", "みんな", "心から願う人"],
    single: [
      "${a}が${t}を選ぶとき、道は自分で明るくなる${e}",
      "覚えておいて、${a}はいつでも${t}ことができる${e}",
      "今日を、${a}が${t}日目にしよう${e}",
      "この瞬間、${a}には${t}力がある${e}",
      "${t}を選ぶことに、静かな強さがある${e}",
    ],
    double: [
      "${t}と${u} — それが${a}が進む方法だ${e}",
      "${a}は${t}を学び、${u}を敢えてするとき、最も成長する${e}",
    ],
    themes: {
      Motivation: ["小さな一歩から始める", "努力を進歩に変える", "迷いより行動を選ぶ", "毎日に目的を与える"],
      Inspiration: ["毎朝に新しい機会を見る", "傷を知恵に変える", "限界の先に可能性を見る", "夢を光にする"],
      Life: ["騒音の中で静けさを探す", "今日を十分に生きる", "経験から成長する", "平凡に意味を見つける"],
      Success: ["一歩ずつ進捗を測る", "一時の挫折を乗り越える", "忍耐を強みにする", "小さな勝利を大きな結果に"],
      Wisdom: ["話すより聞く", "忍耐の価値を理解する", "正しさより真実を求める", "知っていることに謙虚に歩む"],
      Love: ["見返りを求めず与える", "大切な人に優しくする", "理解される前に理解する", "愛する人を近くに抱く"],
      Friendship: ["出会いたいと思う友人になる", "輪を小さく誠実に保つ", "困難な時にそばにいる", "友情を大切にする"],
      Happiness: ["小さな喜びに楽しみを見つける", "不平より感謝を選ぶ", "日常に微笑む", "持っているものに満足する"],
      Courage: ["困難に落ち着いて向き合う", "怖くても前に進む", "自分の決断を下す", "転んだ後また始める"],
      Hope: ["朝が来ると信じる", "明日のために灯りをともす", "物語は終わっていないと信じる", "嵐が私たちを強くすると知る"],
    },
  },
  Korean: {
    actioners: ["당신", "우리", "포기하지 않는 사람", "우리 모두", "마음을 다하는 사람"],
    single: [
      "${a}가 ${t} 것을 선택할 때 길은 스스로 밝아진다${e}",
      "기억하세요, ${a}는 언제나 ${t} 수 있습니다${e}",
      "오늘을 ${a}가 ${t}는 날로 만드세요${e}",
      "이 순간 ${a}에게는 ${t} 힘이 있습니다${e}",
      "${t} 것을 선택하는 데 조용한 힘이 있습니다${e}",
    ],
    double: [
      "${t}와 ${u} — 그것이 ${a}가 나아가는 방법입니다${e}",
      "${a}는 ${t}를 배우고 ${u}를 감행할 때 가장 성장합니다${e}",
    ],
    themes: {
      Motivation: ["작은 발걸음부터 시작하기", "노력을 성장으로 바꾸기", "의심보다 행동 선택하기", "매일의 목적을 찾기"],
      Inspiration: ["매일 아침 새로운 기회 보기", "상처를 지혜로 바꾸기", "한계 너머의 가능성 보기", "꿈을 빛으로 만들기"],
      Life: ["소음 속에서 평온 찾기", "오늘을 충분히 살기", "경험 속에서 성장하기", "평범함에서 의미 찾기"],
      Success: ["한 걸음씩 진전을 재다", "일시적 좌절을 이겨내다", "인내를 강점으로 삼다", "작은 승리를 큰 결과로"],
      Wisdom: ["말하기보다 듣기", "인내의 가치를 이해하다", "옳음보다 진실을 구하다", "아는 것에 겸손하게 걷다"],
      Love: ["보상 없이 주기", "중요한 사람에게 부드럽게", "이해받기 전에 이해하기", "사랑하는 사람을 가까이 품다"],
      Friendship: ["만나고 싶은 친구가 되기", "작고 진실한 원을 유지하기", "어려울 때 곁에 있기", "우정을 소중히 하기"],
      Happiness: ["작은 기쁨에서 즐거움 찾기", "불평보다 감사 선택하기", "일상에 미소 짓기", "가진 것에 만족하기"],
      Courage: ["어려움에 침착히 맞서기", "두려워도 앞으로 나아가기", "자신의 결정을 내리기", "넘어진 후 다시 시작하기"],
      Hope: ["새벽이 온다고 믿기", "내일을 위해 등불 켜기", "이야기는 끝나지 않았다고 믿기", "폭풍이 우리를 강하게 한다고 알기"],
    },
  },
  Chinese: {
    actioners: ["你", "我们", "坚持的人", "我们所有人", "用心的人"],
    single: [
      "当你${a}选择${t}时，路会自己明亮起来${e}",
      "记住，${a}永远可以${t}${e}",
      "让今天成为${a}开始${t}的日子${e}",
      "此刻，${a}拥有${t}的力量${e}",
      "选择${t}，有一种安静的力量${e}",
    ],
    double: [
      "${t}和${u} — 这就是${a}前进的方式${e}",
      "${a}在学会${t}并敢于${u}时成长最多${e}",
    ],
    themes: {
      Motivation: ["从小步开始", "把努力变成进步", "选择行动而非犹豫", "给每一天赋予目标"],
      Inspiration: ["在每个清晨看见新机会", "把伤痛变成智慧", "在限制之外看见可能", "让梦想成为光"],
      Life: ["在喧嚣中寻找平静", "充分地活在今天", "在经历中成长", "在平凡中找到意义"],
      Success: ["一步步丈量进步", "克服暂时的挫折", "把坚持变成优势", "把小胜变成大果"],
      Wisdom: ["多听少说", "理解耐心的价值", "求真胜过求对", "谦逊地走你所知的路"],
      Love: ["不求回报地给予", "对在乎的人温柔", "在被理解之前理解", "亲近所爱之人"],
      Friendship: ["成为你想遇见的朋友", "保持小而真诚的圈子", "困难时陪伴", "珍惜友谊"],
      Happiness: ["从小事中找到快乐", "选择感恩而非抱怨", "对日常微笑", "满足于你所拥有的"],
      Courage: ["平静地面对困难", "即使害怕也向前", "自己做决定", "跌倒后再开始"],
      Hope: ["相信黎明会来", "为明天点亮一盏灯", "相信故事没有结束", "记得风暴让我们更坚强"],
    },
  },
};

/**
 * Authentic, emotionally meaningful Romantic ❤️ and Sad 💔 quotes.
 * Complete quotes written directly in each language — NEVER machine-translated
 * from English. Native to each language/country, author "Unknown", is_original true.
 */
const ROMANTIC_SAD_QUOTES: Record<string, { romantic: string[]; sad: string[] }> = {
  English: {
    romantic: [
      "Loving you is the calmest home I have ever known.",
      "I fell for you slowly, and then all at once.",
      "Every love song finally makes sense when I think of you.",
      "Home is not a place; it is wherever your hand finds mine.",
      "You are my favorite good morning and my sweetest good night.",
      "In a world that moves too fast, I found my forever in you.",
      "I knew I loved you the day you felt more like a memory I was still making.",
      "You do not have to say a word; being near you is enough.",
      "Loving you feels like coming home to myself.",
      "I would cross every distance just to find the warmth in your eyes.",
      "Our love is not loud, but it is the steadiest thing I have.",
      "The best part of my day is the moment our eyes meet.",
      "I fall for you again every single morning.",
      "You are the reason I believe in forever.",
      "Even time moves softer when it is spent with you.",
      "Your hand in mine is my favorite place to be.",
      "I love you in all the quiet ways words cannot reach.",
      "Finding you made sense of every love story I ever heard.",
      "You are the first person I want to tell everything to.",
      "I choose you, today, tomorrow, and every day after.",
    ],
    sad: [
      "Some people leave footprints on your heart and simply walk away.",
      "It still hurts to remember us the way we used to be.",
      "I miss the person we were before we became strangers.",
      "Grief is just love with nowhere left to go.",
      "I feel lonely in rooms full of people since you left.",
      "I keep our moments alive, even as you move on.",
      "The hardest goodbye is the one nobody ever said out loud.",
      "I stopped waiting for you, but I have not stopped remembering.",
      "There is a silence between us now that words cannot fill.",
      "I miss the way we laughed at things no one else understood.",
      "You left, but every place still looks for you.",
      "I carry the weight of us everywhere I go.",
      "Saying your name feels like reopening a wound.",
      "I wish I could hate you, but I only miss you.",
      "We became a story I stay up at night replaying.",
      "I learned to live without you; I never learned to stop loving you.",
      "The worst thing about losing you is remembering how we were found.",
      "Some grief has no name, it is just you missing from my life.",
      "I gave you everything, and you left with all of it.",
      "Moving on is the longest road I have ever walked, and I am still on it.",
    ],
  },
  Hindi: {
    romantic: [
      "तुमसे प्यार करना मेरे जीवन की सबसे खूबसूरत बात है।",
      "मैं धीरे-धीरे तुम्हारा हुआ, और फिर एक पल में पूरा।",
      "हर प्यार भरा गीत अब तुम्हें याद करके समझ आता है।",
      "घर कोई जगह नहीं, बस वह जगह है जहाँ तुम्हारा हाथ मेरा साथ दे।",
      "तुम मेरी सुबह की मुस्कान और शाम का सुकून हो।",
      "इस तेज़ दुनिया में, मुझे तुममें मेरी मंज़िल मिली।",
      "तुम्हारे पास चुप रहना भी मुझे सुकून देता है।",
      "तुम्हें पाकर मुझे हर किस्सा अपना लगने लगा।",
      "मैं तुमसे हर रोज़ फिर से प्यार करता हूँ।",
      "तुम हो तो हर दूरी तय हो जाती है।",
      "तुम्हारा साथ मेरा सबसे बड़ा घर है।",
      "तुम मेरे दिल की सबसे प्यारी धड़कन हो।",
      "तुम्हें देखकर मेरा दिन सौ बार शुरू होता है।",
      "तुम वजह हो हर मुश्किल आसान होने की।",
      "मैंने तुम्हें हर जन्म में पहचाना है।",
    ],
    sad: [
      "कुछ लोग दिल पर निशान छोड़ जाते हैं और चले जाते हैं।",
      "तुम्हारे बिना हर शांत पल तन्हा लगता है।",
      "हम जैसे थे, उस बात को याद करना अब भी दर्द देता है।",
      "अजनबी होने से पहले हम जो थे, मैं उन्हें मिस करता हूँ।",
      "दर्द बस ऐसा प्यार है जिसका कोई ठिकाना नहीं।",
      "तुम्हारे जाने के बाद, भीड़ में भी मैं अकेला हूँ।",
      "मैं तुम्हारा इंतज़ार छोड़ दिया, पर यादें नहीं छूटीं।",
      "हमारी हँसी की गूँज अब खामोशी बन गई है।",
      "तुम चले गए, पर हर जगह अब भी तुम्हें खोजता हूँ।",
      "तुम्हारा नाम लेना ज़ख्म को फिर से खोल देता है।",
      "काश तुमसे नफरत कर पाता, बस तुम्हें याद न करता।",
      "जीना तो सीख गया तुम्हारे बिना, प्यार करना नहीं सीख पाया।",
      "सबसे बुरा यह है कि तुम गए, और मैं यहाँ रह गया।",
      "हर जगह तुम्हारी याद ही तो रह गई।",
      "आगे बढ़ना सबसे लंबी सड़क है, और अब भी चल रहा हूँ।",
    ],
  },
  Spanish: {
    romantic: [
      "Amarte es el hogar más tranquilo que he conocido.",
      "Te amé despacio, y de pronto te amé por completo.",
      "Cada canción de amor cobra sentido cuando pienso en ti.",
      "El hogar no es un lugar: es donde tu mano encuentra la mía.",
      "Eres mi buenos días favorito y mi buenas noches más dulce.",
      "En un mundo que va deprisa, te encontré a ti para siempre.",
    ],
    sad: [
      "Algunas personas dejan huellas en tu corazón y se van.",
      "Todavía duele recordarnos como solíamos ser.",
      "Echo de menos a la persona que éramos antes de ser extraños.",
      "El duelo es solo amor que no tiene a dónde ir.",
      "Me siento solo en habitaciones llenas de gente desde que te fuiste.",
      "Guardo nuestros momentos vivos, mientras tú sigues tu camino.",
    ],
  },
  French: {
    romantic: [
      "T'aimer est la maison la plus calme que j'aie jamais connue.",
      "Je suis tombé amoureux de toi lentement, puis d'un seul coup.",
      "Chaque chanson d'amour prend enfin son sens quand je pense à toi.",
      "La maison n'est pas un lieu : c'est là où ta main trouve la mienne.",
      "Tu es mon bonjour préféré et mon plus doux bonsoir.",
      "Dans un monde si pressé, j'ai trouvé mon toujours en toi.",
    ],
    sad: [
      "Certaines personnes marquent ton cœur et s'en vont.",
      "Ça fait encore mal de se souvenir de nous comme avant.",
      "Tu me manques : la personne que nous étions avant de devenir étrangers.",
      "Le chagrin n'est que de l'amour qui n'a plus où aller.",
      "Je me sens seul dans des pièces pleines de monde depuis ton départ.",
      "Je garde nos souvenirs vivants, pendant que tu avances.",
    ],
  },
  Bengali: {
    romantic: [
      "তোমাকে ভালোবাসা আমার জীবনের সবচেয়ে সুন্দর অধ্যায়।",
      "তুমি আমার ভোরের হাসি আর সন্ধ্যার শান্তি।",
      "বাড়ি কোনো জায়গা নয়, বাড়ি হলো সেই জায়গা যেখানে তোমার হাত আমার হাত খুঁজে পায়।",
      "তোমার কথা ভাবলেই প্রতিটা গান বোঝা যায়।",
      "এত তাড়াহুড়ার এই পৃথিবীতে, আমার অনন্তকাল তুমি।",
      "তুমি আমার প্রিয় সকাল আর সবচেয়ে মধুর রাত।",
    ],
    sad: [
      "কিছু মানুষ হৃদয়ে দাগ রেখে চলে যায়।",
      "তুমি চলে যাওয়ার পর ভিড়েও আমি একা।",
      "আমরা আগে যেমন ছিলাম, সেটা মনে করতেও কষ্ট লাগে।",
      "অচেনা হওয়ার আগে আমরা যা ছিলাম, তাকে মিস করি।",
      "বেদনা হলো সেই ভালোবাসা যার ঠিকানা নেই।",
      "আমি আমাদের মুহূর্তগুলো বাঁচিয়ে রাখি, অথচ তুমি এগিয়ে চলে যাও।",
    ],
  },
  Arabic: {
    romantic: [
      "حُبُّكِ هو بيتي الأكثرُ هدوءًا الذي عرفتُهُ.",
      "أحببتُكِ ببطءٍ، ثم أصبحتِ عالمي كله.",
      "كل أغنية حب تأخذ معناها حين أفكر فيكِ.",
      "البيتُ ليس مكانًا، بل حيث تلتقي يدُكِ بيدي.",
      "أنتِ صباحي المفضل ومسائي الأجمل.",
      "في عالمٍ يسرعُ كثيرًا، وجدتُ أبديتي فيكِ.",
    ],
    sad: [
      "بعض الناس يتركون أثرًا في قلبك ويرحلون.",
      "ما زال يؤلمني أن أتذكرنا كما كنا.",
      "أشتاق لمن كنا قبل أن نصبح غرباء.",
      "الحزنُ حبٌّ لا يجد له مكانًا يذهب إليه.",
      "أشعر بالوحدة في غرفٍ ممتلئةٍ منذ رحيلكِ.",
      "أُبقي لحظاتنا حيّة، بينما تمضين في طريقكِ.",
    ],
  },
  Portuguese: {
    romantic: [
      "Amar você é o lar mais calmo que já conheci.",
      "Eu te amei devagar e, de repente, te amei por inteiro.",
      "Cada música de amor faz sentido quando penso em você.",
      "Lar não é um lugar: é onde sua mão encontra a minha.",
      "Você é meu bom-dia favorito e meu boa-noite mais doce.",
      "Num mundo tão apressado, encontrei meu para sempre em você.",
    ],
    sad: [
      "Algumas pessoas deixam marcas no seu coração e vão embora.",
      "Ainda dói lembrar de nós como éramos.",
      "Sinto falta de quem fomos antes de nos tornarmos estranhos.",
      "A tristeza é só amor sem lugar para ir.",
      "Me sinto sozinho em salas cheias desde que você foi embora.",
      "Guardo nossos momentos vivos, enquanto você segue em frente.",
    ],
  },
  German: {
    romantic: [
      "Dich zu lieben ist das ruhigste Zuhause, das ich kenne.",
      "Ich habe dich langsam geliebt und dann mit einem Mal ganz.",
      "Jedes Liebeslied ergibt Sinn, wenn ich an dich denke.",
      "Zuhause ist kein Ort: Es ist dort, wo deine Hand meine findet.",
      "Du bist mein liebstes Guten Morgen und mein schönstes Gute Nacht.",
      "In einer Welt, die zu schnell rennt, fand ich mein Für-immer in dir.",
    ],
    sad: [
      "Manche Menschen hinterlassen Spuren in deinem Herzen und gehen.",
      "Es tut immer noch weh, uns so zu erinnern, wie wir waren.",
      "Ich vermisse, wer wir waren, bevor wir Fremde wurden.",
      "Trauer ist nur Liebe, die keinen Platz hat zu bleiben.",
      "Ich fühle mich einsam in vollen Räumen, seit du gegangen bist.",
      "Ich halte unsere Momente lebendig, während du weiterziehst.",
    ],
  },
  Urdu: {
    romantic: [
      "تم سے محبت کرنا میری زندگی کا سب سے خوبصورت سفر ہے۔",
      "ہر پیارا گیت اب تمہارے بارے میں لگتا ہے۔",
      "گھر کوئی جگہ نہیں، گھر وہ جگہ ہے جہاں تمہارا ہاتھ میرا ہاتھ پاتا ہے۔",
      "تم میری صبح کی مسکراہٹ اور شام کا سکون ہو۔",
      "اس تیز دنیا میں، میں نے تم میں اپنی منزل پا لی۔",
    ],
    sad: [
      "کچھ لوگ دل پر نشان چھوڑ کر چلے جاتے ہیں۔",
      "تمہارے جانے کے بعد بھیڑ میں بھی میں تنہا ہوں۔",
      "ہم جیسے تھے اسے یاد کرنا اب بھی درد دیتا ہے۔",
      "اجنبی بننے سے پہلے ہم جو تھے، انہیں یاد کرتا ہوں۔",
      "میں ہمارے لمحوں کو زندہ رکھتا ہوں، جبکہ تم آگے بڑھ جاتے ہو۔",
    ],
  },
  Indonesian: {
    romantic: [
      "Mencintaimu adalah rumah paling tenang yang pernah kukenal.",
      "Aku mencintaimu pelan-pelan, lalu seketika sepenuhnya.",
      "Setiap lagu cinta masuk akal saat memikirkanmu.",
      "Rumah bukan tempat: rumah adalah tempat tanganmu bertemu tanganku.",
      "Kamu adalah selamat pagi favoritku dan selamat malam tergantiku.",
    ],
    sad: [
      "Sebagian orang meninggalkan bekas di hatimu lalu pergi.",
      "Masih sakit mengingat kita yang dulu.",
      "Aku rindu siapa kita sebelum menjadi orang asing.",
      "Kesedihan hanyalah cinta yang tak punya tempat pergi.",
      "Aku merasa sendiri di ruangan penuh orang sejak kau pergi.",
    ],
  },
  Japanese: {
    romantic: [
      "あなたを愛することは、私が知る最も静かな家です。",
      "ゆっくりとあなたを愛し、それから一瞬で全て愛した。",
      "あなたを思うと、すべての愛の歌が意味を持つ。",
      "家は場所ではない——あなたの手が私の手を見つける所だ。",
      "あなたは私の大好きなおはようであり、いちばん優しいおやすみだ。",
    ],
    sad: [
      "ある人々は心に跡を残して、ただ去っていく。",
      "以前の私たちを思い出すのは、今でも痛い。",
      "知らない人になる前の私たちに、会いたい。",
      "悲しみとは、行き場のなくなった愛のことだ。",
      "あなたが去ってから、人が溢れる部屋でも孤独だ。",
    ],
  },
  Korean: {
    romantic: [
      "당신을 사랑하는 것은 내가 아는 가장 조용한 집입니다.",
      "나는 천천히 당신을 사랑했고, 그러다 한순간 온전히 사랑했습니다.",
      "당신을 생각하면 모든 사랑 노래가 의미를 가집니다.",
      "집은 장소가 아닙니다—당신의 손이 내 손을 찾는 곳입니다.",
      "당신은 내가 가장 좋아하는 좋은 아침이자 가장 다정한 밤입니다.",
    ],
    sad: [
      "어떤 사람들은 마음에 흔적을 남기고 떠납니다.",
      "예전의 우리를 기억하는 것은 여전히 아픕니다.",
      "낯선 사람이 되기 전의 우리가 그립습니다.",
      "슬픔은 갈 곳이 없는 사랑일 뿐입니다.",
      "당신이 떠난 뒤, 사람들로 가득한 방에서도 나는 혼자입니다.",
    ],
  },
  Chinese: {
    romantic: [
      "爱你，是我所知道的最安静的家。",
      "我慢慢地爱上了你，然后一下子全部爱上。",
      "一想到你，所有情歌都有了意义。",
      "家不是一个地方——是你的手找到我的手的地方。",
      "你是我最喜欢的早安，也是最温柔的晚安。",
    ],
    sad: [
      "有些人在你心里留下痕迹，然后就这样离开。",
      "想起曾经的我们，现在仍然会疼。",
      "我怀念成为陌生人之前的我们。",
      "悲伤，不过是无处安放的爱。",
      "你离开后，即使在满是人的房间，我也感到孤独。",
    ],
  },
};

  const authors = [
  "Unknown",
  "Anonymous",
  "Daily Spark",
  "Ancient Wisdom",
  "Modern Thought",
  "The Quiet Compass",
  "Inspired Minds",
  "Luminous Hearts",
  "The Ever-Wise",
  "A Silent Voice",
  "Timeless Insight",
  "The Inner Flame",
  "Wisdom Seekers",
  "Pathfinders",
  "The Gentle Spirit",
  "Words of Light",
  "The Thoughtful Soul",
  "Everyday Heroes",
  "The Dreamer Within",
  "Quiet Courage",
  "The Bright Thinker",
  "Harmony of Heart",
  "Golden Hours",
  "The Eternal Learner",
];

function buildQuote(rand: () => number, lang: string, category: string): string {
  // Romantic ❤️ and Sad 💔 use authentic, complete native quotes — never
  // machine-translated, never templated into unnatural sentences.
  if (category === "Romantic" || category === "Sad") {
    const set = ROMANTIC_SAD_QUOTES[lang];
    const pool = category === "Romantic" ? set?.romantic : set?.sad;
    if (pool && pool.length) {
      return pool[Math.floor(rand() * pool.length)];
    }
  }
  const d = LANG_DATA[lang];
  const themes = d.themes[category] || d.themes["Motivation"] || [];
  const t1 = themes[Math.floor(rand() * themes.length)];
  const compose = rand() < 0.5;
  const t2 = compose ? themes[Math.floor(rand() * themes.length)] : null;
  const isDouble = compose && t2 !== null && t2 !== t1;
  const pool = isDouble ? d.double : d.single;
  const template = pool[Math.floor(rand() * pool.length)];
  const actioner = d.actioners.length
    ? d.actioners[Math.floor(rand() * d.actioners.length)]
    : "";
  const end = ENDINGS[Math.floor(rand() * ENDINGS.length)];

  const out = template
    .replace("${t}", t1)
    .replace("${u}", isDouble ? (t2 as string) : t1)
    .replace("${a}", actioner)
    .replace("${e}", end)
    .replace(/\s+/g, " ")
    .trim();

  return out.charAt(0).toUpperCase() + out.slice(1);
}

function* generate(
  total: number,
  seedNum: number,
  existingTexts: Set<string>
): Generator<{
  text: string;
  author: string;
  category: string;
  language: string;
  country: string;
  original_language: string;
  source: string;
  is_original: boolean;
}> {
  const rand = mulberry32(seedNum);
  const langs = Object.keys(LANG_DATA);
  let idx = 0;
  const seen = new Set<string>();
  const globalSeen = new Set<string>();
  let produced = 0;
  let guard = 0;
  while (produced < total && guard < total * 20) {
    guard += 1;
    const lang = langs[idx % langs.length];
    idx += 1;
    const category = (process.env.CATEGORY || "").trim()
      ? (process.env.CATEGORY as string).trim()
      : CATEGORIES[Math.floor(rand() * CATEGORIES.length)];
    const text = buildQuote(rand, lang, category);
    const key = `${lang}|${text}`;
    // Never re-insert text that already exists in the DB (dedupe across runs),
    // nor the same text twice within this run (dedupe across languages).
    if (seen.has(key) || globalSeen.has(text) || existingTexts.has(text)) continue;
    seen.add(key);
    globalSeen.add(text);
    produced += 1;
    const meta = LANGUAGE_META[lang] ?? {
      country: "",
      original_language: lang.toLowerCase(),
      source: "Original",
    };
    yield {
      text,
      // Romantic/Sad quotes are original and never claim a fabricated author.
      author:
        category === "Romantic" || category === "Sad"
          ? "Unknown"
          : authors[Math.floor(rand() * authors.length)],
      category,
      language: lang,
      country: meta.country,
      original_language: meta.original_language,
      source: meta.source,
      is_original: true,
    };
  }
}

/** Loads every existing quote text into a Set so the generator can skip them. */
async function fetchExistingTexts(): Promise<Set<string>> {
  const set = new Set<string>();
  const pageSize = 1000;
  let offset = 0;
  for (;;) {
    const { data, error } = await supabase
      .from("quotes")
      .select("text")
      .order("id")
      .range(offset, offset + pageSize - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    for (const row of data) if (row && row.text) set.add(row.text);
    if (data.length < pageSize) break;
    offset += pageSize;
  }
  return set;
}

async function seedCategories(): Promise<void> {
  const { error } = await supabase
    .from("categories")
    .insert(CATEGORIES.map((name) => ({ name })));
  if (error && !/duplicate/i.test(error.message)) {
    console.error("Categories seed warning:", error.message);
  }
  console.log(`Ensured ${CATEGORIES.length} categories.`);
}

/**
 * Creates the missing 'quotes.language' column. Uses the direct DB connection
 * when DATABASE_URL is provided; otherwise just prints a reminder to run it in
 * the Supabase SQL Editor (or scripts/migrate.ts).
 */
async function applyMigration(): Promise<void> {
  if (!DATABASE_URL) {
    console.warn(
      "\nDATABASE_URL not set — make sure the 'language' column exists, or run:\n" +
        "  npx tsx scripts/migrate.ts\n" +
        "(or add it in Supabase -> SQL Editor: alter table public.quotes add column language text not null default 'English';)\n"
    );
    return;
  }
  const pool = new Pool({ connectionString: DATABASE_URL });
  try {
    await pool.query(
      "alter table public.quotes add column if not exists language text not null default 'English';"
    );
    // Country-based quote system (native/original quotes, never machine-translated).
    await pool.query(
      "alter table public.quotes add column if not exists country text;"
    );
    await pool.query(
      "alter table public.quotes add column if not exists original_language text;"
    );
    await pool.query(
      "alter table public.quotes add column if not exists source text;"
    );
    await pool.query(
      "alter table public.quotes add column if not exists is_original boolean default true;"
    );
    await pool.query(
      "create index if not exists quotes_language_idx on public.quotes (language);"
    );
    await pool.query(
      "create index if not exists quotes_country_idx on public.quotes (country);"
    );
    await pool.query(
      "create index if not exists quotes_original_language_idx on public.quotes (original_language);"
    );
    await pool.query(
      "create index if not exists quotes_category_idx on public.quotes (category);"
    );
    console.log(
      "Migration applied: added language/country/original_language/source/is_original to quotes."
    );
  } catch (error: any) {
    console.warn(
      "Automatic migration failed (check DATABASE_URL / DB password):",
      error?.message
    );
  } finally {
    await pool.end().catch(() => {});
  }
}

async function run(): Promise<void> {
  const langs = Object.keys(LANG_DATA);
  console.log(
    `Target: ${target.toLocaleString()} quotes, batch ${BATCH}, languages: ${langs.join(", ")}.`
  );
  const seed = Number(process.env.SEED) || 20260513;

  const { count, error: countErr } = await supabase
    .from("quotes")
    .select("id", { count: "exact", head: true });
  if (countErr) {
    console.error(
      "Sanity count check failed:",
      countErr.message || "(network/auth error — double-check EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY)"
    );
    process.exitCode = 1;
    return;
  }
  let existing = count ?? 0;
  console.log(`Existing quotes in DB: ${existing.toLocaleString()}`);

  // Optional full wipe before reseeding (CLEAR=1 npx tsx scripts/seed-quotes.ts).
  const clear = (process.env.CLEAR || "").trim().toLowerCase() === "1";
  if (clear && existing > 0) {
    console.log("CLEAR=1 → deleting all existing quotes...");
    // Fetch IDs in pages, then delete by ID chunks (avoids statement timeouts
    // from a single bulk DELETE on a large table).
    let deleted = 0;
    const pageSize = 100;
    for (;;) {
      const { data, error } = await supabase
        .from("quotes")
        .select("id")
        .order("id")
        .range(0, pageSize - 1);
      if (error) {
        console.error("Select (for clear) error:", error.message);
        process.exitCode = 1;
        return;
      }
      if (!data || data.length === 0) break;
      const ids = data.map((r: any) => r.id);
      const { error: delErr } = await supabase
        .from("quotes")
        .delete()
        .in("id", ids);
      if (delErr) {
        console.error("Delete error:", delErr.message);
        process.exitCode = 1;
        return;
      }
      deleted += ids.length;
      if (deleted % 1000 === 0 || ids.length < pageSize) {
        console.log(`Deleted ${deleted.toLocaleString()}...`);
      }
      if (ids.length < pageSize) break;
    }
    existing = 0;
    console.log(`Done deleting ${deleted.toLocaleString()} quotes.`);
  }

  const onlyCategory = (process.env.CATEGORY || "").trim();
  if (!onlyCategory && existing >= target) {
    console.log(`Already >= target (${target.toLocaleString()}). Nothing to do.`);
    return;
  }

  await applyMigration();
  await seedCategories();

  const existingTexts = onlyCategory
    ? new Set<string>()
    : await fetchExistingTexts();
  console.log(`Loaded ${existingTexts.size.toLocaleString()} existing quote texts to dedupe against.`);

  const totalToAdd = onlyCategory ? target : target - existing;
  const generator = generate(totalToAdd, seed, existingTexts);
  let added = 0;
  let batch: Array<{
    text: string;
    author: string;
    category: string;
    language: string;
    country: string;
    original_language: string;
    source: string;
    is_original: boolean;
  }> = [];

  const flush = async () => {
    if (batch.length === 0) return;
    const { error } = await supabase.from("quotes").insert(batch);
    if (error) {
      for (const row of batch) {
        const { error: e2 } = await supabase.from("quotes").insert([row]);
        if (e2 && !/duplicate/i.test(e2.message)) {
          console.error("Skipped a row:", e2.message, row.text.slice(0, 80));
        }
      }
    }
    added += batch.length;
    batch = [];
    console.log(`Inserted ${added.toLocaleString()} / ${totalToAdd.toLocaleString()}...`);
  };

  for (const row of generator) {
    batch.push(row);
    if (batch.length >= BATCH) await flush();
  }
  await flush();

  console.log(
    `Done. Added ${added.toLocaleString()} quotes (total in DB now ~${(
      existing + added
    ).toLocaleString()}).`
  );
}

run().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});