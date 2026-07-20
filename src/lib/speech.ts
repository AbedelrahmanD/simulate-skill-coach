// Speech helpers.
// - Voice recognition: browser Web Speech API (prefixed).
// - Voice synthesis: server /api/tts (Lovable AI, OpenAI gpt-4o-mini-tts).
//   This gives natural, human-sounding voices instead of the robotic
//   default speechSynthesis output.

type AnyWindow = Window & {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
};

export function getSpeechRecognition(): any | null {
  if (typeof window === "undefined") return null;
  const w = window as AnyWindow;
  const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
  return Ctor ? new Ctor() : null;
}

export type NaturalVoice = {
  id: string;
  label: string;
  description: string;
};

// Curated subset of OpenAI voices — all natural, human-sounding.
export const NATURAL_VOICES: NaturalVoice[] = [
  { id: "alloy", label: "Alloy", description: "Warm, balanced (neutral)" },
  { id: "shimmer", label: "Shimmer", description: "Bright, friendly (female)" },
  { id: "nova", label: "Nova", description: "Clear, professional (female)" },
  { id: "sage", label: "Sage", description: "Calm, thoughtful (female)" },
  { id: "echo", label: "Echo", description: "Grounded, articulate (male)" },
  { id: "onyx", label: "Onyx", description: "Deep, authoritative (male)" },
  { id: "ash", label: "Ash", description: "Even-keeled, modern (male)" },
];

let currentAudio: HTMLAudioElement | null = null;
let currentUrl: string | null = null;

export function stopSpeaking() {
  if (currentAudio) {
    try {
      currentAudio.pause();
      currentAudio.src = "";
    } catch {
      /* ignore */
    }
    currentAudio = null;
  }
  if (currentUrl) {
    URL.revokeObjectURL(currentUrl);
    currentUrl = null;
  }
  // Also stop any legacy speech synthesis in case it was used previously.
  if (typeof window !== "undefined" && window.speechSynthesis) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      /* ignore */
    }
  }
}

export async function speak(
  text: string,
  voice: string,
  onEnd?: () => void,
): Promise<void> {
  stopSpeaking();
  try {
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, voice }),
    });
    if (!res.ok) {
      const msg = await res.text().catch(() => "");
      throw new Error(msg || `TTS ${res.status}`);
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    currentUrl = url;
    const audio = new Audio(url);
    currentAudio = audio;
    audio.onended = () => {
      if (currentUrl === url) {
        URL.revokeObjectURL(url);
        currentUrl = null;
      }
      if (currentAudio === audio) currentAudio = null;
      onEnd?.();
    };
    audio.onerror = () => {
      if (currentUrl === url) {
        URL.revokeObjectURL(url);
        currentUrl = null;
      }
      if (currentAudio === audio) currentAudio = null;
      onEnd?.();
    };
    await audio.play();
  } catch (err) {
    console.error("speak() failed:", err);
    onEnd?.();
    throw err;
  }
}