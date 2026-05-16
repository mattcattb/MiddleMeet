import type { MapLayerVisibility } from "./types";

export function MapLayerControls({
  layers,
  onLayerChange,
}: {
  layers: MapLayerVisibility;
  onLayerChange: (layer: keyof MapLayerVisibility, visible: boolean) => void;
}) {
  return (
    <div className="absolute left-4 top-4 z-[1000] flex gap-1 border border-border bg-surface-elevated/95 p-1 shadow-xl">
      {Object.entries(layerLabels).map(([key, label]) => {
        const layer = key as keyof MapLayerVisibility;
        return (
          <button
            key={key}
            type="button"
            className={`h-8 px-2 text-xs font-medium ${
              layers[layer] ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => onLayerChange(layer, !layers[layer])}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

const layerLabels: Record<keyof MapLayerVisibility, string> = {
  people: "Locations",
  routes: "Routes",
  areas: "Areas",
  candidates: "Places",
};
