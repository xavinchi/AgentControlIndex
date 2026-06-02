# Agent Control Index

Static Vite + React + TypeScript app for benchmarking agent control and governance tools.

Production URL: `https://xavinchi.github.io/AgentControlIndex`

## Local Development

1. Install dependencies:

```bash
npm install
```

2. Start dev server:

```bash
npm run dev
```

3. Build production bundle:

```bash
npm run build
```

4. Preview production build locally:

```bash
npm run preview
```

## GitHub Pages Deployment

This repository includes a GitHub Actions workflow at `.github/workflows/deploy-pages.yml`.

### One-time repository setup

1. In GitHub, open **Settings -> Pages**.
2. Under **Build and deployment**, set **Source** to **GitHub Actions**.
3. Ensure your default deployment branch is `main`.

### Automatic deployment

- Every push to `main` triggers the Pages workflow.
- The workflow builds with the fixed GitHub Pages base path for this repository:

```bash
VITE_BASE_PATH=/AgentControlIndex/ npm run build
```

This ensures asset paths work for project pages.

### Manual production build (optional)

If you want to mirror GitHub Pages build output locally, run:

```bash
VITE_BASE_PATH=/AgentControlIndex/ npm run build
```

## Routing On GitHub Pages

The app uses `HashRouter` (`#/...` routes), which avoids 404 refresh issues on static hosting and keeps deep links working on refresh.

Additionally, `public/404.html` redirects unknown static paths back into the hash route entry point.

## Troubleshooting

### Blank page after deploy

- Open browser devtools and check for failed JS/CSS requests.
- Confirm Pages source is set to **GitHub Actions**.
- Confirm workflow finished successfully and deployed the latest commit.

### Wrong base path (assets load from `/assets/...`)

- Ensure Vite `base` is set to `/AgentControlIndex/`.
- Ensure workflow build env uses `VITE_BASE_PATH=/AgentControlIndex/`.

### Broken data files (`/data/*.json` 404)

- Confirm files exist in `public/data` and are committed.
- Confirm data requests are base-aware (this app uses `import.meta.env.BASE_URL + data/...`).
- Rebuild and redeploy after data file changes.

## Notes

- Exports and data views use static sample data from `public/data`.
- No backend is required for deployment.
