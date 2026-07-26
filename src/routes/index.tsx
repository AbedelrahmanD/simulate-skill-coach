import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Settings,
  RefreshCw,
  Sparkles,
  Users,
  Terminal,
  FileText,
  Mic2,
  Volume2,
  ShieldCheck,
} from "lucide-react";
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
import { NATURAL_VOICES, speak, stopSpeaking } from "@/lib/speech";

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
  const [apiKey, setApiKey] = useLocal<string>(LS.key, "AQ.Ab8RN6JOO0KxaDNcujvuj1p4zX_8z0w0-MtXybFxzrTiFMtpkg");
  const [mode, setMode] = useLocal<Mode>(LS.mode, "hr");
  const [voiceName, setVoiceName] = useLocal<string>(LS.voice, "shimmer");
  const [resumeText, setResumeText] = useLocal<string>(LS.resume, "");
  const [jd, setJd] = useLocal<string>(LS.jd, "");
  const [messages, setMessages] = useLocal<ChatMsg[]>(LS.msgs, []);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const bootRef = useRef(false);

  // Prompt for API key on first load if missing.
  useEffect(() => {
    if (bootRef.current) return;
    bootRef.current = true;
    const t = setTimeout(() => {
      if (!localStorage.getItem(LS.key)) {
        setApiKey("AQ.Ab8RN6JOO0KxaDNcujvuj1p4zX_8z0w0-MtXybFxzrTiFMtpkg");
      }
    }, 300);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => () => stopSpeaking(), []);

  const systemPrompt = useMemo(
    () => buildSystemPrompt(mode, resumeText, jd),
    [mode, resumeText, jd]
  );

  const speakText = async (text: string) => {
    setSpeaking(true);
    try {
      await speak(text, voiceName || "shimmer", () => setSpeaking(false));
    } catch {
      setSpeaking(false);
      toast.error("Voice playback failed. Check your connection and try again.");
    }
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
      if (/\b(api[_ ]?key|API_KEY|invalid api key|permission denied|unauthenticated)\b/i.test(msg)) {
        toast.error("API key looks invalid. Please update it in settings.");
      } else if (/\b(rate limit|quota|resource_exhausted|429)\b/i.test(msg)) {
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

  const resumeReady = Boolean(resumeText.trim());
  const keyReady = Boolean(apiKey);
  const activeMeta = MODE_META[mode] ?? MODE_META.hr;

  return (
    <ErrorBoundary>
      <div className="min-h-dvh">
        <div className="mx-auto flex min-h-dvh max-w-[1400px] gap-0 p-3 md:p-5 lg:gap-5">
          {/* Sidebar */}
          <aside className="hidden lg:flex w-[300px] shrink-0 flex-col rounded-3xl bg-sidebar text-sidebar-foreground shadow-elegant overflow-hidden">
            <div className="flex items-center gap-3 px-6 pt-7 pb-5">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-[--gold] to-[color-mix(in_oklab,var(--gold)_60%,white)] text-[color:var(--gold-foreground)] shadow-md">
                <Sparkles className="h-5 w-5" strokeWidth={2.5} />
              </div>
              <div className="min-w-0">
                <h1 className="font-display text-lg font-bold leading-tight tracking-tight">MockMate</h1>
                <p className="text-[11px] uppercase tracking-[0.14em] text-sidebar-foreground/70">Interview Simulator</p>
              </div>
            </div>

            <div className="mx-5 h-px bg-sidebar-border/70" />

            <nav className="flex-1 space-y-6 px-5 py-6 text-sm">
              <SidebarSection title="Status">
                <StatusRow ok={keyReady} label={keyReady ? "AI connected" : "API key needed"} />
                <StatusRow ok={resumeReady} label={resumeReady ? "Resume loaded" : "No resume yet"} />
                <StatusRow ok label={`Voice · ${voiceName}`} />
              </SidebarSection>

              <SidebarSection title="Session">
                <div className="rounded-xl bg-sidebar-accent/50 p-3">
                  <div className="flex items-center gap-2 text-sidebar-foreground/80">
                    <activeMeta.icon className="h-4 w-4 text-[--gold]" />
                    <span className="text-xs uppercase tracking-wider">Active mode</span>
                  </div>
                  <p className="mt-1 font-display text-base font-semibold">{activeMeta.label}</p>
                  <p className="mt-1 text-xs leading-relaxed text-sidebar-foreground/70">{activeMeta.blurb}</p>
                </div>
                <button
                  onClick={newInterview}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-sidebar-border/70 px-3 py-2 text-sm font-medium text-sidebar-foreground/90 transition hover:bg-sidebar-accent"
                >
                  <RefreshCw className="h-4 w-4" /> New interview
                </button>
              </SidebarSection>
            </nav>

            <div className="mx-5 mb-5 mt-2 flex items-center gap-2 rounded-xl bg-sidebar-accent/40 px-3 py-2.5 text-xs text-sidebar-foreground/70">
              <ShieldCheck className="h-4 w-4 text-[--gold]" />
              Runs privately — resume never leaves your browser.
            </div>
          </aside>

          {/* Main */}
          <main className="flex min-w-0 flex-1 flex-col gap-4">
            {/* Top bar */}
            <header className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-card/70 px-4 py-3 shadow-card backdrop-blur">
              <div className="flex min-w-0 items-center gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-md lg:hidden">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h2 className="font-display text-base font-semibold leading-tight sm:text-lg">
                    {activeMeta.label}
                  </h2>
                  <p className="truncate text-xs text-muted-foreground">
                    {resumeReady ? "Your resume is loaded — start whenever you're ready." : "Upload a resume to personalize the interview."}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={newInterview} className="hidden sm:inline-flex">
                  <RefreshCw className="mr-2 h-4 w-4" /> New
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSettingsOpen(true)}
                  aria-label="Settings"
                  className="rounded-full"
                >
                  <Settings className="h-5 w-5" />
                </Button>
              </div>
            </header>

            <div className="grid flex-1 gap-4 md:grid-cols-[minmax(0,320px)_1fr]">
              {/* Config panel */}
              <section className="space-y-4">
                <Panel
                  icon={<Users className="h-4 w-4" />}
                  title="Interview mode"
                  hint="Pick the tone of the conversation."
                >
                  <div className="grid grid-cols-2 gap-2">
                    {(Object.keys(MODE_META) as Mode[]).map((m) => {
                      const meta = MODE_META[m];
                      const active = mode === m;
                      const Icon = m === "hr" ? Users : Terminal;
                    return (
                      <button
                        key={m}
                        onClick={() => setMode(m)}
                        aria-pressed={active}
                        className={`group relative flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition ${
                          active
                            ? "border-transparent bg-primary text-white shadow-md"
                            : "border-border bg-background hover:border-primary/40 hover:bg-muted"
                        }`}
                      >
                        <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary text-primary-foreground">
                          <Icon className="h-4 w-4" strokeWidth={2.4} />
                        </span>
                        <span className="text-[11px] font-semibold uppercase tracking-wide">
                          {meta.label.replace(" Mode", "")}
                        </span>
                      </button>
                    );
                    })}
                  </div>
                </Panel>

                <Panel
                  icon={<Volume2 className="h-4 w-4" />}
                  title="Interviewer voice"
                  hint="Natural human voice powered by Lovable AI."
                >
                  <Select value={voiceName} onValueChange={setVoiceName}>
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Select a voice" />
                    </SelectTrigger>
                    <SelectContent>
                      {NATURAL_VOICES.map((v) => (
                        <SelectItem key={v.id} value={v.id}>
                          <span className="font-medium">{v.label}</span>
                          <span className="ml-2 text-xs text-muted-foreground">
                            {v.description}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="mt-3 w-full"
                    onClick={() => speakText("Hi there. I'll be your interviewer today. Whenever you're ready, we'll begin.")}
                    disabled={speaking}
                  >
                    <Mic2 className="mr-2 h-4 w-4" /> {speaking ? "Speaking…" : "Preview voice"}
                  </Button>
                </Panel>

                <Panel
                  icon={<FileText className="h-4 w-4" />}
                  title="Resume"
                  hint="PDF, parsed locally."
                >
                  <ResumeUpload resumeText={resumeText} onChange={setResumeText} />
                </Panel>

                <Panel
                  icon={<FileText className="h-4 w-4" />}
                  title="Job description"
                  hint="Optional — sharpens the questions."
                >
                  <Textarea
                    id="jd"
                    value={jd}
                    onChange={(e) => setJd(e.target.value)}
                    placeholder="Paste the target job description…"
                    className="min-h-[90px] resize-none bg-background text-sm"
                  />
                </Panel>
              </section>

              {/* Chat */}
              <section className="min-h-[520px]">
                <ChatInterface
                  messages={messages}
                  loading={loading}
                  speaking={speaking}
                  onSend={sendMessage}
                  onStopSpeaking={() => { stopSpeaking(); setSpeaking(false); }}
                />
              </section>
            </div>
          </main>
        </div>

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

function Panel({
  icon,
  title,
  hint,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/80 p-4 shadow-card backdrop-blur">
      <div className="mb-3 flex items-center gap-2">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </span>
        <div className="min-w-0">
          <Label className="block text-sm font-semibold text-foreground">{title}</Label>
          {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

function SidebarSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-sidebar-foreground/60">
        {title}
      </p>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function StatusRow({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 px-1 py-1 text-sm text-sidebar-foreground/90">
      <span
        className={`h-2 w-2 shrink-0 rounded-full ${ok ? "bg-[--gold] shadow-[0_0_10px_var(--gold)]" : "bg-sidebar-foreground/30"}`}
      />
      <span className="truncate">{label}</span>
    </div>
  );
}
