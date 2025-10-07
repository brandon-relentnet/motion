import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/deployments")({
  component: Deployments,
});

function Deployments() {
  return <div className="p-2">Hello from Deployments!</div>;
}
