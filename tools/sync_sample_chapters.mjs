/**
 * Sync enriched samples.json into SAMPLE_CHAPTERS in root + public app.js
 */
import fs from "node:fs";
import path from "node:path";

const samples = JSON.parse(
  fs.readFileSync("backend/database/seeders/data/samples.json", "utf8")
);

const keyBySlug = {
  "liberation-war-1971": "1",
  "water-cycle": "2",
  "green-revolution": "3",
  "photosynthesis-respiration": "4",
};

const chapters = {};
for (const sample of samples) {
  const key = keyBySlug[sample.slug];
  if (!key) continue;
  chapters[key] = {
    title: sample.title,
    category: sample.category,
    topic: sample.topic,
    originalText: sample.original_text,
    metadata: sample.metadata,
    payload: sample.payload,
  };
}

const block =
  "const SAMPLE_CHAPTERS = " +
  JSON.stringify(chapters, null, 4)
    .replace(/"([^"]+)":/g, (m, p1) => {
      // keep numeric keys quoted for app.js compatibility
      if (/^\d+$/.test(p1)) return `"${p1}":`;
      return `${p1}:`;
    })
    // Fix: JSON already has quoted keys; for JS object we want unquoted non-numeric keys
    // Rebuild carefully:
    ;

// Rebuild clean JS object literal
function toJs(value, indent = 0) {
  const pad = " ".repeat(indent);
  if (value === null) return "null";
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    const items = value.map((v) => pad + "    " + toJs(v, indent + 4)).join(",\n");
    return `[\n${items}\n${pad}]`;
  }
  if (typeof value === "object") {
    const keys = Object.keys(value);
    if (keys.length === 0) return "{}";
    const items = keys
      .map((k) => {
        const keyOut = /^[A-Za-z_][A-Za-z0-9_]*$/.test(k) ? k : JSON.stringify(k);
        return `${pad}    ${keyOut}: ${toJs(value[k], indent + 4)}`;
      })
      .join(",\n");
    return `{\n${items}\n${pad}}`;
  }
  return "null";
}

const jsBlock = `const SAMPLE_CHAPTERS = ${toJs(chapters)};`;

function replaceInApp(filePath) {
  const src = fs.readFileSync(filePath, "utf8");
  const start = src.indexOf("const SAMPLE_CHAPTERS = ");
  if (start < 0) throw new Error(`SAMPLE_CHAPTERS not found in ${filePath}`);
  const endMarker = "\n};\n\n// 2. APP STATE MANAGER";
  const end = src.indexOf(endMarker, start);
  if (end < 0) throw new Error(`End marker not found in ${filePath}`);
  const next = src.slice(0, start) + jsBlock + "\n\n// 2. APP STATE MANAGER" + src.slice(end + endMarker.length);
  fs.writeFileSync(filePath, next);
  console.log(`Updated ${filePath}`);
}

replaceInApp("app.js");
replaceInApp("backend/public/app/app.js");
console.log("Synced SAMPLE_CHAPTERS from samples.json");
