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
  context.createMediaStreamSource(stream).connect(analyser);
  const samples = new Uint8Array(analyser.fftSize);

  const release = () => {
    stream.getTracks().forEach((track) => track.stop());
    void context.close().catch(() => undefined);
  };

  return {
    level: () => {
      analyser.getByteTimeDomainData(samples);
      let sum = 0;
      for (const value of samples) sum += ((value - 128) / 128) ** 2;
      return Math.min(1, Math.sqrt(sum / samples.length) * 4);
    },
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
    const source = context.createMediaElementSource(audio);
    source.connect(analyser);
    analyser.connect(context.destination);
    const samples = new Uint8Array(analyser.fftSize);
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
      level: () => {
        analyser.getByteTimeDomainData(samples);
        let sum = 0;
        for (const value of samples) sum += ((value - 128) / 128) ** 2;
        return Math.min(1, Math.sqrt(sum / samples.length) * 4);
      },
      done,
      stop: () => audio.pause(),
    };
  } catch {
    return speakWithBrowser(text);
  }
}

function speakWithBrowser(text: string): Playback {
  const synth = window.speechSynthesis;
  if (!synth) return { level: () => 0, done: Promise.resolve(), stop: () => undefined };
  const utterance = new SpeechSynthesisUtterance(text);
  let speaking = true;
  const done = new Promise<void>((resolve) => {
    utterance.onend = () => {
      speaking = false;
      resolve();
    };
    utterance.onerror = () => {
      speaking = false;
      resolve();
    };
  });
  synth.cancel();
  synth.speak(utterance);
  return {
    level: () => (speaking ? 0.25 + 0.2 * Math.abs(Math.sin(performance.now() / 120)) : 0),
    done,
    stop: () => synth.cancel(),
  };
}
