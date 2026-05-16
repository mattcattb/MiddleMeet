import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { MeetupMap } from "../components/meetup/meetup-map";
import { MeetupSidebar } from "../components/meetup/meetup-sidebar";
import type { ActiveTarget, Location, Participant } from "../components/meetup/types";
import { activeTargetLabel, activeTargetLocation, participantColors } from "../components/meetup/types";
import type { components } from "../gen/openapi";
import { openAPIClient } from "../lib/openapi";

export const Route = createFileRoute("/")({
  component: HomePage,
});

type MeetingRequest = components["schemas"]["MeetingRequest"];

const initialParticipants: Participant[] = [
  {
    id: "person-1",
    name: "Person 1",
    color: participantColors[0],
    location: {
      name: "Person 1",
      address: "Lower Manhattan",
      coord: { lat: 40.7128, lng: -74.006 },
    },
  },
  {
    id: "person-2",
    name: "Person 2",
    color: participantColors[1],
    location: {
      name: "Person 2",
      address: "Brooklyn",
      coord: { lat: 40.6782, lng: -73.9442 },
    },
  },
];

function HomePage() {
  const [activeTarget, setActiveTarget] = useState<ActiveTarget>({ type: "participant", id: "person-1" });
  const [participants, setParticipants] = useState<Participant[]>(initialParticipants);
  const [destination, setDestination] = useState<Location | null>({
    name: "Destination",
    address: "Prospect Park",
    coord: { lat: 40.6602, lng: -73.969 },
  });
  const [locationQuery, setLocationQuery] = useState("");

  const healthQuery = useQuery({
    queryKey: ["api-health"],
    queryFn: async () => {
      const { data, error } = await openAPIClient.GET("/health");
      if (error) {
        throw new Error("Health check failed");
      }
      return data;
    },
  });

  const activeLocation = activeTargetLocation(activeTarget, participants, destination);
  const searchCenter = activeLocation?.coord ?? { lat: 40.7004, lng: -73.976 };
  const trimmedLocationQuery = locationQuery.trim();

  const autocompleteQuery = useQuery({
    queryKey: ["locations-autocomplete", trimmedLocationQuery, searchCenter.lat, searchCenter.lng],
    enabled: trimmedLocationQuery.length >= 3,
    queryFn: async () => {
      const { data, error } = await openAPIClient.GET("/api/locations/autocomplete", {
        params: {
          query: {
            query: trimmedLocationQuery,
            lat: searchCenter.lat,
            lng: searchCenter.lng,
          },
        },
      });

      if (error) {
        throw new Error(error.error);
      }

      return data;
    },
  });

  const searchMutation = useMutation({
    mutationFn: async () => {
      if (trimmedLocationQuery.length === 0) {
        throw new Error("Enter a place or address first.");
      }

      const { data, error } = await openAPIClient.GET("/api/locations/search", {
        params: {
          query: {
            query: trimmedLocationQuery,
            lat: searchCenter.lat,
            lng: searchCenter.lng,
            radiusMeters: 10000,
          },
        },
      });

      if (error) {
        throw new Error(error.error);
      }

      return data;
    },
  });

  const estimateMutation = useMutation({
    mutationFn: async (request: MeetingRequest) => {
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
    mutationFn: async (request: MeetingRequest) => {
      const { data, error } = await openAPIClient.POST("/api/meeting/routes", {
        body: request,
      });

      if (error) {
        throw new Error(error.error);
      }

      return data;
    },
  });

  const reverseGeocodeMutation = useMutation({
    mutationFn: async ({ point, target }: { point: Location; target: ActiveTarget }) => {
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

      return { location: data, target };
    },
    onSuccess: ({ location, target }) => {
      setTargetLocation(target, location);
    },
  });

  function resetResults() {
    estimateMutation.reset();
    routesMutation.reset();
  }

  function setTargetLocation(target: ActiveTarget, point: Location) {
    if (target.type === "destination") {
      setDestination(point);
    } else {
      setParticipants((current) =>
        current.map((participant) =>
          participant.id === target.id ? { ...participant, location: point } : participant,
        ),
      );
    }

    resetResults();
  }

  function updateTargetLocation(target: ActiveTarget, lat: number, lng: number) {
    const point: Location = {
      name: activeTargetLabel(target, participants),
      address: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
      coord: { lat, lng },
    };

    setTargetLocation(target, point);
    reverseGeocodeMutation.mutate({ point, target });
  }

  function addParticipant() {
    const nextIndex = participants.length;
    const id = `person-${Date.now()}`;
    const participant: Participant = {
      id,
      name: `Person ${nextIndex + 1}`,
      color: participantColors[nextIndex % participantColors.length],
      location: {
        name: `Person ${nextIndex + 1}`,
        address: "New York",
        coord: { lat: 40.7004 + nextIndex * 0.01, lng: -73.976 + nextIndex * 0.01 },
      },
    };

    setParticipants((current) => [...current, participant]);
    setActiveTarget({ type: "participant", id });
    resetResults();
  }

  function removeParticipant(participantId: string) {
    setParticipants((current) => {
      if (current.length === 1) {
        return current;
      }

      const next = current.filter((participant) => participant.id !== participantId);
      if (activeTarget.type === "participant" && activeTarget.id === participantId) {
        setActiveTarget({ type: "participant", id: next[0].id });
      }
      return next;
    });
    resetResults();
  }

  function renameParticipant(participantId: string, name: string) {
    setParticipants((current) =>
      current.map((participant) => (participant.id === participantId ? { ...participant, name } : participant)),
    );
    resetResults();
  }

  function selectLocation(point: Location) {
    setTargetLocation(activeTarget, point);
    setLocationQuery(point.name || point.address);
  }

  async function estimateMeetup() {
    const request = meetingRequest(participants, destination);
    const estimate = await estimateMutation.mutateAsync(request);
    routesMutation.mutate(request);
    return estimate;
  }

  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-[400px_1fr]">
      <MeetupSidebar
        activeTarget={activeTarget}
        participants={participants}
        destination={destination}
        locationQuery={locationQuery}
        locationResults={searchMutation.data ?? autocompleteQuery.data ?? []}
        apiMessage={healthQuery.isLoading ? "Checking API..." : healthQuery.data?.message}
        apiError={healthQuery.error?.message}
        searchError={(searchMutation.error ?? autocompleteQuery.error)?.message}
        estimateError={estimateMutation.error?.message}
        routesError={routesMutation.error?.message}
        estimate={estimateMutation.data}
        routes={routesMutation.data}
        canEstimate={participants.length > 0 && Boolean(destination)}
        searching={searchMutation.isPending}
        estimating={estimateMutation.isPending}
        loadingRoutes={routesMutation.isPending}
        onActiveTargetChange={setActiveTarget}
        onLocationQueryChange={(query) => {
          setLocationQuery(query);
          searchMutation.reset();
        }}
        onSearch={() => searchMutation.mutate()}
        onLocationSelect={selectLocation}
        onEstimate={() => void estimateMeetup()}
        onParticipantAdd={addParticipant}
        onParticipantRemove={removeParticipant}
        onParticipantNameChange={renameParticipant}
      />
      <MeetupMap
        activeTarget={activeTarget}
        participants={participants}
        destination={destination}
        routes={routesMutation.data}
        onMapClick={(lat, lng) => updateTargetLocation(activeTarget, lat, lng)}
        onParticipantDrag={(participantId, lat, lng) =>
          updateTargetLocation({ type: "participant", id: participantId }, lat, lng)
        }
        onDestinationDrag={(lat, lng) => updateTargetLocation({ type: "destination" }, lat, lng)}
      />
    </div>
  );
}

function meetingRequest(participants: Participant[], destination: Location | null): MeetingRequest {
  if (!destination) {
    throw new Error("Set a destination first.");
  }

  return {
    destination,
    participants: participants.map((participant) => ({
      name: participant.name,
      location: participant.location,
    })),
  };
}
