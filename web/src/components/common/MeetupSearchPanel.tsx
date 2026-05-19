import type { ReactNode } from "react";
import { Clock3, Crosshair, MapPinned, Search, SlidersHorizontal } from "lucide-react";
import {
  Button,
  Input,
  Label,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
} from "../ui";
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
    <section className="space-y-3 rounded-lg border border-border bg-background/70 p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-7 w-8 items-center justify-center rounded-md bg-orange-400 text-xs font-bold text-orange-50">
            E
          </span>
          <div className="min-w-0">
            <div className="text-sm font-semibold">Meetup estimates</div>
            <div className="truncate text-xs text-muted-foreground">{canSearchDestinations ? "Find or solve possible spots." : "Add locations first."}</div>
          </div>
        </div>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="h-8 shrink-0 px-3"
          onClick={onFindMidpoint}
          disabled={!canFindMidpoint || findingMidpoint}
        >
          <Crosshair className="h-3.5 w-3.5" />
          {findingMidpoint ? "Solving" : "Midpoint"}
        </Button>
      </div>
      <div className="flex gap-2">
        <Input
          className="min-w-0 flex-1"
          value={destinationQuery}
          onChange={(event) => onDestinationQueryChange(event.target.value)}
          placeholder="Coffee, pizza, park"
          disabled={!canSearchDestinations}
          onKeyDown={(event) => {
            if (event.key === "Enter" && canSearchDestinations && !searchingDestinations) {
              onDestinationSearch();
            }
          }}
        />
        <Button
          type="button"
          className="h-10 shrink-0"
          onClick={onDestinationSearch}
          disabled={!canSearchDestinations || searchingDestinations}
        >
          <Search className="h-4 w-4" />
          {searchingDestinations ? "Finding" : "Find"}
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <FilterPopover label={formatDuration(maxDurationMinutes)}>
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Clock3 className="h-3.5 w-3.5" />
              Max travel time
            </Label>
            <Select value={String(maxDurationMinutes)} onValueChange={(value) => onMaxDurationMinutesChange(Number(value))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 min</SelectItem>
                <SelectItem value="15">15 min</SelectItem>
                <SelectItem value="30">30 min</SelectItem>
                <SelectItem value="60">1 hour</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </FilterPopover>

        <FilterPopover label={formatRadius(searchRadiusMeters)}>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Search radius</Label>
              <Select
                value={radiusPresetValue(searchRadiusMeters)}
                onValueChange={(value) => {
                  if (value === "custom") {
                    return;
                  }

                  onSearchRadiusMetersChange(milesToMeters(Number(value)));
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 mi</SelectItem>
                  <SelectItem value="10">10 mi</SelectItem>
                  <SelectItem value="25">25 mi</SelectItem>
                  <SelectItem value="50">50 mi</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Custom miles</Label>
              <Input
                min={1}
                step={1}
                type="number"
                value={metersToMiles(searchRadiusMeters)}
                onChange={(event) => onSearchRadiusMetersChange(milesToMeters(Number(event.target.value)))}
              />
            </div>
          </div>
        </FilterPopover>

        <FilterPopover label={sortLabel(sortBy)}>
          <div className="space-y-2">
            <Label>Sort by</Label>
            <Select
            value={sortBy}
              onValueChange={(value) => onSortByChange(value as SortBy)}
          >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fairest">Fairest</SelectItem>
                <SelectItem value="fastest">Fastest average</SelectItem>
                <SelectItem value="lowestMaxTime">Lowest max time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </FilterPopover>

        <label className="inline-flex h-8 items-center gap-2 rounded-md border border-border bg-card px-3 text-xs font-medium text-muted-foreground shadow-sm">
          <MapPinned className="h-3.5 w-3.5" />
          Areas
          <Switch checked={showMeetingArea} onCheckedChange={onShowMeetingAreaChange} />
        </label>
      </div>
    </section>
  );
}

function FilterPopover({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="h-8 bg-card text-xs">
          <SlidersHorizontal className="h-3.5 w-3.5" />
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-56">
        {children}
      </PopoverContent>
    </Popover>
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
