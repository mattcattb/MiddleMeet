import { MapPin, MapPinned, Route, Store } from "lucide-react";
import { Button, Tooltip } from "../ui";
import type { MapLayerVisibility } from "./types";

export function MapLayerControls({
  layers,
  onLayerChange,
}: {
  layers: MapLayerVisibility;
  onLayerChange: (layer: keyof MapLayerVisibility, visible: boolean) => void;
}) {
  return (
    <div className="absolute left-4 top-4 z-[1000] flex gap-1 rounded-lg border border-border bg-card/95 p-1 shadow-xl backdrop-blur">
      {Object.entries(layerMeta).map(([key, meta]) => {
        const layer = key as keyof MapLayerVisibility;
        const Icon = meta.icon;
        return (
          <Tooltip key={key} content={meta.label}>
            <Button
              type="button"
              size="icon"
              variant={layers[layer] ? "default" : "ghost"}
              className="h-8 w-8"
              onClick={() => onLayerChange(layer, !layers[layer])}
              aria-label={`${layers[layer] ? "Hide" : "Show"} ${meta.label}`}
            >
              <Icon className="h-4 w-4" />
            </Button>
          </Tooltip>
        );
      })}
    </div>
  );
}

const layerMeta = {
  people: { label: "Locations", icon: MapPin },
  routes: { label: "Routes", icon: Route },
  areas: { label: "Areas", icon: MapPinned },
  candidates: { label: "Estimates", icon: Store },
};
