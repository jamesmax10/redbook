import { NextRequest, NextResponse } from "next/server";

interface ExtractedData {
  address: string;
  price: string;
  area: string;
  propertyType: string;
  transactionType: string;
}

const TIMEOUT_MS = 8000;

const PROPERTY_TYPE_KEYWORDS = [
  "office",
  "retail",
  "industrial",
  "warehouse",
  "restaurant",
  "mixed use",
  "mixed-use",
  "apartment",
  "residential",
  "hotel",
  "pub",
  "shop",
  "showroom",
  "clinic",
  "crèche",
  "creche",
];

const ADDRESS_NOISE = [
  /\b(is\s+)?for\s+sale\b/gi,
  /\bto\s+(let|rent)\b/gi,
  /\bon\s+(Daft\.ie|MyHome\.ie|PropertyPal|Lisney|CBRE|BNP|JLL|Savills|Allsop)\b/gi,
  /\b(Sale Agreed|Price on Application|POA)\b/gi,
];

function cleanAddress(raw: string): string {
  let addr = raw;
  for (const re of ADDRESS_NOISE) {
    addr = addr.replace(re, "");
  }
  return addr
    .replace(/\s*[,\-–|]\s*$/, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function inferTransactionType(text: string): string {
  const lower = text.toLowerCase();
  if (/\bfor\s+sale\b/.test(lower) || /\bsale\s+agreed\b/.test(lower)) return "Sale";
  if (/\bto\s+(let|rent)\b/.test(lower) || /\bfor\s+rent\b/.test(lower)) return "Letting";
  return "";
}

function stripTags(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ");
}

function extractFromHtml(html: string): ExtractedData | null {
  const result: ExtractedData = {
    address: "",
    price: "",
    area: "",
    propertyType: "",
    transactionType: "",
  };

  const text = stripTags(html);

  // Price: €-prefixed numbers (common in Irish listings)
  const priceMatch = text.match(/€\s?([\d,]+(?:\.\d+)?)/);
  if (priceMatch) {
    result.price = priceMatch[1].replace(/,/g, "");
  }

  // Area in sq m / m²
  const sqmMatch = text.match(
    /([\d,]+(?:\.\d+)?)\s*(?:sq\.?\s*m|m²|sqm)/i,
  );
  if (sqmMatch) {
    result.area = sqmMatch[1].replace(/,/g, "");
  } else {
    const sqftMatch = text.match(
      /([\d,]+(?:\.\d+)?)\s*(?:sq\.?\s*ft|ft²|sqft)/i,
    );
    if (sqftMatch) {
      const sqft = parseFloat(sqftMatch[1].replace(/,/g, ""));
      if (!isNaN(sqft)) result.area = (sqft * 0.092903).toFixed(2);
    }
  }

  // Property type keyword
  const lower = text.toLowerCase();
  for (const kw of PROPERTY_TYPE_KEYWORDS) {
    if (lower.includes(kw)) {
      result.propertyType = kw.charAt(0).toUpperCase() + kw.slice(1);
      break;
    }
  }

  // Address from <title> or og:title — typically the most reliable source
  const ogTitleMatch = html.match(
    /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i,
  );
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const rawTitle = ogTitleMatch?.[1] ?? titleMatch?.[1] ?? "";
  const titleText = rawTitle
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .trim();

  if (titleText && titleText.length >= 8 && titleText.length <= 300) {
    const stripped = titleText
      .replace(/\s*[-|–]\s*(Daft|MyHome|PropertyPal|Lisney|CBRE|BNP|JLL|Savills|Allsop).*$/i, "")
      .trim();
    result.address = cleanAddress(stripped);
  }

  result.transactionType = inferTransactionType(text);

  const hasAnything = result.address || result.price || result.area || result.propertyType;
  return hasAnything ? result : null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const url: string = body?.url;

    if (!url || !/^https?:\/\/\S+$/i.test(url)) {
      return NextResponse.json(
        { error: "Invalid URL" },
        { status: 400 },
      );
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; RedBookPro/1.0; property-valuation-tool)",
          Accept: "text/html,application/xhtml+xml",
        },
        redirect: "follow",
      });
    } catch {
      return NextResponse.json(
        { error: "Could not fetch the URL." },
        { status: 422 },
      );
    } finally {
      clearTimeout(timer);
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: `Page returned status ${response.status}.` },
        { status: 422 },
      );
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html") && !contentType.includes("application/xhtml")) {
      return NextResponse.json(
        { error: "URL did not return an HTML page." },
        { status: 422 },
      );
    }

    // Read at most 512KB to avoid memory issues with large pages
    const reader = response.body?.getReader();
    if (!reader) {
      return NextResponse.json(
        { error: "Could not read response." },
        { status: 422 },
      );
    }

    const chunks: Uint8Array[] = [];
    let totalBytes = 0;
    const MAX_BYTES = 512 * 1024;

    while (totalBytes < MAX_BYTES) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      totalBytes += value.length;
    }
    reader.cancel();

    const html = new TextDecoder("utf-8").decode(
      chunks.length === 1
        ? chunks[0]
        : new Uint8Array(
            chunks.reduce((acc, c) => {
              acc.push(...c);
              return acc;
            }, [] as number[]),
          ),
    );

    const extracted = extractFromHtml(html);

    if (!extracted) {
      return NextResponse.json(
        { error: "Could not extract listing details from this page." },
        { status: 422 },
      );
    }

    return NextResponse.json({ data: extracted });
  } catch {
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 },
    );
  }
}
