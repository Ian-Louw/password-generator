"use client";

import * as React from "react";
import QRCode from "qrcode";
import { Copy, Eye, EyeOff, QrCode, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { copyText } from "@/lib/clipboard";
import { cn } from "@/lib/utils";

export function SecretOutput({
  value,
  onRegenerate,
  big = false,
}: {
  value: string;
  onRegenerate?: () => void;
  big?: boolean;
}) {
  const [masked, setMasked] = React.useState(false);
  const [qrOpen, setQrOpen] = React.useState(false);
  const [qrData, setQrData] = React.useState<string>("");

  React.useEffect(() => {
    if (!qrOpen || !value) return;
    QRCode.toDataURL(value, { errorCorrectionLevel: "M", margin: 1, width: 240 })
      .then(setQrData)
      .catch(() => setQrData(""));
  }, [qrOpen, value]);

  return (
    <>
      <div className="flex items-center gap-2 rounded-lg border bg-muted/40 p-3">
        <span
          onClick={() => value && copyText(value)}
          title="Click to copy"
          className={cn(
            "flex-1 cursor-pointer break-all font-mono-pw",
            big ? "text-center text-2xl tracking-widest" : "text-base",
            masked && "text-security-disc",
          )}
        >
          {value || "—"}
        </span>
        <div className="flex shrink-0 gap-1">
          <Button variant="ghost" size="icon" title="Show / hide" onClick={() => setMasked((m) => !m)}>
            {masked ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" title="Show QR code" onClick={() => setQrOpen(true)}>
            <QrCode className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" title="Copy" onClick={() => copyText(value)}>
            <Copy className="h-4 w-4" />
          </Button>
          {onRegenerate && (
            <Button variant="ghost" size="icon" title="Regenerate" onClick={onRegenerate}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent className="items-center text-center">
          <DialogHeader>
            <DialogTitle>Scan to transfer</DialogTitle>
            <DialogDescription>
              Point your phone&apos;s camera at the code. Nothing leaves this device.
            </DialogDescription>
          </DialogHeader>
          {qrData ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qrData} alt="QR code" width={240} height={240} className="mx-auto rounded-md" />
          ) : (
            <div className="h-[240px] w-[240px]" />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
