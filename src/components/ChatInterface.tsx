import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Mic, MicOff, Send, Square, Loader2, User, MessageSquareQuote } from "lucide-react";
import type { ChatMsg } from "@/lib/gemini";
import { getSpeechRecognition } from "@/lib/speech";

interface Props {
  messages: ChatMsg[];
  loading: boolean;
  speaking: boolean;
  onSend: (text: string) => void;
  onStopSpeaking?: () => void;
}

export function ChatInterface({ messages, loading, speaking, onSend, onStopSpeaking }: Props) {
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const recogRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const startListening = () => {
    setVoiceError(null);
    const recog = getSpeechRecognition();
    if (!recog) {
      setVoiceError("Speech recognition not supported in this browser.");
      return;
    }
    recog.lang = "en-US";
    recog.interimResults = false;
    recog.continuous = false;
    let transcript = "";
    recog.onresult = (e: any) => {
      transcript = Array.from(e.results).map((r: any) => r[0].transcript).join(" ");
      setInput(transcript);
    };
    recog.onerror = (e: any) => {
      setVoiceError(e.error || "Voice error");
      setListening(false);
    };
    recog.onend = () => {
      setListening(false);
      if (transcript.trim()) {
        onSend(transcript.trim());
        setInput("");
      }
    };
    recogRef.current = recog;
    recog.start();
    setListening(true);
  };

  const stopListening = () => {
    recogRef.current?.stop();
    setListening(false);
  };

  const submit = () => {
    const text = input.trim();
    if (!text || loading) return;
    onSend(text);
    setInput("");
  };

  return (
    <div className="flex h-full min-h-[520px] flex-col overflow-hidden rounded-2xl border border-border/60 bg-card/80 shadow-card backdrop-blur">
      {/* Chat header */}
      <div className="flex items-center justify-between border-b border-border/60 bg-card/70 px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-[--gradient-emerald] text-primary-foreground shadow-sm">
            <MessageSquareQuote className="h-4 w-4" />
          </span>
          <div>
            <p className="font-display text-sm font-semibold">Live interview</p>
            <p className="text-[11px] text-muted-foreground">
              {speaking ? "Interviewer is speaking…" : loading ? "Thinking…" : "Ready when you are."}
            </p>
          </div>
        </div>
        {speaking && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onStopSpeaking}
            className="text-xs"
          >
            <Square className="mr-1.5 h-3.5 w-3.5" /> Stop voice
          </Button>
        )}
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 space-y-5 overflow-y-auto px-4 py-5 sm:px-6"
      >
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-[--gradient-emerald] text-primary-foreground shadow-elegant">
              <MessageSquareQuote className="h-7 w-7" />
            </div>
            <h3 className="font-display text-lg font-semibold text-foreground">
              Ready to begin your practice
            </h3>
            <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
              Upload your resume, pick a mode, then say hi or type a message. Your interviewer will take it from there.
            </p>
          </div>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex gap-3 animate-in fade-in slide-in-from-bottom-1 duration-300 ${
              m.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {m.role === "model" && (
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[--gradient-emerald] text-primary-foreground shadow-md">
                <MessageSquareQuote className="h-4 w-4" />
              </div>
            )}
            {m.role === "model" ? (
              <div className="max-w-[78%] rounded-2xl rounded-tl-sm border border-border/60 bg-background/80 px-4 py-3 text-[15px] leading-relaxed text-foreground shadow-sm">
                {m.text}
              </div>
            ) : (
              <div className="max-w-[78%] rounded-2xl rounded-tr-sm bg-primary px-4 py-3 text-[15px] leading-relaxed text-primary-foreground shadow-md">
                {m.text}
              </div>
            )}
            {m.role === "user" && (
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-secondary text-secondary-foreground shadow-sm">
                <User className="h-4 w-4" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            Interviewer is thinking…
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="border-t border-border/60 bg-card/70 p-4 backdrop-blur">
        {voiceError && (
          <p className="mb-2 text-xs font-medium text-destructive">{voiceError}</p>
        )}
        <div className="flex items-end gap-2">
          <div className="flex-1 rounded-2xl border border-border bg-background focus-within:ring-2 focus-within:ring-primary/30">
            <Textarea
              aria-label="Your answer"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
              }}
              placeholder="Type your answer, or press the mic to speak…"
              className="min-h-[48px] resize-none border-0 bg-transparent px-4 py-3 text-[15px] shadow-none focus-visible:ring-0"
              rows={1}
            />
          </div>
          <Button
            type="button"
            variant={listening ? "destructive" : "secondary"}
            size="icon"
            onClick={listening ? stopListening : startListening}
            aria-label={listening ? "Stop listening" : "Start voice input"}
            className={`h-11 w-11 rounded-full shadow-sm ${listening ? "animate-pulse" : ""}`}
          >
            {listening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </Button>
          <Button
            type="button"
            onClick={submit}
            disabled={loading || !input.trim()}
            aria-label="Send answer"
            size="icon"
            className="h-11 w-11 rounded-full bg-[--gradient-emerald] text-primary-foreground shadow-md hover:opacity-95"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}