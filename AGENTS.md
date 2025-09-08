# Repository Guidelines

## Project Structure & Module Organization
- `src/`: React + TypeScript source (components, hooks, styles).
  - Components: `src/components/Timer.tsx`, `src/components/Recipe.tsx`
  - Hooks: `src/hooks/useLocalStorage.ts`
  - Styles: `src/index.css`, `src/App.css`
- `public/`: Static assets and `service-worker.js` (e.g., `public/audio/stir-it-up.mp3`).
- `dist/`: Production build output (generated).
- Config: `vite.config.ts`, `tailwind.config.js`, `eslint.config.js`, `tsconfig*.json`.
- Deployment: `Containerfile`, `docker/nginx.conf`.

## Build, Test, and Development Commands
- `npm run dev`: Start Vite dev server (HMR; basic SSL enabled).
- `npm run build`: Type-check (`tsc -b`) and build to `dist/`.
- `npm run preview`: Serve the production build locally.
- `npm run lint`: Run ESLint on the project.
- Docker: `docker build -t chex-mix-timer -f Containerfile .` then `docker run -p 8080:80 chex-mix-timer`.

## Coding Style & Naming Conventions
- Language: TypeScript + React 19.
- Linting: ESLint with `typescript-eslint`, React Hooks, and Vite refresh rules. Fix issues before PRs (`npm run lint -- --fix`).
- Components: PascalCase filenames (e.g., `Recipe.tsx`).
- Hooks/utilities: camelCase; hooks start with `use` (e.g., `useLocalStorage.ts`).
- Styling: Tailwind + daisyUI. Prefer utility classes over custom CSS; keep globals in `src/index.css`/`src/App.css`.

## Testing Guidelines
- No test framework configured yet. For new tests, prefer Vitest + React Testing Library.
- Place tests alongside code (`Component.test.tsx`, `hook.test.ts`).
- Keep logic small and testable (extract to hooks/util fns). For now, rely on `npm run lint` and `npm run build` for regressions.

## Commit & Pull Request Guidelines
- Commits: Prefer Conventional Commits (`feat:`, `fix:`, `chore:`, `refactor:`). Keep subjects imperative and concise.
- PRs: Include summary, linked issues, and before/after screenshots for UI. Note any accessibility, performance, or styling changes.
- Keep PRs focused; update docs/config when commands or behavior change.

## Security & Configuration Tips
- Do not commit secrets or tokens; this is a client-side app. Avoid storing sensitive data in `localStorage`.
- Assets in `public/` are publicly served; ensure you have rights to media.
- Service worker is opt-in; test caching behavior when changing asset paths.
