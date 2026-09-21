export const printGallery = [
  {
    id: "lantern",
    name: "Lattice lantern",
    layers: 128,
    duration: 72,
    lesson: "Crossing spiral ribs",
    description:
      "A fluted pedestal, diamond windows and a scalloped crown. Infill closes the base; this study has no supports.",
    accent: "#a9cba6",
  },
  {
    id: "castle",
    name: "Miniature castle",
    layers: 128,
    duration: 80,
    lesson: "Arches & supports",
    description:
      "Four battlement towers surround a keep. Blue support paths hold up the front gate arch; hide the walls to explore its infill.",
    accent: "#d5bd91",
  },
  {
    id: "gears",
    name: "Gear assembly",
    layers: 52,
    duration: 58,
    lesson: "Teeth, hubs & infill",
    description:
      "Three toothed wheels with open central bores. Alternating infill connects their hub and rim perimeters in this static mechanical study.",
    accent: "#8fbdd1",
  },
  {
    id: "vase",
    name: "Sculpted vase",
    layers: 128,
    duration: 70,
    lesson: "Twisting outer walls",
    description:
      "A flowing twelve-flute profile turns as it rises. Its interior stays open; infill appears only in the closed base. No support paths are used.",
    accent: "#c2a6ce",
  },
] as const;
export type PrintModel = (typeof printGallery)[number]["id"];
export type PrintKind = "walls" | "infill" | "supports" | "travel";
export type PrintCamera = "Overview" | "Nozzle" | "Object" | "Inspect";
export const printKinds: PrintKind[] = [
  "walls",
  "infill",
  "supports",
  "travel",
];
export const printKindColors = {
  walls: "#c3d8b0",
  infill: "#dca66d",
  supports: "#80bfe6",
  travel: "#da91c5",
};
export const getPrintInfo = (id: PrintModel) =>
  printGallery.find((item) => item.id === id)!;
