export const sources = {
  ptfe: {
    title: "PTFE tubes: buffer to both toolhead inlets",
    url: "https://uk.store.bambulab.com/products/ptfe-tube-on-h2d-printer",
    kind: "Official replacement part",
  },
  tds: {
    title: "H2D technical data sheet (PDF)",
    url: "https://store.bblcdn.com/4731f4c55a/e8f62a86f5f24c42a764d3d528303526/TDS.pdf",
    kind: "Official technical data sheet",
  },
  product: {
    title: "H2D product & technical specifications",
    url: "https://eu.store.bambulab.com/products/h2d",
    kind: "Official product page",
  },
  specs: {
    title: "H2D technical specifications",
    url: "https://bambulab.com/en/h2d/tech-specs",
    kind: "Official specifications",
  },
  manual: {
    title: "H2D manuals & quick start guides",
    url: "https://bambulab.com/en/support/documentation/961610223821189120",
    kind: "Official manuals",
  },
  maintenance: {
    title: "H2D cleaning & maintenance",
    url: "https://wiki.bambulab.com/en/h2/maintenance/period-maintenance",
    kind: "Official Wiki",
  },
  hotend: {
    title: "H2D hotend: sizes, materials & compatibility",
    url: "https://us.store.bambulab.com/products/bambu-hotend-h2d",
    kind: "Official replacement part",
  },
  replaceHotend: {
    title: "Replace the H2D hotend",
    url: "https://wiki.bambulab.com/en/h2/maintenance/replace-hotend",
    kind: "Official installation guide",
  },
  extruder: {
    title: "Replace the dual extruder unit",
    url: "https://wiki.bambulab.com/en/h2/maintenance/replace-dual-extruder-unit",
    kind: "Official service guide",
  },
  gears: {
    title: "Dual extruder gears & switch cam",
    url: "https://wiki.bambulab.com/en/h2/maintenance/replace-dual-extruder-gears-switch-cam",
    kind: "Official service guide",
  },
  detection: {
    title: "H2D intelligent detection",
    url: "https://wiki.bambulab.com/en/h2/manual/intelligent-detection",
    kind: "Official Wiki",
  },
  wiper: {
    title: "Replace the nozzle wiping pad",
    url: "https://wiki.bambulab.com/en/h2/maintenance/replace-nozzle-wiping-pad",
    kind: "Official service guide",
  },
  cutter: {
    title: "Replace the filament cutter lever & blade",
    url: "https://wiki.bambulab.com/en/h2/maintenance/replace-filament-cutter-lever",
    kind: "Official service guide",
  },
  range: {
    title: "Printable range for dual nozzles",
    url: "https://wiki.bambulab.com/en/h2/manual/printable-range-for-dual-nozzles",
    kind: "Official Wiki",
  },
  ams: {
    title: "AMS 2 Pro documentation",
    url: "https://wiki.bambulab.com/en/ams-2-pro",
    kind: "Official Wiki",
  },
  studio: {
    title: "Bambu Studio",
    url: "https://bambulab.com/en/download/studio",
    kind: "Official software",
  },
  handy: {
    title: "Bambu Handy",
    url: "https://bambulab.com/en/download/app",
    kind: "Official software",
  },
  firmware: {
    title: "H2D firmware release history",
    url: "https://wiki.bambulab.com/en/h2d/manual/h2d-firmware-release-history",
    kind: "Official Wiki",
  },
  troubleshooting: {
    title: "H2D clog inspection & troubleshooting",
    url: "https://wiki.bambulab.com/en/h2/troubleshooting/clogging",
    kind: "Official troubleshooting guide",
  },
  parts: {
    title: "Bambu Lab replacement parts",
    url: "https://us.store.bambulab.com/collections/spare-parts",
    kind: "Official parts catalog",
  },
} as const;
export type SourceId = keyof typeof sources;
export const reviewed = "20 September 2026";
export const accuracyNotice =
  "This interactive model is an independent educational reconstruction based on publicly available specifications, documentation, product imagery, and service information. It is not official Bambu Lab engineering CAD.";
