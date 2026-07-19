import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Settings, RefreshCw, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { SettingsDialog } from "@/components/SettingsDialog";
import { ResumeUpload } from "@/components/ResumeUpload";
import { ChatInterface } from "@/components/ChatInterface";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { MODE_META, type Mode, type ChatMsg, buildSystemPrompt, sendToGemini } from "@/lib/gemini";
import { loadVoices, speak, stopSpeaking } from "@/lib/speech";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MockMate — Autonomous Interview Simulator" },
      { name: "description", content: "Practice HR, technical, and grill-mode interviews with an AI interviewer that reads your resume. Voice-first, private, and runs entirely in your browser." },
      { property: "og:title", content: "MockMate — Autonomous Interview Simulator" },
      { property: "og:description", content: "Voice-first AI mock interviews powered by Gemini. Your resume never leaves your browser." },
    ],
  }),
  component: Index,
});

const LS = {
  key: "mockmate.apiKey",
  mode: "mockmate.mode",
  voice: "mockmate.voice",
  resume: "mockmate.resume",
  jd: "mockmate.jd",
  msgs: "mockmate.messages",
};

function useLocal<T>(key: string, initial: T): [T, (v: T) => void] {
  const [v, setV] = useState<T>(initial);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw !== null) setV(JSON.parse(raw));
    } catch { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const set = (val: T) => {
    setV(val);
    try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* ignore */ }
  };
  return [v, set];
}

function Index() {
  const [apiKey, setApiKey] = useLocal<string>(LS.key, "");
  const [mode, setMode] = useLocal<Mode>(LS.mode, "hr");
  const [voiceName, setVoiceName] = useLocal<string>(LS.voice, "");
  const [resumeText, setResumeText] = useLocal<string>(LS.resume, "");
  const [jd, setJd] = useLocal<string>(LS.jd, "");
  const [messages, setMessages] = useLocal<ChatMsg[]>(LS.msgs, []);

  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const bootRef = useRef(false);

  // Prompt for API key on first load if missing.
  useEffect(() => {
    if (bootRef.current) return;
    bootRef.current = true;
    const t = setTimeout(() => {
      if (!localStorage.getItem(LS.key)) setSettingsOpen(true);
    }, 300);
    return () => clearTimeout(t);
  }, []);

  // Load available speech voices; default to a professional female voice.
  useEffect(() => {
    loadVoices().then((vs) => {
      setVoices(vs);
      if (!voiceName && vs.length) {
        const female = vs.find((v) => /female|samantha|zira|susan|karen|victoria|google us english/i.test(v.name));
        setVoiceName((female || vs[0]).name);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => () => stopSpeaking(), []);

  const selectedVoice = useMemo(
    () => voices.find((v) => v.name === voiceName) || null,
    [voices, voiceName]
  );

  const systemPrompt = useMemo(
    () => buildSystemPrompt(mode, resumeText, jd),
    [mode, resumeText, jd]
  );

  const speakText = (text: string) => {
    setSpeaking(true);
    speak(text, selectedVoice, () => setSpeaking(false));
  };

  const sendMessage = async (userText: string) => {
    if (!apiKey) {
      toast.error("Please set your Gemini API key first.");
      setSettingsOpen(true);
      return;
    }
    stopSpeaking();
    const newHistory: ChatMsg[] = [...messages, { role: "user", text: userText }];
    setMessages(newHistory);
    setLoading(true);
    try {
      const reply = await sendToGemini(apiKey, systemPrompt, messages, userText);
      const updated: ChatMsg[] = [...newHistory, { role: "model", text: reply }];
      setMessages(updated);
      speakText(reply);
    } catch (e: any) {
      const msg = String(e?.message || e);
      if (/api key|API_KEY|invalid|permission/i.test(msg)) {
        toast.error("API key looks invalid. Please update it in settings.");
      } else if (/rate|quota|429/i.test(msg)) {
        toast.error("Rate limit hit — wait a moment and try again.");
      } else {
        toast.error("Interview error: " + msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const newInterview = () => {
    stopSpeaking();
    setMessages([]);
    toast.success("Fresh interview session started.");
  };

  return (
    <ErrorBoundary>
      <div className="min-h-dvh bg-background">
        <header className="border-b border-border bg-card/60 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Briefcase className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-base font-semibold leading-tight text-foreground">MockMate</h1>
                <p className="text-xs text-muted-foreground">Autonomous Interview Simulator</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={newInterview}>
                <RefreshCw className="mr-2 h-4 w-4" /> New Interview
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setSettingsOpen(true)} aria-label="Settings">
                <Settings className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </header>

        <main className="mx-auto grid max-w-6xl gap-4 p-4 md:grid-cols-[minmax(0,340px)_1fr]">
          <aside className="space-y-4">
            {/* Mode selector */}
            <div className="rounded-lg border border-border bg-card p-4">
              <Label className="mb-2 block text-sm font-medium">Interview Mode</Label>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(MODE_META) as Mode[]).map((m) => {
                  const meta = MODE_META[m];
                  const active = mode === m;
                  return (
                    <button
                      key={m}
                      onClick={() => setMode(m)}
                      aria-pressed={active}
                      className={`rounded-md border p-2 text-center text-xs transition-all ${
                        active
                          ? "border-primary bg-primary/10 text-primary shadow-sm"
                          : "border-border bg-background hover:bg-muted"
                      }`}
                    >
                      <div className="text-lg">{meta.emoji}</div>
                      <div className="mt-1 font-medium">{meta.label.replace(" Mode", "")}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Voice */}
            <div className="rounded-lg border border-border bg-card p-4">
              <Label className="mb-2 block text-sm font-medium">Interviewer Voice</Label>
              <Select value={voiceName} onValueChange={setVoiceName}>
                <SelectTrigger><SelectValue placeholder="Select a voice" /></SelectTrigger>
                <SelectContent>
                  {voices.map((v) => (
                    <SelectItem key={v.name} value={v.name}>{v.name} ({v.lang})</SelectItem>
                  ))}
                  {voices.length === 0 && <SelectItem value="none" disabled>No voices found</SelectItem>}
                </SelectContent>
              </Select>
              <Button variant="ghost" size="sm" className="mt-2 w-full" onClick={() => selectedVoice && speakText("Hello. I will be your interviewer today.")}>
                Test voice
              </Button>
            </div>

            {/* Resume */}
            <div>
              <Label className="mb-2 block text-sm font-medium">Resume (PDF)</Label>
              <ResumeUpload resumeText={resumeText} onChange={setResumeText} />
            </div>

            {/* JD */}
            <div className="rounded-lg border border-border bg-card p-4">
              <Label htmlFor="jd" className="mb-2 block text-sm font-medium">Job Description (optional)</Label>
              <Textarea
                id="jd"
                value={jd}
                onChange={(e) => setJd(e.target.value)}
                placeholder="Paste the target job description…"
                className="min-h-[80px] text-sm"
              />
            </div>
          </aside>

          <section className="h-[calc(100dvh-8rem)] min-h-[500px]">
            <ChatInterface
              messages={messages}
              loading={loading}
              speaking={speaking}
              onSend={sendMessage}
            />
          </section>
        </main>

        <SettingsDialog
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
          apiKey={apiKey}
          onSave={(k) => { setApiKey(k); setSettingsOpen(false); toast.success("API key saved locally."); }}
          onClear={() => { setApiKey(""); toast.info("API key cleared."); }}
        />
        <Toaster />
      </div>
    </ErrorBoundary>
  );
}
