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

        <div className="grid grid-cols-[auto_1fr] items-center gap-2 border border-border bg-background px-3 transition-colors focus-within:border-primary hover:border-primary/70">
          <span className="flex h-7 w-7 items-center justify-center text-lg leading-none text-muted-foreground">
            +
          </span>
          <LocationSearch
            key={participants.length}
            searchCenter={searchCenter}
            placeholder="Enter new location"
            className="min-w-0"
            inputClassName="border-0 bg-transparent px-0 text-muted-foreground placeholder:text-muted-foreground focus:border-0"
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
