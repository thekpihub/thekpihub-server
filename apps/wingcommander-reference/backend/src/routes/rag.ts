import { Router, Request, Response } from "express";
import Anthropic from "@anthropic-ai/sdk";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import {
  addDocument,
  search,
  searchToContext,
  deleteDocument,
  listDocuments,
  clearProject,
} from "../services/vectorStore.js";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "text/plain", "text/markdown", "text/csv",
      "application/json", "application/pdf",
      "text/html", "text/javascript", "text/typescript",
    ];
    cb(null, allowed.includes(file.mimetype) || file.originalname.match(/\.(txt|md|csv|json|ts|js|py|go|rs|java|cpp|c|cs|rb|sh|yaml|yml|toml|xml)$/) !== null);
  },
});

// ── Upload document ────────────────────────────────────────────────────────

router.post("/upload", upload.single("file"), async (req: Request, res: Response) => {
  const { projectId } = req.body;
  if (!req.file || !projectId) {
    return res.status(400).json({ error: "file and projectId required" });
  }

  const content = req.file.buffer.toString("utf-8");
  const documentId = uuidv4();

  try {
    const { chunks } = await addDocument(
      projectId,
      documentId,
      req.file.originalname,
      content
    );

    res.json({
      success: true,
      documentId,
      filename: req.file.originalname,
      chunks,
      size: content.length,
    });
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Upload failed" });
  }
});

// ── Upload multiple documents ──────────────────────────────────────────────

router.post("/upload-many", upload.array("files", 20), async (req: Request, res: Response) => {
  const { projectId } = req.body;
  const files = req.files as Express.Multer.File[];

  if (!files?.length || !projectId) {
    return res.status(400).json({ error: "files and projectId required" });
  }

  const results = await Promise.allSettled(
    files.map(async (file) => {
      const documentId = uuidv4();
      const content = file.buffer.toString("utf-8");
      const { chunks } = await addDocument(projectId, documentId, file.originalname, content);
      return { documentId, filename: file.originalname, chunks };
    })
  );

  res.json({
    results: results.map((r) =>
      r.status === "fulfilled" ? { ok: true, ...r.value } : { ok: false, error: String(r.reason) }
    ),
  });
});

// ── Query (RAG) ────────────────────────────────────────────────────────────

router.post("/query", async (req: Request, res: Response) => {
  const { query, projectId, topK = 5, stream = false } = req.body;
  if (!query || !projectId) {
    return res.status(400).json({ error: "query and projectId required" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "ANTHROPIC_API_KEY not configured" });

  try {
    const context = await searchToContext(projectId, query, topK);
    const results = await search(projectId, query, topK);

    if (!context) {
      return res.json({
        answer: "No documents uploaded yet. Please upload documents to enable RAG.",
        sources: [],
        context: "",
      });
    }

    const client = new Anthropic({ apiKey });

    if (stream) {
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("X-Accel-Buffering", "no");

      const sendEvent = (data: object) => res.write(`data: ${JSON.stringify(data)}\n\n`);

      const streamRes = await client.messages.stream({
        model: "claude-opus-4-7",
        max_tokens: 4096,
        system: [
          {
            type: "text",
            text: `You are a precise RAG assistant. Answer ONLY based on the provided document context.
Always cite sources as [Source: <filename>, Chunk <n>].
If the answer is not in the context, say "Not found in uploaded documents."`,
            // @ts-ignore — cache_control is supported but not in all SDK type versions
            cache_control: { type: "ephemeral" },
          },
        ],
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `DOCUMENT CONTEXT:\n\n${context}\n\n---\n\nQUESTION: ${query}`,
                // @ts-ignore
                cache_control: { type: "ephemeral" },
              },
            ],
          },
        ],
        stream: true,
      });

      for await (const event of streamRes) {
        if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
          sendEvent({ type: "text", content: event.delta.text });
        }
      }

      sendEvent({
        type: "sources",
        sources: results.map((r) => ({
          filename: r.record.metadata.filename,
          score: r.score,
          chunkIndex: r.record.metadata.chunkIndex,
          excerpt: r.record.text.slice(0, 200),
        })),
      });
      sendEvent({ type: "done" });
      res.write("data: [DONE]\n\n");
      res.end();
    } else {
      const response = await client.messages.create({
        model: "claude-opus-4-7",
        max_tokens: 4096,
        system: `You are a precise RAG assistant. Answer ONLY based on the provided document context.
Always cite sources as [Source: <filename>, Chunk <n>].
If the answer is not in the context, say "Not found in uploaded documents."`,
        messages: [
          {
            role: "user",
            content: `DOCUMENT CONTEXT:\n\n${context}\n\n---\n\nQUESTION: ${query}`,
          },
        ],
      });

      const answer = response.content[0].type === "text" ? response.content[0].text : "";
      res.json({
        answer,
        sources: results.map((r) => ({
          filename: r.record.metadata.filename,
          score: r.score,
          chunkIndex: r.record.metadata.chunkIndex,
          excerpt: r.record.text.slice(0, 200),
        })),
        context,
      });
    }
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : "RAG query failed" });
  }
});

// ── Vector search (raw) ────────────────────────────────────────────────────

router.post("/search", async (req: Request, res: Response) => {
  const { query, projectId, topK = 10, minScore = 0.2 } = req.body;
  if (!query || !projectId) return res.status(400).json({ error: "query and projectId required" });

  try {
    const results = await search(projectId, query, topK, minScore);
    res.json({
      results: results.map((r) => ({
        id: r.record.id,
        documentId: r.record.documentId,
        filename: r.record.metadata.filename,
        score: r.score,
        chunkIndex: r.record.metadata.chunkIndex,
        text: r.record.text,
      })),
    });
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Search failed" });
  }
});

// ── List documents ─────────────────────────────────────────────────────────

router.get("/:projectId/documents", (req: Request, res: Response) => {
  try {
    const docs = listDocuments(req.params.projectId);
    res.json({ documents: docs });
  } catch {
    res.json({ documents: [] });
  }
});

// ── Delete document ────────────────────────────────────────────────────────

router.delete("/:projectId/documents/:documentId", (req: Request, res: Response) => {
  deleteDocument(req.params.projectId, req.params.documentId);
  res.json({ success: true });
});

// ── Clear all documents ────────────────────────────────────────────────────

router.delete("/:projectId", (req: Request, res: Response) => {
  clearProject(req.params.projectId);
  res.json({ success: true });
});

export default router;
