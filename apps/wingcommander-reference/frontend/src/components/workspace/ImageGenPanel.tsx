import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wand2, Image as ImageIcon, Download, Copy, Sparkles,
  ChevronDown, Loader2, X, Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { copyToClipboard } from "@/lib/utils";

interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  enhancedPrompt: string;
  model: string;
  timestamp: Date;
  width: number;
  height: number;
}

const ASPECT_RATIOS = [
  { label: "1:1 Square", width: 1024, height: 1024 },
  { label: "16:9 Landscape", width: 1344, height: 768 },
  { label: "9:16 Portrait", width: 768, height: 1344 },
  { label: "4:3", width: 1152, height: 896 },
  { label: "3:4", width: 896, height: 1152 },
];

const STYLE_PRESETS = [
  "Photorealistic",
  "Digital art",
  "Oil painting",
  "Watercolor",
  "Anime / Manga",
  "Cinematic",
  "Minimalist",
  "Cyberpunk",
  "Fantasy illustration",
  "Product photography",
];

const MODELS = [
  { id: "flux-schnell", name: "FLUX Schnell", desc: "Fastest, great quality" },
  { id: "flux-dev", name: "FLUX Dev", desc: "High quality, slower" },
  { id: "flux-pro", name: "FLUX Pro 1.1", desc: "Best quality, premium" },
  { id: "sdxl", name: "SDXL", desc: "Stable Diffusion XL" },
];

function ImageCard({ img, onSelect }: { img: GeneratedImage; onSelect: (img: GeneratedImage) => void }) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setDownloading(true);
    try {
      const a = document.createElement("a");
      a.href = img.url;
      a.download = `ditto-gen-${img.id}.png`;
      a.click();
    } finally {
      setDownloading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="group relative rounded-xl overflow-hidden border border-border bg-card cursor-pointer hover:border-ditto-500/40 transition-all"
      onClick={() => onSelect(img)}
    >
      <img
        src={img.url}
        alt={img.prompt}
        className="w-full object-cover aspect-square"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <p className="text-white text-xs line-clamp-2 mb-2">{img.prompt}</p>
          <div className="flex gap-1.5">
            <Button size="icon-sm" variant="glass" className="h-6 w-6" onClick={handleDownload}>
              {downloading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
            </Button>
            <Button size="icon-sm" variant="glass" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); copyToClipboard(img.enhancedPrompt); }}>
              <Copy className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </div>
      <div className="absolute top-2 right-2">
        <Badge variant="secondary" className="text-xs opacity-0 group-hover:opacity-100 transition-opacity">
          {img.model}
        </Badge>
      </div>
    </motion.div>
  );
}

function LightboxModal({ img, onClose }: { img: GeneratedImage; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.9 }}
        className="relative max-w-4xl w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <Button size="icon-sm" variant="glass" className="absolute -top-3 -right-3 z-10" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
        <img src={img.url} alt={img.prompt} className="w-full rounded-2xl" />
        <div className="mt-3 p-4 rounded-xl bg-black/60 border border-white/10">
          <p className="text-white/60 text-xs mb-1">Enhanced prompt</p>
          <p className="text-white text-sm leading-relaxed">{img.enhancedPrompt}</p>
          <div className="flex gap-2 mt-3">
            <Badge variant="secondary">{img.model}</Badge>
            <Badge variant="outline" className="text-white/60">{img.width}×{img.height}</Badge>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

interface ImageGenPanelProps {
  projectId: string;
}

export default function ImageGenPanel({ projectId: _projectId }: ImageGenPanelProps) {
  const [prompt, setPrompt] = useState("");
  const [selectedModel, setSelectedModel] = useState(MODELS[0]);
  const [selectedRatio, setSelectedRatio] = useState(ASPECT_RATIOS[0]);
  const [selectedStyle, setSelectedStyle] = useState("");
  const [enhancePrompt, setEnhancePrompt] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
  const [analyzePrompt, setAnalyzePrompt] = useState("");
  const [analyzeResult, setAnalyzeResult] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"generate" | "analyze" | "gallery">("generate");
  const handleGenerate = async () => {
    if (!prompt.trim() || generating) return;
    setGenerating(true);
    setError(null);

    const fullPrompt = selectedStyle ? `${prompt}, ${selectedStyle} style` : prompt;

    try {
      const res = await fetch("/api/image/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: fullPrompt,
          model: selectedModel.id,
          width: selectedRatio.width,
          height: selectedRatio.height,
          enhancePrompt,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Generation failed");
      }

      const data: { images: string[]; enhancedPrompt: string; originalPrompt: string } = await res.json();

      const newImages: GeneratedImage[] = data.images.map((url) => ({
        id: Math.random().toString(36).slice(2),
        url,
        prompt: fullPrompt,
        enhancedPrompt: data.enhancedPrompt,
        model: selectedModel.id,
        timestamp: new Date(),
        width: selectedRatio.width,
        height: selectedRatio.height,
      }));

      setGeneratedImages((prev) => [...newImages, ...prev]);
      setActiveTab("gallery");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const handleEnhancePrompt = async () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/image/prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: prompt, style: selectedStyle || "photorealistic" }),
      });
      const data: { prompt: string } = await res.json();
      setPrompt(data.prompt);
    } finally {
      setGenerating(false);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedImage || analyzing) return;
    setAnalyzing(true);
    setAnalyzeResult("");
    try {
      const res = await fetch("/api/image/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: selectedImage.url, question: analyzePrompt || undefined }),
      });
      const data: { analysis: string } = await res.json();
      setAnalyzeResult(data.analysis);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center">
            <ImageIcon className="w-4 h-4 text-amber-400" />
          </div>
          <span className="font-medium text-sm">Image Studio</span>
          <div className="ml-auto">
            <TabsList className="h-7">
              <TabsTrigger value="generate" className="text-xs h-6">Generate</TabsTrigger>
              <TabsTrigger value="analyze" className="text-xs h-6">Analyze</TabsTrigger>
              <TabsTrigger value="gallery" className="text-xs h-6">
                Gallery {generatedImages.length > 0 && `(${generatedImages.length})`}
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        {/* Generate tab */}
        <TabsContent value="generate" className="flex-1 overflow-y-auto p-4 space-y-4 m-0">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Prompt</label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="A cinematic portrait of an astronaut on Mars, golden hour light..."
              className="min-h-[90px]"
            />
            <div className="flex gap-2 mt-2">
              <Button size="sm" variant="ghost" className="text-xs h-7 gap-1" onClick={handleEnhancePrompt} disabled={generating || !prompt}>
                <Sparkles className="w-3 h-3 text-ditto-400" /> Enhance with AI
              </Button>
            </div>
          </div>

          {/* Style presets */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">Style</label>
            <div className="flex flex-wrap gap-1.5">
              {STYLE_PRESETS.map((s) => (
                <button
                  key={s}
                  onClick={() => setSelectedStyle(selectedStyle === s ? "" : s)}
                  className={`px-2.5 py-1 rounded-full text-xs border transition-all ${
                    selectedStyle === s
                      ? "border-amber-500/50 bg-amber-500/15 text-amber-300"
                      : "border-border text-muted-foreground hover:border-amber-500/30"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Settings row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Model</label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full justify-between h-8 text-xs">
                    {selectedModel.name} <ChevronDown className="w-3.5 h-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-52">
                  {MODELS.map((m) => (
                    <DropdownMenuItem key={m.id} onClick={() => setSelectedModel(m)} className="flex-col items-start gap-0">
                      <span className="font-medium text-sm">{m.name}</span>
                      <span className="text-xs text-muted-foreground">{m.desc}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Aspect ratio</label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full justify-between h-8 text-xs">
                    {selectedRatio.label} <ChevronDown className="w-3.5 h-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {ASPECT_RATIOS.map((r) => (
                    <DropdownMenuItem key={r.label} onClick={() => setSelectedRatio(r)}>
                      {r.label} <span className="ml-auto text-muted-foreground text-xs">{r.width}×{r.height}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Enhance toggle */}
          <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={enhancePrompt}
              onChange={(e) => setEnhancePrompt(e.target.checked)}
              className="rounded"
            />
            Auto-enhance prompt with Claude before generation
          </label>

          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
              {error}
            </div>
          )}

          <Button
            variant="gradient"
            className="w-full"
            onClick={handleGenerate}
            disabled={generating || !prompt.trim()}
          >
            {generating ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
            ) : (
              <><Wand2 className="w-4 h-4" /> Generate Image</>
            )}
          </Button>

          {generating && (
            <div className="rounded-xl border border-dashed border-amber-500/30 bg-amber-500/5 p-8 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-amber-400 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Generating with {selectedModel.name}...</p>
              <p className="text-xs text-muted-foreground/60 mt-1">This may take 10–30 seconds</p>
            </div>
          )}
        </TabsContent>

        {/* Analyze tab */}
        <TabsContent value="analyze" className="flex-1 overflow-y-auto p-4 space-y-4 m-0">
          <p className="text-sm text-muted-foreground">
            Use Claude Vision to analyze any generated image in your gallery.
          </p>

          {generatedImages.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ImageIcon className="w-10 h-10 opacity-30 mx-auto mb-3" />
              <p className="text-sm">Generate some images first</p>
            </div>
          ) : (
            <>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">Select image to analyze</label>
                <div className="grid grid-cols-3 gap-2">
                  {generatedImages.slice(0, 9).map((img) => (
                    <button
                      key={img.id}
                      onClick={() => setSelectedImage(img)}
                      className={`rounded-lg overflow-hidden border-2 transition-all ${
                        selectedImage?.id === img.id ? "border-ditto-500" : "border-transparent"
                      }`}
                    >
                      <img src={img.url} alt="" className="w-full aspect-square object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Question (optional)</label>
                <Input
                  value={analyzePrompt}
                  onChange={(e) => setAnalyzePrompt(e.target.value)}
                  placeholder="What objects are in this image? What mood does it convey?"
                />
              </div>

              <Button
                variant="gradient"
                className="w-full"
                onClick={handleAnalyze}
                disabled={!selectedImage || analyzing}
              >
                {analyzing ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</> : <><Eye className="w-4 h-4" /> Analyze with Claude Vision</>}
              </Button>

              {analyzeResult && (
                <div className="p-4 rounded-xl bg-secondary border border-border text-sm leading-relaxed whitespace-pre-wrap">
                  {analyzeResult}
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* Gallery tab */}
        <TabsContent value="gallery" className="flex-1 overflow-y-auto p-4 m-0">
          {generatedImages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                <ImageIcon className="w-8 h-8 text-amber-400 opacity-50" />
              </div>
              <div className="text-center">
                <p className="font-medium text-sm mb-1">No images yet</p>
                <p className="text-xs">Generate your first image to see it here</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setActiveTab("generate")}>
                <Wand2 className="w-4 h-4" /> Start generating
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {generatedImages.map((img) => (
                <ImageCard key={img.id} img={img} onSelect={setSelectedImage} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedImage && activeTab !== "analyze" && (
          <LightboxModal img={selectedImage} onClose={() => setSelectedImage(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
