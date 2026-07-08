/**
 * Generate Lorebound Project Report PDF from HTML.
 * Run: node tools/generate_project_report.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const HTML = path.join(ROOT, 'docs', 'project-report.html');
const PDF = path.join(ROOT, 'docs', 'Lorebound_Project_Report.pdf');

async function withPuppeteer() {
  const require = createRequire(import.meta.url);
  let puppeteer;
  try {
    puppeteer = require('puppeteer');
  } catch {
    return false;
  }

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.goto(`file://${HTML.replace(/\\/g, '/')}`, { waitUntil: 'networkidle0' });
  await page.pdf({
    path: PDF,
    format: 'A4',
    printBackground: true,
    scale: 1,
    margin: { top: '14mm', right: '14mm', bottom: '14mm', left: '14mm' },
  });
  await browser.close();
  return true;
}

async function main() {
  if (!fs.existsSync(HTML)) {
    throw new Error(`Missing HTML template: ${HTML}`);
  }

  fs.mkdirSync(path.dirname(PDF), { recursive: true });

  const ok = await withPuppeteer();
  if (!ok) {
    console.error('Puppeteer not installed. Run: npm install puppeteer --no-save');
    console.error('Then re-run: node tools/generate_project_report.mjs');
    process.exit(1);
  }

  const size = fs.statSync(PDF).size;
  console.log(`PDF written: ${PDF} (${Math.round(size / 1024)} KB)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
