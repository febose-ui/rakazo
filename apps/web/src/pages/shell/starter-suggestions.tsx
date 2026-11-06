import { useLingui } from "@lingui/react/macro";

/** Starting points under an empty chat's composer; picking one puts it in the draft to finish. */
export function StarterSuggestions({ onPick }: { onPick: (text: string) => void }) {
  const { t } = useLingui();
  const starters = [
    t`Plan my week`,
    t`Summarize a web page`,
    t`Draft an email`,
    t`Explain a topic simply`,
  ];
  return (
    <div
      data-testid="starter-suggestions"
      className="pointer-events-auto mt-4 flex flex-wrap justify-center gap-2 px-3 md:px-[max(1.5rem,calc((100%_-_48rem)/2))]"
    >
      {starters.map((text) => (
        <button
          key={text}
          type="button"
          onClick={() => onPick(text)}
          className="rounded-full border border-border bg-muted/60 px-4 py-2 text-sm text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
        >
          {text}
        </button>
      ))}
    </div>
  );
}
