import { experimental_transcribe as transcribe } from "ai";
import { gatewayAvailable } from "@/lib/gateway";

export const maxDuration = 30;

export async function POST(request: Request) {
  if (!gatewayAvailable(request)) {
    return Response.json({ error: "Transcription isn’t configured on this deployment." }, { status: 503 });
  }
  const form = await request.formData();
  const audio = form.get("audio");
  if (!(audio instanceof Blob) || audio.size === 0) return Response.json({ error: "No audio." }, { status: 400 });
  if (audio.size > 10_000_000) return Response.json({ error: "Recording is too long." }, { status: 413 });
  try {
    const result = await transcribe({
      model: process.env.AI_TRANSCRIBE_MODEL || "openai/gpt-4o-mini-transcribe",
      audio: new Uint8Array(await audio.arrayBuffer()),
    });
    return Response.json({ text: result.text });
  } catch (error) {
    console.error("transcribe failed", error);
    return Response.json({ error: "Couldn’t transcribe that." }, { status: 502 });
  }
}
