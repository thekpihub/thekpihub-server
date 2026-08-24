export type Theme = "dark" | "light" | "system";

export type MessageRole = "user" | "assistant" | "system";

export type AgentMode = "chat" | "code" | "rag" | "image" | "autonomous";

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  files?: FileAttachment[];
  images?: string[];
  thinkingContent?: string;
  model?: string;
}

export interface FileAttachment {
  name: string;
  type: string;
  size: number;
  content?: string;
  url?: string;
}

export interface ProjectFile {
  id: string;
  path: string;
  name: string;
  content: string;
  language: string;
  isDirectory?: boolean;
  children?: ProjectFile[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  userId: string;
  name: string;
  description?: string;
  mode: AgentMode;
  files: ProjectFile[];
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  isPublic?: boolean;
  tags?: string[];
  thumbnailUrl?: string;
  deployedUrl?: string;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  plan: "free" | "pro" | "enterprise";
  createdAt: Date;
}

export interface AIModel {
  id: string;
  name: string;
  provider: "anthropic";
  description: string;
  contextWindow: number;
  supportsVision: boolean;
  supportsThinking: boolean;
  isDefault?: boolean;
}

export interface RAGDocument {
  id: string;
  projectId: string;
  name: string;
  content: string;
  embedding?: number[];
  createdAt: Date;
}

export interface AgentTask {
  id: string;
  description: string;
  status: "pending" | "running" | "completed" | "failed";
  result?: string;
  error?: string;
  subTasks?: AgentTask[];
  createdAt: Date;
  completedAt?: Date;
}

export interface StreamChunk {
  type: "text" | "thinking" | "tool_use" | "tool_result" | "error" | "done";
  content: string;
  toolName?: string;
  toolInput?: Record<string, unknown>;
}

export interface CodeExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  duration: number;
}
