import type { components } from "../../gen/openapi";

export type Location = components["schemas"]["Location"];
export type DestinationCandidate = components["schemas"]["DestinationCandidate"];
export type MeetingArea = components["schemas"]["MeetingArea"];
export type MeetingConstraints = components["schemas"]["MeetingConstraints"];
export type MeetingEstimate = components["schemas"]["MeetingEstimate"];
export type MeetingRoutes = components["schemas"]["MeetingRoutes"];
export type SortBy = NonNullable<MeetingConstraints["sortBy"]>;
export type Participant = components["schemas"]["Participant"] & {
  id: string;
  color: string;
};

export type ActiveTarget =
  | { type: "none" }
  | { type: "newParticipant" }
  | { type: "participant"; id: string }
  | { type: "candidate"; id: string };

export type MapLayerVisibility = {
  people: boolean;
  routes: boolean;
  areas: boolean;
  candidates: boolean;
};

export const destinationColor = "#fb923c";

export const participantColors = [
  "#60a5fa",
  "#34d399",
  "#f472b6",
  "#a78bfa",
  "#facc15",
  "#2dd4bf",
];

export function activeTargetLabel(target: ActiveTarget, participants: Participant[]) {
  if (target.type === "none") {
    return "a location or estimate";
  }

  if (target.type === "newParticipant") {
    return "new location";
  }

  if (target.type === "candidate") {
    return "candidate";
  }

  return participants.find((participant) => participant.id === target.id)?.name ?? "Participant";
}

export function activeTargetLocation(target: ActiveTarget, participants: Participant[]) {
  if (target.type === "none" || target.type === "newParticipant" || target.type === "candidate") {
    return null;
  }

  return participants.find((participant) => participant.id === target.id)?.location ?? null;
}
