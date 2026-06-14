"use client";

import * as React from "react";
import { KeyRound, MessageSquareText, Hash, ShieldCheck, ListOrdered, Clock, Binary } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThemeToggle } from "@/components/theme-toggle";
import { PasswordTab } from "@/components/tabs/password-tab";
import { PassphraseTab } from "@/components/tabs/passphrase-tab";
import { PinTab } from "@/components/tabs/pin-tab";
import { BulkTab } from "@/components/tabs/bulk-tab";
import { HashTab } from "@/components/tabs/hash-tab";
import { AnalyzeTab } from "@/components/tabs/analyze-tab";
import { HistoryTab, type HistoryEntry } from "@/components/tabs/history-tab";

const HISTORY_MAX = 50;

export default function Home() {
  const [history, setHistory] = React.useState<HistoryEntry[]>([]);
  const idRef = React.useRef(0);

  const addHistory = React.useCallback((value: string, kind: string) => {
    setHistory((prev) => {
      if (!value || value === prev[0]?.value) return prev;
      return [{ value, kind, id: idRef.current++ }, ...prev].slice(0, HISTORY_MAX);
    });
  }, []);

  const tabs = [
    { v: "password", icon: KeyRound, label: "Password" },
    { v: "passphrase", icon: MessageSquareText, label: "Passphrase" },
    { v: "pin", icon: Binary, label: "PIN" },
    { v: "bulk", icon: ListOrdered, label: "Bulk" },
    { v: "hash", icon: Hash, label: "Hash" },
    { v: "analyze", icon: ShieldCheck, label: "Analyze" },
    { v: "history", icon: Clock, label: "History" },
  ];

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-4 py-10">
      <header className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary text-2xl">🔐</div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">UltraPass</h1>
            <p className="text-xs text-muted-foreground">Secure password toolkit · 100% in your browser</p>
          </div>
        </div>
        <ThemeToggle />
      </header>

      <Tabs defaultValue="password">
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1">
          {tabs.map((t) => (
            <TabsTrigger key={t.v} value={t.v} className="gap-1.5">
              <t.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{t.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="mt-6">
          <TabsContent value="password">
            <PasswordTab onGenerated={addHistory} />
          </TabsContent>
          <TabsContent value="passphrase">
            <PassphraseTab onGenerated={addHistory} />
          </TabsContent>
          <TabsContent value="pin">
            <PinTab onGenerated={addHistory} />
          </TabsContent>
          <TabsContent value="bulk">
            <BulkTab />
          </TabsContent>
          <TabsContent value="hash">
            <HashTab />
          </TabsContent>
          <TabsContent value="analyze">
            <AnalyzeTab />
          </TabsContent>
          <TabsContent value="history">
            <HistoryTab history={history} onClear={() => setHistory([])} />
          </TabsContent>
        </div>
      </Tabs>

      <footer className="mt-12 flex items-center justify-between border-t pt-6 text-xs text-muted-foreground">
        <span className="text-green-500">● Runs entirely offline — no data leaves your device</span>
        <a
          href="https://github.com/ian-louw/password-generator"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-foreground"
        >
          GitHub
        </a>
      </footer>
    </main>
  );
}
