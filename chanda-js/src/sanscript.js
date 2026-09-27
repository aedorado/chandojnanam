/**
 * Sanscript - Sanskrit Transliteration Engine
 * Supports Devanagari, IAST, ITRANS, Harvard-Kyoto, SLP1, and Velthuis
 * Pure JavaScript, zero dependencies.
 */

const SCHEMES = {
  devanagari: {
    vowels: ["अ", "आ", "इ", "ई", "उ", "ऊ", "ऋ", "ॠ", "ऌ", "ॡ", "ए", "ऐ", "ओ", "औ"],
    vowelMarks: ["ा", "ि", "ी", "ु", "ू", "ृ", "ॄ", "ॢ", "ॣ", "े", "ै", "ो", "ौ"],
    consonants: [
      "क", "ख", "ग", "घ", "ङ",
      "च", "छ", "ज", "झ", "ञ",
      "ट", "ठ", "ड", "ढ", "ण",
      "त", "थ", "द", "ध", "न",
      "प", "फ", "ब", "भ", "म",
      "य", "र", "ल", "व",
      "श", "ष", "स", "ह",
      "ळ"
    ],
    other: ["ं", "ः", "ऽ", "्", "ॐ", "।", "॥"]
  },
  iast: {
    vowels: ["a", "ā", "i", "ī", "u", "ū", "ṛ", "ṝ", "ḷ", "ḹ", "e", "ai", "o", "au"],
    vowelMarks: ["ā", "i", "ī", "u", "ū", "ṛ", "ṝ", "ḷ", "ḹ", "e", "ai", "o", "au"],
    consonants: [
      "k", "kh", "g", "gh", "ṅ",
      "c", "ch", "j", "jh", "ñ",
      "ṭ", "ṭh", "ḍ", "ḍh", "ṇ",
      "t", "th", "d", "dh", "n",
      "p", "ph", "b", "bh", "m",
      "y", "r", "l", "v",
      "ś", "ṣ", "s", "h",
      "ḻ"
    ],
    other: ["ṃ", "ḥ", "'", "", "om", "|", "||"]
  },
  hk: {
    vowels: ["a", "A", "i", "I", "u", "U", "R", "RR", "lR", "lRR", "e", "ai", "o", "au"],
    vowelMarks: ["A", "i", "I", "u", "U", "R", "RR", "lR", "lRR", "e", "ai", "o", "au"],
    consonants: [
      "k", "kh", "g", "gh", "G",
      "c", "ch", "j", "jh", "J",
      "T", "Th", "D", "Dh", "N",
      "t", "th", "d", "dh", "n",
      "p", "ph", "b", "bh", "m",
      "y", "r", "l", "v",
      "z", "S", "s", "h",
      "L"
    ],
    other: ["M", "H", "'", "", "OM", "|", "||"]
  },
  itrans: {
    vowels: ["a", "A", "i", "I", "u", "U", "RRi", "RRI", "LLi", "LLI", "e", "ai", "o", "au"],
    vowelMarks: ["A", "i", "I", "u", "U", "RRi", "RRI", "LLi", "LLI", "e", "ai", "o", "au"],
    consonants: [
      "k", "kh", "g", "gh", "~N",
      "ch", "Ch", "j", "jh", "~n",
      "T", "Th", "D", "Dh", "N",
      "t", "th", "d", "dh", "n",
      "p", "ph", "b", "bh", "m",
      "y", "r", "l", "v",
      "sh", "Sh", "s", "h",
      "L"
    ],
    other: ["M", "H", ".a", "", "OM", "|", "||"]
  },
  slp1: {
    vowels: ["a", "A", "i", "I", "u", "U", "f", "F", "x", "X", "e", "E", "o", "O"],
    vowelMarks: ["A", "i", "I", "u", "U", "f", "F", "x", "X", "e", "E", "o", "O"],
    consonants: [
      "k", "K", "g", "G", "N",
      "c", "C", "j", "J", "Y",
      "w", "W", "q", "Q", "R",
      "t", "T", "d", "D", "n",
      "p", "P", "b", "B", "m",
      "y", "r", "l", "v",
      "S", "z", "s", "h",
      "L"
    ],
    other: ["M", "H", "'", "", "oM", "|", "||"]
  }
};

export const DEVANAGARI = "devanagari";
export const IAST = "iast";
export const ITRANS = "itrans";
export const HK = "hk";
export const SLP1 = "slp1";

/**
 * Detect script of input text
 */
export function detect(text) {
  if (!text) return DEVANAGARI;
  // If text contains Devanagari Unicode range (0900–097F)
  if (/[\u0900-\u097F]/.test(text)) {
    return DEVANAGARI;
  }
  // If contains IAST special diacritics
  if (/[āīūṛṝḷḹṅñṭḍṇśṣṃḥḻ]/.test(text)) {
    return IAST;
  }
  // Check for ITRANS markers
  if (/(~N|~n|\.a|RRi|RRI|LLi|LLI)/.test(text)) {
    return ITRANS;
  }
  // Check for SLP1 vs HK
  if (/[fFxXwWqQR]/.test(text)) {
    return SLP1;
  }
  // Default Latin scheme is Harvard-Kyoto or ITRANS
  return HK;
}

/**
 * Transliterate text from Roman script to Devanagari
 */
function toDevanagari(text, fromSchemeName) {
  const from = SCHEMES[fromSchemeName] || SCHEMES.hk;
  const deva = SCHEMES.devanagari;

  // Build token maps sorted by length descending to match multi-char tokens first
  const vowelMap = new Map();
  from.vowels.forEach((v, i) => vowelMap.set(v, deva.vowels[i]));

  const markMap = new Map();
  from.vowelMarks.forEach((m, i) => markMap.set(m, deva.vowelMarks[i]));

  const consonantMap = new Map();
  from.consonants.forEach((c, i) => consonantMap.set(c, deva.consonants[i]));

  const otherMap = new Map();
  from.other.forEach((o, i) => {
    if (o) otherMap.set(o, deva.other[i]);
  });

  // Additional common variants for input flexibility
  if (fromSchemeName === "itrans") {
    vowelMap.set("aa", "आ");
    vowelMap.set("ii", "ई");
    vowelMap.set("uu", "ऊ");
    markMap.set("aa", "ा");
    markMap.set("ii", "ी");
    markMap.set("uu", "ू");
    otherMap.set(".h", "्");
    otherMap.set(".n", "ं");
  } else if (fromSchemeName === "iast") {
    otherMap.set("ṁ", "ं");
  }

  const allTokens = [
    ...vowelMap.keys(),
    ...consonantMap.keys(),
    ...otherMap.keys()
  ].sort((a, b) => b.length - a.length);

  let result = "";
  let i = 0;
  const len = text.length;

  while (i < len) {
    // Check if next token matches any known token
    let matchedToken = null;
    for (const tok of allTokens) {
      if (text.startsWith(tok, i)) {
        matchedToken = tok;
        break;
      }
    }

    if (!matchedToken) {
      result += text[i];
      i++;
      continue;
    }

    // Is it a consonant?
    if (consonantMap.has(matchedToken)) {
      const devaCons = consonantMap.get(matchedToken);
      i += matchedToken.length;

      // Check what follows the consonant
      let nextVowel = null;
      for (const v of from.vowels) {
        if (text.startsWith(v, i)) {
          if (!nextVowel || v.length > nextVowel.length) {
            nextVowel = v;
          }
        }
      }

      if (nextVowel) {
        if (nextVowel === from.vowels[0]) {
          // inherent 'a' vowel
          result += devaCons;
        } else {
          result += devaCons + markMap.get(nextVowel);
        }
        i += nextVowel.length;
      } else {
        // Consonant with halanta (virama)
        result += devaCons + "्";
      }
    } else if (vowelMap.has(matchedToken)) {
      result += vowelMap.get(matchedToken);
      i += matchedToken.length;
    } else if (otherMap.has(matchedToken)) {
      result += otherMap.get(matchedToken);
      i += matchedToken.length;
    } else {
      result += text[i];
      i++;
    }
  }

  return result;
}

/**
 * Transliterate text from Devanagari to Roman scheme
 */
function fromDevanagari(text, toSchemeName) {
  const to = SCHEMES[toSchemeName] || SCHEMES.iast;
  const deva = SCHEMES.devanagari;

  const vowelMap = new Map();
  deva.vowels.forEach((v, i) => vowelMap.set(v, to.vowels[i]));

  const markMap = new Map();
  deva.vowelMarks.forEach((m, i) => markMap.set(m, to.vowelMarks[i]));

  const consonantMap = new Map();
  deva.consonants.forEach((c, i) => consonantMap.set(c, to.consonants[i]));

  const otherMap = new Map();
  deva.other.forEach((o, i) => otherMap.set(o, to.other[i]));

  let result = "";
  let i = 0;
  const len = text.length;

  while (i < len) {
    const ch = text[i];
    if (consonantMap.has(ch)) {
      const romCons = consonantMap.get(ch);
      const nextCh = text[i + 1];

      if (nextCh === "्") {
        result += romCons;
        i += 2;
      } else if (markMap.has(nextCh)) {
        result += romCons + markMap.get(nextCh);
        i += 2;
      } else {
        // Inherent 'a'
        result += romCons + to.vowels[0];
        i += 1;
      }
    } else if (vowelMap.has(ch)) {
      result += vowelMap.get(ch);
      i++;
    } else if (otherMap.has(ch)) {
      result += otherMap.get(ch);
      i++;
    } else {
      result += ch;
      i++;
    }
  }

  return result;
}

/**
 * Transliterate between any supported scripts
 */
export function transliterate(text, fromScheme, toScheme) {
  if (!text) return "";
  const src = (fromScheme || detect(text)).toLowerCase();
  const dst = (toScheme || DEVANAGARI).toLowerCase();

  if (src === dst) return text;

  if (src === DEVANAGARI) {
    return fromDevanagari(text, dst);
  }

  const devanagariText = toDevanagari(text, src);
  if (dst === DEVANAGARI) {
    return devanagariText;
  }

  return fromDevanagari(devanagariText, dst);
}

export const Sanscript = {
  detect,
  transliterate,
  DEVANAGARI,
  IAST,
  ITRANS,
  HK,
  SLP1,
};
