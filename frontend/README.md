# Frontend Deployment (GitHub Pages)

This frontend is a Create React App + CRACO single-page app in a monorepo.

## Build target

- Output directory: `frontend/build`
- SPA fallback: `frontend/build/404.html` (copy of `index.html`)
- Jekyll bypass: `frontend/build/.nojekyll`

The `build:pages` script generates all three artifacts.

## Commands (local)

Run from the repository root:

```bash
cd frontend
yarn install --frozen-lockfile
CI=false PUBLIC_URL=/kinetix yarn build:pages
```

If your repository name changes, replace `/kinetix` with `/<repo-name>`.

## Backend URL for demo

This app reads `REACT_APP_BACKEND_URL` at build time.

- In GitHub repository settings, define Actions variable `REACT_APP_BACKEND_URL`.
- Example value: `https://your-backend.example.com`

If not set, frontend API calls default to `/api`, which will not work on GitHub Pages unless you proxy elsewhere.

## Automatic deployment

Deployment is handled by [../.github/workflows/deploy.yml](../.github/workflows/deploy.yml).

On each push to `main`, GitHub Actions will:

1. Install frontend dependencies.
2. Build with `PUBLIC_URL=/<repository-name>`.
3. Upload `frontend/build` as a Pages artifact.
4. Deploy to GitHub Pages.

## Live demo URL

Your public URL format is:

`https://<username>.github.io/<repository-name>/`

For this repository:

`https://telebehub.github.io/kinetix/`
