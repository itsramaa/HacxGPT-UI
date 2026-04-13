# HacxGPT Architecture Analysis & Mapping

## 1. Backend Analysis

The backend service is built using FastAPI and defines the actual domain models, data persistence layer, streaming infrastructure, and business logic. 

**Core Endpoints:**
- `GET /api/sessions`: Returns a list of the user's active chat sessions.
- `POST /api/sessions`: Creates a new session (requires `title`, `provider_name`, `model_name`, `system_prompt`).
- `GET /api/sessions/{session_id}`: Retrieves a single session.
- `GET /api/sessions/{session_id}/history`: Returns paginated history (messages) for a session.
- `DELETE /api/sessions/{session_id}`: Archives a session.
- `POST /api/chat/stream`: Core SSE streaming endpoint that receives a multi-model request and returns LLM chunks.
- `POST /api/uploads`: File upload endpoint that integrates with Minio and Qdrant for RAG.

**Authentication:** 
- JWT stateless cookies handled by backend routers `/api/auth/*`.

**Features:**
- Native Tool Use (web search, weather) handled directly by backend agents.
- Context window truncation, Token Billing, Key management.
- Multi-provider dynamic routing.

## 2. UI Analysis

The UI project currently duplicates extensive backend logic. It treats itself as the primary application server using Next.js Edge routing, Vercel AI SDK, and a local local Postgres DB (managed by Drizzle ORM).

**Current Component Structure:**
- `components/chat/sidebar-history.tsx`: Fetches from `/api/history` using SWR.
- `app/(chat)/api/chat/route.ts`: Heavy logic handling the Vercel AI SDK orchestration, DB inserts (using local Drizzle `saveMessages`), Rate-limiting, and resolving locally executed tools (`getWeather`, `createDocument`).
- `lib/db/schema.ts` & `lib/db/queries.ts`: Defines unused/dead tables for `Chat`, `Message_v2`, `Document`, `Stream` locally instead of reading from the backend.

**Dead Features (to remove):**
- Local tool implementations in `lib/ai/tools` (Duplicate of backend logic).
- Vercel AI SDK local provider integrations in `lib/ai/providers` and `lib/ai/models`.
- Drizzle ORM inserts for Chats/Messages in Edge routes.
- `botid` and generic `/api/document` endpoints if not supported by the backend REST contract. 
- Local rate-limiting (Backend does this natively with slowapi).

## 3. Mapping Table

| Feature / Data | Current UI Implementation | Refactored Target (Backend Alignment) |
| --- | --- | --- |
| **History Listing** | `/api/history` using Drizzle ORM. | Proxy to backend `GET /api/sessions` |
| **Chat Session** | Route handler `GET /api/messages` | Proxy to backend `GET /api/sessions/{id}/history` |
| **Create Chat/Msg** | `POST /api/chat` using `@ai-sdk` | Next.js API edge proxy mapping to backend `POST /api/chat/stream` |
| **Delete Chat** | `DELETE /api/chat?id=` | Proxy to backend `DELETE /api/sessions/{id}` |
| **Tool Execution** | `lib/ai/tools/*` | Handled natively by backend via Server-Sent Events (SSE) tool streams |
| **Models List** | Hardcoded in `lib/ai/models.ts` | Proxy to backend `GET /api/providers` |

## 4. Planned Refactoring Actions

1. **API Layer Replacement:**
   - Overwrite `app/(chat)/api/chat/route.ts` to be a pure passthrough proxy to the `BACKEND_PROXY_URL` `/api/chat/stream` or `/api/chat` using standard `fetch` streams. 
   - Overwrite `app/(chat)/api/history/route.ts` to proxy requests to `/api/sessions`.
   - Overwrite `app/(chat)/api/messages/route.ts` to proxy requests to `/api/sessions/{session_id}/history`.
2. **Cleanup Local Logic:**
   - Empty or delete files in `lib/db/queries.ts` logic that interacts with `Chat` or `Message` tables, replacing them with fetch calls to the NextJS proxy routes if they're used in Server Actions.
   - Remove unused tool implementations from `lib/ai/tools/`.
   - Clean up dependencies (`ai`, `@ai-sdk/*`, `drizzle-orm`) if entirely obsolete, though `ai` package (Vercel AI UI hooks) might be kept for `useChat`.
3. **Preserve UI/UX:**
   - Keep the existing `useChat` hook integration in the frontend client components but adjust it so that standard requests parse the SSE response coming from the FastAPI backend format instead of the React specific format, or transform the FastAPI format into Vercel AI format using custom parsers.
