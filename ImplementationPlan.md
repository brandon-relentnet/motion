# Implementation Plan

## Objectives
- Integrate deployment and container management features into the existing redesigned UI without reusing OldApp styling.
- Keep feature additions incremental so each slice can be tested independently on Unraid.
- Mirror functionality from `src/OldApp.jsx` while modernizing the architecture (TanStack Router, Zustand stores, modular components).

## Phased Roadmap

### Phase 1 · Deploy Flow Foundations *(current focus)*
1. Wire `DeploymentForm` inputs to a dedicated Zustand slice for form state and status flags.
2. Implement a stub `startDeploy` handler that validates input, toggles loading states, and logs payload to the console.
3. Keep visual components (`LoadingProgressBar`, `MultiStateBadge`) fed by the store so UI feedback matches future real deployments.

### Phase 2 · Deploy Streaming Integration
1. Create `deployClient.ts` with a streaming fetch helper that exposes callbacks for step changes, log chunks, and completion/error.
2. Replace the stub handler with real streaming logic; reuse parsing heuristics from `OldApp` to detect progress markers.
3. Introduce a `DeployLog` component that renders incremental log output inside the Deploy tab.

### Phase 3 · Container Inventory & Actions
1. Expand `Containers.tsx` to display running/stopped app data with layout consistent with the new design.
2. Add `useApps` Zustand slice (or hook) that polls `/api/apps`, handles errors, and provides optimistic updates.
3. Implement container action handlers (`start`, `stop`, `restart`, `remove`, `purge`) with confirmation where required.

### Phase 4 · Health & Global Status
1. Build `useHealth` hook polling `/healthz` and surface status in header badge/UI shell.
2. Coordinate polling intervals between health and apps to avoid redundant requests.

### Phase 5 · Settings & Categories Enhancements
1. Flesh out the Settings and Categories tabs using modular forms connected to stores/APIs once available.
2. Add persistence or server calls for category management as backend endpoints come online.

## Guiding Principles
- Prefer small PR-sized increments; each phase can be split into multiple commits if needed.
- Keep UI components stateless where possible; colocate side effects in hooks/stores.
- Maintain strong typing for API responses; centralize types in `src/lib`.
- Guard all network calls with sensible error handling and user feedback.

## API Server Notes
- Temporary Express server lives in `server/index.ts`; it streams mock deploy logs and mutates an in-memory apps list so the UI can be exercised end-to-end.
- Run it locally with `npm run server` (defaults to port 4000). Set `API_PORT` or `API_URL` to override the port/URL if needed.
- Vite dev server proxies `/api` and `/healthz` to the API, keeping frontend fetch paths unchanged.
- Optional env vars:
  - `DEPLOY_OUTPUT_DIR` to override where `dist/` assets are copied (defaults to `<repo>/deployments/<app>`).
  - `DEPLOY_BASE_URL` to decorate published apps with a browsable URL in the containers list.
