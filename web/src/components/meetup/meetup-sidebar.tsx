import { Button } from "../ui";
import { formatDistance, formatDuration } from "../../lib/units";
import type { ActiveTarget, Location, MeetingEstimate, MeetingRoutes, Participant } from "./types";
import { activeTargetLabel, destinationColor } from "./types";

export function MeetupSidebar({
  activeTarget,
  participants,
  destination,
  locationQuery,
  locationResults,
  apiMessage,
  apiError,
  searchError,
  estimateError,
  routesError,
  estimate,
  routes,
  canEstimate,
  searching,
  estimating,
  loadingRoutes,
  onActiveTargetChange,
  onLocationQueryChange,
  onSearch,
  onLocationSelect,
  onEstimate,
  onParticipantAdd,
  onParticipantRemove,
  onParticipantNameChange,
}: {
  activeTarget: ActiveTarget;
  participants: Participant[];
  destination: Location | null;
  locationQuery: string;
  locationResults: Location[];
  apiMessage: string | undefined;
  apiError: string | undefined;
  searchError: string | undefined;
  estimateError: string | undefined;
  routesError: string | undefined;
  estimate: MeetingEstimate | undefined;
  routes: MeetingRoutes | undefined;
  canEstimate: boolean;
  searching: boolean;
  estimating: boolean;
  loadingRoutes: boolean;
  onActiveTargetChange: (target: ActiveTarget) => void;
  onLocationQueryChange: (query: string) => void;
  onSearch: () => void;
  onLocationSelect: (point: Location) => void;
  onEstimate: () => void;
  onParticipantAdd: () => void;
  onParticipantRemove: (participantId: string) => void;
  onParticipantNameChange: (participantId: string, name: string) => void;
}) {
  return (
    <aside className="border-b border-border bg-surface-elevated lg:h-screen lg:overflow-y-auto lg:border-b-0 lg:border-r">
      <div className="space-y-5 p-5">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Middle Meetup</h2>
          <div className="border border-border bg-muted px-3 py-2 text-sm">
            {apiMessage}
            {apiError}
          </div>
        </div>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">People</div>
            <Button type="button" size="sm" variant="outline" onClick={onParticipantAdd}>
              Add
            </Button>
          </div>

          <div className="space-y-2">
            {participants.map((participant) => (
              <ParticipantRow
                key={participant.id}
                participant={participant}
                active={activeTarget.type === "participant" && activeTarget.id === participant.id}
                canRemove={participants.length > 1}
                onSelect={() => onActiveTargetChange({ type: "participant", id: participant.id })}
                onRemove={() => onParticipantRemove(participant.id)}
                onNameChange={(name) => onParticipantNameChange(participant.id, name)}
              />
            ))}
          </div>
        </section>

        <section className="space-y-2">
          <button
            type="button"
            className={`w-full border px-3 py-2 text-left text-sm ${
              activeTarget.type === "destination" ? "border-primary bg-primary/10" : "border-border bg-muted"
            }`}
            onClick={() => onActiveTargetChange({ type: "destination" })}
          >
            <div className="flex items-center gap-2 font-medium">
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: destinationColor }} />
              Destination
            </div>
            <div className="text-muted-foreground">
              {destination ? `${destination.coord.lat.toFixed(5)}, ${destination.coord.lng.toFixed(5)}` : "Not set"}
            </div>
          </button>
        </section>

        <section className="space-y-2 border-t border-border pt-4">
          <div className="text-sm font-medium">Find {activeTargetLabel(activeTarget, participants)}</div>
          <input
            className="h-10 w-full border border-border bg-background px-3 text-sm outline-none focus:border-primary"
            value={locationQuery}
            onChange={(event) => onLocationQueryChange(event.target.value)}
            placeholder="Search address or place"
          />
          <Button type="button" size="sm" variant="outline" className="w-full" onClick={onSearch} disabled={searching}>
            {searching ? "Searching..." : "Search nearby"}
          </Button>
          {searchError ? <ErrorMessage message={searchError} /> : null}
          {locationResults.length > 0 ? (
            <div className="max-h-52 space-y-2 overflow-y-auto">
              {locationResults.map((point) => (
                <button
                  key={`${point.coord.lat}-${point.coord.lng}-${point.address}`}
                  type="button"
                  className="w-full border border-border bg-muted px-3 py-2 text-left text-sm hover:border-primary hover:bg-primary/10"
                  onClick={() => onLocationSelect(point)}
                >
                  <div className="font-medium">{point.name || "Unnamed location"}</div>
                  <div className="text-muted-foreground">{point.address}</div>
                </button>
              ))}
            </div>
          ) : null}
        </section>

        <Button type="button" className="w-full" onClick={onEstimate} disabled={!canEstimate || estimating || loadingRoutes}>
          {estimating ? "Estimating..." : loadingRoutes ? "Loading routes..." : "Estimate meetup"}
        </Button>

        {estimateError ? <ErrorMessage message={estimateError} /> : null}
        {routesError ? <ErrorMessage message={routesError} /> : null}
        {estimate ? <EstimateSummary estimate={estimate} routes={routes} /> : null}
      </div>
    </aside>
  );
}

function ParticipantRow({
  participant,
  active,
  canRemove,
  onSelect,
  onRemove,
  onNameChange,
}: {
  participant: Participant;
  active: boolean;
  canRemove: boolean;
  onSelect: () => void;
  onRemove: () => void;
  onNameChange: (name: string) => void;
}) {
  return (
    <div className={`border px-3 py-2 text-sm ${active ? "border-primary bg-primary/10" : "border-border bg-muted"}`}>
      <div className="flex items-center gap-2">
        <button type="button" className="h-3 w-3 rounded-full" style={{ backgroundColor: participant.color }} onClick={onSelect} />
        <input
          className="min-w-0 flex-1 bg-transparent font-medium outline-none"
          value={participant.name}
          onChange={(event) => onNameChange(event.target.value)}
          onFocus={onSelect}
        />
        <Button type="button" size="sm" variant="ghost" onClick={onRemove} disabled={!canRemove}>
          Remove
        </Button>
      </div>
      <button type="button" className="mt-1 text-left text-muted-foreground" onClick={onSelect}>
        {participant.location.coord.lat.toFixed(5)}, {participant.location.coord.lng.toFixed(5)}
      </button>
    </div>
  );
}

function EstimateSummary({ estimate, routes }: { estimate: MeetingEstimate; routes: MeetingRoutes | undefined }) {
  return (
    <div className="space-y-3 border-t border-border pt-4">
      <div className="grid grid-cols-2 gap-2">
        <SummaryTile label="Average" value={formatDuration(estimate.averageDurationSeconds)} />
        <SummaryTile label="Spread" value={formatDuration(estimate.durationSpreadSeconds)} />
      </div>

      {estimate.participants.map((participant) => {
        const route = routes?.routes.find((item) => item.participantName === participant.participantName);
        return (
          <TripSummary
            key={participant.participantName}
            label={participant.participantName}
            distance={route?.route.distanceMeters ?? participant.distanceMeters}
            duration={route?.route.durationSeconds ?? participant.durationSeconds}
            detailed={Boolean(route)}
          />
        );
      })}
    </div>
  );
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-border bg-muted px-3 py-2 text-sm">
      <div className="font-medium">{label}</div>
      <div className="text-muted-foreground">{value}</div>
    </div>
  );
}

function TripSummary({ label, distance, duration, detailed }: { label: string; distance: number; duration: number; detailed: boolean }) {
  return (
    <div className="border border-border bg-muted px-3 py-2 text-sm">
      <div className="flex items-center justify-between gap-2">
        <div className="font-medium">{label}</div>
        <div className="text-xs text-muted-foreground">{detailed ? "route" : "estimate"}</div>
      </div>
      <div className="text-muted-foreground">
        {formatDistance(distance)} / {formatDuration(duration)}
      </div>
    </div>
  );
}

function ErrorMessage({ message }: { message: string }) {
  return <div className="border border-danger/50 bg-danger/15 px-3 py-2 text-sm text-danger">{message}</div>;
}
