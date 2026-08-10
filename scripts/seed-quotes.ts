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
 * Each row stores: text, author, category AND language.
 * Add/remove languages by editing the LANG_DATA object below.
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
];

const ENDINGS = ["", ".", "...", ", always.", "!", " — always.", " — always.", " — truly.", ", without fail.", " — and keep going."];

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
): Generator<{ text: string; author: string; category: string; language: string }> {
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
    const category = CATEGORIES[Math.floor(rand() * CATEGORIES.length)];
    const text = buildQuote(rand, lang, category);
    const key = `${lang}|${text}`;
    // Never re-insert text that already exists in the DB (dedupe across runs),
    // nor the same text twice within this run (dedupe across languages).
    if (seen.has(key) || globalSeen.has(text) || existingTexts.has(text)) continue;
    seen.add(key);
    globalSeen.add(text);
    produced += 1;
    yield {
      text,
      author: authors[Math.floor(rand() * authors.length)],
      category,
      language: lang,
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
    await pool.query(
      "create index if not exists quotes_language_idx on public.quotes (language);"
    );
    await pool.query(
      "create index if not exists quotes_category_idx on public.quotes (category);"
    );
    console.log("Migration applied: added 'language' column to quotes.");
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
  const existing = count ?? 0;
  console.log(`Existing quotes in DB: ${existing.toLocaleString()}`);
  if (existing >= target) {
    console.log(`Already >= target (${target.toLocaleString()}). Nothing to do.`);
    return;
  }

  await applyMigration();
  await seedCategories();

  const existingTexts = await fetchExistingTexts();
  console.log(`Loaded ${existingTexts.size.toLocaleString()} existing quote texts to dedupe against.`);

  const totalToAdd = target - existing;
  const generator = generate(totalToAdd, seed, existingTexts);
  let added = 0;
  let batch: Array<{ text: string; author: string; category: string; language: string }> = [];

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