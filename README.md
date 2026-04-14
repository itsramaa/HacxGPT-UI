# ⚡ HacxGPT-UI

Welcome to **HacxGPT-UI**, the elite front-end interface for the HacxGPT ecosystem. Designed for speed, aesthetics, and technical transparency, this dashboard connects directly to the HacxGPT FastAPI backend to deliver a premium AI experience.

![HacxGPT-UI Preview](https://chatbot.ai-sdk.dev/opengraph-image.png)

## 🚀 Key Features

- **Multi-Provider AI Gateway**: Seamlessly interact with Gemini, Groq, and OpenRouter models through a unified, high-performance interface.
- **Real-Time Tool Transparency**: 
    - **Live Activity Indicators**: Watch the AI work in real-time with specific indicators like "Searching the web...", "Thinking...", or "Executing exploit research...".
    - **Data-Stream Integration**: Powered by a custom `DataStreamHandler` that intercept structured tool-call events from the backend.
- **Elite Hacker Persona**: Integrated system prompts that leverage a specialized "Hacker" identity for technical precision and personality.
- **Unified Auth & History**: 
    - Fully integrated with the FastAPI backend via **Next-Auth** and JWT.
    - Persistent chat history and multi-tenant workspace isolation.
- **Advanced Multimodal Inputs**: 
    - Upload images and documents directly to the backend for S3 storage and RAG indexing.
    - Drag-and-drop support with real-time upload progress.
- **Modern UI/UX**:
    - **Rich Aesthetics**: Dark-mode first design with smooth Framer Motion animations and glassmorphism.
    - **Diagnostic Tooltips**: Hover over message actions to view detailed token usage and provider metadata.
    - **Suggested Actions**: Smart, context-aware prompts to jumpstart your intelligence gathering.

## 🛠️ Technology Stack

- **Framework**: [Next.js 15](https://nextjs.org) (App Router)
- **State Management**: [Vercel AI SDK](https://ai-sdk.dev) + React Context
- **Styling**: [Tailwind CSS](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Auth**: [Next-Auth (Auth.js)](https://authjs.dev)

## 📦 Getting Started

### 1. Prerequisites
- Node.js 20+
- A running instance of [HacxGPT-Backend](https://github.com/itsramaa/HacxGPT-Backend)

### 2. Configuration
Create a `.env.local` file in the root directory:

```bash
# Backend URL (FastAPI)
NEXT_PUBLIC_API_URL=http://localhost:8000

# Auth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_auth_secret_here

# Optional: AI Gateway Key (if using Vercel AI Gateway)
AI_GATEWAY_API_KEY=your_key
```

### 3. Installation
```bash
pnpm install
pnpm dev
```

Visit `http://localhost:3000` to start hacking.

---

## 🤝 Contributing

We build for the elite. If you want to contribute, please ensure your code meets our aesthetic and technical standards. Check [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## 🛡️ License

Licensed under the [MIT License](LICENSE).
