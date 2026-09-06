export type ResolvedProductInput = {
  original: string;
  resolvedText: string;
  sourceType: "url" | "description";
  sourceUrl?: string;
  title?: string;
  description?: string;
  fetched: boolean;
  note?: string;
};

function isBlockedHost(hostname: string) {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (
    host === "localhost" ||
    host === "::1" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal")
  ) return true;

  if (/^127\./.test(host) || /^10\./.test(host) || /^169\.254\./.test(host) || /^192\.168\./.test(host)) {
    return true;
  }

  const private172 = host.match(/^172\.(\d{1,3})\./);
  if (private172) {
    const second = Number(private172[1]);
    if (second >= 16 && second <= 31) return true;
  }

  return false;
}

function parseSafeProductUrl(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (url.username || url.password) return null;
    if (url.port && url.port !== "80" && url.port !== "443") return null;
    if (isBlockedHost(url.hostname)) return null;
    return url;
  } catch {
    return null;
  }
}

function decodeEntities(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function pickMeta(html: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return decodeEntities(match[1].trim());
  }
  return "";
}

function extractJsonLdProductName(html: string) {
  const scripts = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  for (const match of scripts.slice(0, 12)) {
    try {
      const parsed = JSON.parse(match[1]);
      const nodes = Array.isArray(parsed) ? parsed : [parsed];
      const queue = [...nodes];
      while (queue.length) {
        const node = queue.shift();
        if (!node || typeof node !== "object") continue;
        const type = node["@type"];
        const types = Array.isArray(type) ? type : [type];
        if (types.includes("Product") && typeof node.name === "string") {
          return node.name.trim();
        }
        if (Array.isArray(node["@graph"])) queue.push(...node["@graph"]);
      }
    } catch {
      // Ignore malformed JSON-LD blocks.
    }
  }
  return "";
}

export async function resolveProductInput(input: string): Promise<ResolvedProductInput> {
  const original = input.trim();

  const safeUrl = parseSafeProductUrl(original);

  if (!safeUrl) {
    return {
      original,
      resolvedText: original,
      sourceType: "description",
      fetched: false,
    };
  }

  const url = safeUrl;
  const fallbackText = decodeURIComponent(
    [url.hostname.replace(/^www\./, ""), url.pathname, url.search].join(" ")
  )
    .replace(/[-_+/=?&.%]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4500);

  try {
    const response = await fetch(url.toString(), {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "user-agent": "SellComply/1.0 (+https://sellcomply.com)",
        accept: "text/html,application/xhtml+xml",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return {
        original,
        resolvedText: fallbackText,
        sourceType: "url",
        sourceUrl: url.toString(),
        fetched: false,
        note: `Product page returned HTTP ${response.status}; URL text was used as a fallback.`,
      };
    }

    const html = (await response.text()).slice(0, 450_000);
    const title =
      extractJsonLdProductName(html) ||
      pickMeta(html, [
        /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i,
        /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i,
        /<title[^>]*>([^<]+)<\/title>/i,
      ]);

    const description = pickMeta(html, [
      /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i,
      /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i,
    ]);

    const resolvedText = [title, description, fallbackText].filter(Boolean).join(" ").slice(0, 1800);

    return {
      original,
      resolvedText: resolvedText || fallbackText,
      sourceType: "url",
      sourceUrl: url.toString(),
      title: title || undefined,
      description: description || undefined,
      fetched: true,
    };
  } catch {
    return {
      original,
      resolvedText: fallbackText,
      sourceType: "url",
      sourceUrl: url.toString(),
      fetched: false,
      note: "The product page could not be read automatically; URL text was used as a fallback.",
    };
  } finally {
    clearTimeout(timer);
  }
}
