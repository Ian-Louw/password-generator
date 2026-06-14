"use client";

import * as React from "react";
import { toast } from "sonner";

import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { copyText } from "@/lib/clipboard";
import { generateBulk, type PasswordOptions } from "@/lib/core/generator";

export function BulkTab() {
  const [count, setCount] = React.useState(20);
  const [length, setLength] = React.useState(20);
  const [opts, setOpts] = React.useState<PasswordOptions>({
    uppercase: true,
    lowercase: true,
    digits: true,
    symbols: true,
    excludeAmbiguous: false,
  });
  const [list, setList] = React.useState<string[]>([]);

  const generate = () => {
    try {
      const result = generateBulk(count, { ...opts, length });
      setList(result);
      toast.success(`Generated ${result.length} passwords`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    }
  };

  const exportFile = () => {
    if (!list.length) return toast.error("Nothing to export");
    const blob = new Blob([list.join("\n") + "\n"], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "passwords.txt";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported passwords.txt");
  };

  const TOGGLES: { key: keyof PasswordOptions; label: string }[] = [
    { key: "uppercase", label: "Uppercase" },
    { key: "lowercase", label: "Lowercase" },
    { key: "digits", label: "Numbers" },
    { key: "symbols", label: "Symbols" },
    { key: "excludeAmbiguous", label: "No ambiguous" },
  ];

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-5 pt-6">
          <div className="flex items-center gap-4">
            <Label className="w-24 shrink-0">Count</Label>
            <Input
              type="number"
              min={1}
              max={10000}
              value={count}
              onChange={(e) => setCount(Math.max(1, Math.min(10000, +e.target.value || 1)))}
              className="max-w-32"
            />
          </div>
          <div className="flex items-center gap-4">
            <Label className="w-24 shrink-0">Length</Label>
            <Slider value={[length]} min={4} max={128} step={1} onValueChange={([v]) => setLength(v)} />
            <span className="w-10 rounded-md bg-muted py-1 text-center font-mono text-sm font-semibold tabular-nums">
              {length}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {TOGGLES.map((t) => (
              <label key={t.key} className="flex items-center gap-2.5 text-sm">
                <Switch
                  checked={!!opts[t.key]}
                  onCheckedChange={(v) => setOpts((p) => ({ ...p, [t.key]: v }))}
                />
                {t.label}
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button onClick={generate}>Generate</Button>
        <Button variant="outline" onClick={() => list.length && copyText(list.join("\n"), "Copied all")}>
          Copy all
        </Button>
        <Button variant="outline" onClick={exportFile}>
          Export .txt
        </Button>
      </div>

      <Textarea
        readOnly
        value={list.join("\n")}
        placeholder="Generated passwords will appear here…"
        className="min-h-56 font-mono-pw text-xs"
      />
    </div>
  );
}
