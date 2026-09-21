import type { SourceId } from "./sources";
import type { Mode, View } from "../scene/types";

export interface TourStep {
  title: string;
  label: string;
  body: string;
  observe: string;
  mode: Mode;
  view?: View;
  focus: string[];
  sources: SourceId[];
}

// A conceptual sequence, not printer firmware order or operating instructions.
export const printTour: TourStep[] = [
  {
    label: "Feed",
    title: "Follow the filament",
    body: "Filament travels through the guide tubes into the shared toolhead. Two separate inlet paths lead to the left and right hotends; the optional AMS manages material upstream.",
    observe:
      "Follow the moving dots toward the toolhead. The tube routes are reconstructed.",
    mode: "Filament",
    focus: [],
    sources: ["ptfe", "extruder", "ams"],
  },
  {
    label: "Heat",
    title: "Turn filament into a melt",
    body: "Each hotend heats its own extrusion path. The heated bed supports adhesion, while chamber heating is available when the material calls for it. Actual temperatures depend on the material profile.",
    observe:
      "Warm colors mark the heating zones. They are not measured temperatures.",
    mode: "Heat map",
    focus: ["hotend-left", "hotend-right", "heater", "bed", "chamber-heater"],
    sources: ["hotend", "tds"],
  },
  {
    label: "Move",
    title: "Two axes guide one toolhead",
    body: "The shared carriage moves along the X rail, and the gantry travels along the Y rods. Belts transmit motor motion. Both nozzles travel together, and the guide tubes flex with the carriage.",
    observe:
      "Watch the carriage move across the rail and the tube ends stay connected.",
    mode: "Motion",
    focus: [
      "x-rail",
      "y-rods",
      "belts",
      "motors",
      "carriage",
      "extruders",
      "tool-cover",
      "ptfe",
    ],
    sources: ["maintenance", "extruder"],
  },
  {
    label: "Build",
    title: "A shape grows one layer at a time",
    body: "Choose a lantern, castle, gear assembly or vase from the print gallery. The platform lowers as layers accumulate. Hide the walls to reveal infill, or follow the nozzle as it deposits each path.",
    observe:
      "Try the castle for supports beneath an arch. Travel moves do not extrude. These studies are illustrations, not G-code playback.",
    mode: "Print demo",
    focus: [],
    sources: ["product", "maintenance"],
  },
  {
    label: "Switch",
    title: "Give each nozzle a role",
    body: "Two extrusion paths allow different colors or materials, including a dedicated support material. The left nozzle has a lift mechanism. Both nozzles remain on the same carriage when the active path changes.",
    observe:
      "The active nozzle switches every few seconds. Green and blue show a model and its support concept.",
    mode: "Dual nozzle",
    focus: ["extruders", "hotend-left", "hotend-right", "lift", "ducts"],
    sources: ["extruder", "maintenance", "product"],
  },
  {
    label: "Cool",
    title: "Manage heat around the print",
    body: "Hotend cooling protects the cold side of the extrusion path. Part cooling directs air toward deposited material; chamber airflow and filtration serve other jobs. Their settings vary with the material and print.",
    observe:
      "Blue traces illustrate airflow roles. They do not model measured airflow or cooldown time.",
    mode: "Airflow",
    focus: [],
    sources: ["maintenance", "product"],
  },
];
