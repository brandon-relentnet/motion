import { createRootRoute, Link, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

const RootLayout = () => (
  <>
    <div className="p-2 flex gap-2">
      <Link to="/" className="[&.active]:font-bold">
        Home
      </Link>{" "}
      <Link to="/about" className="[&.active]:font-bold">
        About
      </Link>{" "}
      <Link to="/settings" className="[&.active]:font-bold">
        Settings
      </Link>
    </div>
    <hr />
    <div className="p-2 min-h-screen bg-[url('/bg-texture.jpg')] bg-cover relative">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/70 via-secondary-100/70 to-accent/70" />
      <div className="absolute inset-0 bg-white/30 dark:bg-black/30" />
      <Outlet />
      <TanStackRouterDevtools />
    </div>
  </>
);

export const Route = createRootRoute({ component: RootLayout });
