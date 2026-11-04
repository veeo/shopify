import index from "@/lib/help-index.json";

const HELP_ORIGIN = "https://help.shopify.com";
const ARTICLE_LIMIT = 30_000;

type Entry = { path: string; title: string; summary: string; terms: Map<string, number> };

const stopwords = new Set(
  "a an and are as at be by can do does for from get how i in is it my of on or our set the this to up use what when where which who why with you your".split(
    " ",
  ),
);

function stem(word: string) {
  if (word.length > 5 && word.endsWith("ing")) return word.slice(0, -3);
  if (word.length > 4 && word.endsWith("ies")) return `${word.slice(0, -3)}y`;
  if (word.length > 4 && word.endsWith("es")) return word.slice(0, -2);
  if (word.length > 3 && word.endsWith("s") && !word.endsWith("ss")) return word.slice(0, -1);
  if (word.length > 4 && word.endsWith("ed")) return word.slice(0, -2);
  return word;
}

function tokens(text: string) {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word && !stopwords.has(word))
    .map(stem);
}

let entries: Entry[] | null = null;
let idf: Map<string, number> | null = null;

function load() {
  if (entries && idf) return { entries, idf };
  const df = new Map<string, number>();
  entries = (index as [string, string, string][]).map(([path, title, summary]) => {
    const terms = new Map<string, number>();
    const add = (text: string, weight: number) => {
      for (const term of tokens(text)) terms.set(term, Math.max(terms.get(term) ?? 0, weight));
    };
    add(summary, 1);
    add(path.replace("/en/manual/", "").replace(/[/-]/g, " "), 2);
    add(title, 3);
    for (const term of terms.keys()) df.set(term, (df.get(term) ?? 0) + 1);
    return { path, title, summary, terms };
  });
  idf = new Map([...df].map(([term, count]) => [term, Math.log(1 + entries!.length / count)]));
  return { entries, idf };
}

export function searchHelpCenter(query: string, limit = 6) {
  const { entries, idf } = load();
  const wanted = [...new Set(tokens(query))];
  if (wanted.length === 0) return [];
  return entries
    .map((entry) => {
      let score = 0;
      let hits = 0;
      for (const term of wanted) {
        const weight = entry.terms.get(term);
        if (!weight) continue;
        hits++;
        score += weight * (idf.get(term) ?? 0);
      }
      // Favor articles that cover more of the question, and shallower overview pages.
      score *= hits / wanted.length;
      score /= 1 + entry.path.split("/").length * 0.04;
      return { entry, score };
    })
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ entry }) => ({ title: entry.title, url: `${HELP_ORIGIN}${entry.path}`, summary: entry.summary }));
}

const articleCache = new Map<string, { title: string; url: string; content: string }>();

export function helpPath(input: string) {
  let url: URL;
  try {
    url = new URL(input, HELP_ORIGIN);
  } catch {
    return null;
  }
  if (url.hostname !== "help.shopify.com") return null;
  let path = url.pathname.replace(/\.md$/, "").replace(/\/$/, "");
  if (path.startsWith("/manual/") || path.startsWith("/partners/")) path = `/en${path}`;
  if (!/^\/en\/(manual|partners|affiliates)\//.test(path)) return null;
  return path;
}

export async function readHelpArticle(input: string) {
  const path = helpPath(input);
  if (!path) return { error: "Only help.shopify.com/en/manual articles can be read." };
  const cached = articleCache.get(path);
  if (cached) return cached;
  const response = await fetch(`${HELP_ORIGIN}${path}.md`, {
    headers: { accept: "text/markdown", "user-agent": "shopify-sidekick-prototype/1.0" },
    signal: AbortSignal.timeout(8000),
  }).catch(() => null);
  if (!response?.ok) return { error: `Could not load ${HELP_ORIGIN}${path} (${response?.status ?? "network error"}).` };
  const markdown = (await response.text())
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\]\((\/(?:en\/)?(?:manual|partners)[^)]*)\)/g, (_, link: string) =>
      `](${HELP_ORIGIN}${link.startsWith("/en/") ? link : `/en${link}`})`,
    )
    .replace(/\n{3,}/g, "\n\n");
  const finalPath = helpPath(response.url) ?? path;
  const article = {
    title: markdown.match(/^# (.+)$/m)?.[1]?.trim() ?? finalPath.split("/").at(-1)!,
    url: `${HELP_ORIGIN}${finalPath}`,
    content: markdown.length > ARTICLE_LIMIT ? `${markdown.slice(0, ARTICLE_LIMIT)}\n\n[Article truncated]` : markdown,
  };
  articleCache.set(path, article);
  return article;
}

export async function searchDevDocs(query: string) {
  const response = await fetch(`https://shopify.dev/assistant/search?query=${encodeURIComponent(query)}`, {
    signal: AbortSignal.timeout(8000),
  }).catch(() => null);
  if (!response?.ok) return { error: "shopify.dev search is unavailable right now." };
  const results = (await response.json()) as { title: string; url: string; content: string }[];
  const seen = new Set<string>();
  return results
    .filter((result) => !seen.has(result.url) && seen.add(result.url))
    .slice(0, 4)
    .map((result) => ({ title: result.title, url: result.url, excerpt: result.content.slice(0, 900) }));
}
