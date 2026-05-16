import { useMemo } from "react";
import { divIcon, type LatLngExpression } from "leaflet";
import { MapContainer, Marker, Polyline, TileLayer, Tooltip, useMapEvents } from "react-leaflet";
import type { ActiveTarget, Location, MeetingRoutes, Participant } from "./types";
import { activeTargetLabel, destinationColor } from "./types";

export function MeetupMap({
  activeTarget,
  participants,
  destination,
  routes,
  onMapClick,
  onParticipantDrag,
  onDestinationDrag,
}: {
  activeTarget: ActiveTarget;
  participants: Participant[];
  destination: Location | null;
  routes: MeetingRoutes | undefined;
  onMapClick: (lat: number, lng: number) => void;
  onParticipantDrag: (participantId: string, lat: number, lng: number) => void;
  onDestinationDrag: (lat: number, lng: number) => void;
}) {
  const routeLines = useMemo(() => {
    return new Map(
      (routes?.routes ?? []).map((route) => [
        route.participantName,
        toLine(route.route.geometry.points),
      ]),
    );
  }, [routes]);

  return (
    <div className="h-[560px] bg-background lg:h-full">
      <MapContainer center={[40.7004, -73.976]} zoom={12} className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapClickHandler onMapClick={onMapClick} />

        {destination
          ? participants.map((participant) => {
              const routeLine = routeLines.get(participant.name);
              const fallbackLine = toLine([participant.location.coord, destination.coord]);

              return (
                <Polyline
                  key={participant.id}
                  positions={routeLine && routeLine.length > 0 ? routeLine : fallbackLine}
                  pathOptions={{
                    color: participant.color,
                    dashArray: routeLine && routeLine.length > 0 ? undefined : "6 8",
                    opacity: 0.9,
                    weight: 5,
                  }}
                />
              );
            })
          : null}

        {participants.map((participant) => (
          <PointMarker
            key={participant.id}
            point={participant.location}
            label={participant.name}
            color={participant.color}
            onDrag={(lat, lng) => onParticipantDrag(participant.id, lat, lng)}
          />
        ))}

        <PointMarker
          point={destination}
          label="Destination"
          color={destinationColor}
          onDrag={onDestinationDrag}
        />

        <Tooltip direction="top" permanent position={[40.7004, -73.976]} opacity={0.92}>
          Click map to set {activeTargetLabel(activeTarget, participants)}
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

function PointMarker({
  point,
  label,
  color,
  onDrag,
}: {
  point: Location | null;
  label: string;
  color: string;
  onDrag: (lat: number, lng: number) => void;
}) {
  const icon = useMemo(() => markerIcon(color), [color]);

  if (!point) {
    return null;
  }

  return (
    <Marker
      draggable
      icon={icon}
      position={[point.coord.lat, point.coord.lng]}
      eventHandlers={{
        dragend(event) {
          const marker = event.target;
          const next = marker.getLatLng();
          onDrag(next.lat, next.lng);
        },
      }}
    >
      <Tooltip direction="top" permanent opacity={0.95}>
        {label}
      </Tooltip>
    </Marker>
  );
}

function markerIcon(color: string) {
  return divIcon({
    className: "",
    html: `<span style="display:block;width:18px;height:18px;border-radius:999px;background:${color};border:3px solid #0f172a;box-shadow:0 0 0 2px rgba(255,255,255,.65);"></span>`,
    iconAnchor: [9, 9],
    iconSize: [18, 18],
  });
}

function toLine(points: Location["coord"][] | undefined): LatLngExpression[] {
  return (points ?? []).map((point) => [point.lat, point.lng] satisfies [number, number]);
}
