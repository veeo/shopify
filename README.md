# Shopify admin + Sidekick

A prototype of a new merchant landing in the Shopify admin, with an expanded multi-agent Sidekick. It follows the Figma frames for signup, setup, payments, adding a sidekick, and the live store.

## Run locally

```bash
npm install
npm run dev
```

Open the URL Next prints (port 3000 unless you pass another one).

```bash
npm run dev -- --port 3847
```

Copy `.env.example` to `.env.local` and set `ANTHROPIC_API_KEY` to stream replies from Claude. Without the key, the composer uses scripted replies that still update the preview.

`?scenario=active` opens the live store and skips signup.

## Where to experiment

- Tokens live in `src/app/globals.css`.
- Agents, copy, products, and the screen flow live in `src/lib/prototype.ts`.
- The gear icon opens Experiments: New merchant or Active store, and motion.
- Chat tools are in `src/app/api/chat/route.ts`.

## Deploy

Next.js on Vercel, Node 24. The chat route reads `ANTHROPIC_API_KEY` on the server. Set `ANTHROPIC_MODEL` to override the default Claude Sonnet model.
