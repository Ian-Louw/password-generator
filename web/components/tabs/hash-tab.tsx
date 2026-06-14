"use client";

import * as React from "react";
import { toast } from "sonner";
import { Copy } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { copyText } from "@/lib/clipboard";
import { allDigests, bcryptHash, bcryptVerify, pbkdf2Hash } from "@/lib/core/hasher";

interface Results {
  bcrypt: string;
  sha256: string;
  sha512: string;
  pbkdf2: string;
  note: string;
}

function HashRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-16 shrink-0 text-xs font-semibold text-muted-foreground">{label}</span>
      <code className="flex-1 select-all break-all rounded-md bg-muted px-2 py-1.5 font-mono-pw text-xs">
        {value}
      </code>
      <Button variant="ghost" size="icon" title="Copy" onClick={() => copyText(value)}>
        <Copy className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function HashTab() {
  const [password, setPassword] = React.useState("");
  const [rounds, setRounds] = React.useState(12);
  const [results, setResults] = React.useState<Results | null>(null);
  const [busy, setBusy] = React.useState(false);

  const [verifyHash, setVerifyHash] = React.useState("");
  const [verifyMsg, setVerifyMsg] = React.useState<{ text: string; ok: boolean } | null>(null);

  const run = async () => {
    if (!password) return toast.error("Enter a password first");
    setBusy(true);
    try {
      const [bc, dg, pk] = await Promise.all([
        bcryptHash(password, rounds),
        allDigests(password),
        pbkdf2Hash(password),
      ]);
      setResults({
        bcrypt: bc.hash,
        sha256: dg.sha256,
        sha512: dg.sha512,
        pbkdf2: pk,
        note: bc.truncated
          ? "Note: bcrypt only uses the first 72 bytes — your password was truncated."
          : `bcrypt cost factor ${bc.rounds}.`,
      });
    } finally {
      setBusy(false);
    }
  };

  const verify = async () => {
    if (!password || !verifyHash) return toast.error("Enter both a password and a hash");
    const res = await bcryptVerify(password, verifyHash.trim());
    if (res.error) setVerifyMsg({ text: `⚠️ ${res.error}`, ok: false });
    else if (res.match) setVerifyMsg({ text: "✓ Match — the password produces this hash.", ok: true });
    else setVerifyMsg({ text: "✗ No match.", ok: false });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-5 pt-6">
          <div className="space-y-1.5">
            <Label htmlFor="hash-input">Password</Label>
            <Input
              id="hash-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Type or paste a password…"
            />
          </div>
          <div className="flex items-center gap-4">
            <Label className="w-24 shrink-0">bcrypt cost</Label>
            <Slider value={[rounds]} min={4} max={15} step={1} onValueChange={([v]) => setRounds(v)} />
            <span className="w-10 rounded-md bg-muted py-1 text-center font-mono text-sm font-semibold tabular-nums">
              {rounds}
            </span>
          </div>
          <Button onClick={run} disabled={busy} className="w-full">
            {busy ? "Hashing…" : "Hash it"}
          </Button>
        </CardContent>
      </Card>

      {results && (
        <Card>
          <CardContent className="space-y-2.5 pt-6">
            <HashRow label="bcrypt" value={results.bcrypt} />
            <HashRow label="SHA-256" value={results.sha256} />
            <HashRow label="SHA-512" value={results.sha512} />
            <HashRow label="PBKDF2" value={results.pbkdf2} />
            <p className="pt-1 text-xs text-muted-foreground">{results.note}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="space-y-4 pt-6">
          <h3 className="text-sm font-semibold">Verify against a bcrypt hash</h3>
          <div className="space-y-1.5">
            <Label htmlFor="verify-hash">Hash</Label>
            <Input
              id="verify-hash"
              value={verifyHash}
              onChange={(e) => setVerifyHash(e.target.value)}
              placeholder="$2a$12$…"
            />
          </div>
          <Button variant="outline" onClick={verify}>
            Verify match
          </Button>
          {verifyMsg && (
            <p className={`text-sm font-medium ${verifyMsg.ok ? "text-green-500" : "text-destructive"}`}>
              {verifyMsg.text}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
