import type { AIModel } from "@/types";

export const AVAILABLE_MODELS: AIModel[] = [
  {
    id: "claude-opus-4-7",
    name: "Claude Opus 4.7",
    provider: "anthropic",
    description: "Most capable model — ideal for complex reasoning and autonomous agents",
    contextWindow: 200000,
    supportsVision: true,
    supportsThinking: true,
    isDefault: true,
  },
  {
    id: "claude-sonnet-4-6",
    name: "Claude Sonnet 4.6",
    provider: "anthropic",
    description: "Balanced performance and speed — great for most tasks",
    contextWindow: 200000,
    supportsVision: true,
    supportsThinking: false,
  },
  {
    id: "claude-haiku-4-5-20251001",
    name: "Claude Haiku 4.5",
    provider: "anthropic",
    description: "Fastest model — ideal for quick responses and high-volume tasks",
    contextWindow: 200000,
    supportsVision: true,
    supportsThinking: false,
  },
];

export const DEFAULT_MODEL = AVAILABLE_MODELS[0];
