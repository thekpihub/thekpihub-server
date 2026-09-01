import { useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Sparkles, Play, Globe, Code2, MessageSquare,
  Eye, SplitSquareHorizontal, Database, Image as ImageIcon,
  Zap, Loader2, Settings, ChevronLeft, ChevronRight,
  Cpu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import ChatPanel from "@/components/chat/ChatPanel";
import CodeEditor from "@/components/editor/CodeEditor";
import FileTree from "@/components/workspace/FileTree";
import RAGPanel from "@/components/workspace/RAGPanel";
import ImageGenPanel from "@/components/workspace/ImageGenPanel";
import AgentPanel from "@/components/workspace/AgentPanel";
import { useProjectStore } from "@/store";
import { getFileLanguage, generateId } from "@/lib/utils";
import type { ProjectFile } from "@/types";

type PanelLayout = "chat" | "editor" | "split";
type RightPanel = "chat" | "rag" | "image" | "agent";

const DEFAULT_CODE = `// Welcome to Ditto Wingman Workspace
// Select a file from the tree or start chatting to generate code.

export function greet(name: string): string {
  return \`Hello, \${name}! Let's build something amazing.\`;
}
`;

const RIGHT_PANEL_TABS: { id: RightPanel; label: string; icon: React.ElementType; color: string }[] = [
  { id: "chat", label: "Chat", icon: MessageSquare, color: "text-ditto-400" },
  { id: "agent", label: "Agent", icon: Zap, color: "text-rose-400" },
  { id: "rag", label: "RAG", icon: Database, color: "text-emerald-400" },
  { id: "image", label: "Images", icon: ImageIcon, color: "text-amber-400" },
];

export default function WorkspacePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { projects, activeFileId, setActiveFileId, updateProject } = useProjectStore();

  const project = projects.find((p) => p.id === id);

  const [layout, setLayout] = useState<PanelLayout>("split");
  const [rightPanel, setRightPanel] = useState<RightPanel>("chat");
  const [previewUrl, setPreviewUrl] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [activeEditorTab, setActiveEditorTab] = useState<"code" | "preview">("code");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [cacheIndicator, setCacheIndicator] = useState<boolean | null>(null);

  const activeFile = project?.files.find((f) => f.id === activeFileId);
  const editorValue = activeFile?.content ?? DEFAULT_CODE;
  const editorLanguage = activeFile ? getFileLanguage(activeFile.name) : "typescript";

  const handleFileSelect = useCallback((file: ProjectFile) => {
    setActiveFileId(file.id);
  }, [setActiveFileId]);

  const handleAddFile = useCallback((name: string) => {
    if (!project) return;
    const newFile: ProjectFile = {
      id: generateId(),
      path: `/${name}`,
      name,
      content: `// ${name}\n`,
      language: getFileLanguage(name),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    updateProject(project.id, { files: [...project.files, newFile] });
    setActiveFileId(newFile.id);
  }, [project, updateProject, setActiveFileId]);

  const handleDeleteFile = useCallback((fileId: string) => {
    if (!project) return;
    const updatedFiles = project.files.filter((f) => f.id !== fileId);
    updateProject(project.id, { files: updatedFiles });
    if (activeFileId === fileId) setActiveFileId(updatedFiles[0]?.id ?? null);
  }, [project, activeFileId, updateProject, setActiveFileId]);

  const handleRenameFile = useCallback((fileId: string, name: string) => {
    if (!project) return;
    updateProject(project.id, {
      files: project.files.map((f) =>
        f.id === fileId ? { ...f, name, language: getFileLanguage(name), updatedAt: new Date() } : f
      ),
    });
  }, [project, updateProject]);

  const handleEditorChange = useCallback((value: string) => {
    if (!project || !activeFileId) return;
    updateProject(project.id, {
      files: project.files.map((f) =>
        f.id === activeFileId ? { ...f, content: value, updatedAt: new Date() } : f
      ),
      updatedAt: new Date(),
    });
  }, [project, activeFileId, updateProject]);

  const handleFileGenerated = useCallback((filename: string, content: string, language: string) => {
    if (!project) return;
    const existing = project.files.find((f) => f.name === filename);
    if (existing) {
      updateProject(project.id, {
        files: project.files.map((f) => (f.name === filename ? { ...f, content, updatedAt: new Date() } : f)),
      });
    } else {
      const newFile: ProjectFile = {
        id: generateId(),
        path: `/${filename}`,
        name: filename,
        content,
        language,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      updateProject(project.id, { files: [...project.files, newFile] });
      setActiveFileId(newFile.id);
    }
  }, [project, updateProject, setActiveFileId]);

  const handleRun = async () => {
    setIsRunning(true);
    try {
      const res = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files: project?.files ?? [], projectId: id }),
      });
      const { url } = await res.json();
      if (url) {
        setPreviewUrl(url);
        setActiveEditorTab("preview");
      }
    } finally {
      setIsRunning(false);
    }
  };

  if (!project) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-ditto-400 mx-auto mb-3" />
          <p className="text-muted-foreground">Loading project...</p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="h-screen flex flex-col bg-background overflow-hidden">
        {/* Top bar */}
        <div className="h-11 flex items-center gap-2 px-3 border-b border-border/50 shrink-0 bg-card/60 backdrop-blur-sm">
          <Button size="icon-sm" variant="ghost" onClick={() => navigate("/dashboard")} className="h-7 w-7">
            <ArrowLeft className="w-4 h-4" />
          </Button>

          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-5 h-5 rounded bg-ditto-500/20 flex items-center justify-center shrink-0">
              <Sparkles className="w-3 h-3 text-ditto-400" />
            </div>
            <span className="font-medium text-sm truncate">{project.name}</span>
            <Badge variant="outline" className="text-xs shrink-0 capitalize">{project.mode}</Badge>
            {cacheIndicator !== null && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge
                    variant={cacheIndicator ? "success" : "secondary"}
                    className="text-xs shrink-0 gap-1"
                  >
                    <Cpu className="w-2.5 h-2.5" />
                    {cacheIndicator ? "Cache hit" : "No cache"}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>Prompt caching status for last request</TooltipContent>
              </Tooltip>
            )}
          </div>

          {/* Layout toggles */}
          <div className="hidden md:flex items-center gap-1 border border-border rounded-lg p-0.5">
            {(["chat", "split", "editor"] as PanelLayout[]).map((l) => (
              <Tooltip key={l}>
                <TooltipTrigger asChild>
                  <Button
                    size="icon-sm"
                    variant={layout === l ? "secondary" : "ghost"}
                    onClick={() => setLayout(l)}
                    className="h-6 w-6"
                  >
                    {l === "chat" ? <MessageSquare className="w-3 h-3" /> :
                     l === "split" ? <SplitSquareHorizontal className="w-3 h-3" /> :
                     <Code2 className="w-3 h-3" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{l === "chat" ? "Chat only" : l === "split" ? "Split view" : "Editor only"}</TooltipContent>
              </Tooltip>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={handleRun} disabled={isRunning}>
              {isRunning ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
              Run
            </Button>
            <Button size="sm" variant="gradient" className="h-7 text-xs gap-1">
              <Globe className="w-3 h-3" /> Deploy
            </Button>
            <Button size="icon-sm" variant="ghost" className="h-7 w-7" onClick={() => navigate("/settings")}>
              <Settings className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex overflow-hidden">
          {/* File tree sidebar */}
          <AnimatePresence initial={false}>
            {(layout === "split" || layout === "editor") && !sidebarCollapsed && (
              <motion.div
                key="sidebar"
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 192, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="border-r border-border/50 bg-card/30 overflow-hidden shrink-0"
              >
                <FileTree
                  files={project.files}
                  activeFileId={activeFileId}
                  onSelectFile={handleFileSelect}
                  onAddFile={handleAddFile}
                  onDeleteFile={handleDeleteFile}
                  onRenameFile={handleRenameFile}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Sidebar collapse toggle */}
          {(layout === "split" || layout === "editor") && (
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="w-3 bg-border/50 hover:bg-ditto-500/20 transition-colors flex items-center justify-center shrink-0"
            >
              {sidebarCollapsed ? <ChevronRight className="w-2 h-2" /> : <ChevronLeft className="w-2 h-2" />}
            </button>
          )}

          {/* Right panel (chat / agent / rag / image) */}
          {(layout === "chat" || layout === "split") && (
            <div className={`flex flex-col overflow-hidden border-r border-border/50 ${layout === "split" ? "w-[380px] min-w-[300px]" : "flex-1"}`}>
              {/* Right panel tab bar */}
              <div className="flex items-center gap-1 px-2 py-1.5 border-b border-border/50 bg-card/20 shrink-0">
                {RIGHT_PANEL_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setRightPanel(tab.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                      rightPanel === tab.id
                        ? "bg-secondary text-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                    }`}
                  >
                    <tab.icon className={`w-3 h-3 ${tab.color}`} />
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Panel content */}
              <div className="flex-1 overflow-hidden">
                <AnimatePresence mode="wait">
                  {rightPanel === "chat" && (
                    <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                      <ChatPanel
                        projectId={project.id}
                        onFileGenerated={handleFileGenerated}
                        onCacheUpdate={(cached) => setCacheIndicator(cached)}
                      />
                    </motion.div>
                  )}
                  {rightPanel === "agent" && (
                    <motion.div key="agent" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                      <AgentPanel projectId={project.id} onFileGenerated={handleFileGenerated} />
                    </motion.div>
                  )}
                  {rightPanel === "rag" && (
                    <motion.div key="rag" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                      <RAGPanel projectId={project.id} />
                    </motion.div>
                  )}
                  {rightPanel === "image" && (
                    <motion.div key="image" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                      <ImageGenPanel projectId={project.id} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Editor + Preview panel */}
          {(layout === "editor" || layout === "split") && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <Tabs value={activeEditorTab} onValueChange={(v) => setActiveEditorTab(v as "code" | "preview")} className="flex flex-col h-full">
                <div className="flex items-center border-b border-border/50 px-3 h-9 shrink-0 bg-card/20">
                  <TabsList className="h-7 bg-transparent gap-1 p-0">
                    <TabsTrigger value="code" className="h-6 text-xs gap-1.5 data-[state=active]:bg-secondary px-2">
                      <Code2 className="w-3 h-3" /> Code
                    </TabsTrigger>
                    <TabsTrigger value="preview" className="h-6 text-xs gap-1.5 data-[state=active]:bg-secondary px-2">
                      <Eye className="w-3 h-3" /> Preview
                    </TabsTrigger>
                  </TabsList>
                  {activeFile && (
                    <span className="ml-3 text-xs text-muted-foreground font-mono truncate">
                      {activeFile.name}
                    </span>
                  )}
                  {project.files.length > 0 && (
                    <span className="ml-auto text-xs text-muted-foreground">
                      {project.files.length} file{project.files.length !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>

                <TabsContent value="code" className="flex-1 m-0 overflow-hidden">
                  <CodeEditor
                    value={editorValue}
                    language={editorLanguage}
                    onChange={handleEditorChange}
                    path={activeFile?.path}
                  />
                </TabsContent>

                <TabsContent value="preview" className="flex-1 m-0 overflow-hidden bg-white">
                  {previewUrl ? (
                    <iframe
                      src={previewUrl}
                      className="w-full h-full border-0"
                      sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                      title="App preview"
                    />
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center gap-4 text-muted-foreground bg-background">
                      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
                        <Eye className="w-8 h-8 opacity-30" />
                      </div>
                      <div className="text-center">
                        <p className="font-medium text-sm mb-1">No preview yet</p>
                        <p className="text-xs">Click Run to build and preview your app</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={handleRun} disabled={isRunning}>
                        {isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                        Run app
                      </Button>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
