# Repository Guidelines

## Project Structure & Module Organization
The client is built with React + TypeScript + Vite. All runtime code lives in `src/`. `src/main.tsx` bootstraps the single-page shell exported from `src/App.tsx`. Place shared UI in `src/components`, tab bodies in `src/tabs`, state stores in `src/stores`, and utility helpers in `src/lib`. Static assets (icons, images) belong in `src/assets`; anything served verbatim belongs in `public/`. Vite emits production bundles into `dist/`.

## Build, Test, and Development Commands
Run `npm install` once to pull dependencies. Use `npm run dev` to start Vite locally on port 3000 with HMR. `npm run build` performs a type-check (`tsc -b`) and outputs optimized assets into `dist/`. `npm run preview` serves the build to simulate production. `npm run lint` enforces ESLint rules across the repo; fix reported issues before committing.

## Coding Style & Naming Conventions
The project uses modern ECMAScript modules and TypeScript. Follow the ESLint configuration in `eslint.config.js`; prefer consistent 2-space indentation, semicolons omitted, and double quotes as seen in the existing files. Name React components in PascalCase (`ActivePanel.tsx`) and hooks in camelCase prefixed with `use`. Keep styling within Tailwind classes; extend themes only via the DaisyUI plugin block inside `src/index.css`.

## Testing Guidelines
There is no automated test harness today; rely on `npm run lint` and manual verification in `npm run dev`. When adding tests, colocate them near the code under test using a `.test.tsx` suffix and align with React Testing Library conventions. Aim for high coverage on stateful hooks and motion-heavy components as the surface expands.

## Commit & Pull Request Guidelines
Commits in this repository favor short, descriptive sentences in the present tense (see `git log`). Keep messages under ~70 characters when possible and focus on the user-facing effect ("Simplify theme picker transitions"). For pull requests, include a concise summary, screenshots or gifs for UI changes, a checklist of impacted surfaces, and links to any tracking issues. Ensure linting passes locally before opening the PR.
