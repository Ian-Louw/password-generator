import { toast } from "sonner";

const CLEAR_SECONDS = 20;

/**
 * Copy text to the clipboard and schedule an auto-clear. Browser clipboard can
 * only be cleared while the document is focused, so this is best-effort — but it
 * meaningfully reduces how long a secret lingers.
 */
export async function copyText(text: string, label = "Copied to clipboard") {
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    toast.success(`${label} · clears in ${CLEAR_SECONDS}s`);
    window.setTimeout(async () => {
      try {
        const current = await navigator.clipboard.readText();
        if (current === text) await navigator.clipboard.writeText("");
      } catch {
        /* reading the clipboard may be denied; ignore */
      }
    }, CLEAR_SECONDS * 1000);
  } catch {
    toast.error("Couldn't access the clipboard");
  }
}
