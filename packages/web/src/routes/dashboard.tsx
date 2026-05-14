import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { components } from "../gen/openapi";
import { Button, Card, CardContent } from "../components/ui";
import { openAPIClient } from "../lib/openapi";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});

type CompareMeetingRequest = components["schemas"]["CompareMeetingRequest"];

const sampleCompareRequest: CompareMeetingRequest = {
  locationA: {
    name: "Lower Manhattan",
    address: "New York, NY",
    coord: { lat: 40.7128, lng: -74.006 },
  },
  locationB: {
    name: "Brooklyn",
    address: "Brooklyn, NY",
    coord: { lat: 40.6782, lng: -73.9442 },
  },
  interestAreas: [
    {
      name: "Prospect Park",
      address: "Brooklyn, NY",
      coord: { lat: 40.6602, lng: -73.969 },
    },
  ],
};

function DashboardPage() {
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

  const openAPIEstimateMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await openAPIClient.POST("/api/meeting/compare", {
        body: sampleCompareRequest,
      });

      if (error) {
        throw new Error(error.error);
      }

      return data;
    },
  });

  return (
    <div className="space-y-8">
      <section className="space-y-2">
        <h2 className="text-3xl font-semibold">API playground</h2>
        <p className="text-muted-foreground">
          This intentionally has one example request so you can build the real Go endpoints yourself.
        </p>
      </section>

      <Card>
        <CardContent className="space-y-3 p-6">
          <h3 className="text-lg font-semibold">Go server health</h3>
          <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm">
            {healthQuery.isLoading ? "Checking http://localhost:3000/health..." : null}
            {healthQuery.data ? healthQuery.data.message : null}
            {healthQuery.error ? healthQuery.error.message : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold">OpenAPI meeting estimate</h3>
            <Button
              type="button"
              onClick={() => openAPIEstimateMutation.mutate()}
              disabled={openAPIEstimateMutation.isPending}
            >
              {openAPIEstimateMutation.isPending ? "Estimating..." : "Run sample"}
            </Button>
          </div>
          <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm">
            {openAPIEstimateMutation.isIdle ? "Ready to POST /api/meeting/compare with generated route and body types." : null}
            {openAPIEstimateMutation.data ? `Returned ${openAPIEstimateMutation.data.length} option(s).` : null}
            {openAPIEstimateMutation.error ? openAPIEstimateMutation.error.message : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
