# Motion Dashboard

This project is a Vite + React + TypeScript single page application with Tailwind styling and motion-driven UI components. The backend Express server under `server/` powers deployment workflows and persists per-app settings.

## Getting Started

- Install dependencies: `npm install`
- Start the dev server: `npm run dev` (front-end on port 3000)
- Start the API server: `npm run server` (Express on port 4000)
- Lint the project: `npm run lint`
- Build the production bundle: `npm run build`

## Docker image with SPA-friendly nginx

For deployments that serve the static bundle behind nginx, use the provided `Dockerfile`. It builds the app and ships the assets with an nginx config that includes a SPA fallback, so direct visits to routes like `/settings` resolve correctly.

```
docker build -t motion-app .
docker run -p 8080:80 motion-app
```

If you need to proxy API traffic from the same container, edit `deploy/nginx.conf` and uncomment the `/api/` block with the proper upstream target. After rebuilding the image, nginx will forward API requests while keeping the SPA fallback for client-side routes.
