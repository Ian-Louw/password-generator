"use client";

import type { StrengthResult } from "@/lib/core/strength";

export function StrengthMeter({ result, note }: { result: StrengthResult | null; note?: string }) {
  const score = result?.score ?? 0;
  return (
    <div className="space-y-1.5">
      <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${score}%`, background: result?.color ?? "transparent" }}
        />
      </div>
      <div className="flex justify-between text-xs">
        <span style={{ color: result?.color }} className="font-medium">
          {result?.label ?? "—"}
        </span>
        <span className="text-muted-foreground">
          {note ?? (result?.entropy ? `${result.entropy} bits of entropy` : "")}
        </span>
      </div>
    </div>
  );
}
