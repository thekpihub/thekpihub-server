/**
 * Embedding service — produces float32 vectors from text.
 *
 * Strategy (in order of preference):
 *  1. OpenAI text-embedding-3-small  (if OPENAI_API_KEY set)
 *  2. Cohere embed-english-light-v3.0 (if COHERE_API_KEY set)
 *  3. TF-IDF bag-of-words fallback    (always available, no API needed)
 *
 * All backends return the same normalised float array interface so the
 * vector store is fully provider-agnostic.
 */

const TFIDF_DIMS = 512; // dimensionality for the TF-IDF fallback

// ── Utility ───────────────────────────────────────────────────────────────

function normalize(vec: number[]): number[] {
  const mag = Math.sqrt(vec.reduce((s, v) => s + v * v, 0));
  return mag === 0 ? vec : vec.map((v) => v / mag);
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1);
}

// Deterministic hash → bucket index (djb2)
function hashToBucket(token: string, buckets: number): number {
  let h = 5381;
  for (let i = 0; i < token.length; i++) {
    h = ((h << 5) + h) ^ token.charCodeAt(i);
    h = h >>> 0;
  }
  return h % buckets;
}

// ── Backends ──────────────────────────────────────────────────────────────

async function embedOpenAI(texts: string[]): Promise<number[][]> {
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({ model: "text-embedding-3-small", input: texts }),
  });
  if (!res.ok) throw new Error(`OpenAI embeddings error: ${res.statusText}`);
  const json = (await res.json()) as { data: { embedding: number[] }[] };
  return json.data.map((d) => normalize(d.embedding));
}

async function embedCohere(texts: string[]): Promise<number[][]> {
  const res = await fetch("https://api.cohere.com/v1/embed", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.COHERE_API_KEY}`,
    },
    body: JSON.stringify({
      texts,
      model: "embed-english-light-v3.0",
      input_type: "search_document",
    }),
  });
  if (!res.ok) throw new Error(`Cohere embeddings error: ${res.statusText}`);
  const json = (await res.json()) as { embeddings: number[][] };
  return json.embeddings.map(normalize);
}

function embedTFIDF(texts: string[]): number[][] {
  // Pure term-frequency hashing (the "hashing trick") -- deliberately NOT
  // classic TF-IDF. A real IDF weight needs a stable corpus to compute
  // document frequency against; this function only ever sees the text(s)
  // passed to one embed() call, and query-time embedding always goes
  // through embedOne() -- a single text, so N=1 and every term's IDF
  // collapsed to log((1+1)/(1+1))=0 in the previous version, producing an
  // all-zero vector for every query and therefore a cosine similarity of
  // exactly 0 against every stored document, regardless of content. Found
  // 2026-09-08 via a live RAG test (upload+query a real document, got a
  // literal 0.0 score even for a query sharing most of its words with the
  // document). Confirmed via /api/rag/search with minScore=0.
  return texts.map((text) => {
    const tokens = tokenize(text);
    const tf: Record<string, number> = {};
    for (const t of tokens) tf[t] = (tf[t] ?? 0) + 1;
    const vec = new Array(TFIDF_DIMS).fill(0);
    for (const [term, count] of Object.entries(tf)) {
      const bucket = hashToBucket(term, TFIDF_DIMS);
      vec[bucket] += count / tokens.length;
    }
    return normalize(vec);
  });
}

// ── Public API ────────────────────────────────────────────────────────────

export async function embed(texts: string[]): Promise<number[][]> {
  if (!texts.length) return [];

  if (process.env.OPENAI_API_KEY) {
    try {
      return await embedOpenAI(texts);
    } catch (e) {
      console.warn("[embeddings] OpenAI failed, falling back:", e);
    }
  }

  if (process.env.COHERE_API_KEY) {
    try {
      return await embedCohere(texts);
    } catch (e) {
      console.warn("[embeddings] Cohere failed, falling back:", e);
    }
  }

  return embedTFIDF(texts);
}

export async function embedOne(text: string): Promise<number[]> {
  const [vec] = await embed([text]);
  return vec;
}

export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i];
  return dot; // vectors are pre-normalised
}

export function getDimensions(): number {
  if (process.env.OPENAI_API_KEY) return 1536; // text-embedding-3-small
  if (process.env.COHERE_API_KEY) return 384;  // embed-english-light-v3.0
  return TFIDF_DIMS;
}
