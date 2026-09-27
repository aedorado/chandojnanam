/**
 * Chandojñānam Web Application Controller
 * Handles UI interactions, real-time scansion, presets, and catalog exploration
 */

import { Chanda } from "./src/chanda.js";
import { EXAMPLES } from "./src/data/examples.js";
import {
  SINGLE_CHANDA,
  MULTI_CHANDA,
  MATRA_CHANDA,
  JAATI
} from "./src/data/chandaData.js";
import { Sanscript } from "./src/sanscript.js";

// Initialize Chanda Engine
const chanda = new Chanda();

// DOM Elements
const navTabs = document.querySelectorAll(".nav-tab");
const tabPanes = document.querySelectorAll(".tab-pane");

const verseTextarea = document.getElementById("verse-input-textarea");
const inputSchemeSelect = document.getElementById("input-scheme-select");
const analysisModeSelect = document.getElementById("analysis-mode-select");
const fuzzyToggle = document.getElementById("fuzzy-toggle");
const inputMetaInfo = document.getElementById("input-meta-info");

const presetPillsContainer = document.getElementById("preset-pills-container");
const scansionLinesContainer = document.getElementById("scansion-lines-container");

const bannerMeterName = document.getElementById("banner-meter-name");
const bannerMatchType = document.getElementById("banner-match-type");
const bannerJaatiBadge = document.getElementById("banner-jaati-badge");
const bannerStats = document.getElementById("banner-stats");

const summaryStatsCard = document.getElementById("summary-stats-card");
const summaryGridContent = document.getElementById("summary-grid-content");

const clearInputBtn = document.getElementById("clear-input-btn");
const copyJsonBtn = document.getElementById("copy-json-btn");
const copyTextBtn = document.getElementById("copy-text-btn");

const catalogCardsContainer = document.getElementById("catalog-cards-container");
const catalogSearchInput = document.getElementById("catalog-search-input");
const catalogFilterBtns = document.querySelectorAll(".filter-pill");
const catalogCountBadge = document.getElementById("catalog-count-badge");

let currentAnalysisResult = null;

// =============================================================================
// Tab Switching
// =============================================================================
navTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    const targetId = tab.getAttribute("data-tab");
    navTabs.forEach((t) => t.classList.remove("active"));
    tabPanes.forEach((p) => p.classList.remove("active"));

    tab.classList.add("active");
    const targetPane = document.getElementById(targetId);
    if (targetPane) targetPane.classList.add("active");
  });
});

// =============================================================================
// Load Presets
// =============================================================================
function initPresets() {
  presetPillsContainer.innerHTML = "";
  for (const [meterName, lines] of Object.entries(EXAMPLES)) {
    const btn = document.createElement("button");
    btn.className = "preset-btn";
    btn.textContent = meterName;
    btn.title = `Load example for ${meterName}`;
    btn.addEventListener("click", () => {
      // Filter out empty lines or combine
      const verseText = lines.filter(Boolean).join("\n");
      verseTextarea.value = verseText;
      runScansion();
    });
    presetPillsContainer.appendChild(btn);
  }
}

// =============================================================================
// Real-time Scansion
// =============================================================================
let debounceTimer = null;
function triggerScansion() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(runScansion, 80);
}

function runScansion() {
  const text = verseTextarea.value.trim();
  const charCount = text.length;
  const lineCount = text ? text.split("\n").filter((l) => l.trim()).length : 0;
  inputMetaInfo.textContent = `${lineCount} lines | ${charCount} chars`;

  if (!text) {
    clearResults();
    return;
  }

  const mode = analysisModeSelect.value;
  const fuzzy = fuzzyToggle.checked;
  const selectedScheme = inputSchemeSelect.value === "auto" ? null : inputSchemeSelect.value;

  try {
    const isVerseMode = mode === "verse";
    const resultObj = chanda.identifyFromText(text, {
      verse: isVerseMode,
      fuzzy: fuzzy,
      scheme: selectedScheme
    });

    currentAnalysisResult = resultObj;
    renderResults(resultObj, isVerseMode);
  } catch (err) {
    console.error("Scansion error:", err);
  }
}

function clearResults() {
  bannerMeterName.textContent = "प्रतीक्ष्यताम्... (Type a verse)";
  bannerMatchType.textContent = "Waiting";
  bannerMatchType.className = "meter-badge";
  bannerJaatiBadge.textContent = "—";
  bannerStats.innerHTML = "";
  scansionLinesContainer.innerHTML = "";
  summaryStatsCard.style.display = "none";
}

function renderResults(resultObj, isVerseMode) {
  const lineResults = resultObj.result.line;
  const verseResults = resultObj.result.verse;

  // 1. Update Top Banner
  if (isVerseMode && verseResults.length > 0) {
    const vr = verseResults[0];
    if (vr.chanda && vr.chanda[0].length > 0) {
      const bestName = vr.chanda[0].join(" / ");
      const score = vr.chanda[1];
      const isExact = score === vr.lines.length;

      bannerMeterName.textContent = bestName;
      bannerMatchType.textContent = isExact ? "Exact Match" : `Fuzzy Match (${score}/${vr.lines.length})`;
      bannerMatchType.className = `meter-badge ${isExact ? "exact" : "fuzzy"}`;

      // First line's jaati
      const firstLineRes = lineResults[vr.lines[0]]?.result;
      bannerJaatiBadge.textContent = firstLineRes?.display_jaati || "—";

      bannerStats.innerHTML = `
        <span>Lines: <strong>${vr.lines.length}</strong></span>
        <span>Aksharas: <strong>${firstLineRes?.length || "—"} / pada</strong></span>
        <span>Morae (मात्रा): <strong>${firstLineRes?.matra || "—"}</strong></span>
      `;
    } else {
      renderBannerFallback(lineResults[0]?.result);
    }
  } else if (lineResults.length > 0) {
    renderBannerFallback(lineResults[0]?.result);
  } else {
    clearResults();
    return;
  }

  // 2. Render Line Cards
  scansionLinesContainer.innerHTML = "";
  lineResults.forEach((item, idx) => {
    const lr = item.result;
    const card = document.createElement("div");
    card.className = "line-card";

    // Header
    const cardHeader = document.createElement("div");
    cardHeader.className = "line-header";

    const numBadge = document.createElement("span");
    numBadge.className = "line-number-badge";
    numBadge.textContent = `पाद ${idx + 1}`;

    const titleSpan = document.createElement("span");
    titleSpan.className = "line-meter-title";
    titleSpan.textContent = lr.display_chanda || (lr.fuzzy?.[0] ? `${lr.fuzzy[0].display_chanda} (Fuzzy)` : "अज्ञात वृत्तम्");

    cardHeader.appendChild(numBadge);
    cardHeader.appendChild(titleSpan);
    card.appendChild(cardHeader);

    // Verse text line
    const textP = document.createElement("div");
    textP.className = "line-verse-text";
    textP.textContent = lr.display_line;
    card.appendChild(textP);

    // Syllables Strip
    if (lr.syllables && lr.syllables.length > 0) {
      const strip = document.createElement("div");
      strip.className = "syllables-strip";

      for (let sIdx = 0; sIdx < lr.syllables.length; sIdx++) {
        const syl = lr.syllables[sIdx];
        const mark = lr.lg[sIdx] || "";
        const isL = mark === "ल" || mark === "L";
        const isG = mark === "ग" || mark === "G";

        const block = document.createElement("div");
        block.className = `syllable-block ${isL ? "laghu" : isG ? "guru" : "empty"}`;

        const sylText = document.createElement("span");
        sylText.className = "syllable-text";
        sylText.textContent = syl;

        const badge = document.createElement("span");
        badge.className = "syllable-lg-badge";
        badge.textContent = isL ? "। (1)" : isG ? "ऽ (2)" : "—";

        block.appendChild(sylText);
        block.appendChild(badge);
        strip.appendChild(block);
      }
      card.appendChild(strip);
    }

    // Gana and stats metadata row
    const metaRow = document.createElement("div");
    metaRow.className = "line-meta-row";

    const ganaTokens = (lr.display_gana || "").split(" ").filter(Boolean);
    const ganaDiv = document.createElement("div");
    ganaDiv.className = "gana-badge-row";
    ganaDiv.innerHTML = `<span>गण:</span> ` + ganaTokens.map((g) => `<span class="gana-token">${g}</span>`).join(" ");

    const countDiv = document.createElement("div");
    countDiv.textContent = `${lr.length || 0} अक्षराणि | ${lr.matra || 0} मात्राः | ${lr.display_jaati || "—"}`;

    metaRow.appendChild(ganaDiv);
    metaRow.appendChild(countDiv);
    card.appendChild(metaRow);

    // If fuzzy suggestion exists and line was not exact
    if (!lr.found && lr.fuzzy && lr.fuzzy.length > 0) {
      const topFuzzy = lr.fuzzy[0];
      const suggestionBox = document.createElement("div");
      suggestionBox.className = "fuzzy-suggestion-box";
      suggestionBox.innerHTML = `
        <strong>संभाव्य-दोषपरीक्षणम्:</strong> Matches <strong>${topFuzzy.display_chanda}</strong> with ${(topFuzzy.similarity * 100).toFixed(0)}% confidence (Gana: ${topFuzzy.gana}).
      `;
      card.appendChild(suggestionBox);
    }

    scansionLinesContainer.appendChild(card);
  });

  // 3. Render Summary Statistics
  const summary = chanda.summarizeResults(resultObj.result);
  renderSummaryStats(summary);
}

function renderBannerFallback(firstLineResult) {
  if (!firstLineResult) {
    clearResults();
    return;
  }
  const isFound = firstLineResult.found;
  const name = firstLineResult.display_chanda || (firstLineResult.fuzzy?.[0]?.display_chanda ? `${firstLineResult.fuzzy[0].display_chanda} (Fuzzy)` : "अज्ञात");

  bannerMeterName.textContent = name;
  bannerMatchType.textContent = isFound ? "Exact Match" : "Unidentified / Fuzzy";
  bannerMatchType.className = `meter-badge ${isFound ? "exact" : "fuzzy"}`;
  bannerJaatiBadge.textContent = firstLineResult.display_jaati || "—";
  bannerStats.innerHTML = `
    <span>Aksharas: <strong>${firstLineResult.length || 0}</strong></span>
    <span>Morae (मात्रा): <strong>${firstLineResult.matra || 0}</strong></span>
    <span>Gaṇa: <strong>${firstLineResult.display_gana || "—"}</strong></span>
  `;
}

function renderSummaryStats(summary) {
  summaryStatsCard.style.display = "block";
  summaryGridContent.innerHTML = "";

  const items = [
    { label: "कुल पङ्क्तयः (Total Lines)", val: summary.count.line },
    { label: "शुद्ध-मेलनम् (Exact Lines)", val: summary.count.match_line },
    { label: "संभाव्य-मेलनम् (Fuzzy Lines)", val: summary.count.fuzzy_line },
    { label: "अक्षर-दोष-संख्या (Mismatched Syllables)", val: summary.count.mismatch_syllable }
  ];

  items.forEach((it) => {
    const el = document.createElement("div");
    el.className = "summary-item";
    el.innerHTML = `
      <div class="summary-item-label">${it.label}</div>
      <div class="summary-item-val">${it.val}</div>
    `;
    summaryGridContent.appendChild(el);
  });
}

// =============================================================================
// Action Buttons: Clear, Copy JSON, Copy Text
// =============================================================================
clearInputBtn.addEventListener("click", () => {
  verseTextarea.value = "";
  runScansion();
});

copyJsonBtn.addEventListener("click", () => {
  if (!currentAnalysisResult) return;
  navigator.clipboard.writeText(JSON.stringify(currentAnalysisResult.result, null, 2)).then(() => {
    copyJsonBtn.textContent = "Copied JSON!";
    setTimeout(() => (copyJsonBtn.textContent = "Copy JSON"), 2000);
  });
});

copyTextBtn.addEventListener("click", () => {
  if (!currentAnalysisResult) return;
  navigator.clipboard.writeText(currentAnalysisResult.formattedText).then(() => {
    copyTextBtn.textContent = "Copied Text!";
    setTimeout(() => (copyTextBtn.textContent = "Copy Formatted"), 2000);
  });
});

// Copy code buttons in Tab 3
document.querySelectorAll(".btn-copy-code").forEach((btn) => {
  btn.addEventListener("click", () => {
    const codeId = btn.getAttribute("data-code-id");
    const codeEl = document.getElementById(codeId);
    if (codeEl) {
      navigator.clipboard.writeText(codeEl.textContent).then(() => {
        btn.textContent = "Copied!";
        setTimeout(() => (btn.textContent = "Copy"), 2000);
      });
    }
  });
});

// Event Listeners for inputs
verseTextarea.addEventListener("input", triggerScansion);
inputSchemeSelect.addEventListener("change", runScansion);
analysisModeSelect.addEventListener("change", runScansion);
fuzzyToggle.addEventListener("change", runScansion);

// =============================================================================
// TAB 2: Meter Catalog Explorer
// =============================================================================
function initCatalog() {
  const allMeters = [];

  // 1. Sama meters
  for (const [pattern, meterList] of Object.entries(SINGLE_CHANDA)) {
    for (const [name, pada] of meterList) {
      allMeters.push({
        name,
        type: "sama",
        pada: pada.join(", "),
        pattern: pattern,
        gana: chanda.translate(chanda.lgToGana(pattern), chanda.outputMap),
        length: pattern.length,
        matra: chanda.countMatra(pattern)
      });
    }
  }

  // 2. Ardhasama / Vishama
  for (const [pattern, meterList] of Object.entries(MULTI_CHANDA)) {
    for (const [name, pada] of meterList) {
      allMeters.push({
        name,
        type: "ardhasama",
        pada: pada.join("-"),
        pattern: pattern,
        gana: chanda.translate(chanda.lgToGana(pattern), chanda.outputMap),
        length: pattern.length,
        matra: chanda.countMatra(pattern)
      });
    }
  }

  // 3. Matra meters
  for (const m of MATRA_CHANDA) {
    allMeters.push({
      name: m.name,
      type: "matra",
      pada: "4 pada",
      pattern: m.matra.join(" - "),
      gana: "मात्रावृत्तम्",
      length: "—",
      matra: m.matra.reduce((a, b) => a + b, 0)
    });
  }

  // Deduplicate by name
  const seen = new Set();
  const uniqueMeters = [];
  for (const m of allMeters) {
    const key = `${m.name}_${m.pattern}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueMeters.push(m);
    }
  }

  // Sort alphabetically by Sanskrit name
  uniqueMeters.sort((a, b) => a.name.localeCompare(b.name, "sa"));

  let activeFilter = "all";
  let searchQuery = "";

  function filterAndRenderCatalog() {
    const q = searchQuery.toLowerCase().trim();
    const filtered = uniqueMeters.filter((m) => {
      const matchFilter = activeFilter === "all" || m.type === activeFilter;
      const matchSearch =
        !q ||
        m.name.toLowerCase().includes(q) ||
        m.gana.toLowerCase().includes(q) ||
        String(m.length).includes(q) ||
        m.pattern.toLowerCase().includes(q);

      return matchFilter && matchSearch;
    });

    catalogCountBadge.textContent = `Showing ${filtered.length} of ${uniqueMeters.length} meters`;
    catalogCardsContainer.innerHTML = "";

    filtered.slice(0, 100).forEach((m) => {
      const card = document.createElement("div");
      card.className = "catalog-card";

      const jaatiName = (JAATI[m.length] || [""])[0];

      card.innerHTML = `
        <div class="catalog-card-header">
          <span class="catalog-card-name">${m.name}</span>
          <span class="catalog-card-type">${m.type}</span>
        </div>
        <div class="catalog-card-meta">
          ${jaatiName ? `<strong>${jaatiName}</strong> • ` : ""}${m.length !== "—" ? `${m.length} अक्षराणि • ` : ""}${m.matra} मात्राः
        </div>
        <div class="catalog-card-formula">
          ${m.gana}
        </div>
      `;
      catalogCardsContainer.appendChild(card);
    });
  }

  catalogSearchInput.addEventListener("input", (e) => {
    searchQuery = e.target.value;
    filterAndRenderCatalog();
  });

  catalogFilterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      catalogFilterBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      activeFilter = btn.getAttribute("data-filter");
      filterAndRenderCatalog();
    });
  });

  filterAndRenderCatalog();
}

// =============================================================================
// Initialization
// =============================================================================
initPresets();
initCatalog();

// Default initial verse (Indravajra from examples)
if (EXAMPLES["इन्द्रवज्रा"]) {
  verseTextarea.value = EXAMPLES["इन्द्रवज्रा"].filter(Boolean).join("\n");
  runScansion();
}
