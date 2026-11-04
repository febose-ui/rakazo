import { afterEach, describe, expect, it, vi } from "vitest";
import { dispatchComposerCommand, registerComposer } from "./composer-commands";

describe("composer command dispatch", () => {
  afterEach(() => {
    // A stray registration from an unfinished test must not leak into the next one.
    registerComposer({
      send: () => {},
      addText: () => {},
      focusPrompt: () => {},
    })();
  });

  it("reports there is no composer to command before one registers", () => {
    expect(dispatchComposerCommand({ kind: "focus-prompt" })).toBe(false);
  });

  it("routes each command kind to the registered composer", () => {
    const send = vi.fn();
    const addText = vi.fn();
    const focusPrompt = vi.fn();
    const unregister = registerComposer({ send, addText, focusPrompt });
    expect(dispatchComposerCommand({ kind: "send" })).toBe(true);
    expect(dispatchComposerCommand({ kind: "add-text", text: "note" })).toBe(true);
    expect(dispatchComposerCommand({ kind: "focus-prompt" })).toBe(true);
    expect(send).toHaveBeenCalledTimes(1);
    expect(addText).toHaveBeenCalledWith("note");
    expect(focusPrompt).toHaveBeenCalledTimes(1);
    unregister();
  });

  it("restores the previous composer on unregister", () => {
    const first = { send: vi.fn(), addText: vi.fn(), focusPrompt: vi.fn() };
    const second = { send: vi.fn(), addText: vi.fn(), focusPrompt: vi.fn() };
    const unregisterFirst = registerComposer(first);
    registerComposer(second)();
    dispatchComposerCommand({ kind: "send" });
    expect(second.send).not.toHaveBeenCalled();
    expect(first.send).toHaveBeenCalledTimes(1);
    unregisterFirst();
  });
});
