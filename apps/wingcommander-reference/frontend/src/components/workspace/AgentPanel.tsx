import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, CheckCircle2, XCircle, Clock, Loader2, ChevronRight,
  ChevronDown, StopCircle, Brain, Terminal,
  Sparkles, Code2, Globe, FileText, Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AgentTask {
  id: string;
  description: string;
  status: "pending" | "running" | "completed" | "failed";
  result?: string;
  error?: string;
  tool?: string;
  startedAt?: Date;
  completedAt?: Date;
  subTasks?: AgentTask[];
}

interface AgentRun {
  id: string;
  goal: string;
  status: "running" | "completed" | "failed" | "stopped";
  tasks: AgentTask[];
  thinking?: string;
  finalOutput?: string;
  startedAt: Date;
  completedAt?: Date;
  tokenUsage?: { input: number; output: number; cacheHits: number };
}

const TOOL_ICONS: Record<string, React.ElementType> = {
  code: Code2,
  search: Search,
  browser: Globe,
  file: FileText,
  terminal: Terminal,
  think: Brain,
};

function TaskItem({ task, depth = 0 }: { task: AgentTask; depth?: number }) {
  const [expanded, setExpanded] = useState(task.status === "running");
  const Icon = task.tool ? (TOOL_ICONS[task.tool] ?? Zap) : Zap;

  const statusIcon = {
    pending: <Clock className="w-3.5 h-3.5 text-muted-foreground" />,
    running: <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" />,
    completed: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />,
    failed: <XCircle className="w-3.5 h-3.5 text-destructive" />,
  }[task.status];

  return (
    <div style={{ marginLeft: `${depth * 16}px` }}>
      <div
        className={`flex items-start gap-2 px-2 py-1.5 rounded-lg transition-colors cursor-default ${
          task.status === "running" ? "bg-blue-500/5" : "hover:bg-accent/50"
        }`}
      >
        <div className="shrink-0 mt-0.5">{statusIcon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium truncate">{task.description}</span>
            {task.tool && (
              <Badge variant="outline" className="text-xs py-0 px-1.5 shrink-0">
                <Icon className="w-2.5 h-2.5 mr-1" />{task.tool}
              </Badge>
            )}
          </div>
          {task.status === "running" && (
            <div className="flex gap-0.5 mt-1">
              {[0, 1, 2].map((i) => (
                <span key={i} className="w-1 h-1 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          )}
          {task.result && (
            <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-1 mt-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
              {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              {expanded ? "Hide" : "Show"} result
            </button>
          )}
          <AnimatePresence>
            {expanded && task.result && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-1.5 p-2 rounded-lg bg-secondary text-xs font-mono text-muted-foreground max-h-24 overflow-y-auto">
                  {task.result}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      {task.subTasks?.map((sub) => (
        <TaskItem key={sub.id} task={sub} depth={depth + 1} />
      ))}
    </div>
  );
}

interface AgentPanelProps {
  projectId: string;
  onFileGenerated?: (filename: string, content: string, language: string) => void;
}

export default function AgentPanel({ projectId, onFileGenerated }: AgentPanelProps) {
  const [goal, setGoal] = useState("");
  const [activeRun, setActiveRun] = useState<AgentRun | null>(null);
  const [runHistory, setRunHistory] = useState<AgentRun[]>([]);
  const [thinking, setThinking] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeRun?.tasks]);

  const addTask = (run: AgentRun, task: Partial<AgentTask> & { description: string }): AgentTask => {
    const fullTask: AgentTask = {
      id: Math.random().toString(36).slice(2),
      status: "pending",
      ...task,
    };
    run.tasks.push(fullTask);
    setActiveRun({ ...run, tasks: [...run.tasks] });
    return fullTask;
  };

  const updateTask = (run: AgentRun, taskId: string, updates: Partial<AgentTask>) => {
    const task = run.tasks.find((t) => t.id === taskId);
    if (task) Object.assign(task, updates);
    setActiveRun({ ...run, tasks: [...run.tasks] });
  };

  const handleStart = async () => {
    if (!goal.trim()) return;

    const run: AgentRun = {
      id: Math.random().toString(36).slice(2),
      goal,
      status: "running",
      tasks: [],
      startedAt: new Date(),
    };
    setActiveRun(run);
    setGoal("");
    setThinking("");

    try {
      abortRef.current = new AbortController();
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: goal }],
          model: "claude-opus-4-7",
          mode: "autonomous",
          projectId,
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) throw new Error("Agent start failed");

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let fullResponse = "";
      let currentThinking = "";

      // Add a planning task
      const planTask = addTask(run, { description: "Analysing task and building execution plan", status: "running", tool: "think" });

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        const lines = decoder.decode(value, { stream: true }).split("\n");
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "[DONE]") break;
          try {
            const parsed = JSON.parse(data) as { type: string; content?: string };
            if (parsed.type === "thinking" && parsed.content) {
              currentThinking += parsed.content;
              setThinking(currentThinking);
              // Update plan task status
              updateTask(run, planTask.id, { status: "running", result: currentThinking.slice(0, 200) });
            }
            if (parsed.type === "text" && parsed.content) {
              fullResponse += parsed.content;

              // Mark plan task complete once we start getting text
              if (planTask.status !== "completed") {
                updateTask(run, planTask.id, { status: "completed", result: currentThinking.slice(0, 200) });
                // Add implementation task
                addTask(run, { description: "Implementing solution", status: "running", tool: "code" });
              }

              // Extract generated files
              if (onFileGenerated) {
                const fileRegex = /```(\w+)\s*\/\/\s*filename:\s*([^\n]+)\n([\s\S]*?)```/g;
                let match;
                while ((match = fileRegex.exec(fullResponse)) !== null) {
                  const lang = match[1];
                  const fname = match[2].trim();
                  const content = match[3];
                  onFileGenerated(fname, content, lang);

                  // Check if we already have a task for this file
                  const existing = run.tasks.find((t) => t.description.includes(fname));
                  if (!existing) {
                    addTask(run, { description: `Generated ${fname}`, status: "completed", tool: "file" });
                  }
                }
              }
            }
            if (parsed.type === "usage") {
              const u = parsed as unknown as Record<string, number>;
              run.tokenUsage = {
                input: u.inputTokens ?? 0,
                output: 0,
                cacheHits: u.cacheReadTokens ?? 0,
              };
            }
          } catch {}
        }
      }

      // Mark all running tasks complete
      for (const task of run.tasks) {
        if (task.status === "running") {
          updateTask(run, task.id, { status: "completed" });
        }
      }

      run.status = "completed";
      run.finalOutput = fullResponse;
      run.completedAt = new Date();
      setActiveRun({ ...run });
      setRunHistory((prev) => [run, ...prev.slice(0, 4)]);
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        if (activeRun) {
          activeRun.status = "failed";
          setActiveRun({ ...activeRun });
        }
      }
    }
  };

  const handleStop = () => {
    abortRef.current?.abort();
    if (activeRun) {
      setActiveRun({ ...activeRun, status: "stopped" });
    }
  };

  const isRunning = activeRun?.status === "running";

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50 shrink-0">
        <div className="w-7 h-7 rounded-lg bg-rose-500/20 flex items-center justify-center">
          <Zap className="w-4 h-4 text-rose-400" />
        </div>
        <span className="font-medium text-sm">Autonomous Agent</span>
        <Badge variant="info" className="ml-auto text-xs">Opus 4.7 + Thinking</Badge>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Goal input */}
        <div className="shrink-0 p-3 border-b border-border/50">
          <Textarea
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="Describe a complex task for the autonomous agent...&#10;&#10;e.g. Build a complete authentication system with JWT, refresh tokens, and email verification"
            className="min-h-[80px] text-sm resize-none"
            disabled={isRunning}
          />
          <div className="flex gap-2 mt-2">
            {isRunning ? (
              <Button variant="destructive" size="sm" className="w-full gap-1.5" onClick={handleStop}>
                <StopCircle className="w-3.5 h-3.5" /> Stop agent
              </Button>
            ) : (
              <Button variant="gradient" size="sm" className="w-full gap-1.5" onClick={handleStart} disabled={!goal.trim()}>
                <Zap className="w-3.5 h-3.5" /> Run autonomous agent
              </Button>
            )}
          </div>
        </div>

        {/* Active run */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          {activeRun ? (
            <div className="p-3 space-y-3">
              {/* Run header */}
              <div className="flex items-start gap-2">
                <div className={`w-2 h-2 rounded-full mt-1 shrink-0 ${
                  activeRun.status === "running" ? "bg-blue-400 animate-pulse" :
                  activeRun.status === "completed" ? "bg-emerald-400" :
                  activeRun.status === "failed" ? "bg-destructive" : "bg-muted-foreground"
                }`} />
                <div>
                  <p className="text-xs font-medium leading-relaxed">{activeRun.goal}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {activeRun.status === "running" ? "Running..." :
                     activeRun.status === "completed" ? `Completed in ${Math.round((activeRun.completedAt!.getTime() - activeRun.startedAt.getTime()) / 1000)}s` :
                     activeRun.status}
                  </p>
                </div>
              </div>

              {/* Extended thinking preview */}
              {thinking && (
                <div className="p-2.5 rounded-xl bg-violet-500/5 border border-violet-500/20">
                  <div className="flex items-center gap-1.5 mb-1.5 text-xs text-violet-400 font-medium">
                    <Brain className="w-3 h-3" /> Extended thinking
                  </div>
                  <p className="text-xs text-muted-foreground font-mono leading-relaxed line-clamp-4">
                    {thinking}
                  </p>
                </div>
              )}

              {/* Task list */}
              {activeRun.tasks.length > 0 && (
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Tasks ({activeRun.tasks.filter((t) => t.status === "completed").length}/{activeRun.tasks.length})
                  </p>
                  {activeRun.tasks.map((task) => (
                    <TaskItem key={task.id} task={task} />
                  ))}
                </div>
              )}

              {/* Token usage */}
              {activeRun.tokenUsage && (
                <div className="flex items-center gap-3 text-xs text-muted-foreground p-2 rounded-lg bg-secondary">
                  <Sparkles className="w-3 h-3 text-wing-400" />
                  <span>{activeRun.tokenUsage.input.toLocaleString()} tokens</span>
                  {activeRun.tokenUsage.cacheHits > 0 && (
                    <Badge variant="success" className="text-xs">
                      {activeRun.tokenUsage.cacheHits.toLocaleString()} cached
                    </Badge>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground p-4">
              <div className="w-14 h-14 rounded-2xl bg-rose-500/10 flex items-center justify-center">
                <Zap className="w-7 h-7 text-rose-400 opacity-60" />
              </div>
              <div className="text-center">
                <p className="font-medium text-sm mb-1">Autonomous agent ready</p>
                <p className="text-xs max-w-xs">
                  Describe any complex task. The agent will plan, execute, and build a complete solution using Claude Opus 4.7's extended thinking.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Run history */}
        {runHistory.length > 0 && (
          <div className="shrink-0 border-t border-border/50">
            <ScrollArea className="max-h-28">
              <div className="p-2 space-y-0.5">
                <p className="text-xs font-medium text-muted-foreground px-2 py-1">Previous runs</p>
                {runHistory.map((run) => (
                  <button
                    key={run.id}
                    onClick={() => setActiveRun(run)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-accent text-xs text-left"
                  >
                    {run.status === "completed" ? (
                      <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle className="w-3 h-3 text-muted-foreground shrink-0" />
                    )}
                    <span className="truncate text-muted-foreground">{run.goal}</span>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  );
}
