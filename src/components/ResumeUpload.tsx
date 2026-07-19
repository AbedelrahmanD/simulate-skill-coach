import { useCallback, useRef, useState } from "react";
import { extractPdfText } from "@/lib/pdf";
import { FileText, Upload, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  resumeText: string;
  onChange: (text: string) => void;
}

export function ResumeUpload({ resumeText, onChange }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    if (file.type !== "application/pdf" && !file.name.endsWith(".pdf")) {
      setError("Please upload a PDF file.");
      return;
    }
    setLoading(true);
    try {
      const text = await extractPdfText(file);
      onChange(text);
    } catch (e: any) {
      setError(e.message || "Failed to parse PDF");
    } finally {
      setLoading(false);
    }
  }, [onChange]);

  if (resumeText) {
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <FileText className="h-4 w-4 text-primary" /> Resume parsed ({resumeText.length} chars)
          </div>
          <Button variant="ghost" size="sm" onClick={() => onChange("")} aria-label="Remove resume">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="max-h-32 overflow-auto rounded border border-border bg-muted/40 p-2 text-xs text-muted-foreground whitespace-pre-wrap">
          {resumeText.slice(0, 800)}{resumeText.length > 800 ? "…" : ""}
        </div>
      </div>
    );
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        const f = e.dataTransfer.files?.[0];
        if (f) handleFile(f);
      }}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") inputRef.current?.click(); }}
      className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
        drag ? "border-primary bg-primary/5" : "border-border bg-card hover:bg-muted/30"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />
      {loading ? (
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      ) : (
        <Upload className="h-6 w-6 text-muted-foreground" />
      )}
      <p className="mt-2 text-sm font-medium text-foreground">
        {loading ? "Parsing PDF locally…" : "Drop your resume PDF here"}
      </p>
      <p className="text-xs text-muted-foreground">Processed 100% in your browser</p>
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
    </div>
  );
}