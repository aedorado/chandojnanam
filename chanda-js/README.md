# ChandaJS (छन्दोज्ञानम्) 📜

> **Instant Sanskrit Meter Identification, Prosodic Scansion & Syllable Analysis Engine in Pure JavaScript & TypeScript.**
>
> 100% Client-side. Zero external runtime dependencies. Deploys to Vercel in 0 seconds.

---

## 🌟 Key Features

- **⚡ Zero Dependencies & 100% Client-Side**: No Python servers, no C-extensions, and no serverless cold starts. Executes in < 2ms in browsers or Node.js.
- **🎯 Exhaustive Meter Database**: Built-in catalog of **200+ classical Sanskrit meters** (सम, अर्धसम, विषम, and मात्रावृत्त like आर्या, अनुष्टुभ्, इन्द्रवज्रा, उपेन्द्रवज्रा, वसन्ततिलका, मन्दाक्रान्ता, शिखरिणी, शार्दूलविक्रीडित, etc.).
- **🔤 Native Sanskrit Prosody Rules**: Full support for Laghu-Guru classification (`।` / `ऽ`), conjunct consonants (संयुक्ताक्षर), pādānta guru rule, avagraha, and all 8 traditional Gaṇas (यरतनभजसम + ल, ग).
- **🔄 Universal Transliteration**: Built-in Sanscript transliteration engine supporting **Devanagari**, **IAST**, **ITRANS**, **Harvard-Kyoto**, and **SLP1**.
- **🔍 Fuzzy Matching & Metric Defect Detection**: Levenshtein-based edit distance identifies misspelled or unmetrical syllables and suggests corrections (e.g. vowel lengthening/shortening via `toggleMatra`).
- **📊 Complete Verse Scansion & Summary**: Scores 4-pada stanzas, identifies dominant meters, and aggregates detailed statistics.
- **🚀 Ready for Vercel & Web**: Includes a modern, aesthetic web application that can be deployed to Vercel instantly by connecting your GitHub repo.

---

## 📦 Using as a Library in Code

### Installation

If using as a local folder or npm package:

```bash
npm install ./chanda-js
# or once published:
# npm install chanda-js
```

### 1. Basic Single Line Identification

```javascript
import { Chanda } from "chanda-js";

const chanda = new Chanda();

const result = chanda.identifyLine("नमस्ते सदा वत्सले मातृभूमे");

console.log(result.display_chanda);   // "भुजङ्गप्रयात"
console.log(result.display_gana);     // "य य य य"
console.log(result.display_lg);       // ["ल", "ग", "ग", "ल", "ग", "ग", ...]
console.log(result.length);           // 12 (syllables)
console.log(result.matra);            // 20 (morae)
```

### 2. Full 4-Pada Verse Analysis

```javascript
import { Chanda } from "chanda-js";

const chanda = new Chanda();

const verse = `
लोकाभिरामं रणरङ्गधीरं
राजीवनेत्रं रघुवंशनाथम्।
कारुण्यरूपं करुणाकरं तं
श्रीरामचन्द्रं शरणं प्रपद्ये॥
`;

const analysis = chanda.identifyFromText(verse, { verse: true, fuzzy: true });

console.log("Identified Meter:", analysis.result.verse[0].chanda[0]); // ["इन्द्रवज्रा"]
console.log(analysis.formattedText);
```

### 3. Syllabification & Laghu-Guru Marking

```javascript
import { Chanda } from "chanda-js";

const chanda = new Chanda();
const { flat_syllables, lg_marks } = chanda.markLg("कवि भारतः");

console.log(flat_syllables); // ["क", "वि", "भा", "र", "तः"]
console.log(lg_marks);       // ["L", "L", "G", "L", "G"]
```

### 4. Transliteration (Sanscript)

```javascript
import { transliterate, detect } from "chanda-js";

// Roman to Devanagari
const deva = transliterate("mātā rāmo matpitā rāmacandraḥ", "iast", "devanagari");
console.log(deva); // "माता रामो मत्पिता रामचन्द्रः"

// Auto-detect and convert to ITRANS
const itrans = transliterate(deva, "devanagari", "itrans");
console.log(itrans); // "mAtA rAmo matpitA rAmachandraH"
```

---

## 🚀 How to Deploy the Web App to Vercel

Because this project is built with static, modern web standards and zero backend requirements, deployment to Vercel is completely free and takes 10 seconds:

### Method 1: Push to GitHub & Connect to Vercel (Recommended)

1. Make a new GitHub repository (e.g. `chanda-js` or `chandojnanam-web`).
2. Push this folder to your repository:
   ```bash
   cd chanda-js
   git init
   git add .
   git commit -m "Initial commit of ChandaJS"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo-name>.git
   git push -u origin main
   ```
3. Go to [vercel.com](https://vercel.com/new).
4. Select your new GitHub repository.
5. Framework Preset: **Other** (leave Root Directory as `./`).
6. Click **Deploy**. Your app will be live instantly on `https://<your-project>.vercel.app`!

### Method 2: Deploy with Vercel CLI

```bash
cd chanda-js
npx vercel
# For production:
npx vercel --prod
```

---

## 🧪 Running Tests

The test suite runs using Node's built-in test runner (no dependencies required):

```bash
node --test test/test.js
```

---

## 📄 License & Attribution

- **License**: GNU General Public License v3.0 (GPL-3.0).
- **Original Research & Algorithm**: [Hrishikesh Terdalkar](https://github.com/hrishikeshrt) (*Chandojñānam* & *sanskrit-text*).
