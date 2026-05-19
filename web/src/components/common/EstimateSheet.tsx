import { formatDistance, formatDuration } from "../../lib/units";
import { Button, Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "../ui";
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
    <Sheet open modal={false} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        showOverlay={false}
        className="inset-x-3 inset-y-auto bottom-3 top-auto z-[1000] max-h-[58%] w-auto overflow-y-auto rounded-lg border p-4 sm:inset-x-auto sm:bottom-4 sm:right-4 sm:top-20 sm:w-80 sm:max-w-none"
      >
        <SheetHeader className="pr-7">
          <SheetTitle className="truncate text-base">{target?.name || "Estimate target"}</SheetTitle>
          <SheetDescription className="line-clamp-2 text-xs">
            {target?.address || "Selected map point"}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-3">
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
                    <div
                      key={participant.participantName}
                      className="rounded-md border border-border bg-card px-3 py-2 text-sm shadow-sm"
                    >
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
              <Button type="button" variant="outline" className="w-full" onClick={onClose}>
                Close
              </Button>
            </div>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function StatusMessage({ message }: { message: string }) {
  return <div className="rounded-md border border-border bg-muted px-3 py-2 text-sm text-muted-foreground">{message}</div>;
}

function ErrorMessage({ message }: { message: string }) {
  return <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{message}</div>;
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-secondary/60 px-3 py-2 text-sm">
      <div className="font-medium">{label}</div>
      <div className="text-muted-foreground">{value}</div>
    </div>
  );
}
