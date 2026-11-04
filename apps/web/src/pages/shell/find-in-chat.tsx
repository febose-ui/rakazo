import { useLingui } from "@lingui/react/macro";
import { Button } from "@rakazo/ui-web";
import { X } from "lucide-react";
import { useEffect, useRef } from "react";

type FindableWindow = Window & {
  /** Chromium's own find: reuses scrolling and selection instead of re-walking the transcript. */
  find?: (
    text: string,
    caseSensitive?: boolean,
    backwards?: boolean,
    wrapAround?: boolean,
    wholeWord?: boolean,
    searchInFrames?: boolean,
    showDialog?: boolean,
  ) => boolean;
};

/**
 * The find bar above the open transcript. Enter jumps to the next match and
 * wraps around; a new query restarts from the top of the chat. Escape closes
 * from anywhere while the bar is open.
 */
export function FindBar({ onClose }: { onClose: () => void }) {
  const { t } = useLingui();
  const inputRef = useRef<HTMLInputElement>(null);
  const query = useRef("");

  useEffect(() => {
    const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 0);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  function search(event: React.FormEvent) {
    event.preventDefault();
    const value = inputRef.current?.value ?? "";
    const win = window as FindableWindow;
    if (!value || !win.find) return;
    // A changed query restarts from the top; repeating Enter keeps walking.
    if (value !== query.current) {
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.collapse(document.body, 0);
      query.current = value;
    }
    win.find(value, false, false, true);
  }

  return (
    <search>
      <form
        onSubmit={search}
        className="z-10 mx-auto mt-2 flex w-min items-center gap-1 rounded-md border bg-card py-1 pl-2.5 pr-1 shadow-lg"
      >
        <input
          ref={inputRef}
          type="text"
          aria-label={t`Find in this chat`}
          placeholder={t`Find in this chat`}
          className="w-44 bg-transparent text-[13px] outline-none placeholder:text-muted-foreground"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={t`Close find bar`}
          onClick={onClose}
        >
          <X size={14} strokeWidth={1.8} />
        </Button>
      </form>
    </search>
  );
}
