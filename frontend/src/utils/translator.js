/**
 * Dynamic Real-Time Auto-Translation Engine for ParcelAI
 * Supports multi-provider failover (Google GTX + MyMemory + Local Transliteration Cache)
 * Automatically converts dynamic backend values (customer names, product names, AI OCR text, addresses)
 * into Hindi and Gujarati instantly.
 */

const translationCache = {};

// Common words dictionary fallback for offline / instant translation
const COMMON_DICTIONARY = {
  gu: {
    'recipient': 'પ્રાપ્તકર્તા',
    'page': 'પેજ',
    'saree': 'સાડી',
    'white': 'સફેદ',
    'white saree': 'સફેદ સાડી',
    'customer': 'ગ્રાહક',
    'returned': 'રિટર્ન થયેલ',
    'order': 'ઓર્ડર',
    'delivery': 'ડિલિવરી',
    'product': 'પ્રોડક્ટ',
    'quantity': 'જથ્થો',
    'address': 'સરનામું'
  },
  hi: {
    'recipient': 'प्राप्तकर्ता',
    'page': 'पेज',
    'saree': 'साड़ी',
    'white': 'सफेद',
    'white saree': 'सफेद साड़ी',
    'customer': 'ग्राहक',
    'returned': 'रिटर्न किया गया',
    'order': 'ऑर्डर',
    'delivery': 'डिलीवरी',
    'product': 'उत्पाद',
    'quantity': 'मात्रा',
    'address': 'पता'
  }
};

// Load persisted cache from localStorage
try {
  const saved = localStorage.getItem('parcelai_auto_translations');
  if (saved) {
    Object.assign(translationCache, JSON.parse(saved));
  }
} catch (e) {
  console.warn('Could not read translation cache', e);
}

const saveCache = () => {
  try {
    localStorage.setItem('parcelai_auto_translations', JSON.stringify(translationCache));
  } catch (e) {}
};

/**
 * Attempts Google Translate GTX endpoint (works in client browser)
 */
async function translateViaGoogleGTX(text, targetLang) {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Google GTX HTTP ${res.status}`);
  const data = await res.json();
  if (data && data[0] && data[0][0] && data[0][0][0]) {
    return data[0].map(item => item[0]).join('').trim();
  }
  throw new Error('Invalid Google GTX response');
}

/**
 * Attempts MyMemory API
 */
async function translateViaMyMemory(text, targetLang, sourceLang = 'en') {
  const langPair = `${sourceLang}|${targetLang}`;
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langPair}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`MyMemory HTTP ${res.status}`);
  const data = await res.json();
  if (data && data.responseData && data.responseData.translatedText) {
    const txt = data.responseData.translatedText.trim();
    if (txt && !txt.startsWith('MYMEMORY WARNING')) {
      return txt;
    }
  }
  throw new Error('Invalid MyMemory response');
}

/**
 * Translate using local fallback dictionary
 */
function translateViaLocalDictionary(text, targetLang) {
  const dict = COMMON_DICTIONARY[targetLang];
  if (!dict) return null;
  
  const lower = text.toLowerCase().trim();
  if (dict[lower]) return dict[lower];

  // Try phrase word-by-word replacement if simple pattern (e.g. "Recipient Page 2")
  let words = text.split(/(\s+)/);
  let converted = false;
  let result = words.map(w => {
    const cleanW = w.toLowerCase().trim();
    if (dict[cleanW]) {
      converted = true;
      return dict[cleanW];
    }
    return w;
  }).join('');

  return converted ? result : null;
}

/**
 * Dynamically translates any input string into target language (hi/gu) with caching.
 */
export async function translateText(text, targetLang = 'en', sourceLang = 'en') {
  if (!text || typeof text !== 'string' || !text.trim()) return text;
  
  // Return original for English or matching source
  if (targetLang === 'en' || targetLang === sourceLang) return text;
  
  // Skip pure codes/IDs like #ORD-12345 or SKU-001 (unless text contains real words)
  if (/^#?[A-Z0-9_\-\.\s]+$/i.test(text) && !/[a-z]{3,}/i.test(text)) {
    return text;
  }

  const cacheKey = `${sourceLang}:${targetLang}:${text.trim().toLowerCase()}`;

  // Check cache first for sub-millisecond response
  if (translationCache[cacheKey]) {
    return translationCache[cacheKey];
  }

  // Provider 1: Google GTX (Client Browser)
  try {
    const result = await translateViaGoogleGTX(text.trim(), targetLang);
    if (result) {
      translationCache[cacheKey] = result;
      saveCache();
      return result;
    }
  } catch (err1) {
    // Fallthrough to Provider 2
  }

  // Provider 2: MyMemory API
  try {
    const result = await translateViaMyMemory(text.trim(), targetLang, sourceLang);
    if (result) {
      translationCache[cacheKey] = result;
      saveCache();
      return result;
    }
  } catch (err2) {
    // Fallthrough to Local Dictionary
  }

  // Provider 3: Local Dictionary Fallback
  const dictResult = translateViaLocalDictionary(text, targetLang);
  if (dictResult) {
    translationCache[cacheKey] = dictResult;
    saveCache();
    return dictResult;
  }

  // Return original text if all translation providers are unreachable
  return text;
}

export function clearTranslationCache() {
  for (const key in translationCache) delete translationCache[key];
  try {
    localStorage.removeItem('parcelai_auto_translations');
  } catch (e) {}
}
