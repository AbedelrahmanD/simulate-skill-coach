import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ExternalLink, Trash2 } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  apiKey: string;
  onSave: (key: string) => void;
  onClear: () => void;
}

export function SettingsDialog({ open, onOpenChange, apiKey, onSave, onClear }: Props) {
  const [value, setValue] = useState(apiKey);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Gemini API Key</DialogTitle>
          <DialogDescription>
            Your key is stored only in your browser (localStorage) and used to call Google directly.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Label htmlFor="key">API Key</Label>
          <Input
            id="key"
            type="password"
            placeholder="AIza..."
            value={value}
            onChange={(e) => setValue(e.target.value)}
            autoComplete="off"
          />
          <a
            href="https://aistudio.google.com/apikey"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
          >
            Get your free key here <ExternalLink className="h-3 w-3" />
          </a>
        </div>
        <DialogFooter className="flex-row justify-between sm:justify-between">
          <Button
            variant="ghost"
            onClick={() => { onClear(); setValue(""); }}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" /> Clear
          </Button>
          <Button onClick={() => onSave(value.trim())} disabled={!value.trim()}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}