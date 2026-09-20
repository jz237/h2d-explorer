import {
  Component,
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Box,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Cpu,
  Eye,
  EyeOff,
  Focus,
  Home,
  Layers3,
  Maximize,
  Menu,
  Move3D,
  Pause,
  Play,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Tag,
  Thermometer,
  Wind,
  Wrench,
  X,
  Cable,
  Download,
  ScanLine,
  CircleDot,
  BookOpen,
  Check,
} from "lucide-react";
import { byId, categories, parts, type Category } from "./data/components";
import { specifications } from "./data/specifications";
import { systemGuides } from "./data/systemGuides";
import { accuracyNotice, sources } from "./data/sources";
import {
  initialViewer,
  modes,
  views,
  type Mode,
  type ViewerState,
} from "./scene/types";
import { Library } from "./ui/Library";
import { SourceLink } from "./ui/SourceLink";
import "./style.css";
const PrinterScene = lazy(() => import("./scene/PrinterScene"));
const modeIcons = [
  Box,
  Layers3,
  Move3D,
  Cable,
  Thermometer,
  Wind,
  Cpu,
  Wrench,
  Play,
  CopyNozzle,
];
function CopyNozzle({ size = 18 }: { size?: number }) {
  return <Layers3 size={size} />;
}
type Page =
  "Explore" | "Specifications" | "Documentation" | "Sources & accuracy";
class SceneError extends Component<
  { children: ReactNode },
  { error: boolean }
> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    return this.state.error ? (
      <div className="webgl-fallback">
        <h2>The 3D viewer could not start.</h2>
        <p>
          Try reloading with hardware acceleration enabled. You can still use
          the specifications and documentation tabs.
        </p>
        <button onClick={() => location.reload()}>Reload viewer</button>
      </div>
    ) : (
      this.props.children
    );
  }
}
export default function App() {
  const [page, setPage] = useState<Page>("Explore");
  const [state, setState] = useState<ViewerState>(initialViewer);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string[]>(["Enclosure"]);
  const [treeOpen, setTreeOpen] = useState(false);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [settings, setSettings] = useState(false);
  const [ready, setReady] = useState(false);
  const [auto, setAuto] = useState(false);
  const [help, setHelp] = useState(false);
  const [relatedOnly, setRelatedOnly] = useState(false);
  const [frequency, setFrequency] = useState("All");
  const [toast, setToast] = useState("");
  const [exporting, setExporting] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const viewerRef = useRef<HTMLElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const update = useCallback(
    (change: Partial<ViewerState>) => setState((s) => ({ ...s, ...change })),
    [],
  );
  const onReady = useCallback(() => setReady(true), []);
  const select = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      selected: id,
      running: false,
      ghost:
        byId[id].category === "Enclosure"
          ? []
          : parts
              .filter((p) => p.category === "Enclosure" && p.id !== "frame")
              .map((p) => p.id),
      isolate: s.isolate.length && !s.isolate.includes(id) ? [] : s.isolate,
      hidden: s.hidden.filter((x) => x !== id),
      showAMS: id === "ams" ? true : s.showAMS,
      cameraKey: s.cameraKey + 1,
    }));
    setExpanded((e) => [...new Set([...e, byId[id].category])]);
    setInspectorOpen(true);
    setRelatedOnly(false);
    setTreeOpen(false);
  }, []);
  function home() {
    setAuto(false);
    setState((s) => ({
      ...initialViewer,
      reducedMotion: s.reducedMotion,
      cameraKey: s.cameraKey + 1,
    }));
    setSearch("");
    setRelatedOnly(false);
    setFrequency("All");
    setInspectorOpen(false);
    setSettings(false);
  }
  const chooseMode = useCallback((mode: Mode) => {
    setAuto(false);
    setRelatedOnly(false);
    setState((s) => ({
      ...s,
      mode,
      selected: null,
      isolate: [],
      hidden: [],
      ghost: [],
      explosion: mode === "Exploded" ? 1 : 0,
      showAMS: mode === "Filament",
      running:
        !s.reducedMotion &&
        ["Motion", "Filament", "Airflow", "Print demo", "Dual nozzle"].includes(
          mode,
        ),
      view: "Perspective",
      cameraKey: s.cameraKey + 1,
    }));
  }, []);
  useEffect(() => {
    if (!auto) return;
    if (state.reducedMotion) {
      update({ explosion: 1 });
      setAuto(false);
      return;
    }
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const v = Math.min((now - start) / 10000, 1);
      update({ explosion: v });
      if (v < 1) frame = requestAnimationFrame(tick);
      else setAuto(false);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [auto, state.reducedMotion, update]);
  useEffect(() => {
    if (state.mode !== "Dual nozzle" || !state.running || state.reducedMotion)
      return;
    const timer = setInterval(
      () =>
        setState((s) => ({
          ...s,
          nozzle: s.nozzle === "Left" ? "Right" : "Left",
        })),
      5000 / state.speed,
    );
    return () => clearInterval(timer);
  }, [state.mode, state.running, state.speed, state.reducedMotion]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 3500);
    return () => clearTimeout(t);
  }, [toast]);
  useEffect(() => {
    if (help) dialogRef.current?.showModal();
    else dialogRef.current?.close();
  }, [help]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (
        (e.target as HTMLElement).matches("input,select,textarea") ||
        dialogRef.current?.open
      )
        return;
      if (e.key === "/") {
        e.preventDefault();
        setPage("Explore");
        setTreeOpen(true);
        setTimeout(() => searchRef.current?.focus(), 0);
      }
      if (e.key.toLowerCase() === "l")
        setState((s) => ({ ...s, labels: !s.labels }));
      if (e.key.toLowerCase() === "e") chooseMode("Exploded");
      if (e.key.toLowerCase() === "h") home();
      if (e.key === "Escape") {
        update({ selected: null, isolate: [], ghost: [] });
        setInspectorOpen(false);
      }
      if (e.key === "?") setHelp(true);
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [chooseMode, update]);
  async function exportGLB() {
    setExporting(true);
    try {
      const [{ GLTFExporter }, { createPrinter }] = await Promise.all([
        import("three/addons/exporters/GLTFExporter.js"),
        import("./scene/models"),
      ]);
      const model = createPrinter();
      const result = await new GLTFExporter().parseAsync(model, {
        binary: true,
      });
      const url = URL.createObjectURL(
        new Blob([result as ArrayBuffer], { type: "model/gltf-binary" }),
      );
      const a = document.createElement("a");
      a.href = url;
      a.download = "h2d-educational-reconstruction.glb";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      model.traverse((o) => {
        if ("geometry" in o) (o.geometry as { dispose: () => void }).dispose();
      });
      setToast("Reconstructed GLB exported. Accuracy labels are included.");
    } catch {
      setToast("Export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  }
  const selected = state.selected ? byId[state.selected] : null;
  const selectedSpecs = specifications.filter((s) =>
    selected?.specs?.includes(s.id),
  );
  const filtered = parts.filter(
    (p) =>
      (state.showAMS || p.id !== "ams" || search.trim()) &&
      `${p.name} ${p.category}`.toLowerCase().includes(search.toLowerCase()) &&
      (!relatedOnly || selected?.related?.includes(p.id)) &&
      (state.mode !== "Maintenance" ||
        (p.maintenance &&
          (frequency === "All" || p.maintenance.frequency === frequency))),
  );
  function toggleHidden(ids: string[]) {
    const all = ids.every((id) => state.hidden.includes(id));
    update({
      hidden: all
        ? state.hidden.filter((id) => !ids.includes(id))
        : [...new Set([...state.hidden, ...ids])],
    });
  }
  const animated = [
    "Motion",
    "Filament",
    "Airflow",
    "Print demo",
    "Dual nozzle",
  ].includes(state.mode);
  return (
    <div className="app">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <header className="topbar">
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setPage("Explore");
            home();
          }}
          aria-label="H2D Explorer home"
        >
          <span className="brand-mark">
            <Box size={24} />
          </span>
          <span>
            H2D<span className="brand-light"> EXPLORER</span>
          </span>
          <span className="beta">ENGINEERING SERIES / 01</span>
        </a>
        <nav aria-label="Main navigation">
          {(["Explore", "Specifications", "Documentation"] as Page[]).map(
            (p) => (
              <button
                key={p}
                className={page === p ? "active" : ""}
                onClick={() => setPage(p)}
              >
                {p}
              </button>
            ),
          )}
        </nav>
        <div className="top-actions">
          <button
            className="accuracy-button"
            onClick={() => setPage("Sources & accuracy")}
          >
            <span className="status-dot" />
            Independent reconstruction
            <ArrowUpRight size={13} />
          </button>
          <button
            className="icon-button"
            aria-label="Help and keyboard shortcuts"
            title="Help (?)"
            onClick={() => setHelp(true)}
          >
            <CircleHelp size={18} />
          </button>
        </div>
      </header>
      {page !== "Explore" ? (
        <Library key={page} page={page} />
      ) : (
        <main className="workspace" id="main-content">
          <aside
            className={"assembly-panel " + (treeOpen ? "mobile-open" : "")}
            aria-label="Assembly tree"
          >
            <div className="panel-title">
              <span>ASSEMBLY EXPLORER</span>
              <button
                className="mobile-close icon-button"
                onClick={() => setTreeOpen(false)}
                aria-label="Close assembly tree"
              >
                <X size={18} />
              </button>
              <span className="count">{parts.length}</span>
            </div>
            <label className="search-box">
              <Search size={15} />
              <input
                ref={searchRef}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setRelatedOnly(false);
                }}
                placeholder="Find a component…"
                aria-label="Search components"
              />
              <kbd>/</kbd>
            </label>
            <div className="tree-root">
              <Box size={18} />
              <strong>Bambu Lab H2D</strong>
              <span className="muted">01</span>
            </div>
            {relatedOnly && (
              <button
                className="filter-chip"
                onClick={() => setRelatedOnly(false)}
              >
                Related parts <X size={12} />
              </button>
            )}
            {state.mode === "Maintenance" && (
              <div className="maintenance-filter">
                <label>
                  Official service interval
                  <select
                    aria-label="Maintenance interval"
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                  >
                    {[
                      "All",
                      "Daily",
                      "Weekly",
                      "Monthly",
                      "Periodic",
                      "As needed",
                    ].map((x) => (
                      <option key={x}>{x}</option>
                    ))}
                  </select>
                </label>
              </div>
            )}
            <div className="tree-scroll">
              {categories.map((cat, index) => {
                const list = filtered.filter((p) => p.category === cat);
                if (!list.length) return null;
                const open =
                  expanded.includes(cat) || Boolean(search) || relatedOnly;
                const ids = parts
                  .filter((p) => p.category === cat)
                  .map((p) => p.id);
                return (
                  <section className="tree-category" key={cat}>
                    <div className="category-row">
                      <button
                        className="category-name"
                        onClick={() =>
                          setExpanded((e) =>
                            open ? e.filter((c) => c !== cat) : [...e, cat],
                          )
                        }
                        aria-expanded={open}
                      >
                        {open ? (
                          <ChevronDown size={13} />
                        ) : (
                          <ChevronRight size={13} />
                        )}
                        <span className="category-number">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        {cat}
                        <small>{list.length}</small>
                      </button>
                      <button
                        className="tree-tool"
                        title={`Hide / show ${cat}`}
                        aria-label={`Hide or show ${cat}`}
                        onClick={() => toggleHidden(ids)}
                      >
                        {ids.every((id) => state.hidden.includes(id)) ? (
                          <EyeOff size={12} />
                        ) : (
                          <Eye size={12} />
                        )}
                      </button>
                      <button
                        className="tree-tool"
                        title={`Isolate ${cat}`}
                        aria-label={`Isolate ${cat}`}
                        onClick={() => update({ isolate: ids, selected: null })}
                      >
                        <Focus size={12} />
                      </button>
                      <button
                        className="tree-tool"
                        title={`Ghost ${cat}`}
                        aria-label={`Ghost ${cat}`}
                        onClick={() =>
                          update({
                            ghost: ids.every((id) => state.ghost.includes(id))
                              ? state.ghost.filter((id) => !ids.includes(id))
                              : [...new Set([...state.ghost, ...ids])],
                          })
                        }
                      >
                        <Layers3 size={12} />
                      </button>
                    </div>
                    {open && (
                      <div className="tree-children">
                        {list.map((p) => (
                          <div
                            className={
                              "part-row " +
                              (state.selected === p.id ? "selected" : "") +
                              (state.hidden.includes(p.id)
                                ? " hidden-part"
                                : "")
                            }
                            key={p.id}
                          >
                            <button onClick={() => select(p.id)}>
                              <span className="tree-dot" />
                              {p.name}
                            </button>
                            <button
                              className="tree-tool"
                              onClick={() => toggleHidden([p.id])}
                              aria-label={`${state.hidden.includes(p.id) ? "Show" : "Hide"} ${p.name}`}
                              title="Toggle visibility"
                            >
                              {state.hidden.includes(p.id) ? (
                                <EyeOff size={13} />
                              ) : (
                                <Eye size={13} />
                              )}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                );
              })}
              {filtered.length === 0 && (
                <div className="empty">
                  <Search size={20} />
                  <p>
                    {state.mode === "Maintenance"
                      ? "No verified tasks in this interval."
                      : "No matching components."}
                  </p>
                  <button
                    onClick={() => {
                      setSearch("");
                      setFrequency("All");
                      setRelatedOnly(false);
                    }}
                  >
                    Clear filters
                  </button>
                </div>
              )}
            </div>
            <div className="tree-footer">
              <span className="status-dot" />
              {
                parts.filter(
                  (p) =>
                    !state.hidden.includes(p.id) &&
                    (state.showAMS || p.id !== "ams") &&
                    (!state.isolate.length || state.isolate.includes(p.id)),
                ).length
              }{" "}
              components shown
              <button
                onClick={() => update({ hidden: [], ghost: [], isolate: [] })}
              >
                Show all
              </button>
            </div>
            <button
              className="tree-guide"
              onClick={() => setPage("Documentation")}
            >
              <BookOpen size={17} />
              <span>
                From model to manual
                <small>Explore official documentation</small>
              </span>
              <ArrowUpRight size={16} />
            </button>
          </aside>
          <section
            className="viewer-column"
            ref={viewerRef}
            aria-label="Interactive 3D workspace"
          >
            <div className="scene-area">
              <div className="scene-heading">
                <div className="eyebrow">
                  <span className="status-dot" />
                  INSIDE THE MACHINE
                </div>
                <h1>
                  Bambu Lab <span>H2D</span>
                </h1>
                <p>A closer look. A deeper understanding.</p>
              </div>
              <div className="scene-top-right">
                <span className="live-badge">INTERACTIVE 3D</span>
                <button
                  className="icon-button"
                  aria-label="Toggle full screen"
                  title="Full screen"
                  onClick={() => {
                    if (document.fullscreenElement)
                      void document.exitFullscreen();
                    else
                      void viewerRef.current
                        ?.requestFullscreen()
                        .catch(() =>
                          setToast(
                            "Fullscreen is unavailable in this browser.",
                          ),
                        );
                  }}
                >
                  <Maximize size={16} />
                </button>
              </div>
              <SceneError>
                <Suspense
                  fallback={
                    <div className="loading">
                      <Box size={32} />
                      <strong>Preparing the assembly</strong>
                      <span>Loading the 3D engine…</span>
                    </div>
                  }
                >
                  <PrinterScene
                    state={state}
                    onSelect={select}
                    onReady={onReady}
                  />
                </Suspense>
              </SceneError>
              {!ready && (
                <div className="loading">
                  <Box size={32} />
                  <strong>Building the H2D</strong>
                  <span>Constructing geometry and lighting…</span>
                </div>
              )}
              <div className="scene-left-tools">
                <button
                  className="icon-button mobile-tree-toggle"
                  aria-label="Open assembly tree"
                  title="Components"
                  onClick={() => setTreeOpen(true)}
                >
                  <Menu size={19} />
                </button>
                <button
                  className="icon-button"
                  onClick={home}
                  aria-label="Home: assembled printer"
                  title="Home (H)"
                >
                  <Home size={18} />
                </button>
                <button
                  className="icon-button"
                  onClick={() =>
                    update({
                      selected: null,
                      cameraKey: state.cameraKey + 1,
                      view: "Perspective",
                    })
                  }
                  aria-label="Reset camera"
                  title="Reset camera"
                >
                  <RotateCcw size={18} />
                </button>
                <button
                  className={"icon-button " + (state.labels ? "on" : "")}
                  onClick={() => update({ labels: !state.labels })}
                  aria-label="Toggle labels"
                  aria-pressed={state.labels}
                  title="Labels (L)"
                >
                  <Tag size={18} />
                </button>
                <button
                  className={"icon-button " + (settings ? "on" : "")}
                  onClick={() => setSettings(!settings)}
                  aria-label="Viewer settings and cross-section"
                  title="Viewer settings"
                >
                  <SlidersHorizontal size={18} />
                </button>
              </div>
              {settings && (
                <div className="viewer-settings">
                  <div className="panel-title">
                    VIEWER SETTINGS
                    <button
                      className="icon-button"
                      aria-label="Close settings"
                      onClick={() => setSettings(false)}
                    >
                      <X size={15} />
                    </button>
                  </div>
                  <label>
                    Section plane
                    <select
                      aria-label="Section axis"
                      value={state.section}
                      onChange={(e) =>
                        update({
                          section: e.target.value as ViewerState["section"],
                        })
                      }
                    >
                      {["Off", "X", "Y", "Z"].map((x) => (
                        <option key={x}>{x}</option>
                      ))}
                    </select>
                  </label>
                  {state.section !== "Off" && (
                    <label>
                      Section position
                      <input
                        aria-label="Section position"
                        type="range"
                        min="-1"
                        max="1"
                        step=".01"
                        value={state.sectionPosition}
                        onChange={(e) =>
                          update({ sectionPosition: Number(e.target.value) })
                        }
                      />
                    </label>
                  )}
                  <label>
                    Label category
                    <select
                      aria-label="Label category"
                      value={state.labelCategory}
                      onChange={(e) =>
                        update({
                          labelCategory: e.target.value as Category | "All",
                        })
                      }
                    >
                      {["All", ...categories].map((x) => (
                        <option key={x}>{x}</option>
                      ))}
                    </select>
                  </label>
                  <label className="check-row">
                    <input
                      type="checkbox"
                      checked={state.showAMS}
                      onChange={(e) => update({ showAMS: e.target.checked })}
                    />
                    Show optional AMS 2 Pro
                  </label>
                  <label className="check-row">
                    <input
                      type="checkbox"
                      checked={state.reducedMotion}
                      onChange={(e) =>
                        update({
                          reducedMotion: e.target.checked,
                          running: false,
                        })
                      }
                    />
                    Reduce motion
                  </label>
                  <button
                    className="secondary-button"
                    disabled={exporting}
                    onClick={() => void exportGLB()}
                  >
                    <Download size={15} />
                    {exporting
                      ? "Preparing export…"
                      : "Export reconstructed GLB"}
                  </button>
                </div>
              )}
              <div className="view-selector">
                <ScanLine size={14} />
                <select
                  aria-label="Camera view"
                  value={state.view}
                  onChange={(e) =>
                    update({
                      view: e.target.value as ViewerState["view"],
                      selected: null,
                      cameraKey: state.cameraKey + 1,
                    })
                  }
                >
                  {views.map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
                <ChevronDown size={12} />
              </div>
              <div className="axis-key" aria-hidden="true">
                <span className="axis-y">Y</span>
                <span className="axis-x">X</span>
                <span className="axis-z">Z</span>
                <i />
              </div>
              <div className="orbit-hint">
                Drag to orbit <span>·</span> Scroll to zoom <span>·</span>{" "}
                Right-drag to pan
              </div>
              {(state.isolate.length > 0 ||
                state.ghost.length > 0 ||
                state.hidden.length > 0) && (
                <button
                  className="restore-view"
                  onClick={() => update({ isolate: [], ghost: [], hidden: [] })}
                >
                  <Eye size={14} />
                  Restore all components
                </button>
              )}
              <div className="mode-note">
                {state.mode === "Heat map"
                  ? "Illustrative thermal zones — not measured thermal imaging."
                  : state.mode === "Airflow"
                    ? "Illustrative airflow — not a fluid simulation."
                    : state.mode === "Dual nozzle"
                      ? "Left nozzle lift is documented. Travel and switching sequence are simplified."
                      : state.mode === "Print demo"
                        ? "Illustrative layer sequence — not a slicer or calibrated toolpath."
                        : "Approximate geometry — reconstructed from available documentation."}
              </div>
              {animated && (
                <div className="animation-bar">
                  <button
                    className="icon-button"
                    aria-label={
                      state.running ? "Pause animation" : "Play animation"
                    }
                    onClick={() => update({ running: !state.running })}
                    disabled={state.reducedMotion}
                  >
                    {state.running ? <Pause size={16} /> : <Play size={16} />}
                  </button>
                  <span>
                    {state.mode === "Dual nozzle"
                      ? `${state.nozzle} nozzle active`
                      : state.mode === "Print demo"
                        ? "Layer-by-layer study"
                        : "System animation"}
                  </span>
                  <select
                    aria-label="Animation speed"
                    value={state.speed}
                    onChange={(e) => update({ speed: Number(e.target.value) })}
                  >
                    {[1, 5, 20].map((n) => (
                      <option key={n} value={n}>
                        {n}×
                      </option>
                    ))}
                  </select>
                  {["Filament", "Dual nozzle", "Print demo"].includes(
                    state.mode,
                  ) && (
                    <div className="nozzle-switch">
                      {(["Left", "Right"] as const).map((n) => (
                        <button
                          key={n}
                          className={state.nozzle === n ? "active" : ""}
                          onClick={() => update({ nozzle: n })}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="explosion-control">
              <div className="explosion-title">
                <Layers3 size={17} />
                <span>Exploded view</span>
                <strong>
                  {Math.round(state.explosion * 100)}
                  <small>%</small>
                </strong>
              </div>
              <div className="explosion-range">
                <input
                  type="range"
                  aria-label="Explosion percentage"
                  min="0"
                  max="100"
                  value={state.explosion * 100}
                  onChange={(e) => {
                    setAuto(false);
                    update({
                      explosion: Number(e.target.value) / 100,
                      running: false,
                      mode: "Exploded",
                    });
                  }}
                  style={
                    {
                      "--range-progress": `${state.explosion * 100}%`,
                    } as React.CSSProperties
                  }
                />
                <div>
                  <button onClick={home}>ASSEMBLED</button>
                  <button onClick={() => chooseMode("Exploded")}>FULLY EXPLODED</button>
                </div>
              </div>
              <button
                className={"auto-button " + (auto ? "active" : "")}
                onClick={() => {
                  if (auto) setAuto(false);
                  else {
                    update({
                      mode: "Exploded",
                      explosion: 0,
                      running: false,
                      selected: null,
                      cameraKey: state.cameraKey + 1,
                    });
                    setAuto(true);
                  }
                }}
              >
                {auto ? <Pause size={14} /> : <Play size={14} />}
                <span>{auto ? "Pause" : "Auto explode"}</span>
              </button>
              <button
                className="icon-button"
                title="Reset explosion"
                aria-label="Reset explosion"
                onClick={() => {
                  setAuto(false);
                  update({ explosion: 0, mode: "Standard", running: false });
                }}
              >
                <RotateCcw size={16} />
              </button>
            </div>
            <div
              className="mode-strip"
              role="toolbar"
              aria-label="Visualization modes"
            >
              {modes.map((mode, i) => {
                const Icon = modeIcons[i];
                return (
                  <button
                    key={mode}
                    className={state.mode === mode ? "active" : ""}
                    onClick={() => chooseMode(mode)}
                    aria-pressed={state.mode === mode}
                  >
                    <Icon size={17} />
                    <span>{mode}</span>
                  </button>
                );
              })}
            </div>
          </section>
          <aside
            className={"inspector " + (inspectorOpen ? "mobile-open" : "")}
            aria-label="Component information"
          >
            <div className="panel-title">
              <span>
                {selected ? "COMPONENT INSPECTOR" : "MACHINE OVERVIEW"}
              </span>
              <button
                className="icon-button"
                aria-label="Close inspector"
                onClick={() => {
                  update({ selected: null });
                  setInspectorOpen(false);
                }}
              >
                {selected ? <X size={15} /> : <CircleDot size={15} />}
              </button>
            </div>
            <div className="inspector-scroll">
              {selected ? (
                <>
                  <div className="component-id">
                    {selected.category}{" "}
                    <span>
                      / {String(parts.indexOf(selected) + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <div className="component-symbol">
                    <Box size={35} />
                    <span>{selected.category.toUpperCase()}</span>
                  </div>
                  <h2>{selected.name}</h2>
                  <span className="accuracy-tag">
                    <span className="accuracy-dot" />
                    {selected.accuracy}
                  </span>
                  <p className="description">{selected.description}</p>
                  <div className="info-line">
                    <span>LOCATION</span>
                    <p>{selected.location}</p>
                  </div>
                  {selectedSpecs.length > 0 && (
                    <div className="component-specs">
                      {selectedSpecs.map((s) => (
                        <div key={s.id}>
                          <span>{s.label}</span>
                          <strong>{s.value}</strong>
                          <SourceLink id={s.source} short />
                        </div>
                      ))}
                    </div>
                  )}
                  {selected.maintenance && (
                    <div className="service-card">
                      <Wrench size={17} />
                      <div>
                        <strong>Maintenance</strong>
                        <p>{selected.maintenance.label}</p>
                        {selected.maintenance.note && (
                          <small>{selected.maintenance.note}</small>
                        )}
                        <SourceLink id="maintenance" short />
                      </div>
                    </div>
                  )}
                  <div className="inspector-actions">
                    <button
                      className="secondary-button"
                      onClick={() =>
                        update({
                          isolate: state.isolate.includes(selected.id)
                            ? []
                            : [selected.id],
                        })
                      }
                    >
                      <Focus size={14} />
                      Isolate
                    </button>
                    <button
                      className="secondary-button"
                      onClick={() =>
                        update({
                          ghost: state.ghost.length
                            ? []
                            : parts
                                .filter((p) => p.id !== selected.id)
                                .map((p) => p.id),
                        })
                      }
                    >
                      <Layers3 size={14} />
                      Ghost others
                    </button>
                    <button
                      className="secondary-button"
                      onClick={() => {
                        update({
                          ghost: [],
                          hidden: [],
                          isolate: [],
                          cameraKey: state.cameraKey + 1,
                        });
                      }}
                    >
                      <RotateCcw size={14} />
                      Reset view
                    </button>
                    <button
                      className="secondary-button"
                      disabled={!selected.related?.length}
                      onClick={() => {
                        setRelatedOnly(!relatedOnly);
                        setSearch("");
                        setTreeOpen(true);
                        setExpanded([...categories]);
                      }}
                    >
                      <Cable size={14} />
                      Related parts
                    </button>
                  </div>
                  <a
                    className="primary-button"
                    href={sources[selected.sources[0]].url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open documentation
                    <ArrowUpRight size={15} />
                  </a>
                  <h3 className="eyebrow source-heading">
                    OFFICIAL REFERENCES
                  </h3>
                  <div className="component-sources">
                    {selected.sources.map((id) => (
                      <SourceLink id={id} key={id} />
                    ))}
                  </div>
                  <p className="fineprint">
                    Approximate geometry — reconstructed from available
                    documentation. Consult official instructions before
                    servicing the physical printer.
                  </p>
                </>
              ) : (
                <>
                  <div className="overview-kicker">BAMBU LAB / H SERIES</div>
                  <h2>Meet the H2D.</h2>
                  <p className="description">
                    Two nozzles. One connected system. Explore the assemblies
                    that turn filament into a finished object.
                  </p>
                  {systemGuides[state.mode] && (
                    <div className="system-guide">
                      <h3>{systemGuides[state.mode]!.title}</h3>
                      <p>{systemGuides[state.mode]!.body}</p>
                      {systemGuides[state.mode]!.legend?.map((line) => (
                        <small key={line}>{line}</small>
                      ))}
                      {state.mode === "Heat map" && (
                        <SourceLink id="tds" short />
                      )}
                    </div>
                  )}
                  <div className="overview-stats">
                    <div>
                      <span>MAX. NOZZLE</span>
                      <strong>
                        350<small>°C</small>
                      </strong>
                      <SourceLink id="product" short />
                    </div>
                    <div>
                      <span>HEATED CHAMBER</span>
                      <strong>
                        65<small>°C</small>
                      </strong>
                      <SourceLink id="product" short />
                    </div>
                  </div>
                  <div className="volume-card">
                    <Box size={23} />
                    <span>
                      DUAL-NOZZLE SHARED VOLUME
                      <strong>
                        300 × 320 × 325 <small>mm</small>
                      </strong>
                      <SourceLink id="product" short />
                    </span>
                  </div>
                  <div className="divider" />
                  <span className="eyebrow">FOLLOW YOUR CURIOSITY</span>
                  <button
                    className="tour-card"
                    onClick={() => chooseMode("Exploded")}
                  >
                    <span className="tour-number">01</span>
                    <span>
                      Take it apart<small>Discover the assembly</small>
                    </span>
                    <ArrowRight size={16} />
                  </button>
                  <button
                    className="tour-card"
                    onClick={() => chooseMode("Filament")}
                  >
                    <span className="tour-number">02</span>
                    <span>
                      Follow the filament<small>From spool to nozzle</small>
                    </span>
                    <ArrowRight size={16} />
                  </button>
                  <button
                    className="tour-card"
                    onClick={() => chooseMode("Dual nozzle")}
                  >
                    <span className="tour-number">03</span>
                    <span>
                      Two paths, one print
                      <small>Understand nozzle switching</small>
                    </span>
                    <ArrowRight size={16} />
                  </button>
                  <button
                    className="tour-card"
                    onClick={() => chooseMode("Maintenance")}
                  >
                    <span className="tour-number">04</span>
                    <span>
                      Keep it running<small>Find serviceable components</small>
                    </span>
                    <ArrowRight size={16} />
                  </button>
                  <div className="hint-card">
                    <Focus size={20} />
                    <p>
                      Select any component in the model or assembly tree to
                      inspect its function and references.
                    </p>
                  </div>
                  <button
                    className="text-button"
                    onClick={() => setPage("Sources & accuracy")}
                  >
                    How accurate is this model?
                    <ArrowUpRight size={14} />
                  </button>
                </>
              )}
            </div>
            <div className="inspector-bottom">
              <span className="status-dot" />
              REFERENCE-BASED RECONSTRUCTION
            </div>
          </aside>
          <button
            className="mobile-info"
            onClick={() => setInspectorOpen(true)}
          >
            <Box size={16} />
            {selected ? selected.name : "Machine overview"}
            <ChevronRight size={15} />
          </button>
        </main>
      )}
      <footer className="statusbar">
        <span>
          <span className="status-dot" />
          H2D EXPLORER <span className="footer-divider">/</span> An independent
          engineering study
        </span>
        <button onClick={() => setPage("Sources & accuracy")}>
          Sources & accuracy
          <ArrowUpRight size={12} />
        </button>
        <span className="statusbar-right">
          DESIGNED TO BE EXPLORED <ArrowDown size={12} />
        </span>
      </footer>
      <dialog
        ref={dialogRef}
        onClose={() => setHelp(false)}
        onCancel={() => setHelp(false)}
        className="help-dialog"
      >
        <button
          className="icon-button dialog-close"
          aria-label="Close help"
          onClick={() => setHelp(false)}
        >
          <X size={20} />
        </button>
        <span className="eyebrow">MAKE YOURSELF AT HOME</span>
        <h2>A machine you can explore.</h2>
        <p>
          Drag to orbit, scroll or pinch to zoom, and right-drag or use two
          fingers to pan. Select a component to focus it. All parts are also
          accessible through the assembly tree.
        </p>
        <div className="keyboard-grid">
          {[
            ["/", "Find a component"],
            ["H", "Home / assembled"],
            ["E", "Exploded view"],
            ["L", "Toggle labels"],
            ["Esc", "Clear selection"],
            ["?", "This guide"],
          ].map(([key, text]) => (
            <div key={key}>
              <kbd>{key}</kbd>
              <span>{text}</span>
            </div>
          ))}
        </div>
        <p className="fineprint">{accuracyNotice}</p>
        <button className="primary-button" onClick={() => setHelp(false)}>
          Start exploring
          <ArrowRight size={16} />
        </button>
      </dialog>
      {toast && (
        <div className="toast" role="status">
          <Check size={16} />
          {toast}
        </div>
      )}
    </div>
  );
}
