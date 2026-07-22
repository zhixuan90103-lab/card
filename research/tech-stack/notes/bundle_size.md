# Bundle size notes (A7)

| Date | Command | Result |
|------|---------|--------|
| 2026-07-21 | `npm run build` (Vite 6 + pixi.js 8.19.x) | main chunk **index-*.js 291.68 kB** (gzip **91.67 kB**); CSS 1.01 kB gzip 0.52; lazy Pixi renderer chunks separate (WebGL ~69 kB / gzip 19 kB, etc.) |

Notes:
- Engine: `pixi.js@^8.19.0` (resolved 8.19.x)
- **No Three.js**
- M0: placeholder Graphics cards, no texture atlas
- Full `dist/` with maps ~2.8 MB; ship without maps for prod size
