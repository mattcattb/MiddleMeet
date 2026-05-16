import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Button } from "../ui";
import type { SortBy } from "./types";

export function MeetupSearchPanel({
  destinationQuery,
  maxDurationMinutes,
  searchRadiusMeters,
  sortBy,
  showMeetingArea,
  canSearchDestinations,
  canFindMidpoint,
  searchingDestinations,
  findingMidpoint,
  onDestinationQueryChange,
  onMaxDurationMinutesChange,
  onSearchRadiusMetersChange,
  onSortByChange,
  onShowMeetingAreaChange,
  onDestinationSearch,
  onFindMidpoint,
}: {
  destinationQuery: string;
  maxDurationMinutes: number;
  searchRadiusMeters: number;
  sortBy: SortBy;
  showMeetingArea: boolean;
  canSearchDestinations: boolean;
  canFindMidpoint: boolean;
  searchingDestinations: boolean;
  findingMidpoint: boolean;
  onDestinationQueryChange: (query: string) => void;
  onMaxDurationMinutesChange: (minutes: number) => void;
  onSearchRadiusMetersChange: (meters: number) => void;
  onSortByChange: (sortBy: SortBy) => void;
  onShowMeetingAreaChange: (show: boolean) => void;
  onDestinationSearch: () => void;
  onFindMidpoint: () => void;
}) {
  return (
    <section className="space-y-3 border-t border-border pt-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-medium">Find meetup spots</div>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="h-8 shrink-0 px-3"
          onClick={onFindMidpoint}
          disabled={!canFindMidpoint || findingMidpoint}
        >
          {findingMidpoint ? "Solving" : "Midpoint"}
        </Button>
      </div>
      <div className="flex gap-2">
        <input
          className="h-10 min-w-0 flex-1 border border-border bg-background px-3 text-sm outline-none focus:border-primary"
          value={destinationQuery}
          onChange={(event) => onDestinationQueryChange(event.target.value)}
          placeholder="Coffee, pizza, park"
          onKeyDown={(event) => {
            if (event.key === "Enter" && canSearchDestinations && !searchingDestinations) {
              onDestinationSearch();
            }
          }}
        />
        <Button
          type="button"
          size="sm"
          className="h-10 shrink-0"
          onClick={onDestinationSearch}
          disabled={!canSearchDestinations || searchingDestinations}
        >
          {searchingDestinations ? "Finding" : "Find"}
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <FilterPopover label={formatDuration(maxDurationMinutes)}>
          <label className="space-y-1 text-xs text-muted-foreground">
            Max travel time
            <select
              className="h-9 w-full border border-border bg-background px-2 text-sm text-foreground outline-none focus:border-primary"
              value={maxDurationMinutes}
              onChange={(event) => onMaxDurationMinutesChange(Number(event.target.value))}
            >
              <option value={5}>5 min</option>
              <option value={15}>15 min</option>
              <option value={30}>30 min</option>
              <option value={60}>1 hour</option>
            </select>
          </label>
        </FilterPopover>

        <FilterPopover label={formatRadius(searchRadiusMeters)}>
          <div className="space-y-2">
            <label className="space-y-1 text-xs text-muted-foreground">
              Search radius
              <select
                className="h-9 w-full border border-border bg-background px-2 text-sm text-foreground outline-none focus:border-primary"
                value={radiusPresetValue(searchRadiusMeters)}
                onChange={(event) => {
                  if (event.target.value === "custom") {
                    return;
                  }

                  onSearchRadiusMetersChange(milesToMeters(Number(event.target.value)));
                }}
              >
                <option value={5}>5 mi</option>
                <option value={10}>10 mi</option>
                <option value={25}>25 mi</option>
                <option value={50}>50 mi</option>
                <option value="custom">Custom</option>
              </select>
            </label>
            <label className="space-y-1 text-xs text-muted-foreground">
              Custom miles
              <input
                className="h-9 w-full border border-border bg-background px-2 text-sm text-foreground outline-none focus:border-primary"
                min={1}
                step={1}
                type="number"
                value={metersToMiles(searchRadiusMeters)}
                onChange={(event) => onSearchRadiusMetersChange(milesToMeters(Number(event.target.value)))}
              />
            </label>
          </div>
        </FilterPopover>

        <FilterPopover label={sortLabel(sortBy)}>
          <select
            className="h-9 w-full border border-border bg-background px-2 text-sm outline-none focus:border-primary"
            value={sortBy}
            onChange={(event) => onSortByChange(event.target.value as SortBy)}
          >
            <option value="fairest">Fairest</option>
            <option value="fastest">Fastest average</option>
            <option value="lowestMaxTime">Lowest max time</option>
          </select>
        </FilterPopover>

        <button
          type="button"
          className={`h-8 border px-3 text-xs font-medium ${
            showMeetingArea ? "border-primary bg-primary/10 text-primary" : "border-border bg-muted text-muted-foreground"
          }`}
          onClick={() => onShowMeetingAreaChange(!showMeetingArea)}
        >
          Areas {showMeetingArea ? "on" : "off"}
        </button>
      </div>
    </section>
  );
}

function FilterPopover({ label, children }: { label: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (popoverRef.current?.contains(event.target as Node)) {
        return;
      }

      setOpen(false);
    }

    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, []);

  return (
    <div ref={popoverRef} className="relative">
      <button
        type="button"
        className="h-8 border border-border bg-muted px-3 text-xs font-medium hover:border-primary hover:bg-primary/10"
        onClick={() => setOpen((current) => !current)}
      >
        {label}
      </button>
      {open ? (
        <div className="absolute left-0 top-full z-[1000] mt-1 w-52 border border-border bg-surface-elevated p-3 shadow-xl">
          {children}
        </div>
      ) : null}
    </div>
  );
}

function formatDuration(minutes: number) {
  if (minutes >= 60) {
    return "1 hour";
  }

  return `${minutes} min`;
}

function formatRadius(meters: number) {
  return `${metersToMiles(meters)} mi`;
}

function metersToMiles(meters: number) {
  return Math.max(1, Math.round(meters / 1609.344));
}

function milesToMeters(miles: number) {
  return Math.max(1, Math.round(miles * 1609.344));
}

function radiusPresetValue(meters: number) {
  const miles = metersToMiles(meters);

  if ([5, 10, 25, 50].includes(miles)) {
    return String(miles);
  }

  return "custom";
}

function sortLabel(sortBy: SortBy) {
  if (sortBy === "fastest") {
    return "Fastest";
  }

  if (sortBy === "lowestMaxTime") {
    return "Lowest max";
  }

  return "Fairest";
}
