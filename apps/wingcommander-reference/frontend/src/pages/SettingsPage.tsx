import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, Key, Save, Eye, EyeOff, CheckCircle2, AlertCircle,
  Cpu, Database, Image as ImageIcon, Globe, Sparkles, Trash2,
  RefreshCw, Moon, Sun, Monitor, Lock, Plus, Loader2, Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { useThemeStore, useAuthStore } from "@/store";
import { getHandoffToken } from "@/hooks/useAuthHandoff";
import type { Theme } from "@/types";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

interface ServerKey {
  id: string;
  provider: string;
  key_hint: string;
  label: string;
  is_active: boolean;
}

const BYOK_PROVIDERS = [
  { id: "anthropic", label: "Anthropic", models: "Claude Opus 4.7, Sonnet 4.6, Haiku 4.5" },
  { id: "openai",    label: "OpenAI",    models: "GPT-4o, o3-mini" },
  { id: "google",    label: "Google AI", models: "Gemini 2.0 Flash, Gemini 2.0 Pro" },
  { id: "mistral",   label: "Mistral",   models: "Mistral Large, Mixtral" },
  { id: "groq",      label: "Groq",      models: "Llama 3.3 70B (ultra-fast)" },
];

const STORAGE_KEYS = {
  ANTHROPIC_API_KEY: "ditto_anthropic_key",
  OPENAI_API_KEY: "ditto_openai_key",
  REPLICATE_API_KEY: "ditto_replicate_key",
  STABILITY_API_KEY: "ditto_stability_key",
  COHERE_API_KEY: "ditto_cohere_key",
};

interface ApiKeyField {
  key: keyof typeof STORAGE_KEYS;
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
  required?: boolean;
  docsUrl?: string;
}

const API_KEY_FIELDS: ApiKeyField[] = [
  {
    key: "ANTHROPIC_API_KEY",
    label: "Anthropic API Key",
    description: "Powers all chat, code generation, and autonomous agent features. Required.",
    icon: Cpu,
    color: "text-wing-400",
    required: true,
  },
  {
    key: "OPENAI_API_KEY",
    label: "OpenAI API Key",
    description: "Used for high-quality text embeddings in RAG. Falls back to TF-IDF if not set.",
    icon: Database,
    color: "text-emerald-400",
  },
  {
    key: "REPLICATE_API_KEY",
    label: "Replicate API Key",
    description: "Enables FLUX Schnell / Dev / Pro and SDXL image generation.",
    icon: ImageIcon,
    color: "text-amber-400",
  },
  {
    key: "STABILITY_API_KEY",
    label: "Stability AI API Key",
    description: "Alternative image generation via Stable Image Ultra. Used as fallback if Replicate is not set.",
    icon: Sparkles,
    color: "text-violet-400",
  },
  {
    key: "COHERE_API_KEY",
    label: "Cohere API Key",
    description: "Alternative embeddings provider for RAG. Used if OpenAI key is not set.",
    icon: Globe,
    color: "text-cyan-400",
  },
];

const THEME_OPTIONS: { value: Theme; label: string; icon: React.ElementType }[] = [
  { value: "dark", label: "Dark", icon: Moon },
  { value: "light", label: "Light", icon: Sun },
  { value: "system", label: "System", icon: Monitor },
];

function ApiKeyInput({ field, value, onChange }: { field: ApiKeyField; value: string; onChange: (v: string) => void }) {
  const [visible, setVisible] = useState(false);
  const [saved, setSaved] = useState(false);
  const Icon = field.icon;
  const hasValue = value.trim().length > 0;

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEYS[field.key], value.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleClear = () => {
    localStorage.removeItem(STORAGE_KEYS[field.key]);
    onChange("");
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-md bg-secondary flex items-center justify-center shrink-0">
          <Icon className={`w-3.5 h-3.5 ${field.color}`} />
        </div>
        <label className="text-sm font-medium">{field.label}</label>
        {field.required && <Badge variant="outline" className="text-xs">Required</Badge>}
        {hasValue && <Badge variant="success" className="text-xs ml-auto gap-1"><CheckCircle2 className="w-3 h-3" />Configured</Badge>}
      </div>
      <p className="text-xs text-muted-foreground pl-8">{field.description}</p>
      <div className="flex gap-2 pl-8">
        <div className="relative flex-1">
          <Input
            type={visible ? "text" : "password"}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`sk-...`}
            className="pr-9 font-mono text-sm h-9"
          />
          <button
            type="button"
            onClick={() => setVisible(!visible)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <Button size="sm" variant="outline" className="h-9 gap-1.5" onClick={handleSave} disabled={!hasValue}>
          {saved ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Save className="w-3.5 h-3.5" />}
          {saved ? "Saved!" : "Save"}
        </Button>
        {hasValue && (
          <Button size="icon" variant="ghost" className="h-9 w-9 shrink-0 text-destructive hover:text-destructive" onClick={handleClear}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const navigate = useNavigate();
  const { theme, setTheme } = useThemeStore();
  const { user } = useAuthStore();

  const [apiKeys, setApiKeys] = useState<Record<keyof typeof STORAGE_KEYS, string>>({
    ANTHROPIC_API_KEY: "",
    OPENAI_API_KEY: "",
    REPLICATE_API_KEY: "",
    STABILITY_API_KEY: "",
    COHERE_API_KEY: "",
  });

  const [backendStatus, setBackendStatus] = useState<"checking" | "ok" | "error">("checking");
  const [byokApproved, setByokApproved] = useState<boolean | null>(null);
  const [serverKeys, setServerKeys] = useState<ServerKey[]>([]);
  const [byokLoading, setByokLoading] = useState(false);
  const [addingKey, setAddingKey] = useState<string | null>(null);
  const [newKeyValue, setNewKeyValue] = useState("");
  const [byokMsg, setByokMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    // Load from localStorage
    const loaded: Record<string, string> = {};
    for (const [k, storageKey] of Object.entries(STORAGE_KEYS)) {
      loaded[k] = localStorage.getItem(storageKey) ?? "";
    }
    setApiKeys(loaded as Record<keyof typeof STORAGE_KEYS, string>);

    // Check backend health
    fetch("/api/health")
      .then((r) => setBackendStatus(r.ok ? "ok" : "error"))
      .catch(() => setBackendStatus("error"));

    // Check BYOK approval status (only if handoff token exists)
    const token = getHandoffToken();
    if (token) {
      fetch(`${API}/api/user/byok-status`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.ok ? r.json() : null)
        .then((d) => {
          if (d?.approved) {
            setByokApproved(true);
            fetchServerKeys(token);
          } else {
            setByokApproved(false);
          }
        })
        .catch(() => setByokApproved(false));
    }
  }, []);

  async function fetchServerKeys(token: string) {
    const r = await fetch(`${API}/api/user/api-keys`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (r.ok) setServerKeys(await r.json());
  }

  async function saveServerKey(provider: string) {
    const token = getHandoffToken();
    if (!token || !newKeyValue.trim()) return;
    setByokLoading(true);
    const r = await fetch(`${API}/api/user/api-keys`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ provider, key: newKeyValue.trim(), label: provider }),
    });
    setByokLoading(false);
    if (r.ok) {
      setByokMsg({ type: "ok", text: `${provider} key saved.` });
      setAddingKey(null);
      setNewKeyValue("");
      fetchServerKeys(token);
    } else {
      setByokMsg({ type: "err", text: "Failed to save key. Try again." });
    }
    setTimeout(() => setByokMsg(null), 3500);
  }

  async function deleteServerKey(provider: string) {
    const token = getHandoffToken();
    if (!token) return;
    setByokLoading(true);
    await fetch(`${API}/api/user/api-keys/${provider}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    setByokLoading(false);
    fetchServerKeys(token);
  }

  const handleKeyChange = (key: keyof typeof STORAGE_KEYS, value: string) => {
    setApiKeys((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveAll = () => {
    for (const [k, storageKey] of Object.entries(STORAGE_KEYS)) {
      const val = apiKeys[k as keyof typeof STORAGE_KEYS].trim();
      if (val) {
        localStorage.setItem(storageKey, val);
      } else {
        localStorage.removeItem(storageKey);
      }
    }
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="h-12 flex items-center gap-3 px-4 border-b border-border/50 bg-card/60 backdrop-blur-sm sticky top-0 z-10">
          <Button size="icon-sm" variant="ghost" onClick={() => navigate(-1)} className="h-7 w-7">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="w-5 h-5 rounded bg-wing-500/20 flex items-center justify-center">
            <Sparkles className="w-3 h-3 text-wing-400" />
          </div>
          <span className="font-medium text-sm">Settings</span>
          <div className="ml-auto flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-md ${
                  backendStatus === "ok" ? "text-emerald-400 bg-emerald-500/10" :
                  backendStatus === "error" ? "text-destructive bg-destructive/10" :
                  "text-muted-foreground bg-secondary"
                }`}>
                  {backendStatus === "checking" ? (
                    <RefreshCw className="w-3 h-3 animate-spin" />
                  ) : backendStatus === "ok" ? (
                    <CheckCircle2 className="w-3 h-3" />
                  ) : (
                    <AlertCircle className="w-3 h-3" />
                  )}
                  Backend {backendStatus === "ok" ? "connected" : backendStatus === "error" ? "unreachable" : "checking"}
                </div>
              </TooltipTrigger>
              <TooltipContent>API server status</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
          {/* Account */}
          <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
              <Key className="w-4 h-4 text-muted-foreground" /> Account
            </h2>
            <div className="rounded-xl border border-border bg-card/40 p-4 space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-wing-500/20 flex items-center justify-center text-wing-400 font-semibold text-sm">
                  {(user?.name ?? user?.email ?? "?")[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium">{user?.name ?? "Anonymous"}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <Badge variant="outline" className="ml-auto capitalize">{user?.plan ?? "free"}</Badge>
              </div>
            </div>
          </motion.section>

          <Separator />

          {/* Theme */}
          <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <h2 className="text-base font-semibold mb-4">Appearance</h2>
            <div className="rounded-xl border border-border bg-card/40 p-4">
              <div className="flex items-center gap-2">
                {THEME_OPTIONS.map((t) => {
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.value}
                      onClick={() => setTheme(t.value)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        theme === t.value
                          ? "bg-secondary text-foreground border border-border"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.section>

          <Separator />

          {/* API Keys */}
          <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold">API Keys</h2>
              <Button size="sm" variant="gradient" className="h-7 text-xs gap-1.5" onClick={handleSaveAll}>
                <Save className="w-3 h-3" /> Save all
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Keys are stored locally in your browser and sent only to your own backend instance. They are never shared with Anthropic or any third party.
            </p>
            <div className="rounded-xl border border-border bg-card/40 p-4 space-y-6">
              {API_KEY_FIELDS.map((field) => (
                <ApiKeyInput
                  key={field.key}
                  field={field}
                  value={apiKeys[field.key]}
                  onChange={(v) => handleKeyChange(field.key, v)}
                />
              ))}
            </div>
          </motion.section>

          {/* BYOK Integration Keys — only visible if admin-approved */}
          {byokApproved === true && (
            <>
              <Separator />
              <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="w-4 h-4 text-wing-400" />
                  <h2 className="text-base font-semibold">Integration API Keys</h2>
                  <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-wing-500/15 text-wing-400 font-medium">Admin Approved</span>
                </div>
                <p className="text-xs text-muted-foreground mb-4">
                  Keys are stored AES-256-GCM encrypted on the server. WingCommander uses your key for that provider — zero platform cost on your usage.
                </p>

                {byokMsg && (
                  <div className={`mb-3 px-3 py-2 rounded-lg text-xs ${byokMsg.type === "ok" ? "bg-emerald-500/10 text-emerald-400" : "bg-destructive/10 text-destructive"}`}>
                    {byokMsg.text}
                  </div>
                )}

                <div className="rounded-xl border border-border bg-card/40 p-4 space-y-4">
                  {BYOK_PROVIDERS.map((p) => {
                    const existing = serverKeys.find((k) => k.provider === p.id);
                    const isAdding = addingKey === p.id;
                    return (
                      <div key={p.id} className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Lock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <span className="text-sm font-medium">{p.label}</span>
                          <span className="text-xs text-muted-foreground">{p.models}</span>
                          {existing ? (
                            <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-mono">
                              ···{existing.key_hint}
                            </span>
                          ) : (
                            <span className="ml-auto text-xs text-muted-foreground">Not set</span>
                          )}
                        </div>

                        {existing ? (
                          <div className="flex gap-2 pl-5">
                            <Button
                              size="sm" variant="outline"
                              className="h-7 text-xs gap-1 text-destructive border-destructive/40 hover:bg-destructive/10"
                              onClick={() => deleteServerKey(p.id)}
                              disabled={byokLoading}
                            >
                              <Trash2 className="w-3 h-3" /> Remove
                            </Button>
                            <Button
                              size="sm" variant="ghost"
                              className="h-7 text-xs gap-1"
                              onClick={() => { setAddingKey(p.id); setNewKeyValue(""); }}
                            >
                              <RefreshCw className="w-3 h-3" /> Replace
                            </Button>
                          </div>
                        ) : !isAdding ? (
                          <div className="pl-5">
                            <Button
                              size="sm" variant="outline"
                              className="h-7 text-xs gap-1"
                              onClick={() => { setAddingKey(p.id); setNewKeyValue(""); }}
                            >
                              <Plus className="w-3 h-3" /> Add Key
                            </Button>
                          </div>
                        ) : null}

                        {isAdding && (
                          <div className="flex gap-2 pl-5">
                            <input
                              type="password"
                              value={newKeyValue}
                              onChange={(e) => setNewKeyValue(e.target.value)}
                              placeholder="Paste API key…"
                              className="flex-1 h-8 text-xs font-mono bg-background border border-border rounded-md px-3 text-foreground outline-none focus:border-wing-400 transition-colors"
                              autoFocus
                            />
                            <Button
                              size="sm" variant="gradient"
                              className="h-8 text-xs gap-1"
                              onClick={() => saveServerKey(p.id)}
                              disabled={byokLoading || !newKeyValue.trim()}
                            >
                              {byokLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                              Save
                            </Button>
                            <Button
                              size="sm" variant="ghost"
                              className="h-8 text-xs"
                              onClick={() => { setAddingKey(null); setNewKeyValue(""); }}
                            >
                              Cancel
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </motion.section>
            </>
          )}

          <Separator />

          {/* About */}
          <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <h2 className="text-base font-semibold mb-4">About</h2>
            <div className="rounded-xl border border-border bg-card/40 p-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Version</span>
                <span className="font-mono">0.1.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Primary model</span>
                <Badge variant="info" className="text-xs">Claude Opus 4.7</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Features</span>
                <div className="flex flex-wrap gap-1 justify-end max-w-xs">
                  {["Chat", "Code Gen", "RAG", "Image Gen", "Autonomous Agent", "Prompt Caching"].map((f) => (
                    <Badge key={f} variant="secondary" className="text-xs">{f}</Badge>
                  ))}
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Mission</span>
                <span className="text-xs text-right max-w-xs text-muted-foreground italic">For humanity. Forever.</span>
              </div>
            </div>
          </motion.section>
        </div>
      </div>
    </TooltipProvider>
  );
}
