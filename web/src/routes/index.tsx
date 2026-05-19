import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MapView } from "../components/common/MapView";
import { MapSidebar } from "../components/common/MapSidebar";
import { candidateKey } from "../components/common/ResultsPanel";
import type { ActiveTarget, DestinationCandidate, Location, MapLayerVisibility, Participant, SortBy } from "../components/common/types";
import { activeTargetLocation, participantColors } from "../components/common/types";
import type { components } from "../gen/openapi";
import { openAPIClient } from "../lib/openapi";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  const [activeTarget, setActiveTarget] = useState<ActiveTarget>({ type: "none" });
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [estimateTarget, setEstimateTarget] = useState<Location | null>(null);
  const [destinationQuery, setDestinationQuery] = useState("coffee");
  const [maxDurationMinutes, setMaxDurationMinutes] = useState(30);
  const [searchRadiusMeters, setSearchRadiusMeters] = useState(10000);
  const [sortBy, setSortBy] = useState<SortBy>("fairest");
  const [showMeetingArea, setShowMeetingArea] = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState<DestinationCandidate | null>(null);
  const [meetupOptions, setMeetupOptions] = useState<DestinationCandidate[]>([]);
  const [mapLayers, setMapLayers] = useState<MapLayerVisibility>({
    people: true,
    routes: true,
    areas: true,
    candidates: true,
  });
  const [userCoord, setUserCoord] = useState<Location["coord"] | null>(null);
  const [searchOrigin, setSearchOrigin] = useState<Location["coord"] | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserCoord({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => undefined,
      { enableHighAccuracy: false, maximumAge: 300000, timeout: 5000 },
    );
  }, []);

  const activeLocation = activeTargetLocation(activeTarget, participants);
  const searchCenter =
    activeLocation?.coord ?? estimateTarget?.coord ?? searchOrigin ?? userCoord ?? { lat: 39.8283, lng: -98.5795 };
  const selectedCandidateId = selectedCandidate ? candidateKey(selectedCandidate) : null;

  const estimateMutation = useMutation({
    mutationFn: async (request: components["schemas"]["MeetingRequest"]) => {
      const { data, error } = await openAPIClient.POST("/api/meeting/estimate", {
        body: request,
      });

      if (error) {
        throw new Error(error.error);
      }

      return data;
    },
  });

  const routesMutation = useMutation({
    mutationFn: async (request: components["schemas"]["MeetingRequest"]) => {
      const { data, error } = await openAPIClient.POST("/api/meeting/routes", {
        body: request,
      });

      if (error) {
        throw new Error(error.error);
      }

      return data;
    },
  });

  const meetingAreaMutation = useMutation({
    mutationFn: async (request: components["schemas"]["MeetingAreaRequest"]) => {
      const { data, error } = await openAPIClient.POST("/api/meeting/area", {
        body: request,
      });

      if (error) {
        throw new Error(error.error);
      }

      return data;
    },
  });

  const destinationSearchMutation = useMutation({
    mutationFn: async (request: components["schemas"]["DestinationSearchRequest"]) => {
      const { data, error } = await openAPIClient.POST("/api/meeting/destinations/search", {
        body: request,
      });

      if (error) {
        throw new Error(error.error);
      }

      return data;
    },
  });

  const midpointMutation = useMutation({
    mutationFn: async (request: components["schemas"]["MeetingAreaRequest"]) => {
      const { data, error } = await openAPIClient.POST("/api/meeting/midpoint", {
        body: request,
      });

      if (error) {
        throw new Error(error.error);
      }

      return data;
    },
  });

  const nearbyDestinationSearchMutation = useMutation({
    mutationFn: async (near: Location["coord"]) => {
      const query = destinationQuery.trim();
      if (!query) {
        throw new Error("Enter what to find first.");
      }

      if (participants.length === 0) {
        throw new Error("Add at least one location first.");
      }

      const { data, error } = await openAPIClient.GET("/api/locations/search", {
        params: {
          query: {
            query,
            lat: near.lat,
            lng: near.lng,
            radiusMeters: searchRadiusMeters,
          },
        },
      });

      if (error) {
        throw new Error(error.error);
      }

      const constraints = meetingConstraints(maxDurationMinutes, searchRadiusMeters, sortBy);
      const candidates = await Promise.all(
        data.map(async (location) => {
          const { data: estimate, error: estimateError } = await openAPIClient.POST("/api/meeting/estimate", {
            body: meetingRequest(participants, location),
          });

          if (estimateError) {
            throw new Error(estimateError.error);
          }

          return {
            location,
            estimate,
            score: scoreEstimate(estimate, sortBy),
          } satisfies DestinationCandidate;
        }),
      );

      return candidates
        .filter((candidate) => candidate.estimate.maxDurationSeconds <= constraints.maxDurationSeconds)
        .sort((a, b) => a.score - b.score)
        .slice(0, 12);
    },
  });

  function resetResults() {
    resetEstimate();
    destinationSearchMutation.reset();
    nearbyDestinationSearchMutation.reset();
    midpointMutation.reset();
  }

  function clearMeetupOptions() {
    setMeetupOptions([]);
  }

  function resetEstimate() {
    estimateMutation.reset();
    routesMutation.reset();
    setSelectedCandidate(null);
    setEstimateTarget(null);
  }

  function setTargetLocation(target: ActiveTarget, point: Location) {
    if (target.type === "participant") {
      setParticipants((current) =>
        current.map((participant) =>
          participant.id === target.id ? { ...participant, location: point } : participant,
        ),
      );
    } else {
      return;
    }

    resetResults();
    clearMeetupOptions();
  }

  function selectActiveTarget(target: ActiveTarget) {
    if (target.type !== "candidate") {
      setSelectedCandidate(null);
    }
    setActiveTarget(target);
  }

  function addParticipant(location: Location) {
    const nextIndex = participants.length;
    const id = `person-${Date.now()}`;
    const participant: Participant = {
      id,
      name: personLetter(nextIndex),
      color: participantColors[nextIndex % participantColors.length],
      location,
    };

    setParticipants((current) => [...current, participant]);
    setActiveTarget({ type: "participant", id });
    resetResults();
    clearMeetupOptions();
    return id;
  }

  function removeParticipant(participantId: string) {
    setParticipants((current) => {
      const next = current.filter((participant) => participant.id !== participantId);
      if (activeTarget.type === "participant" && activeTarget.id === participantId) {
        setActiveTarget(next[0] ? { type: "participant", id: next[0].id } : { type: "none" });
      }
      return next;
    });
    resetResults();
    clearMeetupOptions();
  }

  async function searchDestinations() {
    const constraints = meetingConstraints(maxDurationMinutes, searchRadiusMeters, sortBy);
    const request: components["schemas"]["DestinationSearchRequest"] = {
      participants: meetingParticipants(participants),
      query: destinationQuery,
      constraints,
      limit: 12,
    };

    const result = await destinationSearchMutation.mutateAsync(request);
    resetEstimate();
    nearbyDestinationSearchMutation.reset();
    midpointMutation.reset();
    addMeetupOptions(result.destinations);

    if (showMeetingArea) {
      meetingAreaMutation.mutate({
        participants: meetingParticipants(participants),
        constraints,
      });
    }

    return result;
  }

  async function findMidpoint() {
    const constraints = meetingConstraints(maxDurationMinutes, searchRadiusMeters, sortBy);
    const result = await midpointMutation.mutateAsync({
      participants: meetingParticipants(participants),
      constraints,
    });

    resetEstimate();
    destinationSearchMutation.reset();
    nearbyDestinationSearchMutation.reset();
    addMeetupOptions(result.candidates);
    setMapLayer("areas", showMeetingArea);
    return result;
  }

  function selectDestinationCandidate(candidate: DestinationCandidate) {
    const id = candidateKey(candidate);
    setActiveTarget({ type: "candidate", id });
    estimateLocation(candidate.location, candidate);
  }

  function estimateLocation(location: Location, candidate: DestinationCandidate | null = null) {
    setEstimateTarget(location);
    setSelectedCandidate(candidate);
    estimateMutation.reset();
    routesMutation.reset();

    if (participants.length === 0) {
      return;
    }

    const request = meetingRequest(participants, location);
    estimateMutation.mutate(request, {
      onSuccess(estimate) {
        const nextCandidate = {
          location,
          estimate,
          score: scoreEstimate(estimate, sortBy),
        } satisfies DestinationCandidate;

        addMeetupOptions([nextCandidate]);
        if (!candidate) {
          setSelectedCandidate(nextCandidate);
          setActiveTarget({ type: "candidate", id: candidateKey(nextCandidate) });
        }
      },
    });
    routesMutation.mutate(request);
  }

  async function estimateMapPoint(lat: number, lng: number) {
    const point = mapPointLocation(lat, lng, "Estimate target");
    setActiveTarget({ type: "none" });

    try {
      const location = await reverseGeocode(point);
      estimateLocation(location);
    } catch {
      estimateLocation(point);
    }
  }

  function addPersonAtMapPoint(lat: number, lng: number) {
    const point = mapPointLocation(lat, lng, `Person ${participants.length + 1}`);
    const id = addParticipant(point);
    reverseGeocode(point)
      .then((location) => {
        setTargetLocation({ type: "participant", id }, location);
      })
      .catch(() => undefined);
  }

  function searchNearbyMapPoint(lat: number, lng: number) {
    setSearchOrigin({ lat, lng });
    destinationSearchMutation.reset();
    resetEstimate();
    nearbyDestinationSearchMutation.mutate(
      { lat, lng },
      {
        onSuccess(candidates) {
          addMeetupOptions(candidates);
        },
      },
    );
  }

  function closeEstimateSheet() {
    resetEstimate();
    if (activeTarget.type === "candidate") {
      setActiveTarget({ type: "none" });
    }
  }

  function setMapLayer(layer: keyof MapLayerVisibility, visible: boolean) {
    setMapLayers((current) => ({ ...current, [layer]: visible }));
  }

  function addMeetupOptions(candidates: DestinationCandidate[]) {
    if (candidates.length === 0) {
      return;
    }

    setMeetupOptions((current) => {
      const byKey = new Map(current.map((candidate) => [candidateKey(candidate), candidate]));
      for (const candidate of candidates) {
        byKey.set(candidateKey(candidate), candidate);
      }

      return Array.from(byKey.values()).sort((a, b) => a.score - b.score);
    });
  }

  async function reverseGeocode(point: Location) {
    const { data, error } = await openAPIClient.GET("/api/locations/reverse", {
      params: {
        query: {
          lat: point.coord.lat,
          lng: point.coord.lng,
        },
      },
    });

    if (error) {
      throw new Error(error.error);
    }

    return data;
  }

  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-[390px_1fr]">
      <MapSidebar
        activeTarget={activeTarget}
        participants={participants}
        searchCenter={searchCenter}
        meetingAreaError={meetingAreaMutation.error?.message}
        destinationSearchError={
          midpointMutation.error?.message ??
          destinationSearchMutation.error?.message ??
          nearbyDestinationSearchMutation.error?.message
        }
        destinationQuery={destinationQuery}
        maxDurationMinutes={maxDurationMinutes}
        searchRadiusMeters={searchRadiusMeters}
        sortBy={sortBy}
        showMeetingArea={showMeetingArea}
        destinationResults={
          meetupOptions
        }
        selectedCandidateId={selectedCandidateId}
        canSearchDestinations={participants.length > 0 && destinationQuery.trim().length > 0}
        canFindMidpoint={participants.length >= 2}
        searchingDestinations={destinationSearchMutation.isPending || nearbyDestinationSearchMutation.isPending}
        findingMidpoint={midpointMutation.isPending}
        onActiveTargetChange={selectActiveTarget}
        onDestinationQueryChange={(query) => {
          setDestinationQuery(query);
          destinationSearchMutation.reset();
          nearbyDestinationSearchMutation.reset();
          midpointMutation.reset();
        }}
        onMaxDurationMinutesChange={(minutes) => {
          setMaxDurationMinutes(minutes);
          destinationSearchMutation.reset();
          nearbyDestinationSearchMutation.reset();
          meetingAreaMutation.reset();
          midpointMutation.reset();
        }}
        onSearchRadiusMetersChange={(meters) => {
          setSearchRadiusMeters(meters);
          destinationSearchMutation.reset();
          nearbyDestinationSearchMutation.reset();
          midpointMutation.reset();
        }}
        onSortByChange={(nextSortBy) => {
          setSortBy(nextSortBy);
          destinationSearchMutation.reset();
          nearbyDestinationSearchMutation.reset();
          midpointMutation.reset();
        }}
        onShowMeetingAreaChange={(show) => {
          setShowMeetingArea(show);
          setMapLayer("areas", show);
        }}
        onDestinationSearch={() => void searchDestinations()}
        onFindMidpoint={() => void findMidpoint()}
        onDestinationSelect={selectDestinationCandidate}
        onParticipantAdd={addParticipant}
        onParticipantRemove={removeParticipant}
      />
      <MapView
        activeTarget={activeTarget}
        participants={participants}
        estimateTarget={estimateTarget}
        selectedCandidate={selectedCandidate}
        selectedCandidateId={selectedCandidateId}
        layers={mapLayers}
        estimate={selectedCandidate?.estimate ?? estimateMutation.data}
        routes={routesMutation.data}
        meetingArea={showMeetingArea ? midpointMutation.data?.area ?? meetingAreaMutation.data ?? destinationSearchMutation.data?.area : undefined}
        destinationCandidates={
          meetupOptions
        }
        estimating={estimateMutation.isPending}
        loadingRoutes={routesMutation.isPending}
        estimateError={estimateMutation.error?.message}
        routesError={routesMutation.error?.message}
        onLayerChange={setMapLayer}
        onDestinationCandidateSelect={selectDestinationCandidate}
        onAddPersonHere={addPersonAtMapPoint}
        onEstimateHere={(lat, lng) => void estimateMapPoint(lat, lng)}
        onSearchNearby={searchNearbyMapPoint}
        onEstimateSheetClose={closeEstimateSheet}
      />
    </div>
  );
}

function meetingRequest(participants: Participant[], estimateTarget: Location | null): components["schemas"]["MeetingRequest"] {
  if (!estimateTarget) {
    throw new Error("Choose an estimate target first.");
  }

  return {
    destination: estimateTarget,
    participants: meetingParticipants(participants),
  };
}

function meetingParticipants(participants: Participant[]) {
  return participants.map((participant) => ({
    name: participant.name,
    location: participant.location,
  }));
}

function personLetter(index: number) {
  return String.fromCharCode(65 + (index % 26));
}

function meetingConstraints(maxDurationMinutes: number, radiusMeters: number, sortBy: SortBy) {
  return {
    maxDurationSeconds: Math.max(1, Math.round(maxDurationMinutes * 60)),
    radiusMeters,
    sortBy,
  };
}

function scoreEstimate(estimate: components["schemas"]["MeetingEstimate"], sortBy: SortBy) {
  if (sortBy === "fastest") {
    return estimate.averageDurationSeconds;
  }

  if (sortBy === "lowestMaxTime") {
    return estimate.maxDurationSeconds;
  }

  return estimate.averageDurationSeconds + estimate.durationSpreadSeconds;
}

function mapPointLocation(lat: number, lng: number, name: string): Location {
  return {
    name,
    address: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
    coord: { lat, lng },
  };
}
