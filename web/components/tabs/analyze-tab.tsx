"use client";

import * as React from "react";
import { AlertTriangle, Lightbulb } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { StrengthMeter } from "@/components/strength-meter";
import { evaluateStrength, type StrengthResult } from "@ultrapass/core";

const CRACK_LABELS: Record<string, string> = {
  online_throttled: "Online (throttled, 100/s)",
  online: "Online (10k/s)",
  offline_slow: "Offline slow hash (10B/s)",
  offline_fast: "Offline fast hash (1T/s)",
};

export function AnalyzeTab() {
  const [pw, setPw] = React.useState("");
  const [result, setResult] = React.useState<StrengthResult>(() => evaluateStrength(""));

  React.useEffect(() => {
    const id = window.setTimeout(() => setResult(evaluateStrength(pw)), 100);
    return () => window.clearTimeout(id);
  }, [pw]);

  const cells: [string, string][] = pw
    ? [
        ["Length", `${result.length} chars`],
        ["Character set", `${result.charsetSize} symbols`],
        ...Object.entries(result.crackTimes).map(([k, v]) => [CRACK_LABELS[k], v] as [string, string]),
      ]
    : [];

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="space-y-1.5">
            <Label htmlFor="an-input">Password</Label>
            <Input
              id="an-input"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder="Type or paste a password…"
            />
          </div>
          <StrengthMeter result={result} />
        </CardContent>
      </Card>

      {pw && (
        <>
          <div className="grid grid-cols-2 gap-3">
            {cells.map(([k, v]) => (
              <Card key={k}>
                <CardContent className="py-3">
                  <span className="block text-xs text-muted-foreground">{k}</span>
                  <span className="text-sm font-semibold">{v}</span>
                </CardContent>
              </Card>
            ))}
          </div>

          {result.warnings.map((w) => (
            <div
              key={w}
              className="flex items-start gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              {w}
            </div>
          ))}
          {result.suggestions.map((s) => (
            <div
              key={s}
              className="flex items-start gap-2 rounded-lg bg-primary/10 px-3 py-2 text-sm text-primary"
            >
              <Lightbulb className="mt-0.5 h-4 w-4 shrink-0" />
              {s}
            </div>
          ))}
        </>
      )}
    </div>
  );
}
