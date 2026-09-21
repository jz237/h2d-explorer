import type { Mode } from "../scene/types";
export const systemGuides: Partial<
  Record<Mode, { title: string; body: string; legend?: string[] }>
> = {
  Exploded: {
    title: "Separate the systems",
    body: "Enclosure panels move first. The gantry, extrusion paths, bed stack and rear modules separate along their assembly relationships. Drag the slider to study a transition.",
  },
  Motion: {
    title: "XY above. Z below.",
    body: "The toolhead travels across the X rail; the X assembly moves along Y rods. Three Z guide / leadscrew sets support the vertically moving bed. Speeds and belt routes are illustrative.",
  },
  Filament: {
    title: "A continuous material path",
    body: "Colored markers trace an example from the optional AMS to the selected extrusion path and nozzle. Left / right controls switch the highlighted path; actual tubing depends on your accessory setup.",
    legend: ["Green · left feed", "Blue · right feed"],
  },
  "Heat map": {
    title: "Different jobs, different temperatures",
    body: "These are published maximum temperatures, not recommended print settings. The colored geometry indicates thermal roles; it is not a measured temperature field.",
    legend: [
      "Orange · nozzle, up to 350 °C",
      "Amber · bed, up to 120 °C",
      "Yellow · chamber, up to 65 °C",
    ],
  },
  Airflow: {
    title: "Move heat. Manage air.",
    body: "Blue markers illustrate part cooling, chamber circulation and the filtration / exhaust route. They do not represent measured flow rate or an exact duct network.",
  },
  Electronics: {
    title: "Control is distributed",
    body: "The main controller, power system, toolhead board and sensors work together. Circuit boards and wires here are schematic: do not use them as a pinout or repair diagram.",
  },
  Maintenance: {
    title: "Find the serviceable parts",
    body: "Filter the tree by documented intervals. “Periodic” includes three-month cleaning and spool-count checks. Frequent engineering-material use can require shorter intervals. Follow the linked official procedure.",
  },
  "Print demo": {
    title: "A print, one layer at a time",
    body: "Choose a study from the gallery. Hide outer walls to reveal amber infill, toggle blue supports or trace magenta travel moves on the current layer. Follow the nozzle, focus on the object or inspect the finished print with the machine hidden. Colors identify teaching features, not material changes. These original paths illustrate construction; they are not slicer-generated G-code or functional manufacturing files.",
  },
  "Dual nozzle": {
    title: "Two materials on one carriage",
    body: "The left nozzle’s lift is documented. This animation exaggerates its travel and simplifies the switch sequence. The sample bridge uses green model material above blue support material.",
    legend: ["Green · model material", "Blue · support material"],
  },
};
