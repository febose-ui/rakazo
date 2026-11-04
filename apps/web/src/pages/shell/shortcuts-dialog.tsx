import { useLingui } from "@lingui/react/macro";
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle } from "@rakazo/ui-web";
import { X } from "lucide-react";
import { isApplePlatform } from "./shell-shortcuts";

type ShortcutRow = { label: string; keys: string[] };

/** Rows that share one modifier plus plain keys. */
function modRow(label: string, mod: string, keys: string[]): ShortcutRow {
  return { label, keys: keys.map((key) => `${mod} + ${key}`) };
}

/**
 * The desktop keyboard-shortcut list, as the shortcuts dialog. Rows stay
 * terse: the dialog shows what each chord does and nothing else.
 */
export function ShortcutsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useLingui();
  const apple = isApplePlatform();
  const mod = apple ? "⌘" : "Ctrl";
  const alt = apple ? "⌥" : "Alt";
  const rows: ShortcutRow[] = [
    modRow(t`Jump to / search palette`, mod, ["K"]),
    modRow(t`Search bots`, mod, ["Shift F"]),
    modRow(t`New bot`, mod, ["N"]),
    modRow(t`New group chat`, mod, ["Shift N"]),
    modRow(t`Show all keyboard shortcuts`, mod, ["/"]),
    modRow(t`Find in this chat`, mod, ["F"]),
    modRow(t`Compact sidebar`, mod, ["B"]),
    modRow(t`Focus prompt`, mod, ["I"]),
    modRow(t`Add selected text to chat`, mod, ["L"]),
    { label: t`Sidebar bots 1–9`, keys: [`${mod} + 1 … 9`] },
    { label: t`Previous / next bot`, keys: [`${alt} + ↑ / ↓`] },
    { label: t`Cycle bots`, keys: [`Ctrl + Tab / Shift Tab`] },
    modRow(t`Visit history`, mod, ["[ / ]"]),
    modRow(t`Connect apps`, mod, ["Shift M", "Shift W"]),
    modRow(t`Toggle bot settings`, mod, ["Shift ,"]),
    apple
      ? modRow(t`Conversation details`, mod, ["Shift I", `${alt} B`])
      : { label: t`Conversation details`, keys: ["Ctrl + Alt + B"] },
    { label: t`Send`, keys: ["Enter", `${mod} + Enter from anywhere`] },
    { label: t`New line`, keys: ["Shift + Enter"] },
    modRow(t`Dictate into the composer`, mod, ["D"]),
  ];
  return (
    <Dialog open onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="flex max-h-[80vh] w-[460px] flex-col gap-0">
        <DialogHeader>
          <DialogTitle>{t`Keyboard shortcuts`}</DialogTitle>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t`Close`}
            onClick={onClose}
            className="relative mr-1"
          >
            <X size={16} strokeWidth={1.8} />
          </Button>
        </DialogHeader>
        <div className="rk-scroll -mx-5 flex-1 overflow-y-auto px-5">
          <dl className="py-2">
            {rows.map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between gap-4 border-b py-2 last:border-b-0"
              >
                <dt className="text-[13px] text-foreground">{row.label}</dt>
                <dd className="flex flex-wrap items-center justify-end gap-1 text-right">
                  {row.keys.map((keys) => (
                    <kbd
                      key={keys}
                      className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground"
                    >
                      {keys}
                    </kbd>
                  ))}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </DialogContent>
    </Dialog>
  );
}
