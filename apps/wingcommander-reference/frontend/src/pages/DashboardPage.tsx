import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Search, Code2, Bot, Database, Image as ImageIcon, Sparkles,
  MoreHorizontal, Trash2, Edit3, Clock, Zap, LogOut,
  Moon, Sun, Monitor, ChevronDown, Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { formatRelativeTime, generateId } from "@/lib/utils";
import { signOut } from "@/lib/supabase";
import { useAuthStore, useProjectStore, useThemeStore } from "@/store";
import type { AgentMode, Project } from "@/types";

const MODE_CONFIG: Record<AgentMode, { icon: React.ElementType; label: string; color: string; description: string }> = {
  code: { icon: Code2, label: "Code", color: "text-cyan-400", description: "Build full-stack apps with AI" },
  chat: { icon: Bot, label: "Chat", color: "text-violet-400", description: "Conversational AI assistant" },
  rag: { icon: Database, label: "RAG", color: "text-emerald-400", description: "Document intelligence & retrieval" },
  image: { icon: ImageIcon, label: "Image", color: "text-amber-400", description: "AI image generation & editing" },
  autonomous: { icon: Zap, label: "Autonomous", color: "text-rose-400", description: "Multi-step agent execution" },
};

const EXAMPLE_PROJECTS: Project[] = [
  {
    id: "demo-1",
    userId: "demo",
    name: "SaaS Dashboard",
    description: "Full-stack dashboard with auth, billing, and analytics charts",
    mode: "code",
    files: [],
    messages: [],
    createdAt: new Date(Date.now() - 86400000 * 2),
    updatedAt: new Date(Date.now() - 3600000),
    tags: ["react", "typescript", "supabase"],
  },
  {
    id: "demo-2",
    userId: "demo",
    name: "Document Analyzer",
    description: "AI-powered PDF analyzer with citations and RAG retrieval",
    mode: "rag",
    files: [],
    messages: [],
    createdAt: new Date(Date.now() - 86400000 * 5),
    updatedAt: new Date(Date.now() - 7200000 * 3),
    tags: ["rag", "documents"],
  },
  {
    id: "demo-3",
    userId: "demo",
    name: "Brand Asset Generator",
    description: "Generate logos, banners, and social media assets",
    mode: "image",
    files: [],
    messages: [],
    createdAt: new Date(Date.now() - 86400000 * 1),
    updatedAt: new Date(Date.now() - 1800000),
    tags: ["design", "branding"],
  },
];

function NewProjectDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const { addProject } = useProjectStore();
  const { user } = useAuthStore();
  const [name, setName] = useState("");
  const [description, _setDescription] = useState("");
  const [selectedMode, setSelectedMode] = useState<AgentMode>("code");
  const [prompt, setPrompt] = useState("");

  const handleCreate = () => {
    const project: Project = {
      id: generateId(),
      userId: user?.id ?? "anon",
      name: name || `New ${MODE_CONFIG[selectedMode].label} Project`,
      description,
      mode: selectedMode,
      files: [],
      messages: prompt ? [{ id: generateId(), role: "user", content: prompt, timestamp: new Date() }] : [],
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: [],
    };
    addProject(project);
    onClose();
    navigate(`/workspace/${project.id}`);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-figtree text-xl">New project</DialogTitle>
          <DialogDescription>Choose a mode and describe what you want to build</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-2">
          {/* Mode selection */}
          <div>
            <label className="text-sm font-medium mb-3 block">Agent mode</label>
            <div className="grid grid-cols-5 gap-2">
              {(Object.entries(MODE_CONFIG) as [AgentMode, typeof MODE_CONFIG[AgentMode]][]).map(([mode, config]) => (
                <button
                  key={mode}
                  onClick={() => setSelectedMode(mode)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all text-xs font-medium ${
                    selectedMode === mode
                      ? "border-ditto-500/50 bg-ditto-500/10 text-foreground"
                      : "border-border hover:border-ditto-500/30 hover:bg-accent text-muted-foreground"
                  }`}
                >
                  <config.icon className={`w-5 h-5 ${config.color}`} />
                  {config.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">{MODE_CONFIG[selectedMode].description}</p>
          </div>

          {/* Project name */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">Project name</label>
            <Input
              placeholder={`My ${MODE_CONFIG[selectedMode].label} Project`}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Initial prompt */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">What do you want to build?</label>
            <Textarea
              placeholder="Describe your project in detail. The more context you give, the better the AI can help you build it."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button variant="gradient" onClick={handleCreate} disabled={!prompt && !name}>
              <Sparkles className="w-4 h-4" />
              Create project
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, setUser } = useAuthStore();
  const { projects, setProjects, deleteProject } = useProjectStore();
  const { theme, setTheme } = useThemeStore();
  const [search, setSearch] = useState("");
  const [showNewProject, setShowNewProject] = useState(false);
  const [filterMode, setFilterMode] = useState<AgentMode | "all">("all");

  useEffect(() => {
    if (projects.length === 0) setProjects(EXAMPLE_PROJECTS);
  }, [projects.length, setProjects]);

  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase());
    const matchesMode = filterMode === "all" || p.mode === filterMode;
    return matchesSearch && matchesMode;
  });

  const handleSignOut = async () => {
    await signOut();
    setUser(null);
    navigate("/");
  };

  const userInitials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() ?? "?";

  return (
    <div className="min-h-screen bg-background">
      {/* Topbar */}
      <header className="sticky top-0 z-40 border-b border-border/50 glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 font-figtree font-bold text-base"
          >
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-ditto-400 to-ditto-700 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="gradient-text hidden sm:block">Ditto Wingman</span>
          </button>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="gradient" onClick={() => setShowNewProject(true)}>
              <Plus className="w-4 h-4" /> New project
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-accent transition-colors">
                  <Avatar className="w-7 h-7">
                    {user?.avatarUrl && <AvatarImage src={user.avatarUrl} />}
                    <AvatarFallback className="text-xs">{userInitials}</AvatarFallback>
                  </Avatar>
                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel className="font-normal">
                  <p className="font-medium text-sm truncate">{user?.name ?? user?.email}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Theme</DropdownMenuLabel>
                {(["light", "dark", "system"] as const).map((t) => (
                  <DropdownMenuItem key={t} onClick={() => setTheme(t)} className="gap-2">
                    {t === "light" ? <Sun className="w-4 h-4" /> : t === "dark" ? <Moon className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
                    <span className="capitalize">{t}</span>
                    {theme === t && <span className="ml-auto text-ditto-400">✓</span>}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem className="gap-2" onClick={() => navigate("/settings")}>
                  <Settings className="w-4 h-4" /> Settings
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2 text-destructive" onClick={handleSignOut}>
                  <LogOut className="w-4 h-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-figtree font-bold mb-1">
            Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"},{" "}
            {user?.name?.split(" ")[0] ?? "there"} 👋
          </h1>
          <p className="text-muted-foreground">What are we building today?</p>
        </div>

        {/* Quick start prompt */}
        <div
          className="mb-8 p-4 rounded-2xl border border-ditto-500/20 bg-ditto-500/5 cursor-pointer hover:bg-ditto-500/10 transition-colors group"
          onClick={() => setShowNewProject(true)}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-ditto-500/20 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-ditto-400" />
            </div>
            <div className="flex-1 text-sm text-muted-foreground">
              Describe what you want to build...
            </div>
            <Button size="sm" variant="gradient" className="shrink-0">
              <Zap className="w-4 h-4" /> Build
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            <Button
              size="sm"
              variant={filterMode === "all" ? "secondary" : "ghost"}
              onClick={() => setFilterMode("all")}
            >
              All
            </Button>
            {(Object.entries(MODE_CONFIG) as [AgentMode, typeof MODE_CONFIG[AgentMode]][]).map(([mode, config]) => (
              <Button
                key={mode}
                size="sm"
                variant={filterMode === mode ? "secondary" : "ghost"}
                onClick={() => setFilterMode(mode)}
                className="shrink-0"
              >
                <config.icon className={`w-3.5 h-3.5 ${config.color}`} />
                {config.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Projects grid */}
        <AnimatePresence mode="popLayout">
          {filteredProjects.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <div className="w-16 h-16 rounded-2xl bg-muted mx-auto mb-4 flex items-center justify-center">
                <Code2 className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-medium mb-2">No projects found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {search ? "Try a different search term" : "Create your first project to get started"}
              </p>
              <Button variant="gradient" onClick={() => setShowNewProject(true)}>
                <Plus className="w-4 h-4" /> New project
              </Button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProjects.map((project, i) => {
                const modeConfig = MODE_CONFIG[project.mode];
                return (
                  <motion.div
                    key={project.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: i * 0.05 }}
                    className="group relative p-5 rounded-2xl border border-border bg-card hover:border-ditto-500/30 hover:shadow-lg hover:shadow-ditto-500/5 transition-all duration-200 cursor-pointer"
                    onClick={() => navigate(`/workspace/${project.id}`)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-9 h-9 rounded-xl bg-${project.mode === "code" ? "cyan" : project.mode === "rag" ? "emerald" : project.mode === "image" ? "amber" : project.mode === "autonomous" ? "rose" : "violet"}-500/10 flex items-center justify-center`}>
                        <modeConfig.icon className={`w-4.5 h-4.5 ${modeConfig.color}`} />
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/workspace/${project.id}`); }}>
                            <Edit3 className="w-4 h-4" /> Open
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={(e) => { e.stopPropagation(); deleteProject(project.id); }}
                          >
                            <Trash2 className="w-4 h-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <h3 className="font-semibold text-base mb-1 truncate">{project.name}</h3>
                    {project.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{project.description}</p>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex gap-1 flex-wrap">
                        {project.tags?.slice(0, 2).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs py-0">{tag}</Badge>
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatRelativeTime(project.updatedAt)}
                      </span>
                    </div>
                  </motion.div>
                );
              })}

              {/* New project card */}
              <motion.div
                layout
                className="p-5 rounded-2xl border border-dashed border-border hover:border-ditto-500/40 hover:bg-ditto-500/5 transition-all duration-200 cursor-pointer flex flex-col items-center justify-center gap-3 min-h-[180px] text-muted-foreground hover:text-foreground"
                onClick={() => setShowNewProject(true)}
              >
                <div className="w-10 h-10 rounded-xl border border-dashed border-current flex items-center justify-center">
                  <Plus className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium">New project</span>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>

      <NewProjectDialog open={showNewProject} onClose={() => setShowNewProject(false)} />
    </div>
  );
}
