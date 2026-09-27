/**
 * TypeScript Type Definitions for ChandaJS
 */

export interface ScansionMatch {
  found: boolean;
  syllables: string[];
  lg: string[];
  gana: string[];
  chanda: Array<[string, string[]]>;
  jaati: string[];
  length: string[];
  matra: string[];
}

export interface FuzzyCandidate {
  chanda: Array<[string, string[]]>;
  gana: string;
  suggestion: any;
  cost: number;
  similarity: number;
  display_chanda: string;
}

export interface LineIdentificationResult {
  found: boolean;
  syllables: string[];
  lg: string[];
  gana: string;
  length: number;
  matra: number;
  chanda: Array<[string, string[]]>;
  jaati: string[];
  display_scheme?: string | null;
  display_line: string;
  display_syllables: string[];
  display_lg: string[];
  display_gana: string;
  display_length: string;
  display_matra: string;
  display_chanda: string;
  display_jaati: string;
  fuzzy: FuzzyCandidate[];
}

export interface LineResultItem {
  line: string;
  result: LineIdentificationResult;
}

export interface VerseResultItem {
  chanda: [string[], number] | null;
  scheme: string;
  scores: Array<[string, number]>;
  lines: number[];
}

export interface TextIdentificationResult {
  result: {
    line: LineResultItem[];
    verse: VerseResultItem[];
  };
  formattedText: string;
}

export interface SummaryCounts {
  line: number;
  match_line: number;
  fuzzy_line: number;
  verse: number;
  match_verse: number;
  fuzzy_verse: number;
  mismatch_syllable: number;
}

export interface ResultSummary {
  verse: Map<string, number>;
  line: {
    match: Map<string, number>;
    fuzzy: Map<string, number>;
  };
  count: SummaryCounts;
}

export interface IdentifyOptions {
  verse?: boolean;
  fuzzy?: boolean;
  scheme?: string | null;
}

export declare class Chanda {
  static Y: string;
  static R: string;
  static T: string;
  static N: string;
  static B: string;
  static J: string;
  static S: string;
  static M: string;
  static L: string;
  static G: string;
  static SYMBOLS: string;
  static GANA: Record<string, string>;

  L: string;
  G: string;
  gana: Record<string, string>;
  ganaInv: Record<string, string>;
  JAATI: Record<number, string[]>;
  SINGLE_CHANDA: Record<string, Array<[string, string[]]>>;
  MULTI_CHANDA: Record<string, Array<[string, string[]]>>;
  SPLITS: Record<string, string[][]>;
  CHANDA: Record<string, Array<[string, string[]]>>;
  MATRA_CHANDA: Array<{ name: string; matra: number[] }>;
  EXAMPLES: Record<string, string[]>;

  constructor(symbols?: string);

  markLg(text: string): {
    syllables: string[][][];
    lg_marks: string[];
    flat_syllables: string[];
  };

  lgToGana(lgStr: string): string;
  ganaToLg(ganaStr: string): string;
  countMatra(ganaStr: string): number;
  processText(text: string): { lines: string[]; scheme: string };

  findDirectMatch(line: string, multi?: boolean): ScansionMatch | null;
  transform(
    sourceLine: string,
    signature: string,
    options?: { replaceCost?: number; deleteCost?: number; insertCost?: number; maxDiff?: number }
  ): { cost: number; output: any };

  identifyLine(line: string, options?: { fuzzy?: boolean; k?: number }): LineIdentificationResult;
  identifyFromText(text: string, options?: IdentifyOptions): TextIdentificationResult;
  summarizeResults(results: { line: LineResultItem[]; verse: VerseResultItem[] }): ResultSummary;

  formatChandaPada(chanda: string, pada: string[]): string;
  formatLineResult(lineResult: LineIdentificationResult): string;
  formatSummary(summary: ResultSummary): string;
}

export declare function clean(
  text: string,
  options?: { punct?: boolean; digits?: boolean; spaces?: boolean; allow?: string[] }
): string;
export declare function splitLines(text: string, pattern?: RegExp): string[];
export declare function getSyllables(text: string, technical?: boolean): string[][][];
export declare function getSyllablesWord(word: string, technical?: boolean): string[];
export declare function isLaghu(syllable: string): boolean;
export declare function toggleMatra(syllable: string): string | null;

export declare function transliterate(text: string, fromScheme?: string, toScheme?: string): string;
export declare function detect(text: string): string;

export declare const Sanscript: {
  detect(text: string): string;
  transliterate(text: string, fromScheme?: string, toScheme?: string): string;
  DEVANAGARI: string;
  IAST: string;
  ITRANS: string;
  HK: string;
  SLP1: string;
};

export declare function distance(s: string, d: string): number;
export declare function editops(s: string, d: string): Array<[string, number, number]>;
