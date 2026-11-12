"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import { Orb } from "@/components/marks";
import { useOrbAudioPublish } from "@/components/orb-audio";
import { PIcon } from "@/components/polaris-icon";
import { type Agent } from "@/lib/prototype";
import type { OrbState } from "@/voiceorbs/lib/orb-state";
import { speak, speakable, startRecording, transcribeAudio, type Playback, type Recording } from "@/lib/voice";

type Phase = "starting" | "listening" | "transcribing" | "thinking" | "speaking" | "unavailable";

const status: Record<Phase, string> = {
  starting: "Starting…",
  listening: "Listening",
  transcribing: "Got it…",
  thinking: "Thinking",
  speaking: "Speaking",
  unavailable: "",
};

/** Voice conversation: listens until you pause, sends what you said as a message, then reads the reply aloud and listens again. */
export function VoiceMode({
  agent,
  busy,
  lastReply,
  onSend,
  onClose,
}: {
  agent: Agent;
  busy: boolean;
  lastReply: { id: string; text: string } | null;
  onSend: (text: string) => void;
  onClose: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("starting");
  const [heard, setHeard] = useState("");
  const [problem, setProblem] = useState("");
  const recording = useRef<Recording | null>(null);
  const playback = useRef<Playback | null>(null);
  const waitingAfter = useRef<string | null>(null);
  const alive = useRef(true);
  const send = useRef(onSend);
  useEffect(() => {
    send.current = onSend;
  });

  function listen() {
    if (!alive.current) return;
    startRecording().then(
      (active) => {
        if (!alive.current) {
          active.cancel();
          return;
        }
        recording.current = active;
        setPhase("listening");
      },
      () => {
        setProblem("Sidekick couldn’t access your microphone. Check your browser’s microphone permission.");
        setPhase("unavailable");
      },
    );
  }

  async function finishListening() {
    const active = recording.current;
    recording.current = null;
    if (!active) return;
    setPhase("transcribing");
    const audio = await active.stop();
    let text = "";
    try {
      text = await transcribeAudio(audio);
    } catch {
      setProblem("Voice isn’t available here yet.");
      setPhase("unavailable");
      return;
    }
    if (!alive.current) return;
    if (!text) {
      listen();
      return;
    }
    setHeard(text);
    waitingAfter.current = lastReplyId.current;
    setPhase("thinking");
    send.current(text);
  }

  const lastReplyId = useRef(lastReply?.id ?? null);
  useEffect(() => {
    lastReplyId.current = lastReply?.id ?? null;
  });

  const start = useEffectEvent(() => listen());
  const pauseHeard = useEffectEvent(() => void finishListening());
  const speakReply = useEffectEvent((reply: { id: string; text: string }, isCancelled: () => boolean) => {
    void (async () => {
      const voice = await speak(speakable(reply.text));
      if (isCancelled() || !alive.current) {
        voice.stop();
        return;
      }
      playback.current = voice;
      setPhase("speaking");
      await voice.done;
      if (playback.current === voice) playback.current = null;
      if (!isCancelled()) listen();
    })();
  });

  useEffect(() => {
    alive.current = true;
    start();
    return () => {
      alive.current = false;
      recording.current?.cancel();
      playback.current?.stop();
    };
  }, []);

  // Animate the orb from whichever side is talking, and end your turn after a pause.
  useEffect(() => {
    let frame = 0;
    let spoke = false;
    let loudAt = 0;
    const tick = () => {
      const now = performance.now();
      const level = recording.current?.level() ?? playback.current?.level() ?? 0;
      if (recording.current) {
        if (level > 0.12) {
          spoke = true;
          loudAt = now;
        } else if (spoke && now - loudAt > 1100) {
          spoke = false;
          pauseHeard();
        }
      } else {
        spoke = false;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [agent.id]);

  useEffect(() => {
    if (phase !== "thinking" || busy || !lastReply || lastReply.id === waitingAfter.current) return;
    waitingAfter.current = lastReply.id;
    let cancelled = false;
    speakReply(lastReply, () => cancelled);
    return () => {
      cancelled = true;
    };
  }, [phase, busy, lastReply]);

  function tapOrb() {
    if (phase === "listening") void finishListening();
    else if (phase === "speaking") {
      playback.current?.stop();
      playback.current = null;
    } else if (phase === "unavailable") {
      setProblem("");
      listen();
    }
  }

  const orbState: OrbState | null =
    phase === "starting"
      ? "connecting"
      : phase === "listening"
        ? "listening"
        : phase === "transcribing" || phase === "thinking"
          ? "thinking"
          : phase === "speaking"
            ? "speaking"
            : null;
  useOrbAudioPublish(agent.id, orbState, () => {
    if (phase === "listening") return recording.current?.level() ?? 0;
    if (phase === "speaking") return playback.current?.level() ?? -1;
    return 0;
  });

  const hint =
    phase === "listening" ? "Talk, then pause. Tap to send now." : phase === "speaking" ? "Tap to interrupt." : phase === "unavailable" ? "Tap to try again." : "";

  return (
    <div className="rise relative flex items-center gap-4 rounded-[20px] border border-[#2e302d] bg-[#121312] px-4 py-3">
      <button
        type="button"
        aria-label={phase === "speaking" ? "Interrupt" : phase === "listening" ? "Send now" : "Voice"}
        onClick={tapOrb}
        className="press relative grid size-14 shrink-0 place-items-center overflow-visible rounded-full"
      >
        <Orb id={agent.orb} agentId={agent.id} size={48} presence="selected" colorFrom={agent.orbFrom} colorTo={agent.orbTo} />
      </button>
      <div className="min-w-0 flex-1" aria-live="polite">
        {phase === "unavailable" ? (
          <p className="text-[13px] text-[#ffd2cc]">{problem}</p>
        ) : (
          <p className={`text-[15px] font-medium ${phase === "thinking" || phase === "transcribing" ? "shimmer-text" : ""}`}>{status[phase]}</p>
        )}
        <p className="truncate text-[13px] text-[#8e8f8b]">{heard && phase !== "listening" ? `“${heard}”` : hint}</p>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="press flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-white/[0.08] px-3.5 text-[13px] font-medium text-white hover:bg-white/[0.14]"
      >
        <PIcon name="X" size={16} />
        End
      </button>
    </div>
  );
}
