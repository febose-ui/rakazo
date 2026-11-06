import type { ModelCatalogEntry, ModelCredential, ThinkingLevel } from "@rakazo/contracts";
import { credentialForModel, resolveSelectableModelId } from "@rakazo/core";

/** The model a chat actually runs: its own choice, or the space default when it has none. */
export function effectiveChatModel({
  selected,
  defaultProvider,
  defaultModel,
  catalog,
  credentials,
}: {
  selected: { provider: string; modelId: string } | null;
  defaultProvider: string | null | undefined;
  defaultModel: string | null | undefined;
  catalog: readonly ModelCatalogEntry[];
  credentials: readonly ModelCredential[];
}) {
  const provider = selected?.provider ?? defaultProvider ?? null;
  const modelId = selected?.modelId ?? defaultModel ?? null;
  const entry =
    provider && modelId
      ? catalog.find(
          (candidate) =>
            candidate.provider === provider &&
            resolveSelectableModelId(catalog, candidate.provider, candidate.id) === modelId,
        )
      : undefined;
  const credential = credentialForModel(credentials, provider, modelId);
  const thinkingOptions: ThinkingLevel[] = (
    credential?.thinkingLevels ??
    entry?.thinkingLevels ??
    []
  ).filter((level) => level !== "off");
  return {
    provider,
    modelId,
    label: entry?.label ?? modelId,
    thinkingOptions,
    defaultThinkingLevel: credential?.thinkingLevel ?? "medium",
  };
}

const DEEP_THINKING: readonly ThinkingLevel[] = ["high", "xhigh", "max"];

/** The level Think turns on: high where the model offers it, else its deepest level. */
export function deepThinkingLevel(options: readonly ThinkingLevel[]): ThinkingLevel | null {
  if (options.includes("high")) return "high";
  return options.at(-1) ?? null;
}

/** Think reads as on when the chat asks for a deep level, or the deepest one its model has. */
export function thinksDeeply(
  level: ThinkingLevel | null | undefined,
  options: readonly ThinkingLevel[],
) {
  if (level == null) return false;
  return DEEP_THINKING.includes(level) || level === deepThinkingLevel(options);
}
