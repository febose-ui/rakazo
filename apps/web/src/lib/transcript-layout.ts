export const TRANSCRIPT_CONTENT_PADDING = "px-4 md:px-[max(1.75rem,calc((100%_-_48rem)/2))]";

const CODE_FENCE = /^ {0,3}(?:```|~~~)/m;

/** A reply with a fenced code block takes the full reading column so the code card does too. */
export function hasCodeFence(text: string) {
  return CODE_FENCE.test(text);
}
