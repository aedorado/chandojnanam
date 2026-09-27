/**
 * ChandaJS - Sanskrit Meter Identification & Scansion Library
 * An exhaustive port of Chandojñānam
 */

export { Chanda } from "./chanda.js";
export {
  clean,
  splitLines,
  getSyllables,
  getSyllablesWord,
  isLaghu,
  toggleMatra,
  SWARA,
  MATRA,
  VYANJANA,
  ALPHABET,
  HALANTA,
  AVAGRAHA,
  ANUSWARA,
  VISARGA
} from "./sanskrit.js";
export { Sanscript, transliterate, detect } from "./sanscript.js";
export { distance, editops } from "./levenshtein.js";
export {
  JAATI,
  SINGLE_CHANDA,
  MULTI_CHANDA,
  SPLITS,
  ALL_CHANDA,
  MATRA_CHANDA
} from "./data/chandaData.js";
export { EXAMPLES } from "./data/examples.js";
