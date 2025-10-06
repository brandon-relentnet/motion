import { createFileRoute } from "@tanstack/react-router";
import DeploymentForm from "../components/DeploymentForm";
import SmoothTabs from "../components/SmoothTabs";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <div className="px-8 min-h-screen flex justify-center items-center flex-col gap-4">
      <div className="flex gap-8 w-full">
        <DeploymentForm />
        <SmoothTabs />
      </div>
    </div>
  );
}
