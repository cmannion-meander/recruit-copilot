import { cn } from "@/lib/utils";

/* A state, drawn as a shape and a word.
 *
 * Colour is never the only signal, so this always renders both: a mark whose form
 * differs between states, and the state written out. Take the colour away and it still
 * reads. That is not a nicety — a stage column that only differs by hue is unusable to
 * a reader with a colour vision deficiency, and it prints as five identical greys.
 *
 * There is no tone that means "bad". Nothing in this product ranks a person, so nothing
 * in this component turns a state into a verdict.
 */
export type MarkerShape = "filled" | "outlined" | "dotted" | "rule";
export type MarkerTone = "ink" | "evidenced" | "open";

const SHAPE: Record<MarkerShape, string> = {
  filled: "size-3",
  outlined: "size-3 border-2 bg-transparent",
  dotted: "size-3 border border-dotted bg-transparent",
  rule: "h-0.5 w-4",
};

const TONE: Record<MarkerTone, { mark: string; text: string }> = {
  ink: { mark: "bg-ink border-ink", text: "text-ink-secondary" },
  evidenced: { mark: "bg-evidenced border-evidenced", text: "text-evidenced" },
  open: { mark: "bg-open border-open", text: "text-open" },
};

export function StateMarker({
  label,
  shape = "filled",
  tone = "ink",
  className,
}: {
  label: string;
  shape?: MarkerShape;
  tone?: MarkerTone;
  className?: string;
}) {
  const palette = TONE[tone];
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span
        aria-hidden="true"
        className={cn(
          SHAPE[shape],
          palette.mark,
          shape === "outlined" || shape === "dotted" ? "bg-transparent" : "",
        )}
      />
      <span className={cn("rc-label", palette.text)}>{label}</span>
    </span>
  );
}
