import { anthropic } from "@ai-sdk/anthropic";
import type { LanguageModel } from "ai";

export function chatModel(request: Request): LanguageModel | null {
  if (process.env.ANTHROPIC_API_KEY) return anthropic(process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5");
  if (process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN || request.headers.has("x-vercel-oidc-token")) {
    return process.env.AI_GATEWAY_MODEL || "anthropic/claude-sonnet-5.5";
  }
  return null;
}
