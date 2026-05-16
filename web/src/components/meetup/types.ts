import type { components } from "../../gen/openapi";

export type Location = components["schemas"]["Location"];
export type MeetingEstimate = components["schemas"]["MeetingEstimate"];
export type MeetingRoutes = components["schemas"]["MeetingRoutes"];
export type Participant = components["schemas"]["Participant"] & {
  id: string;
  color: string;
};

export type ActiveTarget =
  | { type: "participant"; id: string }
  | { type: "destination" };

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
  if (target.type === "destination") {
    return "Destination";
  }

  return participants.find((participant) => participant.id === target.id)?.name ?? "Participant";
}

export function activeTargetLocation(target: ActiveTarget, participants: Participant[], destination: Location | null) {
  if (target.type === "destination") {
    return destination;
  }

  return participants.find((participant) => participant.id === target.id)?.location ?? null;
}
