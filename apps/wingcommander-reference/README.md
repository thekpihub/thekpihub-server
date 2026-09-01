# Ditto Wingman

> A unified self-hosted AI agent — LLM, code, RAG, image generation and autonomous agents. For humanity. Forever.

Powered by **Claude Opus 4.7** — the most capable AI model available.

## Why Ditto Wingman?

| Feature | Ditto Wingman | Others |
|---|---|---|
| AI Model | Claude Opus 4.7 (best available) | Unknown/GPT-4 |
| Context Window | 200,000 tokens | ~32K tokens |
| Extended Thinking | ✅ | ❌ |
| RAG / Document Upload | ✅ | ❌ |
| Image Generation + Vision | ✅ | ❌ |
| Autonomous Agents | ✅ | Limited |
| Self-Hosted | ✅ | ❌ |
| Open Source | ✅ | ❌ |

## Quick Start

### Prerequisites
- Node.js 20+
- An [Anthropic API key](https://console.anthropic.com)
- A [Supabase](https://supabase.com) project (free tier works)

### 1. Clone and install

```bash
git clone https://github.com/nitro0dust-pixel/ditto-wingman
cd ditto-wingman
npm install
```

### 2. Configure environment

```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env — add ANTHROPIC_API_KEY

# Frontend
cp frontend/.env.example frontend/.env.local
# Edit frontend/.env.local — add Supabase credentials
```

### 3. Set up Supabase Auth

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **Authentication → Providers** → enable Google OAuth
3. Add your Supabase URL and anon key to `frontend/.env.local`
4. Set redirect URL to `http://localhost:3000/auth/callback`

### 4. Run development server

```bash
npm run dev
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:4000

## Docker Deployment (Production)

```bash
# Copy and fill in all env vars
cp backend/.env.example .env
docker-compose up -d
```

## Architecture

```
ditto-wingman/
├── frontend/           # React 18 + Vite + TypeScript + Tailwind CSS
│   └── src/
│       ├── components/ # UI library, chat, Monaco editor, workspace
│       ├── pages/      # Landing, Auth, Dashboard, Workspace
│       ├── lib/        # Supabase, theme, utils
│       ├── store/      # Zustand (auth, projects, chat, theme)
│       └── types/      # TypeScript interfaces
└── backend/            # Node.js + Express + Anthropic SDK
    └── src/
        └── routes/     # /chat (SSE streaming), /execute, /rag, /image
```

## Agent Modes

| Mode | Description |
|---|---|
| **Code** | Full-stack app generation with automatic file extraction |
| **Chat** | Conversational AI with 200K token context |
| **RAG** | Document upload + intelligent retrieval + citations |
| **Image** | Prompt enhancement + Claude Vision analysis |
| **Autonomous** | Multi-step agent loops with extended thinking |

## License

MIT — free forever.
