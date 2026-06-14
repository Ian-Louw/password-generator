"use client";

import * as React from "react";

import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SecretOutput } from "@/components/secret-output";
import { StrengthMeter } from "@/components/strength-meter";
import { generatePassphrase, passphraseEntropy, type PassphraseOptions } from "@/lib/core/passphrase";
import { evaluateStrength, type StrengthResult } from "@/lib/core/strength";

const SEPARATORS = [
  { value: "-", label: "- (hyphen)" },
  { value: ".", label: ". (dot)" },
  { value: "_", label: "_ (underscore)" },
  { value: " ", label: "(space)" },
  { value: "", label: "(none)" },
];

export function PassphraseTab({ onGenerated }: { onGenerated?: (v: string, k: string) => void }) {
  const [opts, setOpts] = React.useState<Required<PassphraseOptions>>({
    words: 5,
    separator: "-",
    capitalize: true,
    includeNumber: true,
    includeSymbol: false,
  });
  const [value, setValue] = React.useState("");
  const [strength, setStrength] = React.useState<StrengthResult | null>(null);

  const generate = React.useCallback(
    (o: Required<PassphraseOptions>) => {
      const phrase = generatePassphrase(o);
      setValue(phrase);
      setStrength(evaluateStrength(phrase));
      onGenerated?.(phrase, "passphrase");
    },
    [onGenerated],
  );

  React.useEffect(() => {
    generate(opts);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opts]);

  const set = <K extends keyof PassphraseOptions>(key: K, v: Required<PassphraseOptions>[K]) =>
    setOpts((p) => ({ ...p, [key]: v }));

  return (
    <div className="space-y-4">
      <SecretOutput value={value} onRegenerate={() => generate(opts)} />
      <StrengthMeter result={strength} note={`~${passphraseEntropy(opts.words)} bits from ${opts.words} words`} />

      <Card>
        <CardContent className="space-y-5 pt-6">
          <div className="flex items-center gap-4">
            <Label className="w-24 shrink-0">Words</Label>
            <Slider
              value={[opts.words]}
              min={2}
              max={12}
              step={1}
              onValueChange={([v]) => set("words", v)}
            />
            <span className="w-10 rounded-md bg-muted py-1 text-center font-mono text-sm font-semibold tabular-nums">
              {opts.words}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Label className="w-24 shrink-0">Separator</Label>
            <Select value={opts.separator} onValueChange={(v) => set("separator", v)}>
              <SelectTrigger className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SEPARATORS.map((s) => (
                  <SelectItem key={s.label} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center gap-2.5 text-sm">
              <Switch checked={opts.capitalize} onCheckedChange={(v) => set("capitalize", v)} />
              Capitalize words
            </label>
            <label className="flex items-center gap-2.5 text-sm">
              <Switch checked={opts.includeNumber} onCheckedChange={(v) => set("includeNumber", v)} />
              Add a number
            </label>
            <label className="flex items-center gap-2.5 text-sm">
              <Switch checked={opts.includeSymbol} onCheckedChange={(v) => set("includeSymbol", v)} />
              Add a symbol
            </label>
          </div>
        </CardContent>
      </Card>

      <Button className="w-full" size="lg" onClick={() => generate(opts)}>
        Generate Passphrase
      </Button>
    </div>
  );
}
