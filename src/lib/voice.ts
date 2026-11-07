/** VoiceOrbs gallery loudness: voice-band energy, 0 silent through 1 loud. */
const VOICE_MIN_HZ = 85;
const VOICE_MAX_HZ = 3800;
const LEVEL_FLOOR = 0.14;
const LEVEL_RANGE = 0.62;
const PEAK_WEIGHT = 0.35;

function voiceLevel(analyser: AnalyserNode, bins: Uint8Array) {
  analyser.getByteFrequencyData(bins as Uint8Array<ArrayBuffer>);
  const nyquist = analyser.context.sampleRate / 2;
  const count = analyser.frequencyBinCount;
  const binFor = (hz: number) => Math.min(count, Math.max(1, Math.round((hz / nyquist) * count)));
  const lo = binFor(VOICE_MIN_HZ);
  const hi = Math.max(lo + 1, binFor(VOICE_MAX_HZ));
  let sum = 0;
  let peak = 0;
  for (let i = lo; i < hi; i += 1) {
    const value = bins[i] ?? 0;
    sum += value;
    if (value > peak) peak = value;
  }
  const average = sum / (hi - lo) / 255;
  const energy = (1 - PEAK_WEIGHT) * average + PEAK_WEIGHT * (peak / 255);
  return Math.min(1, Math.max(0, (energy - LEVEL_FLOOR) / LEVEL_RANGE));
}

export type Recording = {
  /** 0–1 loudness of the last few milliseconds of input. */
  level: () => number;
  stop: () => Promise<Blob>;
  cancel: () => void;
};

export async function startRecording(): Promise<Recording> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
  const type = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"].find((item) => MediaRecorder.isTypeSupported(item));
  const recorder = new MediaRecorder(stream, type ? { mimeType: type } : undefined);
  const chunks: Blob[] = [];
  recorder.ondataavailable = (event) => {
    if (event.data.size) chunks.push(event.data);
  };
  recorder.start(250);

  const context = new AudioContext();
  const analyser = context.createAnalyser();
  analyser.fftSize = 512;
  analyser.smoothingTimeConstant = 0.7;
  context.createMediaStreamSource(stream).connect(analyser);
  const bins = new Uint8Array(analyser.frequencyBinCount);

  const release = () => {
    stream.getTracks().forEach((track) => track.stop());
    void context.close().catch(() => undefined);
  };

  return {
    level: () => voiceLevel(analyser, bins),
    stop: () =>
      new Promise<Blob>((resolve) => {
        recorder.onstop = () => {
          release();
          resolve(new Blob(chunks, { type: recorder.mimeType || "audio/webm" }));
        };
        if (recorder.state === "inactive") recorder.onstop(new Event("stop"));
        else recorder.stop();
      }),
    cancel: () => {
      recorder.onstop = null;
      if (recorder.state !== "inactive") recorder.stop();
      release();
    },
  };
}

export async function transcribeAudio(audio: Blob): Promise<string> {
  const body = new FormData();
  body.append("audio", audio, "speech.webm");
  const response = await fetch("/api/transcribe", { method: "POST", body });
  if (!response.ok) throw new Error(`transcribe ${response.status}`);
  const data = (await response.json()) as { text?: string };
  return (data.text ?? "").trim();
}

/** Turns a Markdown reply into something that reads naturally aloud. */
export function speakable(markdown: string) {
  return markdown
    .replace(/```[\s\S]*?```/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*_`#>]+/g, "")
    .replace(/^\s*[-•]\s+/gm, "")
    .replace(/\n{2,}/g, ". ")
    .replace(/\s+/g, " ")
    .trim();
}

export type Playback = { level: () => number; done: Promise<void>; stop: () => void };

/** Speaks text with the gateway voice, falling back to the browser's own speech when that isn't available. */
export async function speak(text: string): Promise<Playback> {
  try {
    const response = await fetch("/api/speech", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!response.ok) throw new Error(`speech ${response.status}`);
    const url = URL.createObjectURL(await response.blob());
    const audio = new Audio(url);
    const context = new AudioContext();
    const analyser = context.createAnalyser();
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.7;
    const source = context.createMediaElementSource(audio);
    source.connect(analyser);
    analyser.connect(context.destination);
    const bins = new Uint8Array(analyser.frequencyBinCount);
    const done = new Promise<void>((resolve) => {
      const finish = () => {
        URL.revokeObjectURL(url);
        void context.close().catch(() => undefined);
        resolve();
      };
      audio.onended = finish;
      audio.onerror = finish;
      audio.onpause = finish;
    });
    await audio.play();
    return {
      level: () => voiceLevel(analyser, bins),
      done,
      stop: () => audio.pause(),
    };
  } catch {
    return speakWithBrowser(text);
  }
}

function speakWithBrowser(text: string): Playback {
  const synth = window.speechSynthesis;
  if (!synth) return { level: () => -1, done: Promise.resolve(), stop: () => undefined };
  const utterance = new SpeechSynthesisUtterance(text);
  const done = new Promise<void>((resolve) => {
    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();
  });
  synth.cancel();
  synth.speak(utterance);
  return {
    // speechSynthesis has no sample stream. A negative level tells the orb to use its speaking motion.
    level: () => -1,
    done,
    stop: () => synth.cancel(),
  };
}
