import { experimental_generateSpeech as generateSpeech } from "ai";
import { gatewayAvailable } from "@/lib/gateway";

export const maxDuration = 30;

export async function POST(request: Request) {
  if (!gatewayAvailable(request)) {
    return Response.json({ error: "Speech isn’t configured on this deployment." }, { status: 503 });
  }
  const { text } = (await request.json()) as { text?: string };
  const input = (text ?? "").trim().slice(0, 1200);
  if (!input) return Response.json({ error: "No text." }, { status: 400 });
  try {
    const { audio } = await generateSpeech({
      model: process.env.AI_SPEECH_MODEL || "openai/tts-1",
      voice: process.env.AI_SPEECH_VOICE || "nova",
      text: input,
    });
    return new Response(Buffer.from(audio.uint8Array), {
      headers: { "content-type": audio.mediaType || "audio/mpeg", "cache-control": "no-store" },
    });
  } catch (error) {
    console.error("speech failed", error);
    return Response.json({ error: "Couldn’t generate speech." }, { status: 502 });
  }
}
