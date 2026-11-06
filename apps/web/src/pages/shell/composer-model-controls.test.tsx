// @vitest-environment jsdom
import type { Bot, ModelCatalogEntry, ThinkingLevel } from "@rakazo/contracts";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { act } from "react";
import type { Root } from "react-dom/client";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ComposerModelControls } from "./composer-model-controls";

const data = vi.hoisted(() => ({
  catalog: [] as ModelCatalogEntry[],
}));

vi.mock("../../lib/query", () => ({
  useSpaceQueries: () => ({
    models: {
      list: { queryOptions: () => ({ queryKey: ["catalog"], queryFn: () => data.catalog }) },
      credentials: { queryOptions: () => ({ queryKey: ["credentials"], queryFn: () => [] }) },
    },
    me: {
      queryOptions: () => ({
        queryKey: ["me"],
        queryFn: () => ({ defaultProvider: "acme", defaultModel: "acme-1" }),
      }),
    },
  }),
}));
vi.mock("@lingui/react/macro", () => ({
  Trans: ({ children }: { children: ReactNode }) => children,
}));

let root: Root | undefined;
let container: HTMLDivElement | undefined;

afterEach(() => {
  act(() => root?.unmount());
  container?.remove();
  root = undefined;
});

async function renderControls(
  thinkingLevels: ThinkingLevel[] | undefined,
  botLevel: ThinkingLevel | null,
) {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  act(() => root?.unmount());
  container?.remove();
  data.catalog = [
    { provider: "acme", id: "acme-1", label: "Acme One", billing: "usage", thinkingLevels },
  ];
  const onOpenModel = vi.fn();
  const onThinkingChange = vi.fn(async () => undefined);
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const bot = { id: "bot-1", modelProvider: null, modelId: null, thinkingLevel: botLevel } as Bot;
  await act(async () => {
    root?.render(
      <QueryClientProvider client={client}>
        <ComposerModelControls
          bot={bot}
          onOpenModel={onOpenModel}
          onThinkingChange={onThinkingChange}
        />
      </QueryClientProvider>,
    );
  });
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
  const buttons = [...(container.querySelectorAll("button") ?? [])];
  return {
    think: buttons.find((button) => button.textContent === "Thinking"),
    model: buttons.find((button) => button.textContent === "Acme One"),
    onOpenModel,
    onThinkingChange,
  };
}

describe("ComposerModelControls", () => {
  it("turns Think on at high, and opens the model setting from the model's name", async () => {
    const view = await renderControls(["off", "low", "medium", "high"], null);
    expect(view.think?.getAttribute("aria-pressed")).toBe("false");
    await act(async () => view.think?.click());
    expect(view.onThinkingChange).toHaveBeenCalledWith("high");
    act(() => view.model?.click());
    expect(view.onOpenModel).toHaveBeenCalledTimes(1);
  });

  it("returns the chat to its usual effort when Think is turned off", async () => {
    const view = await renderControls(["low", "medium", "high", "xhigh"], "xhigh");
    expect(view.think?.getAttribute("aria-pressed")).toBe("true");
    await act(async () => view.think?.click());
    expect(view.onThinkingChange).toHaveBeenCalledWith(null);
  });

  it("uses the deepest level a model has when it stops short of high", async () => {
    const view = await renderControls(["low", "medium"], "medium");
    expect(view.think?.getAttribute("aria-pressed")).toBe("true");
    const off = await renderControls(["low", "medium"], null);
    await act(async () => off.think?.click());
    expect(off.onThinkingChange).toHaveBeenCalledWith("medium");
  });

  it("shows only the model's name when it cannot think harder", async () => {
    const view = await renderControls(undefined, null);
    expect(view.think).toBeUndefined();
    expect(view.model).toBeDefined();
  });
});
