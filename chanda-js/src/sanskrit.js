/**
 * Sanskrit Text Processing & Syllabification Utility
 * Ported faithfully from sanskrit_text (Python) by Hrishikesh Terdalkar
 */

// Alphabet of Sanskrit
export const SWARA = ["अ", "आ", "इ", "ई", "उ", "ऊ", "ऋ", "ॠ", "ऌ", "ॡ", "ए", "ऐ", "ओ", "औ"];
export const EXTENDED_SWARA = ["ऎ", "ऒ", "ॲ", "ऑ", "ऍ"];

export const MATRA = ["ा", "ि", "ी", "ु", "ू", "ृ", "ॄ", "ॢ", "ॣ", "े", "ै", "ो", "ौ"];
export const EXTENDED_MATRA = ["ॆ", "ॊ", "ॅ", "ॉ"];

export const KANTHYA = ["क", "ख", "ग", "घ", "ङ"];
export const TALAVYA = ["च", "छ", "ज", "झ", "ञ"];
export const MURDHANYA = ["ट", "ठ", "ड", "ढ", "ण"];
export const DANTYA = ["त", "थ", "द", "ध", "न"];
export const AUSHTHYA = ["प", "फ", "ब", "भ", "म"];
export const ANTAHSTHA = ["य", "र", "ल", "व"];
export const USHMA = ["श", "ष", "स", "ह"];
export const VISHISHTA = ["ळ"];
export const EXTENDED_VYANJANA = ["ऩ", "ऱ", "ऴ", "क़", "ख़", "ग़", "ज़", "ड़", "ढ़", "फ़", "य़"];

export const OM = "ॐ";
export const AVAGRAHA = "ऽ";

export const SWARITA = "॑";
export const DOUBLE_SWARITA = "᳚";
export const TRIPLE_SWARITA = "᳛";
export const ANUDATTA = "॒";
export const CHANDRABINDU = "ँ";
export const CHANDRABINDU_VIRAMA = "ꣳ";
export const CHANDRABINDU_SPACING = "ꣲ";
export const CHANDABINDU_TWO = "ꣵ";
export const CHANDRABINDU_THREE = "ꣶ";

export const ANUSWARA = "ं";
export const VISARGA = "ः";
export const ARDHAVISARGA = "ᳲ";
export const JIHVAAMULIYA = "ᳵ";
export const UPADHMANIYA = "ᳶ";

export const HALANTA = "्";
export const NUKTA = "़";
export const ABBREV = "॰";
export const DANDA = "।";
export const DOUBLE_DANDA = "॥";

export const VARGIYA = [...KANTHYA, ...TALAVYA, ...MURDHANYA, ...DANTYA, ...AUSHTHYA];
export const VYANJANA = [...VARGIYA, ...ANTAHSTHA, ...USHMA, ...VISHISHTA];

export const LAGHU_SWARA = [SWARA[0], SWARA[2], SWARA[4], SWARA[6], SWARA[8], ...EXTENDED_SWARA.slice(0, 2)];
export const LAGHU_MATRA = [MATRA[1], MATRA[3], MATRA[5], MATRA[7], ...EXTENDED_MATRA.slice(0, 2)];

export const AYOGAVAAHA_COMMON = [CHANDRABINDU, ANUSWARA, VISARGA];
export const AYOGAVAAHA = [...AYOGAVAAHA_COMMON, JIHVAAMULIYA, UPADHMANIYA];

export const VEDIC_MARKS = [SWARITA, ANUDATTA, DOUBLE_SWARITA, TRIPLE_SWARITA];
export const SPECIAL = [
  AVAGRAHA,
  OM,
  CHANDRABINDU_VIRAMA,
  CHANDRABINDU_SPACING,
  CHANDABINDU_TWO,
  CHANDRABINDU_THREE,
];
export const OTHER = [HALANTA];

export const ALL_SWARA = [...SWARA, ...EXTENDED_SWARA];
export const ALL_VYANJANA = [...VYANJANA, ...EXTENDED_VYANJANA];
export const ALL_MATRA = [...MATRA, ...EXTENDED_MATRA];

export const VARNA = [...ALL_SWARA, ...ALL_VYANJANA];
export const ALPHABET = [
  ...VARNA,
  ...ALL_MATRA,
  ...AYOGAVAAHA,
  ...SPECIAL,
  ...OTHER,
  ...VEDIC_MARKS,
];

export const SPACES = [" ", "\t", "\n", "\r"];
export const PUNCTUATION = [DANDA, DOUBLE_DANDA, ABBREV];
export const GENERAL_PUNCTUATION = [".", ",", ";", '"', "'", "`", ":"];
export const DIGITS = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];

const ALPHABET_SET = new Set(ALPHABET);
const SPACES_SET = new Set(SPACES);
const PUNCTUATION_SET = new Set([...PUNCTUATION, ...GENERAL_PUNCTUATION]);
const DIGITS_SET = new Set(DIGITS);

const ALL_VYANJANA_SET = new Set(ALL_VYANJANA);
const LAGHU_SWARA_SET = new Set(LAGHU_SWARA);
const LAGHU_MATRA_SET = new Set(LAGHU_MATRA);

/**
 * Clean a line of Sanskrit (Devanagari) text
 */
export function clean(text, options = {}) {
  const {
    punct = false,
    digits = false,
    spaces = true,
    allow = [],
  } = options;

  const allowedSet = new Set(ALPHABET);
  for (const c of allow) allowedSet.add(c);
  if (spaces) for (const c of SPACES_SET) allowedSet.add(c);
  if (punct) for (const c of PUNCTUATION_SET) allowedSet.add(c);
  if (digits) for (const c of DIGITS_SET) allowedSet.add(c);

  let cleaned = "";
  for (const ch of text) {
    if (allowedSet.has(ch)) {
      cleaned += ch;
    }
  }

  return cleaned
    .split("\n")
    .map((line) => line.trim().replace(/\s+/g, " "))
    .filter(Boolean)
    .join("\n");
}

/**
 * Split a string into lines using Sanskrit danda or newlines
 */
export function splitLines(text, pattern = /[।॥\r\n]+/) {
  return text.split(pattern).filter(Boolean);
}

/**
 * Get syllables from a single Devanagari word
 */
export function getSyllablesWord(word, technical = false) {
  const cleanedWord = clean(word, { spaces: false });
  const wlen = cleanedWord.length;
  const wordSyllables = [];

  const startCharsSet = new Set([...VARNA, ...SPECIAL]);
  if (technical) {
    for (const c of AYOGAVAAHA_COMMON) startCharsSet.add(c);
  }

  let current = "";
  let i = 0;
  while (i < wlen) {
    current += cleanedWord[i];
    i += 1;

    while (i < wlen && !startCharsSet.has(cleanedWord[i])) {
      current += cleanedWord[i];
      i += 1;
    }

    if (current[current.length - 1] !== HALANTA || i === wlen || technical) {
      wordSyllables.push(current);
      current = "";
    }
  }

  return wordSyllables;
}

/**
 * Get syllables from a Sanskrit (Devanagari) text
 * Returns 3D array: [lines][words][syllables]
 */
export function getSyllables(text, technical = false) {
  const lines = splitLines(text.trim());
  const syllables = [];

  for (const line of lines) {
    const words = line.trim().split(/\s+/).filter(Boolean);
    const lineSyllables = [];
    for (const word of words) {
      const wordSyllables = getSyllablesWord(word, technical);
      lineSyllables.push(wordSyllables);
    }
    syllables.append ? syllables.append(lineSyllables) : syllables.push(lineSyllables);
  }

  return syllables;
}

/**
 * Checks if a syllable is Laghu (short)
 */
export function isLaghu(syllable) {
  for (const ch of syllable) {
    if (
      !ALL_VYANJANA_SET.has(ch) &&
      !LAGHU_SWARA_SET.has(ch) &&
      !LAGHU_MATRA_SET.has(ch) &&
      ch !== HALANTA
    ) {
      return false;
    }
  }
  return true;
}

/**
 * Toggle matra of a syllable between Laghu and Guru (if possible)
 */
export function toggleMatra(syllable) {
  if (!syllable) return null;
  const lastChar = syllable[syllable.length - 1];

  if (MATRA.includes(lastChar)) {
    const index = MATRA.indexOf(lastChar);
    if ([2, 4, 6, 8].includes(index)) {
      return syllable.slice(0, -1) + MATRA[index - 1];
    }
    if ([1, 3, 5, 7].includes(index)) {
      return syllable.slice(0, -1) + MATRA[index + 1];
    }
  }

  if (SWARA.includes(syllable)) {
    const index = SWARA.indexOf(syllable);
    if ([0, 2, 4, 6, 8].includes(index)) {
      return SWARA[index + 1];
    }
    if ([1, 3, 5, 7, 9].includes(index)) {
      return SWARA[index - 1];
    }
  }

  return null;
}
