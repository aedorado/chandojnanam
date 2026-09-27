/**
 * Sanskrit Meter Identification Engine (Chandojñānam)
 * Fully ported to modern JavaScript / TypeScript
 * Author of original Python library: Hrishikesh Terdalkar
 */

import {
  clean,
  splitLines,
  getSyllables,
  isLaghu,
  toggleMatra,
  AVAGRAHA,
  HALANTA
} from "./sanskrit.js";
import { Sanscript, DEVANAGARI } from "./sanscript.js";
import { distance, editops } from "./levenshtein.js";
import {
  JAATI,
  SINGLE_CHANDA,
  MULTI_CHANDA,
  SPLITS,
  ALL_CHANDA,
  MATRA_CHANDA
} from "./data/chandaData.js";
import { EXAMPLES } from "./data/examples.js";

export class Chanda {
  static Y = "Y";
  static R = "R";
  static T = "T";
  static N = "N";
  static B = "B";
  static J = "J";
  static S = "S";
  static M = "M";
  static L = "L";
  static G = "G";
  static SYMBOLS = "YRTNBJSMLG";

  static GANA = {
    Y: "LGG",
    R: "GLG",
    T: "GGL",
    N: "LLL",
    B: "GLL",
    J: "LGL",
    S: "LLG",
    M: "GGG"
  };

  /**
   * @param {string} symbols Devanagari symbols matching YRTNBJSMLG
   */
  constructor(symbols = "यरतनभजसमलग") {
    this.L = Chanda.L;
    this.G = Chanda.G;
    this.gana = { ...Chanda.GANA };
    this.ganaInv = {};
    for (const [k, v] of Object.entries(this.gana)) {
      this.ganaInv[v] = k;
    }

    this.inputMap = {};
    this.outputMap = {};
    for (let i = 0; i < symbols.length; i++) {
      this.inputMap[symbols[i]] = Chanda.SYMBOLS[i];
      this.outputMap[Chanda.SYMBOLS[i]] = symbols[i];
    }

    this.JAATI = JAATI;
    this.SINGLE_CHANDA = SINGLE_CHANDA;
    this.MULTI_CHANDA = MULTI_CHANDA;
    this.SPLITS = SPLITS;
    this.CHANDA = ALL_CHANDA;
    this.MATRA_CHANDA = MATRA_CHANDA;
    this.EXAMPLES = EXAMPLES;

    this._cache = new Map();
  }

  /**
   * Translate string using a character dictionary
   */
  translate(str, map) {
    let res = "";
    for (const ch of str) {
      res += map[ch] !== undefined ? map[ch] : ch;
    }
    return res;
  }

  /**
   * Mark Laghu-Guru for given Sanskrit text
   * @returns {{ syllables: Array, lg_marks: string[], flat_syllables: string[] }}
   */
  markLg(text) {
    const skipSyllables = [AVAGRAHA];
    const lgMarks = [];
    const syllables = getSyllables(text);
    const flatSyllables = [];
    for (const line of syllables) {
      for (const word of line) {
        for (const syl of word) {
          flatSyllables.push(syl);
        }
      }
    }

    if (flatSyllables.length === 0) {
      return { syllables, lg_marks: lgMarks, flat_syllables: flatSyllables };
    }

    for (let idx = 0; idx < flatSyllables.length - 1; idx++) {
      const syllable = flatSyllables[idx];
      if (syllable[syllable.length - 1] === HALANTA || skipSyllables.includes(syllable)) {
        lgMarks.push("");
        continue;
      }
      const nextSyllable = flatSyllables[idx + 1];
      const laghu = isLaghu(syllable) && !nextSyllable.includes(HALANTA);
      lgMarks.push(laghu ? this.L : this.G);
    }

    // handle last syllable
    const lastSyllable = flatSyllables[flatSyllables.length - 1];
    if (lastSyllable[lastSyllable.length - 1] === HALANTA || skipSyllables.includes(lastSyllable)) {
      lgMarks.push("");
    } else {
      lgMarks.push(isLaghu(lastSyllable) ? this.L : this.G);
    }

    return { syllables, lg_marks: lgMarks, flat_syllables: flatSyllables };
  }

  /**
   * Transform Laghu-Guru string into Gana string (3 syllables per gana)
   */
  lgToGana(lgStr) {
    const gana = [];
    for (let i = 0; i < lgStr.length; i += 3) {
      const group = lgStr.slice(i, i + 3);
      gana.push(this.ganaInv[group] || group);
    }
    return gana.join("");
  }

  /**
   * Transform Gana string into Laghu-Guru string
   */
  ganaToLg(ganaStr) {
    let res = "";
    for (const ch of ganaStr) {
      res += this.gana[ch] || ch;
    }
    return res;
  }

  /**
   * Count mora / matra in a Gana or Laghu-Guru string
   */
  countMatra(ganaStr) {
    const lgStr = this.ganaToLg(ganaStr);
    let count = 0;
    for (const ch of lgStr) {
      if (ch === this.L) count += 1;
      else if (ch === this.G) count += 2;
    }
    return count;
  }

  /**
   * Process raw text, detect transliteration scheme, clean and split lines
   */
  processText(text) {
    const detected = Sanscript.detect(text);
    const devanagariText =
      detected !== DEVANAGARI ? Sanscript.transliterate(text, detected, DEVANAGARI) : text;

    const lines = [];
    for (const line of splitLines(devanagariText)) {
      const cleanLine = clean(line).trim();
      if (cleanLine) {
        lines.push(cleanLine);
      }
    }
    return { lines, scheme: detected };
  }

  /**
   * Find direct match for a single line
   */
  findDirectMatch(line, multi = false) {
    const chandaDict = multi ? this.MULTI_CHANDA : this.SINGLE_CHANDA;
    const { syllables, lg_marks: lgMarks, flat_syllables: flatSyllables } = this.markLg(clean(line));
    let lgStr = lgMarks.join("");
    if (!lgStr) return null;

    let found = chandaDict[lgStr] !== undefined;

    // Try searching by applying pādānta guru rule (making last syllable Guru if Laghu)
    if (!found && lgStr.endsWith(this.L)) {
      const alteredLg = lgStr.slice(0, -1) + this.G;
      if (chandaDict[alteredLg] !== undefined) {
        lgStr = alteredLg;
        found = true;
      }
    }

    let chanda = [];
    let jaati = [];
    let gana = [];
    let length = [];
    let matra = [];

    const defaultJaati = this.JAATI[-1] || ["अज्ञात"];

    if (!multi) {
      if (found) {
        chanda = [...(this.SINGLE_CHANDA[lgStr] || [])];
      }
      jaati = this.JAATI[lgStr.length] || defaultJaati;
      gana = [this.lgToGana(lgStr)];
      length = [String(lgStr.length)];
      matra = [String(this.countMatra(lgStr))];
    } else {
      if (found) {
        chanda = [...(this.MULTI_CHANDA[lgStr] || [])];
        const splitList = this.SPLITS[lgStr] || [];
        jaati = splitList.map(
          (splits) =>
            "(" +
            splits
              .map((split) => (this.JAATI[split.length] || defaultJaati).join(" / "))
              .join(", ") +
            ")"
        );
        gana = splitList.map(
          (splits) => `(${splits.map((s) => this.lgToGana(s)).join(", ")})`
        );
        length = splitList.map(
          (splits) => `(${splits.map((s) => s.length).join(" + ")})`
        );
        matra = splitList.map(
          (splits) => `(${splits.map((s) => this.countMatra(s)).join(" + ")})`
        );
      }
    }

    return {
      found,
      syllables: flatSyllables,
      lg: lgMarks,
      gana,
      chanda,
      jaati,
      length,
      matra
    };
  }

  /**
   * Find possible transformations of source line to fit a target signature
   */
  transform(sourceLine, signature, options = {}) {
    const {
      replaceCost = 1,
      deleteCost = 1,
      insertCost = 1,
      maxDiff = 3
    } = options;

    const { syllables, lg_marks: lgMarks } = this.markLg(sourceLine);
    const lgSignature = this.ganaToLg(signature);
    const lgStr = lgMarks.join("");
    const ops = editops(lgStr, lgSignature);

    if (ops.length === 0) {
      return { cost: 0, output: [] };
    }

    const distanceVal = ops.length;
    const opCost = {
      replace: replaceCost,
      delete: deleteCost,
      insert: insertCost
    };

    let cost = 0;
    for (const op of ops) {
      cost += opCost[op[0]] || 1;
    }

    if (distanceVal > maxDiff) {
      return { cost: distanceVal, output: null };
    }

    let idx = 0;
    let lgIdx = 0;
    let opIdx = 0;
    const output = [];

    let [opType, spos, dpos] = ops[opIdx];

    for (let lid = 0; lid < syllables.length; lid++) {
      const line = syllables[lid];
      const outputLine = [];

      for (let wid = 0; wid < line.length; wid++) {
        const word = line[wid];
        const outputWord = [];

        for (let cid = 0; cid < word.length; cid++) {
          const syllable = word[cid];
          let outputSyllable = syllable;

          if (lgMarks[idx]) {
            if (lgIdx === spos) {
              if (opType[0] === "i") {
                outputSyllable = `i(${lgSignature[dpos]})`;
                outputWord.push(outputSyllable);
                opIdx += 1;
              }

              if (opIdx < distanceVal) {
                [opType, spos, dpos] = ops[opIdx];
                if (opType[0] !== "i") {
                  outputSyllable = `${opType[0]}(${syllable})`;
                  if (opType[0] === "r") {
                    const substitute = lgSignature[dpos];
                    outputSyllable += `[${substitute}]`;
                    const laghu = isLaghu(syllable);
                    if (laghu !== (substitute === this.L)) {
                      const tm = toggleMatra(syllable);
                      if (tm) {
                        outputSyllable += `{${tm}}`;
                      }
                    }
                  }
                  opIdx += 1;
                }
              }

              if (opIdx < distanceVal) {
                [opType, spos, dpos] = ops[opIdx];
              }
            }
            lgIdx += 1;
          }

          idx += 1;
          outputWord.push(outputSyllable);
        }
        outputLine.push(outputWord);
      }
      output.push(outputLine);
    }

    return { cost, output };
  }

  /**
   * Identify meter for a single text line
   */
  identifyLine(line, options = {}) {
    const { fuzzy = false, k = 10 } = options;
    const { lines, scheme } = this.processText(line);
    const outputScheme = scheme !== DEVANAGARI ? scheme : null;

    if (lines.length > 1) {
      throw new Error("Input contains more than one line.");
    }
    if (lines.length === 0) {
      return {};
    }

    const cleanLine = lines[0];
    const directMatch = this.findDirectMatch(cleanLine);
    const multiMatch = this.findDirectMatch(cleanLine, true);

    if (!directMatch) {
      return {};
    }

    let found = directMatch.found || multiMatch.found;
    const lgStr = directMatch.lg.join("");

    // Check regex pattern matches
    const regexMatches = [];
    for (const pattern of Object.keys(this.CHANDA)) {
      if (pattern.includes("[") || pattern.includes(".")) {
        try {
          const re = new RegExp(`^${pattern}$`);
          if (re.test(lgStr)) {
            regexMatches.push(pattern);
          }
        } catch {
          // ignore invalid regex
        }
      }
    }

    if (regexMatches.length > 0) {
      found = true;
    }

    let chanda = [];
    let jaati = [];
    let gana = [];
    let length = [];
    let matra = [];

    if (found) {
      if (directMatch.found) {
        chanda.push(...directMatch.chanda);
        jaati.push(...directMatch.jaati);
        gana.push(...directMatch.gana);
        length.push(...directMatch.length);
        matra.push(...directMatch.matra);
      }
      if (multiMatch.found) {
        chanda.push(...multiMatch.chanda);
        jaati.push(...multiMatch.jaati);
        gana.push(...multiMatch.gana);
        length.push(...multiMatch.length);
        matra.push(...multiMatch.matra);
      }
      if (regexMatches.length > 0) {
        for (const m of regexMatches) {
          for (const c of this.CHANDA[m] || []) {
            if (!chanda.some((existing) => existing[0] === c[0])) {
              chanda.push(c);
            }
          }
        }
      }
    }

    const fullLg = directMatch.lg.map((c) => this.outputMap[c] || c);
    const fullLength = lgStr.length;
    const fullMatra = this.countMatra(lgStr);
    const fullGana = this.translate(this.lgToGana(lgStr), this.outputMap);
    const fullJaati = this.JAATI[lgStr.length] || this.JAATI[-1] || ["अज्ञात"];

    const displayLine = cleanLine;
    const displaySyllables = directMatch.syllables;
    const displayLg = fullLg;
    const displayGana = gana.length > 0 ? gana.map((g) => this.translate(g, this.outputMap)).join(" / ") : fullGana;
    const displayLength = length.length > 0 ? length.join(" / ") : String(fullLength);
    const displayMatra = matra.length > 0 ? matra.join(" / ") : String(fullMatra);
    const displayChanda = chanda.map(([c, p]) => this.formatChandaPada(c, p)).join(" / ");
    const displayJaati = jaati.length > 0 ? jaati.join(" / ") : fullJaati.join(" / ");

    const answer = {
      found,
      syllables: directMatch.syllables,
      lg: fullLg,
      gana: fullGana,
      length: fullLength,
      matra: fullMatra,
      chanda,
      jaati,
      display_scheme: outputScheme,
      display_line: displayLine,
      display_syllables: displaySyllables,
      display_lg: displayLg,
      display_gana: displayGana,
      display_length: displayLength,
      display_matra: displayMatra,
      display_chanda: displayChanda,
      display_jaati: displayJaati,
      fuzzy: []
    };

    if (!found && fuzzy) {
      const candidates = [];
      for (const [chandaLg, chandaNames] of Object.entries(this.CHANDA)) {
        // Skip regex patterns for fuzzy base
        if (chandaLg.includes("[") || chandaLg.includes(".")) continue;

        const chandaGana = this.lgToGana(chandaLg);
        const { cost, output } = this.transform(cleanLine, chandaLg);
        if (output) {
          const similarity = 1 - cost / chandaLg.length;
          const dispChanda = chandaNames
            .map(([c, p]) => this.formatChandaPada(c, p))
            .join(" / ");

          candidates.push({
            chanda: chandaNames,
            gana: this.translate(chandaGana, this.outputMap),
            suggestion: output,
            cost,
            similarity,
            display_chanda: dispChanda
          });
        }
      }

      candidates.sort((a, b) => b.similarity - a.similarity);
      answer.fuzzy = candidates.slice(0, k);
    }

    return answer;
  }

  /**
   * Identify meters from complete text (multiple lines or complete verses)
   */
  identifyFromText(text, options = {}) {
    const { verse = false, fuzzy = false, scheme = null } = options;
    const { lines, scheme: detectedScheme } = this.processText(text);
    const effectiveScheme = scheme || detectedScheme;

    const lineResults = [];
    for (const line of lines) {
      if (!line) continue;
      const originalLine =
        effectiveScheme !== DEVANAGARI
          ? Sanscript.transliterate(line, DEVANAGARI, effectiveScheme)
          : line;

      lineResults.push({
        line,
        result: this.identifyLine(originalLine, { fuzzy })
      });
    }

    const verseResults = [];
    if (verse && lineResults.length > 0) {
      let verseResult = {
        chanda: null,
        scheme: effectiveScheme,
        scores: [],
        lines: []
      };

      let lineCount = 0;
      const ongoingScore = new Map();

      for (let lineIdx = 0; lineIdx < lineResults.length; lineIdx++) {
        const lineRes = lineResults[lineIdx].result;
        if (lineRes.found) {
          const uniqueChanda = new Set(lineRes.chanda.map((c) => c[0]));
          for (const c of uniqueChanda) {
            ongoingScore.set(c, (ongoingScore.get(c) || 0) + 1);
          }
        } else if (lineRes.fuzzy) {
          for (const fMatch of lineRes.fuzzy) {
            const uniqueChanda = new Set(fMatch.chanda.map((c) => c[0]));
            for (const c of uniqueChanda) {
              ongoingScore.set(c, (ongoingScore.get(c) || 0) + fMatch.similarity);
            }
          }
        }

        verseResult.lines.push(lineIdx);
        lineCount++;

        if (lineCount % 4 === 0 || lineIdx === lineResults.length - 1) {
          const sortedScores = Array.from(ongoingScore.entries()).sort(
            (a, b) => b[1] - a[1]
          );

          if (sortedScores.length > 0) {
            const bestScore = sortedScores[0][1];
            const bestMatches = sortedScores
              .filter(([_, score]) => score === bestScore)
              .map(([ch]) => ch);

            verseResult.scores = sortedScores;
            verseResult.chanda = [bestMatches, bestScore];

            // Prioritize fuzzy matches matching best verse meter
            for (const lIdx of verseResult.lines) {
              const res = lineResults[lIdx].result;
              if (res.fuzzy && res.fuzzy.length > 0) {
                const priority = [];
                const regular = [];
                for (const fm of res.fuzzy) {
                  const hasBest = fm.chanda.some(([c]) => bestMatches.includes(c));
                  if (hasBest) priority.push(fm);
                  else regular.push(fm);
                }
                res.fuzzy = [...priority, ...regular];
              }
            }
          } else {
            verseResult.chanda = [[], 0];
          }

          verseResults.push(verseResult);

          verseResult = {
            chanda: null,
            scheme: effectiveScheme,
            scores: [],
            lines: []
          };
          ongoingScore.clear();
        }
      }
    }

    const results = {
      line: lineResults,
      verse: verseResults
    };

    const simpleResult = [];
    if (verse) {
      for (const vr of verseResults) {
        if (vr.chanda) {
          const bestMatches = vr.chanda[0].join(" / ");
          const bestScore = vr.chanda[1];
          simpleResult.push(`# ${bestMatches} (${bestScore})`);
        }
        simpleResult.push("");
        for (const lineId of vr.lines) {
          simpleResult.push(this.formatLineResult(lineResults[lineId].result));
        }
        simpleResult.push("");
      }
    } else {
      for (const lr of lineResults) {
        simpleResult.push(this.formatLineResult(lr.result));
        simpleResult.push("");
      }
    }

    return {
      result: results,
      formattedText: simpleResult.join("\n")
    };
  }

  /**
   * Summarize meter identification statistics
   */
  summarizeResults(results) {
    const lineResults = results.line || [];
    const verseResults = results.verse || [];

    const matchLineStats = new Map();
    const fuzzyLineStats = new Map();
    const verseStats = new Map();

    const counts = {
      line: 0,
      match_line: 0,
      fuzzy_line: 0,
      verse: 0,
      match_verse: 0,
      fuzzy_verse: 0,
      mismatch_syllable: 0
    };

    for (const lineAnswer of lineResults) {
      counts.line++;
      const lr = lineAnswer.result;
      if (lr.found) {
        counts.match_line++;
        const chandaList = lr.display_chanda ? lr.display_chanda.split(" / ") : [];
        for (const c of chandaList) {
          matchLineStats.set(c, (matchLineStats.get(c) || 0) + 1);
        }
      } else {
        counts.fuzzy_line++;
        if (lr.fuzzy && lr.fuzzy.length > 0) {
          counts.mismatch_syllable += lr.fuzzy[0].cost || 0;
          const chandaList = lr.fuzzy[0].display_chanda
            ? lr.fuzzy[0].display_chanda.split(" / ")
            : [];
          for (const c of chandaList) {
            fuzzyLineStats.set(c, (fuzzyLineStats.get(c) || 0) + 1);
          }
        }
      }
    }

    for (const vr of verseResults) {
      counts.verse++;
      if (vr.chanda) {
        const [chandaList, chandaScore] = vr.chanda;
        if (chandaScore === vr.lines.length) {
          counts.match_verse++;
        } else {
          counts.fuzzy_verse++;
        }
        for (const c of chandaList) {
          verseStats.set(c, (verseStats.get(c) || 0) + 1);
        }
      }
    }

    return {
      verse: verseStats,
      line: {
        match: matchLineStats,
        fuzzy: fuzzyLineStats
      },
      count: counts
    };
  }

  formatChandaPada(chanda, pada) {
    if (!pada || pada.length === 0) return chanda;
    if (pada.length === 1) {
      return pada[0] ? `${chanda} (पाद ${pada[0]})` : chanda;
    }
    if (pada.length === 2) {
      return `${chanda} (पाद ${pada[0]}-${pada[1]})`;
    }
    return chanda;
  }

  formatLineResult(lineResult) {
    if (!lineResult || !lineResult.display_line) return "";
    const out = [
      lineResult.display_line,
      `\tSyllables: ${lineResult.display_syllables ? lineResult.display_syllables.join(" ") : ""}`,
      `\tLG: ${lineResult.display_lg ? lineResult.display_lg.join("") : ""}`,
      `\tGana: ${lineResult.display_gana || ""}`,
      `\tCounts: ${lineResult.display_length || 0} letters, ${lineResult.display_matra || 0} morae`,
      `\tChanda: ${lineResult.display_chanda || "अज्ञात"}`,
      `\tJaati: ${lineResult.display_jaati || "अज्ञात"}`
    ];
    if (lineResult.fuzzy && lineResult.fuzzy.length > 0) {
      const best = lineResult.fuzzy[0];
      out.push(`\tFuzzy: ${best.display_chanda} (similarity: ${best.similarity.toFixed(2)})`);
    }
    return out.join("\n");
  }

  formatSummary(summary) {
    const lines = [];
    if (summary.verse && summary.verse.size > 0) {
      lines.push("Verse Statistics", "----------------");
      let idx = 1;
      const sorted = Array.from(summary.verse.entries()).sort((a, b) => b[1] - a[1]);
      for (const [name, count] of sorted) {
        lines.push(`${String(idx++).padStart(4)}. ${name}: ${count}`);
      }
      lines.push("");
    }

    lines.push("Line Statistics", "---------------");
    if (summary.line.match && summary.line.match.size > 0) {
      lines.push("-- Exact Match");
      let idx = 1;
      const sorted = Array.from(summary.line.match.entries()).sort((a, b) => b[1] - a[1]);
      for (const [name, count] of sorted) {
        lines.push(`${String(idx++).padStart(4)}. ${name}: ${count}`);
      }
      lines.push("");
    }

    if (summary.line.fuzzy && summary.line.fuzzy.size > 0) {
      lines.push("-- Fuzzy Match");
      let idx = 1;
      const sorted = Array.from(summary.line.fuzzy.entries()).sort((a, b) => b[1] - a[1]);
      for (const [name, count] of sorted) {
        lines.push(`${String(idx++).padStart(4)}. ${name}: ${count}`);
      }
      lines.push("");
    }

    const c = summary.count;
    lines.push(
      "Counts",
      "------",
      `* Total Lines: ${c.line}`,
      `  - Exact Match: ${c.match_line}`,
      `  - Fuzzy Match: ${c.fuzzy_line}`,
      `* Total Verses: ${c.verse}`,
      `  - Exact Match: ${c.match_verse}`,
      `  - Fuzzy Match: ${c.fuzzy_verse}`,
      `* Total Syllables Mismatched: ${c.mismatch_syllable}`
    );

    return lines.join("\n");
  }
}
