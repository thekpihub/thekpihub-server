import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Theme, Project, Message, User, AgentMode, AIModel } from "@/types";
import { applyTheme, getStoredTheme } from "@/lib/theme";
import { DEFAULT_MODEL } from "@/lib/models";

interface ThemeStore {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      theme: getStoredTheme(),
      setTheme: (theme) => {
        applyTheme(theme);
        set({ theme });
      },
    }),
    { name: "ditto-theme" }
  )
);

interface AuthStore {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthStore>()((set) => ({
  user: null,
  isLoading: true,
  setUser: (user) => set({ user }),
  setLoading: (isLoading) => set({ isLoading }),
}));

interface ProjectStore {
  projects: Project[];
  activeProject: Project | null;
  activeFileId: string | null;
  setProjects: (projects: Project[]) => void;
  setActiveProject: (project: Project | null) => void;
  setActiveFileId: (id: string | null) => void;
  addProject: (project: Project) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
}

export const useProjectStore = create<ProjectStore>()((set) => ({
  projects: [],
  activeProject: null,
  activeFileId: null,
  setProjects: (projects) => set({ projects }),
  setActiveProject: (activeProject) => set({ activeProject }),
  setActiveFileId: (activeFileId) => set({ activeFileId }),
  addProject: (project) =>
    set((state) => ({ projects: [project, ...state.projects] })),
  updateProject: (id, updates) =>
    set((state) => ({
      projects: state.projects.map((p) => (p.id === id ? { ...p, ...updates } : p)),
      activeProject:
        state.activeProject?.id === id ? { ...state.activeProject, ...updates } : state.activeProject,
    })),
  deleteProject: (id) =>
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== id),
      activeProject: state.activeProject?.id === id ? null : state.activeProject,
    })),
}));

interface ChatStore {
  messages: Message[];
  isStreaming: boolean;
  selectedModel: AIModel;
  agentMode: AgentMode;
  addMessage: (message: Message) => void;
  updateLastMessage: (content: string) => void;
  updateLastMessageData: (updates: Partial<Message>) => void;
  clearMessages: () => void;
  setStreaming: (streaming: boolean) => void;
  setSelectedModel: (model: AIModel) => void;
  setAgentMode: (mode: AgentMode) => void;
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set) => ({
      messages: [],
      isStreaming: false,
      selectedModel: DEFAULT_MODEL,
      agentMode: "code",
      addMessage: (message) =>
        set((state) => ({ messages: [...state.messages, message] })),
      updateLastMessage: (content) =>
        set((state) => {
          const msgs = [...state.messages];
          if (msgs.length > 0) {
            msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], content };
          }
          return { messages: msgs };
        }),
      updateLastMessageData: (updates) =>
        set((state) => {
          const msgs = [...state.messages];
          if (msgs.length > 0) {
            msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], ...updates };
          }
          return { messages: msgs };
        }),
      clearMessages: () => set({ messages: [] }),
      setStreaming: (isStreaming) => set({ isStreaming }),
      setSelectedModel: (selectedModel) => set({ selectedModel }),
      setAgentMode: (agentMode) => set({ agentMode }),
    }),
    { name: "ditto-chat", partialize: (s) => ({ selectedModel: s.selectedModel, agentMode: s.agentMode }) }
  )
);
