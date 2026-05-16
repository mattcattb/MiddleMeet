import { formatDistance, formatDuration } from "../../lib/units";
import type { DestinationCandidate, Location, MeetingEstimate, MeetingRoutes } from "./types";

export function EstimateSheet({
  target,
  selectedCandidate,
  estimate,
  routes,
  estimating,
  loadingRoutes,
  estimateError,
  routesError,
  onClose,
}: {
  target: Location | null;
  selectedCandidate: DestinationCandidate | null;
  estimate: MeetingEstimate | undefined;
  routes: MeetingRoutes | undefined;
  estimating: boolean;
  loadingRoutes: boolean;
  estimateError: string | undefined;
  routesError: string | undefined;
  onClose: () => void;
}) {
  const detailEstimate = selectedCandidate?.estimate ?? estimate;

  if (!target && !detailEstimate && !estimateError && !routesError) {
    return null;
  }

  return (
    <section className="absolute inset-x-3 bottom-3 z-[1000] max-h-[58%] overflow-y-auto border border-border bg-surface-elevated p-3 shadow-2xl lg:inset-x-auto lg:bottom-4 lg:right-4 lg:top-20 lg:w-80">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold">{target?.name || "Estimate target"}</div>
          <div className="line-clamp-2 text-xs text-muted-foreground">{target?.address || "Selected map point"}</div>
        </div>
        <button
          type="button"
          className="h-8 border border-border bg-muted px-2 text-xs font-medium hover:border-primary hover:bg-primary/10"
          onClick={onClose}
        >
          Close
        </button>
      </div>

      {estimating ? <StatusMessage message="Estimating travel times..." /> : null}
      {loadingRoutes ? <StatusMessage message="Loading routes..." /> : null}
      {estimateError ? <ErrorMessage message={estimateError} /> : null}
      {routesError ? <ErrorMessage message={routesError} /> : null}

      {detailEstimate ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <SummaryTile label="Average" value={formatDuration(detailEstimate.averageDurationSeconds)} />
            <SummaryTile label="Spread" value={formatDuration(detailEstimate.durationSpreadSeconds)} />
          </div>
          <div className="space-y-2">
            {detailEstimate.participants.map((participant) => {
              const route = routes?.routes.find((item) => item.participantName === participant.participantName);
              return (
                <div key={participant.participantName} className="border border-border bg-muted px-3 py-2 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-medium">{participant.participantName}</div>
                    <div className="text-xs text-muted-foreground">{route ? "route" : "estimate"}</div>
                  </div>
                  <div className="text-muted-foreground">
                    {formatDistance(route?.route.distanceMeters ?? participant.distanceMeters)} /{" "}
                    {formatDuration(route?.route.durationSeconds ?? participant.durationSeconds)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function StatusMessage({ message }: { message: string }) {
  return <div className="mb-2 border border-border bg-muted px-3 py-2 text-sm text-muted-foreground">{message}</div>;
}

function ErrorMessage({ message }: { message: string }) {
  return <div className="mb-2 border border-danger/50 bg-danger/15 px-3 py-2 text-sm text-danger">{message}</div>;
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-border bg-muted px-3 py-2 text-sm">
      <div className="font-medium">{label}</div>
      <div className="text-muted-foreground">{value}</div>
    </div>
  );
}
