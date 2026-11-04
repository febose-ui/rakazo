import { useEffect, useRef } from "react";

/**
 * Shell-level imperative composer commands: keyboard shortcuts that send,
 * focus or add selected text without the composer owning the chord itself.
 * The shell renders one Composer per shell mount, so the registry holds the
 * single live instance and the shell dispatches to it.
 */
export type ComposerCommand =
  | { kind: "send" }
  | { kind: "add-text"; text: string }
  | { kind: "focus-prompt" };

export type ComposerController = {
  send: () => void;
  addText: (text: string) => void;
  focusPrompt: () => void;
};

let current: ComposerController | null = null;

/** Register the mounted composer; returns its unregister function. */
export function registerComposer(controller: ComposerController) {
  const previous = current;
  current = controller;
  return () => {
    if (current === controller) current = previous;
  };
}

/** Run a command on the registered composer, or report there is none. */
export function dispatchComposerCommand(command: ComposerCommand): boolean {
  if (!current) return false;
  if (command.kind === "send") current.send();
  else if (command.kind === "focus-prompt") current.focusPrompt();
  else current.addText(command.text);
  return true;
}

/** Keep the mounted composer commandable for the shell's lifetime. */
export function useComposerCommands(controller: ComposerController) {
  const handlers = useRef(controller);
  handlers.current = controller;
  const stable = useRef<ComposerController>({
    send: () => handlers.current.send(),
    addText: (text) => handlers.current.addText(text),
    focusPrompt: () => handlers.current.focusPrompt(),
  });
  useEffect(() => registerComposer(stable.current), []);
}
