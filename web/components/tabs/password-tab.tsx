"use client";

import * as React from "react";

import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SecretOutput } from "@/components/secret-output";
import { StrengthMeter } from "@/components/strength-meter";
import { generatePassword, generatePronounceable, type PasswordOptions } from "@/lib/core/generator";
import { evaluateStrength, type StrengthResult } from "@/lib/core/strength";

const TOGGLES: { key: keyof PasswordOptions; label: string; hint?: string }[] = [
  { key: "uppercase", label: "Uppercase", hint: "A-Z" },
  { key: "lowercase", label: "Lowercase", hint: "a-z" },
  { key: "digits", label: "Numbers", hint: "0-9" },
  { key: "symbols", label: "Symbols", hint: "!@#$" },
  { key: "excludeAmbiguous", label: "No ambiguous", hint: "Il1O0" },
  { key: "requireEach", label: "One of each" },
  { key: "pronounceable" as keyof PasswordOptions, label: "Pronounceable", hint: "easy to say" },
];

interface State extends PasswordOptions {
  pronounceable: boolean;
}

export function PasswordTab({ onGenerated }: { onGenerated?: (v: string, k: string) => void }) {
  const [opts, setOpts] = React.useState<State>({
    length: 20,
    uppercase: true,
    lowercase: true,
    digits: true,
    symbols: true,
    excludeAmbiguous: false,
    excludeChars: "",
    customSymbols: "",
    requireEach: true,
    pronounceable: false,
  });
  const [value, setValue] = React.useState("");
  const [strength, setStrength] = React.useState<StrengthResult | null>(null);
  const [error, setError] = React.useState("");

  const generate = React.useCallback(
    (o: State) => {
      try {
        const pw = o.pronounceable
          ? generatePronounceable({ length: o.length, uppercase: o.uppercase, digits: o.digits })
          : generatePassword(o);
        setValue(pw);
        setStrength(evaluateStrength(pw));
        setError("");
        onGenerated?.(pw, "password");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error");
      }
    },
    [onGenerated],
  );

  // Initial generation + regenerate whenever options change.
  React.useEffect(() => {
    generate(opts);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opts]);

  const set = <K extends keyof State>(key: K, v: State[K]) => setOpts((p) => ({ ...p, [key]: v }));

  return (
    <div className="space-y-4">
      <SecretOutput value={error || value} onRegenerate={() => generate(opts)} />
      <StrengthMeter
        result={strength}
        note={strength ? `${strength.entropy} bits · cracks in ${strength.crackTimes.offline_fast}` : undefined}
      />

      <Card>
        <CardContent className="space-y-5 pt-6">
          <div className="flex items-center gap-4">
            <Label className="w-24 shrink-0">Length</Label>
            <Slider
              value={[opts.length ?? 20]}
              min={4}
              max={128}
              step={1}
              onValueChange={([v]) => set("length", v)}
            />
            <span className="w-10 rounded-md bg-muted py-1 text-center font-mono text-sm font-semibold tabular-nums">
              {opts.length}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {TOGGLES.map((t) => (
              <label key={t.key} className="flex items-center gap-2.5 text-sm">
                <Switch
                  checked={!!opts[t.key]}
                  onCheckedChange={(v) => set(t.key as keyof State, v as never)}
                />
                {t.label}
                {t.hint && <span className="text-xs text-muted-foreground">{t.hint}</span>}
              </label>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="pw-exclude" className="text-xs text-muted-foreground">
                Exclude characters
              </Label>
              <Input
                id="pw-exclude"
                placeholder="e.g. {}[]"
                value={opts.excludeChars}
                onChange={(e) => set("excludeChars", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pw-symbols" className="text-xs text-muted-foreground">
                Custom symbols
              </Label>
              <Input
                id="pw-symbols"
                placeholder="leave blank for default"
                value={opts.customSymbols}
                onChange={(e) => set("customSymbols", e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Button className="w-full" size="lg" onClick={() => generate(opts)}>
        Generate Password
      </Button>
    </div>
  );
}
