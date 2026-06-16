# Flow section hero images

Drop one image per flow panel here. `flow.js` loads them via each
`.flow-panel`'s `data-img` attribute and floats them as 3D planes in the
Three.js scene. Until a file exists, that panel renders a solid indigo
placeholder plane (graceful fallback — the scene still works).

Expected filenames (≈16:10, recommend ≤2048px on the long edge):

- `data-collection.jpg`    — panel 01, Data Collection
- `processing-storage.jpg` — panel 02, Processing & Storage
- `ml-analysis.jpg`        — panel 03, ML & Analysis
- `build-ship.jpg`         — panel 04, Build & Ship
