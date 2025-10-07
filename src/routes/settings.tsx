import { createFileRoute } from "@tanstack/react-router";
import Theme from "../components/Theme";

export const Route = createFileRoute("/settings")({
  component: Settings,
});

function Settings() {
  return (
    <div>
      <Theme />
    </div>
  );
}
