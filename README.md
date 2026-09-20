# H2D Explorer

An independent interactive engineering exhibit for the **Bambu Lab H2D**. Rotate the printer, separate its assemblies, inspect individual components, and follow each technical claim back to official documentation.

**Public exhibit:** https://jez237.com/demos/h2d-explorer/

**Source:** https://github.com/jz237/h2d-explorer

## Run locally

Use Node.js 22.12+ (validated with Node 24) and npm.

```sh
npm install
npm run dev
```

Open the URL printed by Vite (normally `http://127.0.0.1:5178`).

```sh
npm run build
npm run preview
```

The output is a static `dist/` folder. Relative asset paths allow deployment below a subdirectory. No API keys, accounts, database, backend, paid service or printer connection are required. Fonts use Google Fonts with local system fallbacks; the model has no remote asset dependencies.

## Explore

- **44 selectable assemblies** in nine categories, including a smoked toolhead front cover reconstructed from official service photographs, with text search, visibility controls, category isolation and ghosting.
- A six-step **How a print happens** tour: feed, heat, move, build, switch and cool. Each step frames and highlights its system, supplies official references and lets the visitor advance at their own pace. Finish or Escape restores the prior view; choosing a mode or component leaves the tour to explore freely.
- Refined toolhead housing, perforated extruder face, inlet collars, nozzle taper, rounded ducts and door handle, plus toothed belt strips. Flexible guide tubes keep their rear ends anchored while their inlet ends follow the moving carriage.
- Auto / Balanced / High render quality. Auto uses 1× pixel density and 512 px shadows in narrow viewer areas; High allows up to 1.5× and 1024 px shadows. Repeated belt teeth and leadscrew thread rings use instancing to reduce draw calls.
- Staged **0–100% explosion**, auto explode, Home, camera reset and seven camera presets.
- Ten visualization modes: Standard, Exploded, Motion, Filament, Heat map, Airflow, Electronics, Maintenance, Print demo and Dual nozzle.
- Left/right filament paths, moving XY gantry and Z bed, a growing layer example, and a simplified left-nozzle lift with a model/support-material specimen.
- **Lattice lantern print demo:** 128 layers build an original fluted pedestal, crossing helical ribs, diamond windows and scalloped crown. The nozzle follows the same paths that reveal the deposited geometry; travel between ribs does not extrude. Scrub any stage, pause, restart or jump to the finished object. The 72-second teaching sequence stops with the head parked clear of the model.
- Source-linked component information, **40 searchable specifications**, official maintenance filters, a documentation library and a full accuracy statement.
- X/Y/Z clipping planes, label categories, screen-space label spacing, optional AMS 2 Pro, and GLB export.
- Responsive assembly drawer and inspector sheet, touch gestures, keyboard controls, focus styles and reduced-motion support.

Mouse: drag to orbit; right-drag to pan; scroll to zoom. Touch: one finger rotates; pinch zooms; two fingers pan. Click or double-click a part to frame it. The tree provides keyboard-accessible equivalents to canvas selection.

| Key      | Action                        |
| -------- | ----------------------------- |
| `/`      | Search components             |
| `H`      | Home / assemble               |
| `E`      | Explode                       |
| `L`      | Toggle labels                 |
| `Escape` | Clear inspection / close help |
| `?`      | Help                          |

Use Viewer settings to explicitly override the initial system reduced-motion preference. When reduced motion is active, continuous animations stay disabled and camera / explosion transitions are immediate.

## Architecture

React + TypeScript + Vite, Three.js, React Three Fiber, drei, Lucide. Animation uses the render loop rather than a separate animation library. React 19.2 is pinned to satisfy the installed Fiber peer range.

```text
src/
  App.tsx                         Viewer state and interface composition
  style.css                       Responsive engineering interface
  data/
    components.ts                 Component hierarchy and provenance
    specifications.ts             Searchable facts with source IDs
    sources.ts                    Canonical official URLs
    documentation.ts              Library groupings
    systemGuides.ts               Educational mode explanations
    printTour.ts                  Six source-linked conceptual print stages
  scene/
    models.ts                     Original procedural component geometry
    PrinterScene.tsx              Materials, selections, animation and rendering
    printPaths.ts                 Lantern layer paths and synchronized nozzle/bed sampling
    PrintDemo.tsx                  Incrementally revealed deposition geometry
    CameraRig.tsx                 Orbit controls and animated framing
    LabelLayout.tsx               Sparse label collision management
    explosionTransforms.ts        Staged assembly separation
    types.ts                      Typed viewer state and modes
  ui/
    Library.tsx                   Specifications, documents and accuracy pages
    SourceLink.tsx                Consistent links to evidence
    PrintTour.tsx                 Keyboard-accessible step navigation and notes
tests/
  explorer.spec.ts                 Production-browser interaction tests
```

Geometry is generated once per scene mount. The scene is lazy loaded, pixel ratio is capped at 1.5, transparent materials avoid depth writes, airflow uses instanced particles, and idle scenes render on demand. The core Three.js vendor chunk is large by design (about 197 KB gzip); it contains the renderer used by every 3D mode. Sparse labels are repositioned or hidden to avoid collisions. Model construction has no external texture/CAD loading phase, so loading feedback reports engine and geometry preparation instead of a fabricated network percentage.

## Sources and technical accuracy

Research reviewed **20 September 2026**. The primary numerical reference is the [official H2D technical data sheet](https://store.bblcdn.com/4731f4c55a/e8f62a86f5f24c42a764d3d528303526/TDS.pdf), linked from the [official H2D product page](https://eu.store.bambulab.com/products/h2d). Other primary references include:

- [H2D maintenance](https://wiki.bambulab.com/en/h2/maintenance/period-maintenance)
- [H2D hotend specifications](https://us.store.bambulab.com/products/bambu-hotend-h2d)
- [Dual extruder service](https://wiki.bambulab.com/en/h2/maintenance/replace-dual-extruder-unit)
- [Intelligent detection](https://wiki.bambulab.com/en/h2/manual/intelligent-detection)
- [Printable range](https://wiki.bambulab.com/en/h2/manual/printable-range-for-dual-nozzles)
- [Official manuals](https://bambulab.com/en/support/documentation/961610223821189120)

Every displayed specification has a source ID that resolves to a retained URL. Component descriptions also retain references. Three important distinctions:

1. Single-nozzle volume is **325 × 320 × 325 mm**, shared dual-nozzle volume is **300 × 320 × 325 mm**, and combined coverage is **350 × 320 × 325 mm**. These are not interchangeable.
2. The **0.2 mm hotend option is stainless steel**. The 0.4/0.6/0.8 mm options on the referenced part page are hardened steel.
3. Monthly/quarterly maintenance is shortened for frequent high-temperature or engineering-material use. Filter-cover cleaning intervals are not filter-media life guarantees. “Daily” intentionally has no results because this guide did not verify a daily interval. Spool-count service tasks appear under Periodic.

### Model limitations

This is **not official Bambu Lab CAD**, a service disassembly sequence, a thermal simulation, a wiring diagram or a calibrated motion model. Do not use it to manufacture replacement parts or infer undocumented clearances. Published dimensions establish the overall exterior proportions; the component shapes, wall thicknesses, fasteners, boards, motors, ducts, sensor positions and internal transmission routes are reconstructed. No part is labeled factory-verified geometry.

The H2D has a shared dual-nozzle carriage. Official maintenance documentation describes the **left nozzle lift**. The animation exaggerates the lift and abstracts its mechanism and timing. It is not an IDEX machine. The X axis uses a linear rail; the Y axis uses rods; the bed has three Z rod/leadscrew sets.

Thermal colors indicate functional zones and published maxima. Airflow paths illustrate purpose, not measured velocities. The lantern paths, layer thickness and timing are educational, not slicer output or a fabrication-ready G-code file. The color gradient separates features visually and does not simulate filament changes. The support example is explanatory; it is not a material-specific printing recommendation. The optional AMS housing and feed curves are approximate. Laser/cutting modules and BirdsEye geometry are outside the model scope (the specifications identify the Laser Edition camera separately).

### 3D asset provenance

All displayed meshes are original parametric reconstructions. Searches for complete H2D CAD located community exterior references but did not establish an openly licensed complete internal assembly. No downloaded third-party CAD, proprietary engineering files or product images are redistributed. Reference imagery was used only to understand overall proportions and features.

Use **Viewer settings → Export reconstructed GLB** to download an assembled reusable model. Component node names, accuracy classifications and source IDs remain in GLTF extras. The interface uses 100 mm per scene unit; the exported root converts those units to meters. Geometry stays editable in `models.ts`.

## Extend or correct the model

1. Add a `Part` record to `src/data/components.ts` with a stable ID, category, location, source IDs, accuracy label, local origin and explosion vector. Set `stage` to determine when it begins separating.
2. Implement its geometry in `buildPart()` in `src/scene/models.ts`. Shapes are centered on the record's origin; positions are `[x, y, z]`, with Y up and positive Z at the printer front. Avoid undocumented numeric precision.
3. Add new verified facts to `specifications.ts`. Each must reference an entry in `sources.ts`. Add a note when a number is a test-condition-dependent limit, a regional rating, or an accessory feature.
4. Link related part IDs and documented maintenance fields. Leave unknown dimensions, intervals and difficulty ratings absent rather than guessing.
5. If authorized CAD becomes available, import a GLB and preserve the stable component node IDs. Align its coordinate system and origins with the part records, retain its license/provenance, and only upgrade accuracy classifications supported by the new evidence.

## Validation

```sh
npm run build
npm test
```

Tests launch installed Google Chrome through Playwright against the production preview. They cover all modes, camera presets, clipping controls, part search and sources, isolate/restore, maintenance empty states, specs search, documentation, mobile drawer/sheet behavior, reduced motion, help focus and binary GLB structure/provenance. Screenshots and downloads go to ignored `work/`; failure traces go to ignored `test-results/`. Vite does not watch these directories, avoiding locked download issues on Windows.

The suite contains 13 browser tests and two path validation tests, including all six tour steps, Back / Finish / Escape, focus restoration, exiting to free exploration, the new cover, mobile tour layout, Balanced pixel density, print scrubbing, pause/restart and completion. Path checks cover all 128 layers, bed bounds, continuity, travel moves, and nozzle/deposition alignment. Mobile checks use desktop Chrome emulation, not a physical phone or mobile GPU.

To test a published origin, set `TEST_BASE_URL` to the exhibit URL. The tests use the supplied base URL without launching a local preview.

## Publishing

The source repository builds independently. The production `dist/` payload is copied to `demos/h2d-explorer/` in the current `jz237/jez237-site` tree and published through that site's existing Cloudflare deployment. A demo card and project entry make it discoverable. Always start from current `origin/main`, preserve unrelated changes, and run the existing live-site deployment guard. The project does not create paid infrastructure.

The Bambu Lab name and H2D product designation identify the subject of this independent exhibit. No affiliation or endorsement is implied.
