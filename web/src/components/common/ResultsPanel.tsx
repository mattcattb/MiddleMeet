import { formatDuration } from "../../lib/units";
import type { DestinationCandidate } from "./types";

export function ResultsPanel({
  results,
  selectedCandidateId,
  onDestinationSelect,
}: {
  results: DestinationCandidate[];
  selectedCandidateId: string | null;
  onDestinationSelect: (candidate: DestinationCandidate) => void;
}) {
  if (results.length === 0) {
    return null;
  }

  return (
    <section className="space-y-2 border-t border-border pt-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">Results</div>
        <div className="text-xs text-muted-foreground">{results.length} places</div>
      </div>
      <div className="max-h-80 space-y-2 overflow-y-auto">
        {results.map((candidate) => {
          const id = candidateKey(candidate);
          const active = id === selectedCandidateId;
          return (
            <button
              key={id}
              type="button"
              className={`w-full border px-3 py-2 text-left text-sm hover:border-accent hover:bg-accent/10 ${
                active ? "border-accent bg-accent/10 shadow-[inset_3px_0_0_hsl(var(--accent))]" : "border-border bg-muted"
              }`}
              onClick={() => onDestinationSelect(candidate)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate font-medium">{candidate.location.name || "Unnamed destination"}</div>
                  <div className="line-clamp-2 text-muted-foreground">{candidate.location.address}</div>
                </div>
                <div className="shrink-0 text-right text-xs text-muted-foreground">
                  <div>{formatDuration(candidate.estimate.averageDurationSeconds)}</div>
                  <div>spread {formatDuration(candidate.estimate.durationSpreadSeconds)}</div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export function candidateKey(candidate: DestinationCandidate) {
  return `${candidate.location.coord.lat}-${candidate.location.coord.lng}-${candidate.location.address}`;
}
