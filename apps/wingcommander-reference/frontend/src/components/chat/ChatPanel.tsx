import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Send, Sparkles, User, Copy, RefreshCw, ChevronDown,
  Cpu, Zap, Database, Image as ImageIcon, Code2, Bot, StopCircle,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { useChatStore, useAuthStore } from "@/store";
import { AVAILABLE_MODELS } from "@/lib/models";
import { copyToClipboard, generateId } from "@/lib/utils";
import type { Message, AgentMode } from "@/types";

const MODE_CONFIG: Record<AgentMode, { icon: React.ElementType; label: string; color: string }> = {
  code: { icon: Code2, label: "Code", color: "text-cyan-400" },
  chat: { icon: Bot, label: "Chat", color: "text-violet-400" },
  rag: { icon: Database, label: "RAG", color: "text-emerald-400" },
  image: { icon: ImageIcon, label: "Image", color: "text-amber-400" },
  autonomous: { icon: Zap, label: "Auto", color: "text-rose-400" },
};

function ThinkingIndicator() {
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <Cpu className="w-3 h-3 animate-pulse text-wing-400" />
      <span>Thinking deeply...</span>
      <span className="flex gap-0.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1 h-1 rounded-full bg-wing-400 animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </span>
    </div>
  );
}

function MessageBubble({ message, isStreaming }: { message: Message; isStreaming?: boolean }) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";

  const handleCopy = async () => {
    if (await copyToClipboard(message.content)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex gap-3 group ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      <Avatar className="w-7 h-7 shrink-0 mt-0.5">
        {isUser ? (
          <AvatarFallback className="bg-wing-500/20 text-wing-400 text-xs">
            <User className="w-3.5 h-3.5" />
          </AvatarFallback>
        ) : (
          <AvatarFallback className="bg-wing-600/20 text-wing-400 text-xs">
            <Sparkles className="w-3.5 h-3.5" />
          </AvatarFallback>
        )}
      </Avatar>

      <div className={`flex flex-col gap-1 max-w-[80%] ${isUser ? "items-end" : "items-start"}`}>
        {message.thinkingContent && (
          <div className="w-full mb-1 p-3 rounded-lg bg-violet-500/5 border border-violet-500/20 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5 mb-1.5 text-violet-400 font-medium">
              <Cpu className="w-3 h-3" /> Extended thinking
            </div>
            <div className="line-clamp-3 font-mono leading-relaxed">{message.thinkingContent}</div>
          </div>
        )}

        <div
          className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
            isUser
              ? "bg-wing-600/20 border border-wing-500/30 text-foreground rounded-tr-sm"
              : "bg-secondary border border-border text-foreground rounded-tl-sm"
          }`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-pre:my-2 prose-headings:my-2">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ node: _node, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className ?? "");
                    const isBlock = !!match;
                    return isBlock ? (
                      <div className="relative group/code my-2">
                        <div className="flex items-center justify-between px-3 py-1.5 bg-muted/50 border border-border rounded-t-lg">
                          <span className="text-xs text-muted-foreground font-mono">{match[1]}</span>
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            className="h-5 w-5 opacity-0 group-hover/code:opacity-100 transition-opacity"
                            onClick={() => copyToClipboard(String(children))}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                        <pre className="!mt-0 !rounded-t-none overflow-x-auto p-3 bg-muted/30 border border-t-0 border-border rounded-b-lg">
                          <code className={className} {...props}>{children}</code>
                        </pre>
                      </div>
                    ) : (
                      <code className="px-1 py-0.5 rounded bg-muted font-mono text-xs" {...props}>{children}</code>
                    );
                  },
                }}
              >
                {message.content}
              </ReactMarkdown>
              {isStreaming && <span className="inline-block w-2 h-4 bg-wing-400 animate-pulse ml-0.5 rounded-sm" />}
            </div>
          )}
        </div>

        {!isUser && !isStreaming && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="icon-sm" variant="ghost" onClick={handleCopy} className="h-6 w-6">
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Copy</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
      </div>
    </motion.div>
  );
}

interface ChatPanelProps {
  projectId: string;
  onFileGenerated?: (filename: string, content: string, language: string) => void;
  onCacheUpdate?: (cached: boolean) => void;
}

export default function ChatPanel({ projectId, onFileGenerated, onCacheUpdate }: ChatPanelProps) {
  const { messages, isStreaming, selectedModel, agentMode, addMessage, updateLastMessage, updateLastMessageData, setStreaming, setSelectedModel, setAgentMode, clearMessages } = useChatStore();
  const { user } = useAuthStore();
  const [input, setInput] = useState("");
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
    setShowScrollBottom(!isNearBottom);
  };

  const handleStop = () => {
    abortRef.current?.abort();
    setStreaming(false);
  };

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isStreaming) return;

    const userMessage: Message = {
      id: generateId(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
      model: selectedModel.id,
    };

    addMessage(userMessage);
    setInput("");
    setStreaming(true);

    const assistantMessage: Message = {
      id: generateId(),
      role: "assistant",
      content: "",
      timestamp: new Date(),
      model: selectedModel.id,
    };
    addMessage(assistantMessage);

    try {
      abortRef.current = new AbortController();
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          model: selectedModel.id,
          mode: agentMode,
          projectId,
          userId: user?.id,
        }),
        signal: abortRef.current.signal,
      });

      if (!response.ok) throw new Error("Stream failed");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";
      let accumulatedThinking = "";

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") break;
            try {
              const parsed = JSON.parse(data) as { type: string; content?: string; cached?: boolean; inputTokens?: number; cacheReadTokens?: number };
              if (parsed.type === "thinking" && parsed.content) {
                accumulatedThinking += parsed.content;
                updateLastMessageData({ thinkingContent: accumulatedThinking });
              }
              if (parsed.type === "text" && parsed.content) {
                accumulated += parsed.content;
                updateLastMessage(accumulated);

                // Extract file blocks and notify parent
                if (onFileGenerated) {
                  const fileRegex = /```(\w+)\s*\/\/\s*filename:\s*([^\n]+)\n([\s\S]*?)```/g;
                  let match;
                  while ((match = fileRegex.exec(accumulated)) !== null) {
                    onFileGenerated(match[2].trim(), match[3], match[1]);
                  }
                }
              }
              if (parsed.type === "usage") {
                onCacheUpdate?.(!!parsed.cached);
              }
            } catch {}
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        updateLastMessage("Sorry, an error occurred. Please try again.");
      }
    } finally {
      setStreaming(false);
    }
  }, [input, isStreaming, messages, selectedModel, agentMode, projectId, user, addMessage, updateLastMessage, updateLastMessageData, setStreaming, onFileGenerated, onCacheUpdate]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const modeConfig = MODE_CONFIG[agentMode];

  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1.5 text-sm font-medium hover:text-wing-400 transition-colors">
                {selectedModel.name}
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Select model</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {AVAILABLE_MODELS.map((model) => (
                <DropdownMenuItem
                  key={model.id}
                  onClick={() => setSelectedModel(model)}
                  className="flex flex-col items-start gap-0.5 py-2"
                >
                  <div className="flex items-center gap-2 w-full">
                    <span className="font-medium text-sm">{model.name}</span>
                    {model.isDefault && <Badge variant="info" className="text-xs">Best</Badge>}
                    {selectedModel.id === model.id && <Check className="w-3.5 h-3.5 ml-auto text-wing-400" />}
                  </div>
                  <span className="text-xs text-muted-foreground">{model.description}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-2">
          {/* Mode selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="ghost" className="gap-1.5 h-7 text-xs">
                <modeConfig.icon className={`w-3.5 h-3.5 ${modeConfig.color}`} />
                {modeConfig.label}
                <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {(Object.entries(MODE_CONFIG) as [AgentMode, typeof MODE_CONFIG[AgentMode]][]).map(([mode, cfg]) => (
                <DropdownMenuItem
                  key={mode}
                  onClick={() => setAgentMode(mode)}
                  className="gap-2"
                >
                  <cfg.icon className={`w-4 h-4 ${cfg.color}`} />
                  {cfg.label}
                  {agentMode === mode && <Check className="w-3.5 h-3.5 ml-auto text-wing-400" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button size="icon-sm" variant="ghost" onClick={clearMessages} className="h-7 w-7">
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-wing-500/10 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-wing-400" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-lg mb-1">How can I help you build?</h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                Powered by Claude Opus 4.7 with extended thinking and autonomous agent capabilities.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-2 w-full max-w-sm">
              {[
                "Build a REST API with Express and TypeScript",
                "Create a React component with Tailwind",
                "Write unit tests for my code",
                "Explain this code and suggest improvements",
              ].map((s) => (
                <button
                  key={s}
                  onClick={() => setInput(s)}
                  className="text-left px-4 py-2.5 rounded-xl border border-border hover:border-wing-500/30 hover:bg-wing-500/5 text-sm text-muted-foreground hover:text-foreground transition-all"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message, i) => (
          <MessageBubble
            key={message.id}
            message={message}
            isStreaming={isStreaming && i === messages.length - 1 && message.role === "assistant"}
          />
        ))}

        {isStreaming && messages[messages.length - 1]?.role === "user" && (
          <div className="flex gap-3">
            <Avatar className="w-7 h-7 shrink-0">
              <AvatarFallback className="bg-wing-600/20 text-wing-400 text-xs">
                <Sparkles className="w-3.5 h-3.5" />
              </AvatarFallback>
            </Avatar>
            <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-secondary border border-border">
              <ThinkingIndicator />
            </div>
          </div>
        )}
      </div>

      {/* Scroll to bottom */}
      <AnimatePresence>
        {showScrollBottom && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="absolute bottom-20 right-4"
          >
            <Button size="icon-sm" variant="outline" onClick={scrollToBottom}>
              <ChevronDown className="w-4 h-4" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input */}
      <div className="shrink-0 px-4 py-3 border-t border-border/50">
        <div className="relative flex items-end gap-2">
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Message ${selectedModel.name}... (Shift+Enter for new line)`}
              className="min-h-[44px] max-h-40 pr-10 py-3 resize-none"
              rows={1}
              style={{ height: "auto" }}
              onInput={(e) => {
                const el = e.currentTarget;
                el.style.height = "auto";
                el.style.height = Math.min(el.scrollHeight, 160) + "px";
              }}
            />
          </div>
          {isStreaming ? (
            <Button size="icon" variant="destructive" onClick={handleStop}>
              <StopCircle className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              size="icon"
              variant="gradient"
              onClick={sendMessage}
              disabled={!input.trim()}
            >
              <Send className="w-4 h-4" />
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground/50 mt-1.5 text-center">
          Claude can make mistakes. Review important output.
        </p>
      </div>
    </div>
  );
}
