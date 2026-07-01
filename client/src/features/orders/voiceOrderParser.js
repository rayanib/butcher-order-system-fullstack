const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";
const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

const WORD_NUMBERS = [
  ["نص", 0.5],
  ["نصف", 0.5],
  ["واحد", 1],
  ["وحده", 1],
  ["واحدة", 1],
  ["اثنين", 2],
  ["اتنين", 2],
  ["ثنين", 2],
  ["ثلاث", 3],
  ["ثلاثة", 3],
  ["اربع", 4],
  ["اربعة", 4],
  ["خمس", 5],
  ["خمسة", 5],
  ["ست", 6],
  ["ستة", 6],
  ["سبع", 7],
  ["سبعة", 7],
  ["ثمان", 8],
  ["ثمانية", 8],
  ["تسع", 9],
  ["تسعة", 9],
  ["عشر", 10],
  ["عشرة", 10],
];

const ITEM_ALIASES = [
  ["شاورما", "شاورما"],
  ["شاورمه", "شاورما"],
  ["شرايح", "شرحات"],
  ["شرائح", "شرحات"],
  ["شرحات", "شرحات"],
  ["حوسي", "حوسي"],
  ["ناعم", "لحمة ناعمة"],
  ["ناعمة", "لحمة ناعمة"],
  ["خشن", "لحمة خشن"],
  ["كباب", "كباب"],
  ["كبه", "كبة"],
  ["كبة", "كبة"],
  ["كفته", "صفايح / كفته"],
  ["كفتة", "صفايح / كفته"],
  ["صفايح", "صفايح / كفته"],
  ["سلق", "سلق"],
  ["غنم", "غنم"],
  ["فيليه", "فيليه"],
  ["سنتا", "سنتا"],
  ["ستيك", "ستيك"],
  ["شيش", "شيش"],
];

const IGNORED_NAME_WORDS = new Set([
  "رقم",
  "تلفون",
  "هاتف",
  "كيلو",
  "كغم",
  "كغ",
  "بعد",
  "نص",
  "نصف",
]);

export function getSpeechRecognition() {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

export function normalizeVoiceDigits(value = "") {
  return String(value)
    .replace(/[٠-٩۰-۹]/g, (digit) => {
      const arabicIndex = ARABIC_DIGITS.indexOf(digit);
      if (arabicIndex !== -1) return String(arabicIndex);

      const persianIndex = PERSIAN_DIGITS.indexOf(digit);
      return persianIndex === -1 ? digit : String(persianIndex);
    })
    .replace(/[,،]/g, ".");
}

export function parseArabicNumber(value = "") {
  const normalized = normalizeVoiceDigits(value);
  const digitMatch = normalized.match(/\d+(?:\.\d+)?/);
  if (digitMatch) return Number(digitMatch[0]);

  const match = WORD_NUMBERS.find(([word]) => normalized.includes(word));
  return match ? match[1] : null;
}

function buildVoiceItem(name, kg, note = "") {
  const safeKg = Number.isFinite(kg) && kg > 0 ? kg : 1;

  return {
    name,
    priceKey: name,
    mode: "kg",
    kg: safeKg,
    money: null,
    note,
    summary: `${safeKg.toFixed(1)} كغم`,
    done: false,
  };
}

export function parseVoiceOrder(text = "") {
  const normalized = normalizeVoiceDigits(text).replace(/\s+/g, " ").trim();
  const lower = normalized.toLowerCase();
  const digits = normalized.match(/\d{3,10}/g) || [];
  const phone = digits[0] || "";
  const beforePhone = phone ? normalized.split(phone)[0].trim() : normalized;
  const name =
    beforePhone
      .split(" ")
      .map((word) => word.trim())
      .filter((word) => word && !IGNORED_NAME_WORDS.has(word))[0] || "";

  const kgMatch =
    normalized.match(/(\d+(?:\.\d+)?)\s*(?:كيلو|كغم|كغ|kg)/i) ||
    normalized.match(
      /(نص|نصف|واحد|وحده|واحدة|اثنين|اتنين|ثنين|ثلاث|ثلاثة|اربع|اربعة|خمس|خمسة|ست|ستة|سبع|سبعة|ثمان|ثمانية|تسع|تسعة|عشر|عشرة)\s*(?:كيلو|كغم|كغ)/i
    );
  const kg = kgMatch ? parseArabicNumber(kgMatch[1]) : null;
  const itemMatch = ITEM_ALIASES.find(([alias]) => lower.includes(alias));
  const itemName = itemMatch?.[1] || "";
  const notes = [];

  if (/بدون\s*(بهار|بهارات|تتبيل)/.test(lower)) notes.push("بدون بهار");
  if (/مبهر|بهار/.test(lower) && notes.length === 0) notes.push("مبهر");
  if (/مخلوط|خلط|مشكل/.test(lower)) notes.push("مخلوط");
  if (/خبز|رغيف|ارغفة|أرغفة/.test(lower)) notes.push("خبز");

  let pickupTime = "";
  const minuteMatch =
    normalized.match(/بعد\s*(\d+)\s*(?:دقيقه|دقيقة|دقايق|دقائق|د)/) ||
    normalized.match(/بعد\s*(نص|نصف)\s*(?:ساعه|ساعة)/);
  const hourMatch =
    normalized.match(/بعد\s*(\d+)\s*(?:ساعه|ساعة|ساعات)/) ||
    normalized.match(/بعد\s*(ساعتين|ساعتان)/);

  if (minuteMatch) {
    const minutes = ["نص", "نصف"].includes(minuteMatch[1])
      ? 30
      : Number(minuteMatch[1]);
    pickupTime = `بعد ${minutes} دقيقة`;
  } else if (hourMatch) {
    const hours = ["ساعتين", "ساعتان"].includes(hourMatch[1])
      ? 2
      : Number(hourMatch[1]) || 1;
    pickupTime = hours === 1 ? "بعد ساعة" : `بعد ${hours} ساعات`;
  }

  return {
    name,
    phone,
    item: itemName ? buildVoiceItem(itemName, kg || 1, notes.join("، ")) : null,
    pickupTime,
    orderNote: notes.length ? notes.join("، ") : "",
  };
}

export function mergeVoiceTranscript(finalText = "", liveText = "") {
  const finalClean = finalText.replace(/\s+/g, " ").trim();
  const liveClean = liveText.replace(/\s+/g, " ").trim();

  if (!liveClean) return finalClean;
  if (!finalClean) return liveClean;
  if (finalClean.includes(liveClean)) return finalClean;
  if (liveClean.includes(finalClean)) return liveClean;

  return `${finalClean} ${liveClean}`;
}
