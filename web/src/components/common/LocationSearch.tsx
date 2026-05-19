import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { openAPIClient } from "../../lib/openapi";
import { Button, Input, Label } from "../ui";
import { LocateFixed } from "lucide-react";
import { cn } from "../../lib/cn";
import type { Location } from "./types";

export function LocationSearch({
  label,
  searchCenter,
  initialQuery = "",
  placeholder = "Search address or place",
  allowCurrentLocation = false,
  autoFocus = false,
  onLocationSelect,
  className = "",
  inputClassName = "",
}: {
  label?: string;
  searchCenter: Location["coord"];
  initialQuery?: string;
  placeholder?: string;
  allowCurrentLocation?: boolean;
  autoFocus?: boolean;
  onLocationSelect: (point: Location) => void;
  className?: string;
  inputClassName?: string;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [open, setOpen] = useState(false);
  const [currentLocationError, setCurrentLocationError] = useState("");
  const [currentLocationLoading, setCurrentLocationLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const trimmedQuery = query.trim();

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (searchRef.current?.contains(event.target as Node)) {
        return;
      }

      setOpen(false);
    }

    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, []);

  const autocompleteQuery = useQuery({
    queryKey: ["locations-autocomplete", trimmedQuery, searchCenter.lat, searchCenter.lng],
    enabled: open && trimmedQuery.length >= 3,
    queryFn: async () => {
      const { data, error } = await openAPIClient.GET("/api/locations/autocomplete", {
        params: {
          query: {
            query: trimmedQuery,
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

  function selectCurrentLocation() {
    if (!navigator.geolocation) {
      setCurrentLocationError("Current location is not available in this browser.");
      return;
    }

    setCurrentLocationError("");
    setCurrentLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const point: Location = {
          name: "Current location",
          address: `${position.coords.latitude.toFixed(5)}, ${position.coords.longitude.toFixed(5)}`,
          coord: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          },
        };

        try {
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

          const exactLocation = {
            ...data,
            address: data.address || point.address,
            coord: point.coord,
          };

          setQuery(exactLocation.address || exactLocation.name || "Current location");
          onLocationSelect(exactLocation);
        } catch {
          setQuery("Current location");
          onLocationSelect(point);
        } finally {
          setOpen(false);
          setCurrentLocationLoading(false);
        }
      },
      () => {
        setCurrentLocationError("Location permission was denied or unavailable.");
        setCurrentLocationLoading(false);
      },
      { enableHighAccuracy: false, maximumAge: 300000, timeout: 8000 },
    );
  }

  const showMenu =
    open &&
    (allowCurrentLocation ||
      (autocompleteQuery.data && autocompleteQuery.data.length > 0) ||
      Boolean(autocompleteQuery.error) ||
      Boolean(currentLocationError));

  return (
    <div ref={searchRef} className={cn("relative space-y-2", className)}>
      {label ? <Label>{label}</Label> : null}
      <Input
        className={inputClassName}
        value={query}
        onFocus={() => setOpen(true)}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" && autocompleteQuery.data?.[0]) {
            const point = autocompleteQuery.data[0];
            setQuery(point.name || point.address);
            setOpen(false);
            onLocationSelect(point);
          }
        }}
        placeholder={placeholder}
        autoFocus={autoFocus}
      />
      {autocompleteQuery.isFetching ? (
        <div className="absolute right-2 top-9 text-xs text-muted-foreground">Searching...</div>
      ) : null}
      {showMenu ? (
        <div className="absolute left-0 right-0 top-full z-[1000] mt-1 max-h-64 overflow-y-auto rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-xl">
          {allowCurrentLocation ? (
            <Button
              type="button"
              variant="ghost"
              className="h-auto w-full justify-start px-3 py-2 text-left text-sm font-medium hover:bg-success/10"
              onClick={selectCurrentLocation}
              disabled={currentLocationLoading}
            >
              <LocateFixed className="h-4 w-4 text-success" />
              {currentLocationLoading ? "Finding current location..." : "Use current location"}
            </Button>
          ) : null}
          {autocompleteQuery.data?.map((point) => (
            <button
              key={`${point.coord.lat}-${point.coord.lng}-${point.address}`}
              type="button"
              className="w-full rounded-sm px-3 py-2 text-left text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground"
              onClick={() => {
                setQuery(point.name || point.address);
                setOpen(false);
                onLocationSelect(point);
              }}
            >
              <div className="font-medium">{point.name || "Unnamed location"}</div>
              <div className="line-clamp-2 text-muted-foreground">{point.address}</div>
            </button>
          ))}
          {autocompleteQuery.error ? <ErrorMessage message={autocompleteQuery.error.message} /> : null}
          {currentLocationError ? <ErrorMessage message={currentLocationError} /> : null}
        </div>
      ) : null}
    </div>
  );
}

function ErrorMessage({ message }: { message: string }) {
  return <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{message}</div>;
}
