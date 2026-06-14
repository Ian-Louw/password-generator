"use client";

import * as React from "react";

import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { SecretOutput } from "@/components/secret-output";
import { generatePin } from "@ultrapass/core";

export function PinTab({ onGenerated }: { onGenerated?: (v: string, k: string) => void }) {
  const [length, setLength] = React.useState(6);
  const [value, setValue] = React.useState("");

  const generate = React.useCallback(
    (n: number) => {
      const pin = generatePin(n);
      setValue(pin);
      onGenerated?.(pin, "pin");
    },
    [onGenerated],
  );

  React.useEffect(() => {
    generate(length);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [length]);

  return (
    <div className="space-y-4">
      <SecretOutput value={value} onRegenerate={() => generate(length)} big />
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Label className="w-24 shrink-0">Digits</Label>
            <Slider value={[length]} min={3} max={16} step={1} onValueChange={([v]) => setLength(v)} />
            <span className="w-10 rounded-md bg-muted py-1 text-center font-mono text-sm font-semibold tabular-nums">
              {length}
            </span>
          </div>
        </CardContent>
      </Card>
      <Button className="w-full" size="lg" onClick={() => generate(length)}>
        Generate PIN
      </Button>
    </div>
  );
}
