import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { CircleMarker, MapContainer, Polyline, TileLayer, Tooltip, useMapEvents } from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import type { components } from "../gen/openapi";
import { Button } from "../components/ui";
import { openAPIClient } from "../lib/openapi";
import { formatDistance, formatDuration } from "../lib/units";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});

type CompareMeetingRequest = components["schemas"]["CompareMeetingRequest"];
type Location = components["schemas"]["Location"];
type MeetingOption = components["schemas"]["MeetingOption"];
type PointKind = "locationA" | "locationB" | "destination";

const pointLabels: Record<PointKind, string> = {
  locationA: "Location A",
  locationB: "Location B",
  destination: "Destination",
};

function DashboardPage() {
  const [activePoint, setActivePoint] = useState<PointKind>("locationA");
  const [locationA, setLocationA] = useState<Location | null>({
    name: "Location A",
    address: "Lower Manhattan",
    coord: { lat: 40.7128, lng: -74.006 },
  });
  const [locationB, setLocationB] = useState<Location | null>({
    name: "Location B",
    address: "Brooklyn",
    coord: { lat: 40.6782, lng: -73.9442 },
  });
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

  const estimateMutation = useMutation({
    mutationFn: async () => {
      if (!locationA || !locationB || !destination) {
        throw new Error("Set all three map points first.");
      }

      const request: CompareMeetingRequest = {
        locationA,
        locationB,
        interestAreas: [destination],
      };

      const { data, error } = await openAPIClient.POST("/api/meeting/compare", {
        body: request,
      });

      if (error) {
        throw new Error(error.error);
      }

      return data;
    },
  });

  const activeLocation = getActiveLocation(activePoint, locationA, locationB, destination);
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

  const reverseGeocodeMutation = useMutation({
    mutationFn: async ({ point }: { point: Location; kind: PointKind }) => {
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
    },
    onSuccess: (location, variables) => {
      setPoint(variables.kind, location);
    },
  });

  const option = estimateMutation.data?.[0];
  const canEstimate = Boolean(locationA && locationB && destination);
  const locationResults = searchMutation.data ?? autocompleteQuery.data ?? [];

  function setPoint(kind: PointKind, point: Location) {
    if (kind === "locationA") {
      setLocationA(point);
    } else if (kind === "locationB") {
      setLocationB(point);
    } else {
      setDestination(point);
    }

    estimateMutation.reset();
  }

  function updatePoint(lat: number, lng: number) {
    const point: Location = {
      name: pointLabels[activePoint],
      address: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
      coord: { lat, lng },
    };

    setPoint(activePoint, point);
    reverseGeocodeMutation.mutate({ point, kind: activePoint });
  }

  function selectLocation(point: Location) {
    setPoint(activePoint, point);
    setLocationQuery(point.name || point.address);
  }

  return (
    <div className="space-y-8">
      <section className="space-y-2">
        <h2 className="text-3xl font-semibold">Meetup route map</h2>
        <p className="text-muted-foreground">
          Pick two starts and one destination, then estimate both trips with the Go API.
        </p>
      </section>

      <div className="grid min-h-[680px] overflow-hidden rounded-md border border-border bg-surface/70 lg:grid-cols-[340px_1fr]">
        <aside className="border-b border-border bg-surface-elevated/80 lg:border-b-0 lg:border-r">
          <div className="space-y-5 p-5">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Route estimate</h3>
              <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm">
                {healthQuery.isLoading ? "Checking API..." : null}
                {healthQuery.data ? healthQuery.data.message : null}
                {healthQuery.error ? healthQuery.error.message : null}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">Set map point</div>
              <div className="grid grid-cols-3 gap-2">
                {(["locationA", "locationB", "destination"] satisfies PointKind[]).map((point) => (
                  <Button
                    key={point}
                    type="button"
                    size="sm"
                    variant={activePoint === point ? "primary" : "outline"}
                    onClick={() => setActivePoint(point)}
                  >
                    {point === "locationA" ? "A" : point === "locationB" ? "B" : "Dest"}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <PointSummary label="Location A" point={locationA} active={activePoint === "locationA"} />
              <PointSummary label="Location B" point={locationB} active={activePoint === "locationB"} />
              <PointSummary label="Destination" point={destination} active={activePoint === "destination"} />
            </div>

            <div className="space-y-2 border-t border-border pt-4">
              <div className="text-sm font-medium">Find {pointLabels[activePoint]}</div>
              <input
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary"
                value={locationQuery}
                onChange={(event) => {
                  setLocationQuery(event.target.value);
                  searchMutation.reset();
                }}
                placeholder="Search address or place"
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="w-full"
                onClick={() => searchMutation.mutate()}
                disabled={searchMutation.isPending}
              >
                {searchMutation.isPending ? "Searching..." : "Search nearby"}
              </Button>
              {autocompleteQuery.error || searchMutation.error ? (
                <div className="rounded-md border border-danger/40 bg-danger/15 px-3 py-2 text-sm text-danger">
                  {(searchMutation.error ?? autocompleteQuery.error)?.message}
                </div>
              ) : null}
              {locationResults.length > 0 ? (
                <div className="max-h-48 space-y-2 overflow-y-auto">
                  {locationResults.map((point) => (
                    <button
                      key={`${point.coord.lat}-${point.coord.lng}-${point.address}`}
                      type="button"
                      className="w-full rounded-md border border-border bg-muted/30 px-3 py-2 text-left text-sm hover:border-primary hover:bg-primary/10"
                      onClick={() => selectLocation(point)}
                    >
                      <div className="font-medium">{point.name || "Unnamed location"}</div>
                      <div className="text-muted-foreground">{point.address}</div>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <Button
              type="button"
              className="w-full"
              onClick={() => estimateMutation.mutate()}
              disabled={!canEstimate || estimateMutation.isPending}
            >
              {estimateMutation.isPending ? "Estimating..." : "Estimate routes"}
            </Button>

            {estimateMutation.error ? (
              <div className="rounded-md border border-danger/40 bg-danger/15 px-3 py-2 text-sm text-danger">
                {estimateMutation.error.message}
              </div>
            ) : null}

            {option ? <RouteSummary option={option} /> : null}
          </div>
        </aside>

        <RouteMap
          activePoint={activePoint}
          locationA={locationA}
          locationB={locationB}
          destination={destination}
          option={option}
          onMapClick={updatePoint}
        />
      </div>
    </div>
  );
}

function getActiveLocation(
  activePoint: PointKind,
  locationA: Location | null,
  locationB: Location | null,
  destination: Location | null,
) {
  if (activePoint === "locationA") {
    return locationA;
  }

  if (activePoint === "locationB") {
    return locationB;
  }

  return destination;
}

function RouteMap({
  activePoint,
  locationA,
  locationB,
  destination,
  option,
  onMapClick,
}: {
  activePoint: PointKind;
  locationA: Location | null;
  locationB: Location | null;
  destination: Location | null;
  option: MeetingOption | undefined;
  onMapClick: (lat: number, lng: number) => void;
}) {
  const fromALine = useRouteLine(option?.fromA.geometry.points);
  const fromBLine = useRouteLine(option?.fromB.geometry.points);

  return (
    <div className="h-[520px] lg:h-full">
      <MapContainer center={[40.7004, -73.976]} zoom={12} className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapClickHandler onMapClick={onMapClick} />

        {fromALine.length > 0 ? <Polyline positions={fromALine} pathOptions={{ color: "#2563eb", weight: 5 }} /> : null}
        {fromBLine.length > 0 ? <Polyline positions={fromBLine} pathOptions={{ color: "#16a34a", weight: 5 }} /> : null}

        <PointMarker point={locationA} label="A" color="#2563eb" />
        <PointMarker point={locationB} label="B" color="#16a34a" />
        <PointMarker point={destination} label="D" color="#f97316" />

        <Tooltip direction="top" permanent position={[40.7004, -73.976]} opacity={0.92}>
          Click map to set {pointLabels[activePoint]}
        </Tooltip>
      </MapContainer>
    </div>
  );
}

function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(event) {
      onMapClick(event.latlng.lat, event.latlng.lng);
    },
  });

  return null;
}

function PointMarker({ point, label, color }: { point: Location | null; label: string; color: string }) {
  if (!point) {
    return null;
  }

  return (
    <CircleMarker
      center={[point.coord.lat, point.coord.lng]}
      pathOptions={{ color, fillColor: color, fillOpacity: 0.95 }}
      radius={9}
    >
      <Tooltip direction="top" permanent opacity={0.95}>
        {label}
      </Tooltip>
    </CircleMarker>
  );
}

function PointSummary({ label, point, active }: { label: string; point: Location | null; active: boolean }) {
  return (
    <div className={`rounded-md border px-3 py-2 text-sm ${active ? "border-primary bg-primary/10" : "border-border bg-muted/30"}`}>
      <div className="font-medium">{label}</div>
      <div className="text-muted-foreground">
        {point ? `${point.coord.lat.toFixed(5)}, ${point.coord.lng.toFixed(5)}` : "Not set"}
      </div>
    </div>
  );
}

function RouteSummary({ option }: { option: MeetingOption }) {
  return (
    <div className="space-y-3 border-t border-border pt-4">
      <TripSummary label="A to destination" distance={option.fromA.distanceMeters} duration={option.fromA.durationSeconds} />
      <TripSummary label="B to destination" distance={option.fromB.distanceMeters} duration={option.fromB.durationSeconds} />
      <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm">
        <div className="font-medium">Fairness</div>
        <div className="text-muted-foreground">
          {formatDuration(option.durationDifferenceSeconds)} difference, {formatDuration(option.maxDurationSeconds)} max trip
        </div>
      </div>
    </div>
  );
}

function TripSummary({ label, distance, duration }: { label: string; distance: number; duration: number }) {
  return (
    <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm">
      <div className="font-medium">{label}</div>
      <div className="text-muted-foreground">
        {formatDistance(distance)} / {formatDuration(duration)}
      </div>
    </div>
  );
}

function useRouteLine(points: Location["coord"][] | undefined): LatLngExpression[] {
  return useMemo(() => {
    if (!points) {
      return [];
    }

    return points.map((point) => [point.lat, point.lng] satisfies [number, number]);
  }, [points]);
}
