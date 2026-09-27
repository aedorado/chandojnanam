/**
 * Automated test suite for ChandaJS
 * Run using: node --test test/test.js
 */

import test from "node:test";
import assert from "node:assert/strict";
import { Chanda } from "../src/chanda.js";
import { isLaghu, getSyllables, clean } from "../src/sanskrit.js";
import { Sanscript, transliterate } from "../src/sanscript.js";
import { distance, editops } from "../src/levenshtein.js";

test("Sanskrit text syllabification and Laghu/Guru detection", () => {
  const syllables = getSyllables("कवि भारतः");
  assert.equal(syllables.length, 1);
  assert.equal(syllables[0].length, 2);

  // 'क' is short (Laghu), 'वि' is short (Laghu)
  assert.equal(isLaghu("क"), true);
  assert.equal(isLaghu("वि"), true);
  // 'भा' is long (Guru), 'र' is short (Laghu), 'तः' has visarga (Guru)
  assert.equal(isLaghu("भा"), false);
  assert.equal(isLaghu("तः"), false);
});

test("Transliteration between Roman scripts and Devanagari", () => {
  const iast = "mātā rāmo matpitā rāmacandraḥ";
  const deva = transliterate(iast, "iast", "devanagari");
  assert.match(deva, /माता रामो/);

  const backToIast = transliterate(deva, "devanagari", "iast");
  assert.match(backToIast, /mātā rāmo/);
});

test("Levenshtein distance & edit operations", () => {
  assert.equal(distance("LGGLLG", "LGGLLG"), 0);
  assert.equal(distance("LGGLLG", "LGGGGL"), 3);

  const ops = editops("LGGLLG", "LGGGGL");
  assert.equal(ops.length, 3);
});

test("Chanda identification of classic Sanskrit meters", () => {
  const chanda = new Chanda();

  // Test 1: Shalini lakshana line
  // "शालिन्युक्ता म्तौ तगौ गोऽब्धिलोकैः"
  const line1 = chanda.identifyLine("शालिन्युक्ता म्तौ तगौ गोऽब्धिलोकैः");
  assert.equal(line1.found, true);
  assert.match(line1.display_chanda, /शालिनी/);

  // Test 2: Indravajra
  // "स्यादिन्द्रवज्रा यदि तौ जगौ गः" (or "स्यादिन्द्रवज्रा यदि तौस्ततौ गः")
  const line2 = chanda.identifyLine("लोकाभिरामं रणरङ्गधीरं");
  assert.equal(line2.found, true);
  assert.match(line2.display_chanda, /इन्द्रवज्रा/);

  // Test 3: Vasantatilaka
  // "उक्ता वसन्ततिलका तभजा जगौ गः"
  const line3 = chanda.identifyLine("उक्ता वसन्ततिलका तभजा जगौ गः");
  assert.equal(line3.found, true);
  assert.match(line3.display_chanda, /वसन्ततिलका/);

  // Test 4: Bhujangaprayata
  // "नमस्ते सदा वत्सले मातृभूमे"
  const line4 = chanda.identifyLine("नमस्ते सदा वत्सले मातृभूमे");
  assert.equal(line4.found, true);
  assert.match(line4.display_chanda, /भुजङ्गप्रयात/);

  // Test 5: Full verse identification with verse scoring
  const verseText = `
लोकाभिरामं रणरङ्गधीरं
राजीवनेत्रं रघुवंशनाथम्।
कारुण्यरूपं करुणाकरं तं
श्रीरामचन्द्रं शरणं प्रपद्ये॥
`;
  const result = chanda.identifyFromText(verseText, { verse: true });
  assert.equal(result.result.verse.length, 1);
  const bestMeter = result.result.verse[0].chanda[0];
  assert.ok(bestMeter.includes("इन्द्रवज्रा") || bestMeter.includes("उपजाति") || bestMeter.includes("उपेन्द्रवज्रा"));
});

test("Fuzzy matching for metrical variations", () => {
  const chanda = new Chanda();
  // Slightly altered line that is not an exact match to any meter
  const res = chanda.identifyLine("नमस्ते सदा वत्सले मातृभूमी देव", { fuzzy: true });
  assert.equal(res.found, false);
  assert.ok(res.fuzzy.length > 0);
  assert.ok(res.fuzzy[0].similarity > 0.7);
  assert.match(res.fuzzy[0].display_chanda, /भुजङ्गप्रयात/);
});
