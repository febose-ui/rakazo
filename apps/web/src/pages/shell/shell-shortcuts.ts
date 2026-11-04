import type { DesktopMenuCommand } from "@rakazo/contracts";
import { isDesktopMenuCommand } from "@rakazo/contracts";
import { useEffect, useRef } from "react";
import { desktopBridge } from "../../lib/desktop";

export type ShellShortcut =
  | { type: DesktopMenuCommand }
  | { type: "bot"; index: number }
  | { type: "new-group" }
  | { type: "shortcuts-help" }
  | { type: "find-in-chat" }
  | { type: "focus-prompt" }
  | { type: "add-selected-text" }
  | { type: "connect-apps" }
  | { type: "bot-settings" }
  | { type: "conversation-details" }
  | { type: "send" };

/**
 * Browsers keep Cmd+F, Cmd+L, Cmd+Shift+N, Cmd+Shift+W, Cmd+1–9 and their
 * history chords, so those only reach the desktop app. Apple keyboards use Cmd
 * alone for the newer chords, since Ctrl+B and Ctrl+F move the caret there.
 */
export type ShortcutHost = { desktop: boolean; apple: boolean };

export function isApplePlatform() {
  if (typeof navigator === "undefined") return false;
  // platform is deprecated but still the most reliable Apple check in browsers.
  return /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent);
}

export function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT"
  );
}

/**
 * The shell shortcut a key press asks for. From the desktop
 * keyboard-shortcut list: Cmd/Ctrl+K palette, Cmd/Ctrl+N new bot,
 * Cmd/Ctrl+Shift+N new group, Cmd/Ctrl+/ shortcuts help, desktop Cmd+F find
 * in chat (with Shift it searches bots), Cmd/Ctrl+B compact sidebar, desktop
 * Cmd+I focus the prompt, desktop Cmd+L add selected text, desktop sidebar
 * bots 1–9, Alt+Up/Down and the cycle keys step through bots, Cmd+[ / ]
 * visit history, desktop Cmd/Ctrl+Shift+M or W connect apps, Cmd/Ctrl+Shift+,
 * toggles bot settings, Cmd+Shift+I or Cmd+Alt+B on Apple keyboards
 * (Ctrl+Alt+B elsewhere) opens conversation details, and desktop
 * Cmd/Ctrl+Enter sends from anywhere. Next and previous bot are Ctrl+Tab in
 * the desktop app and Cmd/Ctrl+Shift+ArrowDown/Up in a browser, which owns
 * Ctrl+Tab; arrows rather than brackets because Safari claims Cmd+Shift+]
 * and Cmd+Shift+[ for its own tabs, and not while typing, where they select.
 */
export function shellShortcut(event: KeyboardEvent, host: ShortcutHost): ShellShortcut | null {
  if (event.repeat || !event.key) return null;
  const key = event.key.toLowerCase();
  if ((event.metaKey || event.ctrlKey) && !event.altKey && !event.shiftKey) {
    if (key === "k") return { type: "command-menu" };
    if (key === "n") return { type: "new" };
    if (key === "/") return { type: "shortcuts-help" };
  }
  const primary = host.apple ? event.metaKey && !event.ctrlKey : event.ctrlKey && !event.metaKey;
  if (primary && !event.altKey && !event.shiftKey) {
    if (key === "b") return { type: "toggle-sidebar" };
    if (host.desktop && /^[1-9]$/.test(key)) return { type: "bot", index: Number(key) - 1 };
    if (host.desktop && host.apple && (key === "[" || key === "]")) {
      return { type: key === "[" ? "back" : "forward" };
    }
  }
  // Cmd/Ctrl+F is the browser's find, so only the desktop app rebinds it: with
  // Shift it searches bots, without it it finds in the open chat.
  if (host.desktop && primary && !event.altKey && key === "f") {
    return event.shiftKey ? { type: "search" } : { type: "find-in-chat" };
  }
  if (host.desktop && primary && !event.altKey && !event.shiftKey) {
    if (key === "i") return { type: "focus-prompt" };
    if (key === "l") return { type: "add-selected-text" };
  }
  // Unclaimed on every keyboard, so it reaches a browser too.
  if ((event.metaKey || event.ctrlKey) && event.shiftKey && !event.altKey && key === ",") {
    return { type: "bot-settings" };
  }
  if (host.desktop && (event.metaKey || event.ctrlKey) && event.shiftKey && !event.altKey) {
    if (key === "n") return { type: "new-group" };
    if (key === "m" || key === "w") return { type: "connect-apps" };
    if (host.apple && key === "i") return { type: "conversation-details" };
  }
  // The second details chord trades Cmd for Alt, which lets a plain browser
  // keep its own native chords; it is documented per keyboard layout.
  if (primary && event.altKey && !event.shiftKey && key === "b" && (host.desktop || !host.apple)) {
    return { type: "conversation-details" };
  }
  if (
    event.altKey &&
    !event.ctrlKey &&
    !event.metaKey &&
    !event.shiftKey &&
    (event.key === "ArrowDown" || event.key === "ArrowUp") &&
    !isEditableTarget(event.target)
  ) {
    return { type: event.key === "ArrowDown" ? "next-bot" : "previous-bot" };
  }
  if (event.key === "Tab" && event.ctrlKey && !event.metaKey && !event.altKey) {
    return { type: event.shiftKey ? "previous-bot" : "next-bot" };
  }
  if (
    (event.metaKey || event.ctrlKey) &&
    event.shiftKey &&
    !event.altKey &&
    (event.key === "ArrowDown" || event.key === "ArrowUp") &&
    !isEditableTarget(event.target)
  ) {
    return { type: event.key === "ArrowDown" ? "next-bot" : "previous-bot" };
  }
  if (
    host.desktop &&
    !host.apple &&
    event.altKey &&
    !event.ctrlKey &&
    !event.metaKey &&
    !event.shiftKey &&
    (event.key === "ArrowLeft" || event.key === "ArrowRight")
  ) {
    return { type: event.key === "ArrowLeft" ? "back" : "forward" };
  }
  if (host.desktop && event.key === "Enter" && (event.metaKey || event.ctrlKey) && !event.altKey) {
    return { type: "send" };
  }
  return null;
}

/** A printable key pressed outside any text field, which belongs in the composer. */
export function startsTyping(event: KeyboardEvent) {
  return (
    event.key?.length === 1 &&
    event.key !== " " &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.altKey &&
    !event.isComposing &&
    !isEditableTarget(event.target)
  );
}

/** The next id in roster order, wrapping at both ends. */
export function cycleBotId(
  bots: readonly { id: string }[],
  activeId: string | undefined,
  step: 1 | -1,
) {
  if (bots.length === 0) return undefined;
  const index = activeId === undefined ? -1 : bots.findIndex((bot) => bot.id === activeId);
  const next =
    index === -1 ? (step === 1 ? 0 : bots.length - 1) : (index + step + bots.length) % bots.length;
  return bots[next]?.id;
}

/**
 * Every shell-wide shortcut, from the keyboard and from the desktop app's menu. The page handles the
 * chords itself because the desktop app can show a server's own page, older or newer than its menu.
 * `run` answers whether the shortcut applied, so one that does not keeps the key's default.
 */
export function useShellShortcuts({
  run,
  onTyping,
}: {
  run: (shortcut: ShellShortcut) => boolean;
  onTyping: () => void;
}) {
  const handlers = useRef({ run, onTyping });
  handlers.current = { run, onTyping };
  useEffect(() => {
    const desktop = desktopBridge();
    const host: ShortcutHost = { desktop: Boolean(desktop), apple: isApplePlatform() };
    function onKey(event: KeyboardEvent) {
      if (event.defaultPrevented) return;
      const shortcut = shellShortcut(event, host);
      if (shortcut) {
        if (handlers.current.run(shortcut)) event.preventDefault();
      } else if (startsTyping(event)) {
        handlers.current.onTyping();
      }
    }
    window.addEventListener("keydown", onKey);
    const stopMenu = desktop?.menu?.onCommand((command) => {
      if (isDesktopMenuCommand(command)) handlers.current.run({ type: command });
    });
    return () => {
      window.removeEventListener("keydown", onKey);
      stopMenu?.();
    };
  }, []);
}
