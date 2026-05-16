import { LocationSearch } from "./LocationSearch";
import { PersonCard } from "./PersonCard";
import type { ActiveTarget, Location, Participant } from "./types";

export function PeoplePanel({
  activeTarget,
  participants,
  searchCenter,
  onActiveTargetChange,
  onParticipantAdd,
  onParticipantRemove,
}: {
  activeTarget: ActiveTarget;
  participants: Participant[];
  searchCenter: Location["coord"];
  onActiveTargetChange: (target: ActiveTarget) => void;
  onParticipantAdd: (location: Location) => void;
  onParticipantRemove: (participantId: string) => void;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">Locations</div>
      </div>

      <div className="space-y-2">
        {participants.length === 0 ? (
          <div className="border border-dashed border-border bg-muted/50 px-3 py-3 text-sm text-muted-foreground">
            Add a location, then find or estimate meetup options.
          </div>
        ) : null}

        {participants.map((participant, index) => (
          <PersonCard
            key={participant.id}
            participant={participant}
            label={personLetter(index)}
            active={activeTarget.type === "participant" && activeTarget.id === participant.id}
            onSelect={() => onActiveTargetChange({ type: "participant", id: participant.id })}
            onRemove={() => onParticipantRemove(participant.id)}
          />
        ))}

        <div className="grid grid-cols-[auto_1fr] items-center gap-2 border border-dashed border-border bg-background px-2 py-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-success text-xs font-semibold text-white">
            {personLetter(participants.length)}
          </span>
          <LocationSearch
            key={participants.length}
            searchCenter={searchCenter}
            placeholder="Enter new location"
            className="min-w-0"
            allowCurrentLocation
            onLocationSelect={onParticipantAdd}
          />
        </div>
      </div>
    </section>
  );
}

function personLetter(index: number) {
  return String.fromCharCode(65 + (index % 26));
}
