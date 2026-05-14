import { createFileRoute, Link } from "@tanstack/react-router";
import { Button, Card, CardContent } from "../components/ui";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  return (
    <div className="space-y-10">
      <section className="grid gap-6 lg:grid-cols-[1.3fr_1fr] lg:items-center">
        <div className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Go maps learning app
          </p>
          <h1 className="text-4xl font-semibold leading-tight md:text-5xl">
            Build toward meet-in-the-middle plans and roadtrip coordination.
          </h1>
          <p className="text-base text-muted-foreground md:text-lg">
            The backend is now a small Go HTTP server with one example endpoint.
            Add geocoding, places, and drive-time routes yourself as you learn the APIs.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/dashboard">
              <Button effect="glow">Open API playground</Button>
            </Link>
          </div>
        </div>
        <Card className="enter-rise">
          <CardContent className="space-y-4 p-6">
            <div className="text-sm text-muted-foreground">Backend focus</div>
            <ul className="space-y-2 text-sm">
              <li>Server: Go standard library HTTP</li>
              <li>First exercise: add geocoding yourself</li>
              <li>Next idea: compare travel times from two origins</li>
              <li>Later: saved trips, friend invites, roadtrip stops</li>
            </ul>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
