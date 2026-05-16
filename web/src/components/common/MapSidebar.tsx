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
  searchingDestinations,
  onActiveTargetChange,
  onDestinationQueryChange,
  onMaxDurationMinutesChange,
  onSearchRadiusMetersChange,
  onSortByChange,
  onShowMeetingAreaChange,
  onDestinationSearch,
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
  searchingDestinations: boolean;
  onActiveTargetChange: (target: ActiveTarget) => void;
  onDestinationQueryChange: (query: string) => void;
  onMaxDurationMinutesChange: (minutes: number) => void;
  onSearchRadiusMetersChange: (meters: number) => void;
  onSortByChange: (sortBy: SortBy) => void;
  onShowMeetingAreaChange: (show: boolean) => void;
  onDestinationSearch: () => void;
  onDestinationSelect: (candidate: DestinationCandidate) => void;
  onParticipantAdd: (location: Location) => void;
  onParticipantRemove: (participantId: string) => void;
}) {
  return (
    <aside className="border-b border-border bg-surface-elevated lg:h-screen lg:overflow-y-auto lg:border-b-0 lg:border-r">
      <div className="space-y-4 p-4">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Middle Meetup</h2>
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
          searchingDestinations={searchingDestinations}
          onDestinationQueryChange={onDestinationQueryChange}
          onMaxDurationMinutesChange={onMaxDurationMinutesChange}
          onSearchRadiusMetersChange={onSearchRadiusMetersChange}
          onSortByChange={onSortByChange}
          onShowMeetingAreaChange={onShowMeetingAreaChange}
          onDestinationSearch={onDestinationSearch}
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
  return <div className="border border-danger/50 bg-danger/15 px-3 py-2 text-sm text-danger">{message}</div>;
}
