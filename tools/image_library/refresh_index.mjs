import fs from "node:fs";
import path from "node:path";

const root = "assets/universal_library";
const topics = fs
  .readdirSync(root, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .sort();

const index = {};
const rows = [];
let total = 0;

for (const topic of topics) {
  const dir = path.join(root, topic);
  const files = fs.readdirSync(dir).filter((f) => /\.(jpe?g|png|webp)$/i.test(f));
  index[topic] = files.map((f) => {
    const full = path.join(dir, f).replaceAll("\\", "/");
    const bytes = fs.statSync(path.join(dir, f)).size;
    rows.push({ file: full, topic, bytes });
    return {
      file: full,
      tags: [topic, "universal", "curriculum", "background"],
      bytes,
    };
  });
  total += files.length;
  console.log(`${topic}: ${files.length}`);
}

const summary = {
  generated_at_unix: Math.floor(Date.now() / 1000),
  total_images: total,
  topics: Object.fromEntries(Object.entries(index).map(([k, v]) => [k, v.length])),
  index,
};

fs.writeFileSync(path.join(root, "index.json"), JSON.stringify(summary, null, 2));

const header = ["file", "topic", "bytes"];
const csv = [header.join(",")]
  .concat(
    rows.map((row) =>
      header.map((k) => `"${String(row[k]).replaceAll('"', '""')}"`).join(",")
    )
  )
  .join("\n");
fs.writeFileSync(path.join(root, "manifest.csv"), csv);

console.log(`TOTAL: ${total}`);
console.log("index.json + manifest.csv refreshed");
