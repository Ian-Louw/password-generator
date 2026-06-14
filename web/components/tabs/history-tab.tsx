"use client";

import * as React from "react";
import { Copy, Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { copyText } from "@/lib/clipboard";
import { cn } from "@/lib/utils";

export interface HistoryEntry {
  value: string;
  kind: string;
  id: number;
}

function Row({ entry }: { entry: HistoryEntry }) {
  const [masked, setMasked] = React.useState(true);
  return (
    <li className="flex items-center gap-3 rounded-lg border bg-card p-3">
      <Badge variant="secondary" className="shrink-0 uppercase">
        {entry.kind}
      </Badge>
      <span
        className={cn("flex-1 select-all break-all font-mono-pw text-sm", masked && "text-security-disc")}
      >
        {entry.value}
      </span>
      <Button variant="ghost" size="icon" title="Show / hide" onClick={() => setMasked((m) => !m)}>
        {masked ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
      </Button>
      <Button variant="ghost" size="icon" title="Copy" onClick={() => copyText(entry.value)}>
        <Copy className="h-4 w-4" />
      </Button>
    </li>
  );
}

export function HistoryTab({
  history,
  onClear,
}: {
  history: HistoryEntry[];
  onClear: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Kept in memory only — cleared when you close the tab.
        </p>
        <Button variant="outline" size="sm" onClick={onClear} disabled={!history.length}>
          Clear history
        </Button>
      </div>
      {history.length ? (
        <ul className="space-y-2">
          {history.map((e) => (
            <Row key={e.id} entry={e} />
          ))}
        </ul>
      ) : (
        <p className="py-12 text-center text-sm text-muted-foreground">
          Nothing generated yet this session.
        </p>
      )}
    </div>
  );
}
