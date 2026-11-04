// Builds src/lib/help-index.json from the Shopify Help Center's Markdown sitemap.
// Run with `node scripts/build-help-index.mjs`. See https://help.shopify.com/llms.txt.
import { writeFile } from "node:fs/promises";

const SITEMAP = "https://help.shopify.com/sitemap-markdown-en.xml";
const OUT = new URL("../src/lib/help-index.json", import.meta.url);
const CONCURRENCY = 6;

const xml = await (await fetch(SITEMAP)).text();
const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
  .map((match) => match[1])
  .filter((url) => url.includes("/en/manual/"));

function summarize(markdown) {
  const lines = markdown.split("\n");
  const title = (lines.find((line) => line.startsWith("# ")) ?? "").slice(2).trim();
  const body = lines
    .filter((line) => line.trim() && !/^(#|!\[|\||>|-{3}|<)/.test(line.trim()))
    .join(" ")
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[*_`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  const sentence = body.match(/^.{40,220}?[.!?](\s|$)/)?.[0] ?? body.slice(0, 200);
  return { title, summary: sentence.trim() };
}

async function load(url, attempt = 0) {
  const response = await fetch(url, { headers: { "user-agent": "sidekick-prototype-index/1.0" } });
  if (response.status === 429 && attempt < 5) {
    await new Promise((resolve) => setTimeout(resolve, 2000 * 2 ** attempt));
    return load(url, attempt + 1);
  }
  if (!response.ok) return null;
  return summarize(await response.text());
}

const entries = [];
let next = 0;
let failed = 0;
async function worker() {
  while (next < urls.length) {
    const url = urls[next++];
    const page = await load(url).catch(() => null);
    const path = url.replace("https://help.shopify.com", "").replace(/\.md$/, "");
    if (!page || !page.title) failed++;
    entries.push([path, page?.title || path.split("/").at(-1).replace(/-/g, " "), page?.summary ?? ""]);
    if (entries.length % 250 === 0) console.log(`${entries.length}/${urls.length}`);
  }
}
await Promise.all(Array.from({ length: CONCURRENCY }, worker));

entries.sort((a, b) => a[0].localeCompare(b[0]));
await writeFile(OUT, JSON.stringify(entries));
console.log(`wrote ${entries.length} articles (${failed} without a title)`);
