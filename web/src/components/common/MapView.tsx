import { useEffect, useMemo, useState } from "react";
import { divIcon, type LatLngExpression, type PathOptions } from "leaflet";
import { CircleMarker, MapContainer, Marker, Polygon, Polyline, Popup, TileLayer, Tooltip, useMap, useMapEvents } from "react-leaflet";
import { EstimateSheet } from "./EstimateSheet";
import { candidateKey } from "./ResultsPanel";
import { MapLayerControls } from "./MapLayerControls";
import type {
  ActiveTarget,
  DestinationCandidate,
  Location,
  MapLayerVisibility,
  MeetingArea,
  MeetingEstimate,
  MeetingRoutes,
  Participant,
} from "./types";
import { activeTargetLabel, activeTargetLocation, destinationColor } from "./types";

const mapCenter = [39.8283, -98.5795] satisfies LatLngExpression;

const tileLayer = {
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
  url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png",
};

const candidateStyle: PathOptions = {
  color: destinationColor,
  fillColor: destinationColor,
  fillOpacity: 0.62,
  opacity: 1,
  weight: 3,
};

const selectedCandidateStyle: PathOptions = {
  color: "#fff7ed",
  fillColor: destinationColor,
  fillOpacity: 0.85,
  opacity: 1,
  weight: 4,
};

export function MapView({
  activeTarget,
  participants,
  estimateTarget,
  selectedCandidate,
  selectedCandidateId,
  layers,
  estimate,
  routes,
  meetingArea,
  destinationCandidates,
  estimating,
  loadingRoutes,
  estimateError,
  routesError,
  onLayerChange,
  onAddPersonHere,
  onEstimateHere,
  onSearchNearby,
  onEstimateSheetClose,
  onDestinationCandidateSelect,
}: {
  activeTarget: ActiveTarget;
  participants: Participant[];
  estimateTarget: Location | null;
  selectedCandidate: DestinationCandidate | null;
  selectedCandidateId: string | null;
  layers: MapLayerVisibility;
  estimate: MeetingEstimate | undefined;
  routes: MeetingRoutes | undefined;
  meetingArea: MeetingArea | undefined;
  destinationCandidates: DestinationCandidate[];
  estimating: boolean;
  loadingRoutes: boolean;
  estimateError: string | undefined;
  routesError: string | undefined;
  onLayerChange: (layer: keyof MapLayerVisibility, visible: boolean) => void;
  onAddPersonHere: (lat: number, lng: number) => void;
  onEstimateHere: (lat: number, lng: number) => void;
  onSearchNearby: (lat: number, lng: number) => void;
  onEstimateSheetClose: () => void;
  onDestinationCandidateSelect: (candidate: DestinationCandidate) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [actionMenu, setActionMenu] = useState<MapActionMenu | null>(null);

  function handleMapClick(lat: number, lng: number) {
    if (actionMenu) {
      setActionMenu(null);
      return;
    }

    setActionMenu({ lat, lng });
  }

  return (
    <div className={expanded ? "fixed inset-0 z-[900] bg-background" : "relative h-[560px] bg-background lg:h-full"}>
      <button
        type="button"
        className="absolute right-4 top-4 z-[1000] border border-border bg-surface-elevated/95 px-3 py-2 text-sm font-medium shadow-xl hover:border-primary hover:bg-muted"
        onClick={() => setExpanded((current) => !current)}
      >
        {expanded ? "Exit full map" : "Full map"}
      </button>
      <MapLayerControls layers={layers} onLayerChange={onLayerChange} />
      <EstimateSheet
        target={estimateTarget}
        selectedCandidate={selectedCandidate}
        estimate={estimate}
        routes={routes}
        estimating={estimating}
        loadingRoutes={loadingRoutes}
        estimateError={estimateError}
        routesError={routesError}
        onClose={onEstimateSheetClose}
      />
      <MapContainer center={mapCenter} zoom={4} className="h-full w-full bg-background">
        <TileLayer attribution={tileLayer.attribution} url={tileLayer.url} />
        <MapResizeWatcher watch={expanded} />
        <MapInteractionHandler onMapClick={handleMapClick} onMapMoveStart={() => setActionMenu(null)} />
        <UserLocationCenter enabled={participants.length === 0 && !estimateTarget} />
        <ActiveTargetFocus
          activeTarget={activeTarget}
          participants={participants}
          estimateTarget={estimateTarget}
          selectedCandidate={selectedCandidate}
        />

        {layers.areas ? <MeetingAreaLayer meetingArea={meetingArea} participants={participants} /> : null}
        {actionMenu ? (
          <MapActionMenu
            menu={actionMenu}
            canEstimate={participants.length > 0}
            onAddPersonHere={() => {
              onAddPersonHere(actionMenu.lat, actionMenu.lng);
              setActionMenu(null);
            }}
            onEstimateHere={() => {
              onEstimateHere(actionMenu.lat, actionMenu.lng);
              setActionMenu(null);
            }}
            onSearchNearby={() => {
              onSearchNearby(actionMenu.lat, actionMenu.lng);
              setActionMenu(null);
            }}
          />
        ) : null}
        {layers.routes ? <RouteLayer estimateTarget={estimateTarget} participants={participants} routes={routes} /> : null}
        {layers.candidates ? (
          <CandidateLayer
            candidates={destinationCandidates}
            selectedCandidateId={selectedCandidateId}
            onSelect={onDestinationCandidateSelect}
          />
        ) : null}

        {layers.people
          ? participants.map((participant) => (
              <PointMarker
                key={participant.id}
                active={activeTarget.type === "participant" && activeTarget.id === participant.id}
                point={participant.location}
                label={participant.name}
                color={participant.color}
              />
            ))
          : null}

        <PointMarker
          active={Boolean(estimateTarget)}
          point={estimateTarget}
          label="Estimate"
          color={destinationColor}
          draggable
          onDrag={onEstimateHere}
        />

        <Tooltip direction="top" permanent position={mapCenter} opacity={0.92}>
          {activeTarget.type === "none"
            ? "Click the map for actions"
            : `${activeTargetLabel(activeTarget, participants)} selected`}
        </Tooltip>
      </MapContainer>
    </div>
  );
}

function MapResizeWatcher({ watch }: { watch: boolean }) {
  const map = useMap();

  useEffect(() => {
    window.setTimeout(() => map.invalidateSize(), 0);
  }, [map, watch]);

  return null;
}

function UserLocationCenter({ enabled }: { enabled: boolean }) {
  const map = useMap();

  useEffect(() => {
    if (!enabled || !navigator.geolocation) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        map.setView([position.coords.latitude, position.coords.longitude], 12);
      },
      () => undefined,
      { enableHighAccuracy: false, maximumAge: 300000, timeout: 5000 },
    );
  }, [enabled, map]);

  return null;
}

function ActiveTargetFocus({
  activeTarget,
  participants,
  estimateTarget,
  selectedCandidate,
}: {
  activeTarget: ActiveTarget;
  participants: Participant[];
  estimateTarget: Location | null;
  selectedCandidate: DestinationCandidate | null;
}) {
  const map = useMap();
  const activeLocation =
    activeTarget.type === "candidate" ? selectedCandidate?.location ?? null : activeTargetLocation(activeTarget, participants);
  const focusLocation = activeLocation ?? estimateTarget;

  useEffect(() => {
    if (!focusLocation) {
      return;
    }

    map.flyTo([focusLocation.coord.lat, focusLocation.coord.lng], Math.max(map.getZoom(), 13), {
      duration: 0.45,
    });
  }, [focusLocation, map]);

  return null;
}

function MeetingAreaLayer({
  meetingArea,
  participants,
}: {
  meetingArea: MeetingArea | undefined;
  participants: Participant[];
}) {
  const participantColorsByName = useMemo(() => {
    return new Map(participants.map((participant) => [participant.name, participant.color]));
  }, [participants]);

  if (!meetingArea) {
    return null;
  }

  return (
    <>
      {meetingArea.participants.map((participantArea) => (
        <Polygon
          key={participantArea.participantName}
          positions={polygonPositions(participantArea.area)}
          pathOptions={areaStyle(participantColorsByName.get(participantArea.participantName) ?? "#60a5fa")}
        />
      ))}
      {meetingArea.intersection ? (
        <Polygon positions={polygonPositions(meetingArea.intersection)} pathOptions={sharedAreaStyle} />
      ) : null}
    </>
  );
}

function RouteLayer({
  estimateTarget,
  participants,
  routes,
}: {
  estimateTarget: Location | null;
  participants: Participant[];
  routes: MeetingRoutes | undefined;
}) {
  const routeLines = useMemo(() => {
    return new Map(
      (routes?.routes ?? []).map((route) => [
        route.participantName,
        toLine(route.route.geometry.points),
      ]),
    );
  }, [routes]);

  if (!estimateTarget) {
    return null;
  }

  return (
    <>
      {participants.map((participant) => {
        const routeLine = routeLines.get(participant.name);
        const positions = routeLine && routeLine.length > 0 ? routeLine : toLine([participant.location.coord, estimateTarget.coord]);

        return (
          <Polyline
            key={participant.id}
            positions={positions}
            pathOptions={routeStyle(participant.color, Boolean(routeLine?.length))}
          />
        );
      })}
    </>
  );
}

function CandidateLayer({
  candidates,
  selectedCandidateId,
  onSelect,
}: {
  candidates: DestinationCandidate[];
  selectedCandidateId: string | null;
  onSelect: (candidate: DestinationCandidate) => void;
}) {
  return (
    <>
      {candidates.map((candidate) => {
        const id = candidateKey(candidate);
        const active = id === selectedCandidateId;
        return (
          <CircleMarker
            key={id}
            center={[candidate.location.coord.lat, candidate.location.coord.lng]}
            eventHandlers={{
              click(event) {
                event.originalEvent.stopPropagation();
                onSelect(candidate);
              },
            }}
            pathOptions={active ? selectedCandidateStyle : candidateStyle}
            radius={active ? 11 : 8}
          >
            <Tooltip direction="top" opacity={0.95}>
              {candidate.location.name || "Destination"} · {Math.round(candidate.estimate.averageDurationSeconds / 60)} min avg
            </Tooltip>
          </CircleMarker>
        );
      })}
    </>
  );
}

function MapInteractionHandler({
  onMapClick,
  onMapMoveStart,
}: {
  onMapClick: (lat: number, lng: number) => void;
  onMapMoveStart: () => void;
}) {
  useMapEvents({
    click(event) {
      onMapClick(event.latlng.lat, event.latlng.lng);
    },
    movestart() {
      onMapMoveStart();
    },
  });

  return null;
}

type MapActionMenu = {
  lat: number;
  lng: number;
};

function MapActionMenu({
  menu,
  canEstimate,
  onAddPersonHere,
  onEstimateHere,
  onSearchNearby,
}: {
  menu: MapActionMenu;
  canEstimate: boolean;
  onAddPersonHere: () => void;
  onEstimateHere: () => void;
  onSearchNearby: () => void;
}) {
  return (
    <>
      <CircleMarker
        center={[menu.lat, menu.lng]}
        pathOptions={{ color: destinationColor, fillColor: destinationColor, fillOpacity: 1, opacity: 1, weight: 2 }}
        radius={5}
      />
      <Popup position={[menu.lat, menu.lng]} closeButton={false} closeOnClick={false} autoPan={false}>
        <div className="w-40 text-sm">
          <button type="button" className="block w-full px-2 py-2 text-left hover:bg-muted" onClick={onAddPersonHere}>
            Add location here
          </button>
          <button
            type="button"
            className="block w-full px-2 py-2 text-left hover:bg-muted disabled:text-muted-foreground"
            onClick={onEstimateHere}
            disabled={!canEstimate}
          >
            Estimate here
          </button>
          <button type="button" className="block w-full px-2 py-2 text-left hover:bg-muted" onClick={onSearchNearby}>
            Search nearby
          </button>
        </div>
      </Popup>
    </>
  );
}

function PointMarker({
  point,
  label,
  color,
  active,
  draggable = false,
  onDrag,
}: {
  point: Location | null;
  label: string;
  color: string;
  active: boolean;
  draggable?: boolean;
  onDrag?: (lat: number, lng: number) => void;
}) {
  const icon = useMemo(() => markerIcon(color, active), [active, color]);

  if (!point) {
    return null;
  }

  return (
    <Marker
      draggable={draggable}
      icon={icon}
      position={[point.coord.lat, point.coord.lng]}
      eventHandlers={{
        dragend(event) {
          if (!onDrag) {
            return;
          }

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

function markerIcon(color: string, active: boolean) {
  const size = active ? 26 : 18;
  const border = active ? 4 : 3;
  const shadow = active
    ? "0 0 0 3px rgba(45,212,191,.42),0 8px 20px rgba(0,0,0,.35)"
    : "0 0 0 2px rgba(255,255,255,.95),0 5px 14px rgba(0,0,0,.28)";

  return divIcon({
    className: "",
    html: `<span style="display:block;width:${size}px;height:${size}px;border-radius:999px;background:${color};border:${border}px solid #0f172a;box-shadow:${shadow};"></span>`,
    iconAnchor: [size / 2, size / 2],
    iconSize: [size, size],
  });
}

function areaStyle(color: string): PathOptions {
  return {
    color,
    fillOpacity: 0.11,
    opacity: 0.55,
    weight: 3,
  };
}

const sharedAreaStyle: PathOptions = {
  color: destinationColor,
  fillOpacity: 0.22,
  opacity: 0.85,
  weight: 3,
};

function routeStyle(color: string, hasRoute: boolean): PathOptions {
  return {
    color,
    dashArray: hasRoute ? undefined : "6 8",
    opacity: hasRoute ? 1 : 0.85,
    weight: hasRoute ? 6 : 4,
  };
}

function toLine(points: Location["coord"][] | undefined): LatLngExpression[] {
  return (points ?? []).map((point) => [point.lat, point.lng] satisfies [number, number]);
}

function polygonPositions(polygon: MeetingArea["participants"][number]["area"]): LatLngExpression[][] {
  return polygon.coordinates.map((ring) =>
    ring
      .filter((point) => point.length >= 2)
      .map((point) => [point[1], point[0]] satisfies [number, number]),
  );
}
