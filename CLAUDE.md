# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

UIGen is an AI-powered React component generator with live preview. Users describe components in natural language; Claude generates/edits files in a virtual file system; an iframe renders the result via Babel-transpiled JSX.

## Commands

All scripts inject `NODE_OPTIONS='--require ./node-compat.cjs'` via `cross-env` for Node compatibility — do not remove this.

```bash
npm run setup       # First-time: install deps, generate Prisma client, run migrations
npm run dev         # Dev server with Turbopack
npm run build       # Production build
npm run lint        # ESLint
npm test            # Vitest
npm run db:reset    # Reset SQLite DB (destructive)
```

Run a single test file:
```bash
npx vitest run src/components/chat/__tests__/MessageInput.test.tsx
```

Environment: copy `.env.example` to `.env` and set `ANTHROPIC_API_KEY`. Without it, the app falls back to `MockLanguageModel` (returns static counter/form/card components).

## Architecture

### Request / Generation Flow

1. User sends a message from `ChatInterface` → Vercel AI SDK `useChat()` (via `ChatContext`) POSTs to `/api/chat`.
2. `/src/app/api/chat/route.ts` calls `streamText()` with the generation system prompt (`/src/lib/prompts/generation.tsx`), current virtual FS state as context, and two tools: `str_replace_editor` and `file_manager`.
3. Claude calls those tools to mutate files. The frontend applies each tool result to `VirtualFileSystem` (via `FileSystemContext`).
4. On stream finish, the route saves messages + serialized FS to the DB (`Project.messages`, `Project.data`).
5. `PreviewFrame` (`/src/components/preview/`) detects FS changes, re-transforms `/App.jsx` via Babel standalone, and writes an import map + data URI into a sandboxed iframe.

### Key Abstractions

**VirtualFileSystem** (`/src/lib/file-system.ts`) — in-memory tree; never touches disk. All file operations during generation go through this class. It serializes to JSON for DB storage and for sending to the API route as context.

**Language Model Provider** (`/src/lib/provider.ts`) — `getLanguageModel()` returns either the real Anthropic model or `MockLanguageModel`. Always route model creation through this function.

**Tools** (`/src/lib/tools/`) — `str_replace_editor` handles view/create/str_replace/insert operations; `file_manager` handles rename/delete. These are the only mechanisms Claude uses to change files.

**JSX Transform** (`/src/lib/transform/jsx-transformer.ts`) — turns virtual FS files into a runnable iframe bundle. The entry point is always `/App.jsx`. Local imports use the `@/` alias mapped to the virtual FS.

### Auth

JWT sessions stored in an HTTP-only cookie (`session`). `verifySession()` in `/src/lib/auth.ts` is the server-side gate. Unauthenticated users get an anonymous mode tracked by `anon-work-tracker.ts` (browser only, not persisted).

### State Management

Two React contexts at the app root:
- `FileSystemContext` — owns `VirtualFileSystem` instance and exposes CRUD operations to all components.
- `ChatContext` — wraps Vercel AI SDK `useChat()`, holds messages, and wires tool invocations back to the FS context.

### Database

SQLite via Prisma. Schema: `User` (email + bcrypt password) → `Project` (name, `messages: String` JSON, `data: String` JSON). Run `npx prisma studio` to inspect. Migrations live in `prisma/migrations/`.

### Layout

Main UI is three resizable panels (react-resizable-panels): Chat (left, 35%) | Preview or Code view (right, 65%). Code view splits further into FileTree (30%) | Monaco Editor (70%).

## Conventions

- `@/*` path alias maps to `src/*` (configured in `tsconfig.json`).
- UI primitives come from shadcn/ui (New York style, Tailwind CSS v4). Add new components with `npx shadcn@latest add <component>`.
- Generated components must use Tailwind for styling and export a default React component. The system prompt in `generation.tsx` enforces this — keep that prompt in sync with any tool schema changes.
- Tests use Vitest + Testing Library + JSDOM. Test files live in `__tests__/` directories co-located with source.
