import { Trans } from "@lingui/react/macro";
import type { Bot, ThinkingLevel } from "@rakazo/contracts";
import { resolveSelectableModelId } from "@rakazo/core";
import { useQuery } from "@tanstack/react-query";
import { Lightbulb } from "lucide-react";
import { useState } from "react";
import { deepThinkingLevel, effectiveChatModel, thinksDeeply } from "../../lib/bot-model";
import { useSpaceQueries } from "../../lib/query";

/**
 * The chat's model under the composer text: a Think toggle when the model can think harder,
 * and the model's name, which opens the bot's model setting.
 */
export function ComposerModelControls({
  bot,
  onOpenModel,
  onThinkingChange,
}: {
  bot: Bot;
  onOpenModel: () => void;
  onThinkingChange: (level: ThinkingLevel | null) => Promise<void>;
}) {
  const queries = useSpaceQueries();
  const catalog = useQuery(queries.models.list.queryOptions()).data;
  const credentials = useQuery(queries.models.credentials.queryOptions()).data;
  const me = useQuery(queries.me.queryOptions()).data;
  const [pending, setPending] = useState(false);
  if (!catalog || !credentials || !me) return null;

  const model = effectiveChatModel({
    selected:
      bot.modelProvider && bot.modelId
        ? {
            provider: bot.modelProvider,
            modelId: resolveSelectableModelId(catalog, bot.modelProvider, bot.modelId),
          }
        : null,
    defaultProvider: me.defaultProvider,
    defaultModel: me.defaultModel,
    catalog,
    credentials,
  });
  if (!model.label) return null;
  const deep = deepThinkingLevel(model.thinkingOptions);
  const thinking = thinksDeeply(bot.thinkingLevel, model.thinkingOptions);

  async function toggleThinking() {
    setPending(true);
    try {
      // Off returns the chat to its model's usual effort rather than switching thinking off.
      await onThinkingChange(thinking ? null : deep);
    } catch {
      // The pill keeps showing the saved level, so a failed save needs no message of its own.
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex min-w-0 items-center justify-between gap-2" data-testid="composer-model">
      {deep ? (
        <button
          type="button"
          aria-pressed={thinking}
          disabled={pending}
          onClick={() => void toggleThinking()}
          className={`inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-60 ${
            thinking
              ? "border-input bg-accent text-foreground"
              : "border-transparent text-muted-foreground hover:bg-accent hover:text-foreground"
          }`}
        >
          <Lightbulb aria-hidden size={14} strokeWidth={1.8} />
          <Trans>Thinking</Trans>
        </button>
      ) : (
        <span />
      )}
      <button
        type="button"
        title={model.label}
        onClick={onOpenModel}
        className="min-w-0 truncate rounded-full px-2 py-1 font-mono text-xs text-muted-foreground transition-colors duration-150 hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
      >
        {model.label}
      </button>
    </div>
  );
}
