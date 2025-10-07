import { createRootRoute, Link, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

const RootLayout = () => (
  <>
    <div className="p-2 flex gap-2">
      <Link to="/" className="[&.active]:font-bold">
        Overview
      </Link>{" "}
      <Link to="/deployments" className="[&.active]:font-bold">
        Deployments
      </Link>{" "}
      <Link to="/settings" className="[&.active]:font-bold">
        Settings
      </Link>
    </div>
    <hr />
    <div className="p-2 min-h-screen relative">
      <Outlet />
      <TanStackRouterDevtools />
    </div>
  </>
);

export const Route = createRootRoute({ component: RootLayout });
