import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, FileText, Trash2, Search, Database, Loader2,
  File, CheckCircle2, AlertCircle, RefreshCw, Send, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { bytesToSize } from "@/lib/utils";
import { getHandoffToken } from "@/hooks/useAuthHandoff";

interface DocumentInfo {
  id: string;
  filename: string;
  chunkCount: number;
  createdAt: string;
  size: number;
}

interface Source {
  filename: string;
  score: number;
  chunkIndex: number;
  excerpt: string;
}

interface QueryResult {
  answer: string;
  sources: Source[];
}

interface UploadStatus {
  filename: string;
  status: "uploading" | "done" | "error";
  error?: string;
  chunks?: number;
}

interface RAGPanelProps {
  projectId: string;
}

export default function RAGPanel({ projectId }: RAGPanelProps) {
  const [documents, setDocuments] = useState<DocumentInfo[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [uploading, setUploading] = useState<UploadStatus[]>([]);
  const [query, setQuery] = useState("");
  const [querying, setQuerying] = useState(false);
  const [streamedAnswer, setStreamedAnswer] = useState("");
  const [sources, setSources] = useState<Source[]>([]);
  const [queryHistory, setQueryHistory] = useState<Array<{ q: string; r: QueryResult }>>([]);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const loadDocuments = useCallback(async () => {
    setLoadingDocs(true);
    try {
      const res = await fetch(`/api/rag/${projectId}/documents`, {
        headers: { Authorization: `Bearer ${getHandoffToken()}` },
      });
      const data: { documents: DocumentInfo[] } = await res.json();
      setDocuments(data.documents ?? []);
    } finally {
      setLoadingDocs(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const uploadFiles = async (files: File[]) => {
    const statuses: UploadStatus[] = files.map((f) => ({ filename: f.name, status: "uploading" }));
    setUploading((prev) => [...prev, ...statuses]);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fd = new FormData();
      fd.append("file", file);
      fd.append("projectId", projectId);

      try {
        const res = await fetch("/api/rag/upload", {
          method: "POST",
          headers: { Authorization: `Bearer ${getHandoffToken()}` },
          body: fd,
        });
        const data: { chunks?: number; error?: string } = await res.json();

        setUploading((prev) =>
          prev.map((s) =>
            s.filename === file.name
              ? { ...s, status: res.ok ? "done" : "error", chunks: data.chunks, error: data.error }
              : s
          )
        );

        if (res.ok) await loadDocuments();
      } catch (e) {
        setUploading((prev) =>
          prev.map((s) =>
            s.filename === file.name ? { ...s, status: "error", error: "Upload failed" } : s
          )
        );
      }
    }

    setTimeout(() => setUploading([]), 4000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length) uploadFiles(files);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length) uploadFiles(files);
  };

  const handleDelete = async (docId: string) => {
    await fetch(`/api/rag/${projectId}/documents/${docId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${getHandoffToken()}` },
    });
    setDocuments((prev) => prev.filter((d) => d.id !== docId));
  };

  const handleQuery = async () => {
    if (!query.trim() || querying) return;
    setQuerying(true);
    setStreamedAnswer("");
    setSources([]);

    const currentQuery = query;
    setQuery("");

    try {
      abortRef.current = new AbortController();
      const res = await fetch("/api/rag/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getHandoffToken()}`,
        },
        body: JSON.stringify({ query: currentQuery, projectId, stream: true }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) throw new Error("Query failed");

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";
      let finalSources: Source[] = [];

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        const lines = decoder.decode(value, { stream: true }).split("\n");
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "[DONE]") break;
          try {
            const parsed = JSON.parse(data) as { type: string; content?: string; sources?: Source[] };
            if (parsed.type === "text" && parsed.content) {
              accumulated += parsed.content;
              setStreamedAnswer(accumulated);
            }
            if (parsed.type === "sources" && parsed.sources) {
              finalSources = parsed.sources;
              setSources(finalSources);
            }
          } catch {}
        }
      }

      setQueryHistory((prev) => [{ q: currentQuery, r: { answer: accumulated, sources: finalSources } }, ...prev.slice(0, 9)]);
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        setStreamedAnswer("Query failed. Please try again.");
      }
    } finally {
      setQuerying(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50 shrink-0">
        <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center">
          <Database className="w-4 h-4 text-emerald-400" />
        </div>
        <span className="font-medium text-sm">RAG Documents</span>
        <Badge variant="success" className="ml-auto text-xs">
          {documents.length} docs
        </Badge>
        <Button size="icon-sm" variant="ghost" className="h-7 w-7" onClick={loadDocuments}>
          <RefreshCw className={`w-3.5 h-3.5 ${loadingDocs ? "animate-spin" : ""}`} />
        </Button>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Upload zone */}
        <div className="shrink-0 p-3 border-b border-border/50">
          <div
            className={`relative border-2 border-dashed rounded-xl p-4 text-center transition-all cursor-pointer ${
              dragOver
                ? "border-emerald-500/60 bg-emerald-500/10"
                : "border-border hover:border-emerald-500/30 hover:bg-emerald-500/5"
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".txt,.md,.csv,.json,.ts,.js,.py,.go,.rs,.java,.cpp,.c,.cs,.rb,.sh,.yaml,.yml,.toml,.xml,.html"
              className="hidden"
              onChange={handleFileChange}
            />
            <Upload className="w-5 h-5 text-muted-foreground mx-auto mb-1.5" />
            <p className="text-xs font-medium">Drop files or click to upload</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              TXT, MD, CSV, JSON, code files — up to 20MB each
            </p>
          </div>

          {/* Upload progress */}
          <AnimatePresence>
            {uploading.length > 0 && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-2 space-y-1">
                {uploading.map((s) => (
                  <div key={s.filename} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-secondary text-xs">
                    {s.status === "uploading" && <Loader2 className="w-3 h-3 animate-spin text-ditto-400 shrink-0" />}
                    {s.status === "done" && <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />}
                    {s.status === "error" && <AlertCircle className="w-3 h-3 text-destructive shrink-0" />}
                    <span className="truncate flex-1">{s.filename}</span>
                    {s.status === "done" && s.chunks && (
                      <Badge variant="success" className="text-xs shrink-0">{s.chunks} chunks</Badge>
                    )}
                    {s.status === "error" && <span className="text-destructive shrink-0">{s.error}</span>}
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Documents list */}
        {documents.length > 0 && (
          <div className="shrink-0 border-b border-border/50">
            <ScrollArea className="max-h-40">
              <div className="p-2 space-y-0.5">
                {documents.map((doc) => (
                  <div key={doc.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-accent group text-xs">
                    <FileText className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="truncate flex-1 font-mono">{doc.filename}</span>
                    <span className="text-muted-foreground shrink-0">{doc.chunkCount}c</span>
                    <span className="text-muted-foreground shrink-0">{bytesToSize(doc.size)}</span>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                      onClick={() => handleDelete(doc.id)}
                    >
                      <Trash2 className="w-3 h-3 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Query area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Answer stream */}
          <ScrollArea className="flex-1 p-3">
            {!streamedAnswer && queryHistory.length === 0 && (
              <div className="flex flex-col items-center justify-center h-32 gap-2 text-muted-foreground">
                <Search className="w-7 h-7 opacity-30" />
                <p className="text-xs text-center">
                  {documents.length === 0
                    ? "Upload documents above, then ask questions"
                    : "Ask a question about your documents"}
                </p>
              </div>
            )}

            {/* Current streaming answer */}
            {streamedAnswer && (
              <div className="mb-4">
                <div className="flex items-center gap-1.5 mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-ditto-400" />
                  <span className="text-xs font-medium">Answer</span>
                  {querying && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
                </div>
                <div className="text-sm leading-relaxed whitespace-pre-wrap bg-secondary rounded-xl p-3 border border-border">
                  {streamedAnswer}
                  {querying && <span className="inline-block w-1.5 h-4 bg-ditto-400 animate-pulse ml-0.5 rounded-sm" />}
                </div>

                {sources.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Sources used:</p>
                    {sources.map((s, i) => (
                      <div key={i} className="px-3 py-2 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-xs">
                        <div className="flex items-center gap-2 mb-1">
                          <FileText className="w-3 h-3 text-emerald-400" />
                          <span className="font-mono font-medium">{s.filename}</span>
                          <Badge variant="success" className="text-xs ml-auto">{(s.score * 100).toFixed(0)}% match</Badge>
                        </div>
                        <p className="text-muted-foreground line-clamp-2">{s.excerpt}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* History */}
            {queryHistory.length > 0 && (
              <div className="space-y-3">
                <Separator />
                <p className="text-xs font-medium text-muted-foreground">Query history</p>
                {queryHistory.map((h, i) => (
                  <div key={i} className="space-y-1.5">
                    <p className="text-xs font-medium text-ditto-400">Q: {h.q}</p>
                    <p className="text-xs text-muted-foreground line-clamp-3">{h.r.answer}</p>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Query input */}
          <div className="shrink-0 p-3 border-t border-border/50">
            <div className="flex gap-2">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) handleQuery(); }}
                placeholder="Ask about your documents..."
                className="h-8 text-sm"
                disabled={documents.length === 0}
              />
              <Button
                size="icon"
                className="h-8 w-8 shrink-0"
                variant="gradient"
                onClick={handleQuery}
                disabled={!query.trim() || querying || documents.length === 0}
              >
                {querying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
