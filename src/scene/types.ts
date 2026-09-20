import type { Category } from "../data/components";
export const modes = [
  "Standard",
  "Exploded",
  "Motion",
  "Filament",
  "Heat map",
  "Airflow",
  "Electronics",
  "Maintenance",
  "Print demo",
  "Dual nozzle",
] as const;
export type Mode = (typeof modes)[number];
export const views = [
  "Perspective",
  "Front",
  "Rear",
  "Left",
  "Right",
  "Top",
  "Interior",
] as const;
export type View = (typeof views)[number];
export interface ViewerState {
  printSeek: number;
  printKey: number;
  tourFocus: string[];
  quality: "Auto" | "Balanced" | "High";
  explosion: number;
  mode: Mode;
  selected: string | null;
  hidden: string[];
  ghost: string[];
  isolate: string[];
  labels: boolean;
  labelCategory: Category | "All";
  view: View;
  cameraKey: number;
  section: "Off" | "X" | "Y" | "Z";
  sectionPosition: number;
  showAMS: boolean;
  running: boolean;
  speed: number;
  nozzle: "Left" | "Right";
  reducedMotion: boolean;
}
export const initialViewer: ViewerState = {
  printSeek: 0,
  printKey: 0,
  tourFocus: [],
  quality: "Auto",
  explosion: 0,
  mode: "Standard",
  selected: null,
  hidden: [],
  ghost: [],
  isolate: [],
  labels: true,
  labelCategory: "All",
  view: "Perspective",
  cameraKey: 0,
  section: "Off",
  sectionPosition: 0,
  showAMS: false,
  running: false,
  speed: 1,
  nozzle: "Left",
  reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
};
