import { LocationSearch } from "./LocationSearch";
import { PersonCard } from "./PersonCard";
import { Button } from "../ui";
import { MapPin, Plus } from "lucide-react";
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
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/12 text-primary">
          <MapPin className="h-4 w-4" />
        </span>
        <div className="text-sm font-semibold">Locations</div>
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

        <div className="grid grid-cols-[auto_1fr] items-center gap-2 border border-dashed border-primary/40 px-2 py-1.5 transition-colors focus-within:border-primary hover:border-primary/70">
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-primary" tabIndex={-1} aria-label="Add location">
            <Plus className="h-4 w-4" />
          </Button>
          <LocationSearch
            key={participants.length}
            searchCenter={searchCenter}
            placeholder={participants.length === 0 ? "Start with a location" : "Add another location"}
            className="min-w-0"
            inputClassName="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
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
