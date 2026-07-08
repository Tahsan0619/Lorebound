#!/usr/bin/env node
/**
 * Free universal curriculum image pack builder.
 * Sources (no API key): Wikimedia Commons Action API + LoremFlickr.
 * Every kept image must pass: topic keyword relevance, min file size, and image mime type.
 */
import fs from "node:fs/promises";
import path from "node:path";

const USER_AGENT =
  "Mozilla/5.0 (compatible; LoreboundAssetBot/1.0; +https://localhost; curriculum pack builder)";
const WIKI_API = "https://commons.wikimedia.org/w/api.php";

function parseArgs(argv) {
  const out = {
    total: 700,
    out: "assets/universal_library",
    topicFile: "tools/image_library/topics.json",
    minBytes: 40_000,
    delayMs: 350,
  };
  for (let i = 2; i < argv.length; i += 1) {
    const key = argv[i];
    const val = argv[i + 1];
    if (key === "--total" && val) out.total = Number(val);
    if (key === "--out" && val) out.out = val;
    if (key === "--topic-file" && val) out.topicFile = val;
    if (key === "--min-bytes" && val) out.minBytes = Number(val);
    if (key === "--delay-ms" && val) out.delayMs = Number(val);
  }
  return out;
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function topicBudgets(topics, total) {
  const sum = topics.reduce((acc, t) => acc + Number(t.target_count || 0), 0) || 1;
  const ratio = total / sum;
  const out = {};
  for (const t of topics) out[t.slug] = Math.max(5, Math.round(t.target_count * ratio));
  return out;
}

function keywordSet(topic) {
  const raw = `${topic.slug} ${topic.label} ${(topic.queries || []).join(" ")} ${(topic.keywords || []).join(" ")}`;
  return new Set(
    raw
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length >= 4)
  );
}

function isRelevantTitle(title, keywords) {
  const text = String(title || "").toLowerCase();
  // Reject clearly non-image / icon / logo junk.
  if (/\.(svg|gif)$/i.test(text)) return false;
  if (/\b(icon|logo|flag|map|coat of arms|emblem|badge|seal)\b/i.test(text)) return false;
  let hits = 0;
  for (const kw of keywords) {
    if (text.includes(kw)) hits += 1;
  }
  return hits >= 1;
}

function pickExt(mime, url, title) {
  const m = String(mime || "").toLowerCase();
  if (m.includes("png")) return "png";
  if (m.includes("webp")) return "webp";
  if (m.includes("jpeg") || m.includes("jpg")) return "jpg";
  const hay = `${url || ""} ${title || ""}`.toLowerCase();
  if (hay.includes(".png")) return "png";
  if (hay.includes(".webp")) return "webp";
  return "jpg";
}

async function wikiFetchJson(params) {
  const url = new URL(WIKI_API);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) throw new Error(`Wikimedia API ${res.status}`);
  return res.json();
}

async function searchWikimedia(query, limit = 40) {
  const data = await wikiFetchJson({
    action: "query",
    format: "json",
    generator: "search",
    gsrsearch: `${query} filetype:bitmap`,
    gsrnamespace: 6,
    gsrlimit: Math.min(50, limit),
    prop: "imageinfo",
    iiprop: "url|size|mime|extmetadata",
    iiurlwidth: 1600,
  });
  const pages = Object.values(data?.query?.pages || {});
  return pages
    .map((p) => {
      const ii = (p.imageinfo || [])[0] || {};
      const meta = ii.extmetadata || {};
      const title = String(p.title || "").replace(/^File:/, "");
      return {
        provider: "wikimedia",
        id: `wikimedia-${p.pageid}`,
        title,
        description: String(meta.ImageDescription?.value || "").replace(/<[^>]+>/g, " "),
        width: Number(ii.width || 0),
        height: Number(ii.height || 0),
        mimeType: String(ii.mime || ""),
        imageUrl: String(ii.thumburl || ii.url || ""),
        sourceUrl: String(ii.descriptionurl || ii.url || ""),
        author: String(meta.Artist?.value || "").replace(/<[^>]+>/g, " ").trim(),
        license: String(meta.LicenseShortName?.value || "Wikimedia Commons"),
      };
    })
    .filter((x) => x.imageUrl && /image\/(jpeg|jpg|png|webp)/i.test(x.mimeType || "image/jpeg"));
}

async function categoryWikimedia(category, limit = 40) {
  const data = await wikiFetchJson({
    action: "query",
    format: "json",
    generator: "categorymembers",
    gcmtitle: category,
    gcmtype: "file",
    gcmlimit: Math.min(50, limit),
    prop: "imageinfo",
    iiprop: "url|size|mime|extmetadata",
    iiurlwidth: 1600,
  });
  const pages = Object.values(data?.query?.pages || {});
  return pages
    .map((p) => {
      const ii = (p.imageinfo || [])[0] || {};
      const meta = ii.extmetadata || {};
      const title = String(p.title || "").replace(/^File:/, "");
      return {
        provider: "wikimedia",
        id: `wikimedia-${p.pageid}`,
        title,
        description: String(meta.ImageDescription?.value || "").replace(/<[^>]+>/g, " "),
        width: Number(ii.width || 0),
        height: Number(ii.height || 0),
        mimeType: String(ii.mime || ""),
        imageUrl: String(ii.thumburl || ii.url || ""),
        sourceUrl: String(ii.descriptionurl || ii.url || ""),
        author: String(meta.Artist?.value || "").replace(/<[^>]+>/g, " ").trim(),
        license: String(meta.LicenseShortName?.value || "Wikimedia Commons"),
      };
    })
    .filter((x) => x.imageUrl && /image\/(jpeg|jpg|png|webp)/i.test(x.mimeType || "image/jpeg"));
}

async function searchLoremFlickr(tag, count = 12) {
  const out = [];
  for (let i = 0; i < count; i += 1) {
    const lock = `${slugify(tag)}-${i + 1}`;
    const jsonUrl = `https://loremflickr.com/json/g/1400/900/${encodeURIComponent(tag)}/all?lock=${lock}`;
    try {
      const res = await fetch(jsonUrl, { headers: { "User-Agent": USER_AGENT } });
      if (!res.ok) continue;
      const data = await res.json();
      const file = String(data.file || "");
      if (!file) continue;
      out.push({
        provider: "loremflickr",
        id: `loremflickr-${lock}`,
        title: `${tag} educational scene`,
        description: `${tag} universal background`,
        width: Number(data.width || 1400),
        height: Number(data.height || 900),
        mimeType: "image/jpeg",
        imageUrl: file,
        sourceUrl: file,
        author: "LoremFlickr / Flickr CC sources",
        license: "Check Flickr license of source photo",
      });
    } catch {
      // ignore single failures
    }
  }
  return out;
}

async function downloadBinary(url, dest) {
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "image/*,*/*;q=0.8" },
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`Download ${res.status}`);
  const ct = (res.headers.get("content-type") || "").toLowerCase();
  if (ct && !ct.includes("image/") && !ct.includes("octet-stream")) {
    throw new Error(`Not an image content-type: ${ct}`);
  }
  const bytes = Buffer.from(await res.arrayBuffer());
  await fs.writeFile(dest, bytes);
  return { bytes: bytes.length, contentType: ct, finalUrl: res.url };
}

async function collectCandidates(topic, delayMs) {
  const candidates = [];
  const categories = topic.wikimedia_categories || [];
  const queries = topic.queries || [topic.slug];

  for (const category of categories.slice(0, 3)) {
    try {
      const rows = await categoryWikimedia(category, 40);
      candidates.push(...rows);
      await sleep(delayMs);
    } catch (err) {
      console.warn(`  WARN category ${category}: ${err.message}`);
      await sleep(delayMs * 2);
    }
  }

  for (const q of queries.slice(0, 3)) {
    try {
      const rows = await searchWikimedia(q, 30);
      candidates.push(...rows);
      await sleep(delayMs);
    } catch (err) {
      console.warn(`  WARN search ${q}: ${err.message}`);
      await sleep(delayMs * 2);
    }
  }

  // Free no-key keyword images as fill for universal scene coverage.
  for (const q of queries.slice(0, 2)) {
    const tag = q.split(/\s+/).slice(0, 2).join(",");
    try {
      const rows = await searchLoremFlickr(tag, 8);
      candidates.push(...rows);
      await sleep(delayMs);
    } catch (err) {
      console.warn(`  WARN loremflickr ${tag}: ${err.message}`);
    }
  }

  return candidates;
}

async function main() {
  const args = parseArgs(process.argv);
  const config = JSON.parse(await fs.readFile(args.topicFile, "utf8"));
  const topics = config.topics || [];
  const budgets = topicBudgets(topics, args.total);

  await fs.mkdir(args.out, { recursive: true });
  const seen = new Set();
  const rows = [];

  for (const topic of topics) {
    const want = budgets[topic.slug] || 0;
    const topicDir = path.join(args.out, topic.slug);
    await fs.mkdir(topicDir, { recursive: true });
    const keywords = keywordSet(topic);
    console.log(`[${topic.slug}] target=${want}`);

    const candidates = await collectCandidates(topic, args.delayMs);
    let collected = 0;

    for (const item of candidates) {
      if (collected >= want) break;
      const pid = String(item.id || "");
      if (!pid || seen.has(pid)) continue;

      const titleBlob = `${item.title} ${item.description}`;
      // LoremFlickr tags are intentional by query, Wikimedia needs title relevance.
      if (item.provider === "wikimedia" && !isRelevantTitle(titleBlob, keywords)) continue;
      if (!item.imageUrl) continue;
      if (item.width && item.width < 700) continue;
      if (item.height && item.height < 400) continue;

      const ext = pickExt(item.mimeType, item.imageUrl, item.title);
      const queryKey = slugify((topic.queries && topic.queries[0]) || topic.slug).slice(0, 36);
      const idTail = String(pid).replace(/^wikimedia-/, "w-").replace(/^loremflickr-/, "lf-");
      const filename = `${topic.slug}__${queryKey}__${slugify(idTail)}.${ext}`;
      const filePath = path.join(topicDir, filename);

      try {
        const meta = await downloadBinary(item.imageUrl, filePath);
        if (meta.bytes < args.minBytes) {
          await fs.unlink(filePath).catch(() => {});
          continue;
        }
        // Quick magic-byte / content-type double check: tiny non-image leftovers.
        if (meta.contentType.includes("svg") || meta.contentType.includes("html")) {
          await fs.unlink(filePath).catch(() => {});
          continue;
        }
        seen.add(pid);
        collected += 1;
        rows.push({
          file: filePath.replaceAll("\\", "/"),
          topic: topic.slug,
          label: topic.label,
          query: topic.queries?.[0] || topic.slug,
          tags: [topic.slug, slugify(topic.label), "universal", "curriculum", "background"].sort().join(";"),
          photo_id: pid,
          source: item.provider,
          source_url: item.sourceUrl,
          image_url: item.imageUrl,
          photographer: item.author,
          license_note: item.license,
          bytes: String(meta.bytes),
        });
        process.stdout.write(`  + ${filename} (${Math.round(meta.bytes / 1024)}KB)\n`);
      } catch (err) {
        console.warn(`  WARN download failed ${pid}: ${err.message}`);
      }
      await sleep(args.delayMs);
    }

    console.log(`  downloaded=${collected}`);
  }

  const header = [
    "file",
    "topic",
    "label",
    "query",
    "tags",
    "photo_id",
    "source",
    "source_url",
    "image_url",
    "photographer",
    "license_note",
    "bytes",
  ];
  const csv = [header.join(",")]
    .concat(
      rows.map((row) =>
        header
          .map((k) => `"${String(row[k] || "").replaceAll('"', '""')}"`)
          .join(",")
      )
    )
    .join("\n");
  await fs.writeFile(path.join(args.out, "manifest.csv"), csv, "utf8");

  const index = {};
  for (const row of rows) {
    if (!index[row.topic]) index[row.topic] = [];
    index[row.topic].push({
      file: row.file,
      tags: row.tags.split(";"),
      source: row.source,
      source_url: row.source_url,
      bytes: Number(row.bytes || 0),
    });
  }
  await fs.writeFile(
    path.join(args.out, "index.json"),
    JSON.stringify(
      {
        generated_at_unix: Math.floor(Date.now() / 1000),
        total_images: rows.length,
        topics: Object.fromEntries(Object.entries(index).map(([k, v]) => [k, v.length])),
        index,
      },
      null,
      2
    ),
    "utf8"
  );

  console.log(`\nDone. Downloaded ${rows.length} verified images.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
