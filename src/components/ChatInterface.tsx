import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Mic, MicOff, Send, Square, Loader2, User, Bot } from "lucide-react";
import type { ChatMsg } from "@/lib/gemini";
import { getSpeechRecognition, stopSpeaking } from "@/lib/speech";

interface Props {
  messages: ChatMsg[];
  loading: boolean;
  speaking: boolean;
  onSend: (text: string) => void;
}

export function ChatInterface({ messages, loading, speaking, onSend }: Props) {
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
    <div className="flex h-full flex-col rounded-lg border border-border bg-card">
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center text-center text-sm text-muted-foreground">
            <Bot className="mb-2 h-10 w-10 text-primary/50" />
            <p>Upload your resume and pick a mode.</p>
            <p>Then send any message to begin the interview.</p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            {m.role === "model" && (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Bot className="h-4 w-4" />
              </div>
            )}
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm leading-relaxed ${
                m.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground"
              }`}
            >
              {m.text}
            </div>
            {m.role === "user" && (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
                <User className="h-4 w-4" />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Interviewer is thinking…
          </div>
        )}
      </div>

      <div className="border-t border-border p-3">
        {voiceError && <p className="mb-2 text-xs text-destructive">{voiceError}</p>}
        <div className="flex items-end gap-2">
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
            placeholder="Type your answer or press the mic…"
            className="min-h-[44px] resize-none"
            rows={1}
          />
          <Button
            type="button"
            variant={listening ? "destructive" : "secondary"}
            size="icon"
            onClick={listening ? stopListening : startListening}
            aria-label={listening ? "Stop listening" : "Start voice input"}
            className={listening ? "animate-pulse" : ""}
          >
            {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
          {speaking && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={stopSpeaking}
              aria-label="Stop AI speaking"
            >
              <Square className="h-4 w-4" />
            </Button>
          )}
          <Button
            type="button"
            onClick={submit}
            disabled={loading || !input.trim()}
            aria-label="Send answer"
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}