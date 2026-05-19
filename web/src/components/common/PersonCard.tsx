import { Button } from "../ui";
import { X } from "lucide-react";
import type { Participant } from "./types";

export function PersonCard({
  participant,
  label,
  active,
  onSelect,
  onRemove,
}: {
  participant: Participant;
  label: string;
  active: boolean;
  onSelect: () => void;
  onRemove: () => void;
}) {
  const locationLabel = participant.location.address || participant.location.name || "Pinned location";

  return (
    <article
      className={`border px-2 py-2 text-sm transition-colors ${
        active ? "border-primary bg-primary/5" : "border-border bg-transparent hover:border-primary/40"
      }`}
      onClick={onSelect}
    >
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2">
        <span
          className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold text-white"
          style={{ backgroundColor: participant.color }}
        >
          {label}
        </span>
        <button type="button" className="block min-w-0 truncate text-left text-muted-foreground hover:text-foreground" onClick={onSelect}>
          {locationLabel}
        </button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={(event) => {
            event.stopPropagation();
            onRemove();
          }}
          aria-label={`Remove location ${label}`}
          title="Remove location"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </article>
  );
}
