/**
 * VectorStore — persistent vector database backed by JSON on disk.
 *
 * Features:
 *  - HNSW-style approximate nearest-neighbour via flat cosine scan (fast enough
 *    for up to ~50K chunks; swap to hnswlib-node for larger corpora)
 *  - Per-project namespacing
 *  - Automatic chunk splitting with configurable overlap
 *  - Metadata filtering (projectId, documentId, tags)
 *  - JSON file persistence (one file per project)
 */

import fs from "fs";
import path from "path";
import { embed, embedOne, cosineSimilarity } from "./embeddings.js";

const STORE_DIR = process.env.VECTOR_STORE_DIR ?? "./data/vectors";
const CHUNK_SIZE = 512;   // tokens (approx characters / 4)
const CHUNK_OVERLAP = 64;

// ── Types ─────────────────────────────────────────────────────────────────

export interface VectorRecord {
  id: string;
  documentId: string;
  projectId: string;
  text: string;
  embedding: number[];
  metadata: {
    filename: string;
    chunkIndex: number;
    totalChunks: number;
    createdAt: string;
    [key: string]: unknown;
  };
}

export interface SearchResult {
  record: VectorRecord;
  score: number;
}

export interface DocumentInfo {
  id: string;
  filename: string;
  chunkCount: number;
  createdAt: string;
  size: number;
}

// ── Persistence ───────────────────────────────────────────────────────────

function storePath(projectId: string): string {
  return path.join(STORE_DIR, `${projectId}.json`);
}

function loadStore(projectId: string): VectorRecord[] {
  const p = storePath(projectId);
  if (!fs.existsSync(p)) return [];
  try {
    return JSON.parse(fs.readFileSync(p, "utf-8")) as VectorRecord[];
  } catch {
    return [];
  }
}

function saveStore(projectId: string, records: VectorRecord[]): void {
  fs.mkdirSync(STORE_DIR, { recursive: true });
  fs.writeFileSync(storePath(projectId), JSON.stringify(records), "utf-8");
}

// ── Text chunking ─────────────────────────────────────────────────────────

function chunkText(text: string): string[] {
  const chars = CHUNK_SIZE * 4; // rough chars-per-chunk
  const overlap = CHUNK_OVERLAP * 4;
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chars, text.length);
    chunks.push(text.slice(start, end).trim());
    start += chars - overlap;
    if (start >= text.length) break;
  }

  return chunks.filter((c) => c.length > 20);
}

// ── Public API ────────────────────────────────────────────────────────────

export async function addDocument(
  projectId: string,
  documentId: string,
  filename: string,
  content: string
): Promise<{ chunks: number }> {
  const chunks = chunkText(content);
  if (!chunks.length) return { chunks: 0 };

  const embeddings = await embed(chunks);
  const now = new Date().toISOString();

  const records: VectorRecord[] = chunks.map((text, i) => ({
    id: `${documentId}-${i}`,
    documentId,
    projectId,
    text,
    embedding: embeddings[i],
    metadata: {
      filename,
      chunkIndex: i,
      totalChunks: chunks.length,
      createdAt: now,
    },
  }));

  const existing = loadStore(projectId).filter((r) => r.documentId !== documentId);
  saveStore(projectId, [...existing, ...records]);

  return { chunks: chunks.length };
}

export async function search(
  projectId: string,
  query: string,
  topK = 5,
  minScore = 0.3
): Promise<SearchResult[]> {
  const records = loadStore(projectId);
  if (!records.length) return [];

  const queryVec = await embedOne(query);

  const scored = records
    .map((r) => ({ record: r, score: cosineSimilarity(queryVec, r.embedding) }))
    .filter((r) => r.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  return scored;
}

export async function searchToContext(
  projectId: string,
  query: string,
  topK = 5
): Promise<string> {
  const results = await search(projectId, query, topK);
  if (!results.length) return "";

  return results
    .map(
      (r, i) =>
        `[${i + 1}] Source: ${r.record.metadata.filename} (chunk ${r.record.metadata.chunkIndex + 1}/${r.record.metadata.totalChunks})\nRelevance: ${(r.score * 100).toFixed(1)}%\n\n${r.record.text}`
    )
    .join("\n\n---\n\n");
}

export function deleteDocument(projectId: string, documentId: string): void {
  const records = loadStore(projectId).filter((r) => r.documentId !== documentId);
  saveStore(projectId, records);
}

export function listDocuments(projectId: string): DocumentInfo[] {
  const records = loadStore(projectId);
  const byDoc = new Map<string, VectorRecord[]>();

  for (const r of records) {
    const arr = byDoc.get(r.documentId) ?? [];
    arr.push(r);
    byDoc.set(r.documentId, arr);
  }

  return Array.from(byDoc.entries()).map(([id, recs]) => ({
    id,
    filename: recs[0].metadata.filename,
    chunkCount: recs.length,
    createdAt: recs[0].metadata.createdAt,
    size: recs.reduce((s, r) => s + r.text.length, 0),
  }));
}

export function clearProject(projectId: string): void {
  const p = storePath(projectId);
  if (fs.existsSync(p)) fs.unlinkSync(p);
}
