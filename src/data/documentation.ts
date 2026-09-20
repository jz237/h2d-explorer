import type { SourceId } from "./sources";
export const documentation: { category: string; items: SourceId[] }[] = [
  {
    category: "Start here",
    items: ["manual", "tds", "product", "specs", "range"],
  },
  {
    category: "Maintenance & installation",
    items: [
      "maintenance",
      "replaceHotend",
      "extruder",
      "gears",
      "wiper",
      "cutter",
    ],
  },
  { category: "Parts & material handling", items: ["parts", "hotend", "ams"] },
  {
    category: "Troubleshooting, detection & software",
    items: ["troubleshooting", "detection", "firmware", "studio", "handy"],
  },
];
