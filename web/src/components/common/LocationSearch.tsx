import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { openAPIClient } from "../../lib/openapi";
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

          setQuery(data.address || data.name || "Current location");
          onLocationSelect(data);
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
    <div ref={searchRef} className={`relative ${className}`}>
      {label ? <div className="text-sm font-medium">{label}</div> : null}
      <input
        className={`h-10 w-full border border-border bg-background px-3 text-sm outline-none focus:border-primary ${inputClassName}`}
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
        <div className="absolute right-2 top-2.5 text-xs text-muted-foreground">Searching...</div>
      ) : null}
      {showMenu ? (
        <div className="absolute left-0 right-0 top-full z-[1000] mt-1 max-h-56 overflow-y-auto border border-border bg-surface-elevated shadow-xl">
          {allowCurrentLocation ? (
            <button
              type="button"
              className="w-full border-b border-border bg-surface-elevated px-3 py-2 text-left text-sm font-medium hover:bg-success/10"
              onClick={selectCurrentLocation}
              disabled={currentLocationLoading}
            >
              {currentLocationLoading ? "Finding current location..." : "Use current location"}
            </button>
          ) : null}
          {autocompleteQuery.data?.map((point) => (
            <button
              key={`${point.coord.lat}-${point.coord.lng}-${point.address}`}
              type="button"
              className="w-full border border-border bg-muted px-3 py-2 text-left text-sm hover:border-primary hover:bg-primary/10"
              onClick={() => {
                setQuery(point.name || point.address);
                setOpen(false);
                onLocationSelect(point);
              }}
            >
              <div className="font-medium">{point.name || "Unnamed location"}</div>
              <div className="text-muted-foreground">{point.address}</div>
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
  return <div className="border border-danger/50 bg-danger/15 px-3 py-2 text-sm text-danger">{message}</div>;
}
