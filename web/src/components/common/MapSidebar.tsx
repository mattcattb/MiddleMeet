import { Clock3, MapPin, Search, type LucideIcon } from "lucide-react";
import { MeetupSearchPanel } from "./MeetupSearchPanel";
import { PeoplePanel } from "./PeoplePanel";
import { ResultsPanel } from "./ResultsPanel";
import type { ActiveTarget, DestinationCandidate, Location, Participant, SortBy } from "./types";

export function MapSidebar({
  activeTarget,
  participants,
  searchCenter,
  meetingAreaError,
  destinationSearchError,
  destinationQuery,
  maxDurationMinutes,
  searchRadiusMeters,
  sortBy,
  showMeetingArea,
  destinationResults,
  selectedCandidateId,
  canSearchDestinations,
  canFindMidpoint,
  searchingDestinations,
  findingMidpoint,
  onActiveTargetChange,
  onDestinationQueryChange,
  onMaxDurationMinutesChange,
  onSearchRadiusMetersChange,
  onSortByChange,
  onShowMeetingAreaChange,
  onDestinationSearch,
  onFindMidpoint,
  onDestinationSelect,
  onParticipantAdd,
  onParticipantRemove,
}: {
  activeTarget: ActiveTarget;
  participants: Participant[];
  searchCenter: Location["coord"];
  meetingAreaError: string | undefined;
  destinationSearchError: string | undefined;
  destinationQuery: string;
  maxDurationMinutes: number;
  searchRadiusMeters: number;
  sortBy: SortBy;
  showMeetingArea: boolean;
  destinationResults: DestinationCandidate[];
  selectedCandidateId: string | null;
  canSearchDestinations: boolean;
  canFindMidpoint: boolean;
  searchingDestinations: boolean;
  findingMidpoint: boolean;
  onActiveTargetChange: (target: ActiveTarget) => void;
  onDestinationQueryChange: (query: string) => void;
  onMaxDurationMinutesChange: (minutes: number) => void;
  onSearchRadiusMetersChange: (meters: number) => void;
  onSortByChange: (sortBy: SortBy) => void;
  onShowMeetingAreaChange: (show: boolean) => void;
  onDestinationSearch: () => void;
  onFindMidpoint: () => void;
  onDestinationSelect: (candidate: DestinationCandidate) => void;
  onParticipantAdd: (location: Location) => void;
  onParticipantRemove: (participantId: string) => void;
}) {
  return (
    <aside className="border-b border-border bg-card lg:h-screen lg:overflow-y-auto lg:border-b-0 lg:border-r">
      <div className="space-y-5 p-4 lg:p-5">
        <div className="space-y-3">
          <h1 className="text-xl font-semibold tracking-tight">Middle-Where?</h1>
          <div className="grid grid-cols-3 gap-1.5 text-xs text-muted-foreground">
            <FlowStep icon={MapPin} label="Add" />
            <FlowStep icon={Search} label="Find" />
            <FlowStep icon={Clock3} label="Compare" />
          </div>
        </div>

        <PeoplePanel
          activeTarget={activeTarget}
          participants={participants}
          searchCenter={searchCenter}
          onActiveTargetChange={onActiveTargetChange}
          onParticipantAdd={onParticipantAdd}
          onParticipantRemove={onParticipantRemove}
        />

        <MeetupSearchPanel
          destinationQuery={destinationQuery}
          maxDurationMinutes={maxDurationMinutes}
          searchRadiusMeters={searchRadiusMeters}
          sortBy={sortBy}
          showMeetingArea={showMeetingArea}
          canSearchDestinations={canSearchDestinations}
          canFindMidpoint={canFindMidpoint}
          searchingDestinations={searchingDestinations}
          findingMidpoint={findingMidpoint}
          onDestinationQueryChange={onDestinationQueryChange}
          onMaxDurationMinutesChange={onMaxDurationMinutesChange}
          onSearchRadiusMetersChange={onSearchRadiusMetersChange}
          onSortByChange={onSortByChange}
          onShowMeetingAreaChange={onShowMeetingAreaChange}
          onDestinationSearch={onDestinationSearch}
          onFindMidpoint={onFindMidpoint}
        />

        {meetingAreaError ? <ErrorMessage message={meetingAreaError} /> : null}
        {destinationSearchError ? <ErrorMessage message={destinationSearchError} /> : null}

        <ResultsPanel
          results={destinationResults}
          selectedCandidateId={selectedCandidateId}
          onDestinationSelect={onDestinationSelect}
        />
      </div>
    </aside>
  );
}

function ErrorMessage({ message }: { message: string }) {
  return <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{message}</div>;
}

function FlowStep({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <div className="flex items-center justify-center gap-1.5 border border-border py-1.5">
      <Icon className="h-3.5 w-3.5" />
      <span>{label}</span>
    </div>
  );
}
