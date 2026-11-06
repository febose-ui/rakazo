// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
import { StarterSuggestions } from "./starter-suggestions";

vi.mock("@lingui/react/macro", () => ({
  useLingui: () => ({
    t: (strings: TemplateStringsArray, ...values: unknown[]) =>
      strings.reduce((text, part, index) => `${text}${values[index - 1] ?? ""}${part}`),
  }),
}));

it("hands the picked starter's words to the composer", () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  const onPick = vi.fn();
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => root.render(<StarterSuggestions onPick={onPick} />));
  const buttons = [...container.querySelectorAll("button")];
  expect(buttons.map((button) => button.textContent)).toEqual([
    "Plan my week",
    "Summarize a web page",
    "Draft an email",
    "Explain a topic simply",
  ]);
  act(() => buttons[2]?.click());
  expect(onPick).toHaveBeenCalledWith("Draft an email");
  act(() => root.unmount());
  container.remove();
});
