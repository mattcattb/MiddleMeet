import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { parseResponse } from "hono/client";
import { Button, Card, CardContent, Input, Label } from "../components/ui";
import { useSession } from "../lib/auth";
import { rpcClient } from "../lib/rpc.client";

const projectsApi = rpcClient.api.projects;
type Project = Awaited<ReturnType<typeof parseResponse<typeof projectsApi.$get>>>[number];

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const { data: session, isPending } = useSession();
  const [name, setName] = useState("");
  const queryClient = useQueryClient();

  const canFetch = Boolean(session && !isPending);

  const projectsQuery = useQuery({
    queryKey: ["projects"],
    queryFn: () => parseResponse(projectsApi.$get()),
    enabled: canFetch,
  });

  const createMutation = useMutation({
    mutationFn: (payload: { name: string }) =>
      parseResponse(projectsApi.$post({
        json: payload,
      })),
    onSuccess: async (created) => {
      queryClient.setQueryData<Project[]>(["projects"], (prev) => [
        created,
        ...(prev ?? []),
      ]);
      await queryClient.invalidateQueries({
        queryKey: ["projects"],
      }),
      setName("");
    },
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    createMutation.mutate({ name });
  };

  if (!isPending && !session) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="space-y-8">
      <section className="space-y-2">
        <h2 className="text-3xl font-semibold">Dashboard</h2>
        <p className="text-muted-foreground">
          Signed in as {session?.user.email}.
        </p>
      </section>

      <Card>
        <CardContent className="space-y-4 p-6">
          <form onSubmit={handleCreate} className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
            <div className="space-y-2">
              <Label htmlFor="project-name">New project</Label>
              <Input
                id="project-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My next product"
              />
            </div>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create"}
            </Button>
          </form>
          {createMutation.error ? (
            <div className="rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
              {createMutation.error instanceof Error
                ? createMutation.error.message
                : "Failed to create project"}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <section className="space-y-3">
        <h3 className="text-lg font-semibold">Your projects</h3>
        <div className="grid gap-3 md:grid-cols-2">
          {(projectsQuery.data ?? []).map((project) => (
            <Card key={project.id}>
              <CardContent className="p-4">
                <div className="text-base font-semibold">{project.name}</div>
                <div className="text-xs text-muted-foreground">
                  Created {new Date(project.createdAt).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))}
          {projectsQuery.isLoading ? (
            <Card>
              <CardContent className="p-4 text-sm text-muted-foreground">
                Loading projects...
              </CardContent>
            </Card>
          ) : null}
          {projectsQuery.error ? (
            <Card>
              <CardContent className="p-4 text-sm text-danger">
                {projectsQuery.error instanceof Error
                  ? projectsQuery.error.message
                  : "Failed to load projects"}
              </CardContent>
            </Card>
          ) : null}
          {(projectsQuery.data?.length ?? 0) === 0 && !projectsQuery.isLoading && !projectsQuery.error ? (
            <Card>
              <CardContent className="p-4 text-sm text-muted-foreground">
                No projects yet. Create your first one above.
              </CardContent>
            </Card>
          ) : null}
        </div>
      </section>
    </div>
  );
}
