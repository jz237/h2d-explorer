import { useEffect, useRef, useState } from "react";
import { ArrowRight, Check, Layers3, RotateCcw, X } from "lucide-react";
import {
  getPrintInfo,
  printGallery,
  printKinds,
  printKindColors,
  type PrintCamera,
  type PrintModel,
} from "../data/printGallery";
import type { ViewerState } from "../scene/types";

function PrintThumbnail({ id }: { id: PrintModel }) {
  return (
    <svg
      viewBox="0 0 120 76"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      {id === "lantern" ? (
        <>
          <ellipse cx="60" cy="12" rx="25" ry="6" />
          <ellipse cx="60" cy="64" rx="25" ry="6" />
          {[-22, -11, 0, 11, 22].map((x) => (
            <path
              key={x}
              d={`M${60 + x} 16 Q${90 - x} 39 ${60 + x} 60 M${60 + x} 16 Q${30 - x} 39 ${60 + x} 60`}
            />
          ))}
        </>
      ) : id === "castle" ? (
        <>
          <path d="M24 66V20h6V10h8v10h7V10h8v10h5v46M65 66V20h6V10h8v10h7V10h8v10h5v46M25 40h73M49 65V53a11 11 0 0 1 22 0v12M20 67h84" />
          <path d="M38 30v6m47-6v6M57 40V26h15v14" />
        </>
      ) : id === "gears" ? (
        <>
          {[
            [40, 32, 22],
            [82, 31, 16],
            [67, 61, 12],
          ].map(([x, y, r]) => (
            <g key={x}>
              <path
                d={
                  Array.from({ length: 48 }, (_, i) => {
                    const a = (i / 48) * Math.PI * 2,
                      rr = r * (i % 4 < 2 ? 1 : 0.8);
                    return `${i ? "L" : "M"}${x + Math.cos(a) * rr} ${y + Math.sin(a) * rr}`;
                  }).join(" ") + "Z"
                }
              />
              <circle cx={x} cy={y} r={r * 0.28} />
            </g>
          ))}
        </>
      ) : (
        <>
          <path d="M44 10C24 27 29 39 41 56l2 10h34l2-10c12-17 17-29-3-46M44 10q16 9 32 0M43 66q17-6 34 0" />
          {[0, 1, 2, 3].map((i) => (
            <path
              key={i}
              d={`M${46 + i * 9} 12C${26 + i * 11} 34 ${57 + i * 7} 41 ${46 + i * 9} 64`}
            />
          ))}
        </>
      )}
    </svg>
  );
}
export function PrintControls({
  state,
  progress,
  onSeek,
  onModel,
  onCamera,
  onChange,
}: {
  state: ViewerState;
  progress: number;
  onSeek: (p: number, running?: boolean) => void;
  onModel: (id: PrintModel) => void;
  onCamera: (camera: PrintCamera) => void;
  onChange: (change: Partial<ViewerState>) => void;
}) {
  const [panel, setPanel] = useState<"gallery" | "layers" | null>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const layerTrigger = useRef<HTMLButtonElement>(null);
  const options = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (panel)
      options.current
        ?.querySelector<HTMLElement>('[aria-pressed="true"], input')
        ?.focus({ preventScroll: true });
  }, [panel]);
  const info = getPrintInfo(state.printModel);
  const close = () => {
    setPanel(null);
    requestAnimationFrame(() =>
      (panel === "layers" ? layerTrigger : trigger).current?.focus(),
    );
  };
  return (
    <section
      className="print-timeline print-controls"
      aria-label="Print workbench"
      onKeyDown={(e) => {
        if (e.key === "Escape" && panel) {
          e.stopPropagation();
          close();
        }
      }}
    >
      <div className="print-timeline-title">
        <strong>{info.name}</strong>
        <span>{info.layers} layers · illustrative toolpath</span>
        <output aria-label="Print completion">{progress}%</output>
      </div>
      <div className="print-tools">
        <button
          ref={trigger}
          className={panel === "gallery" ? "selected" : ""}
          onClick={() => setPanel(panel === "gallery" ? null : "gallery")}
          aria-expanded={panel === "gallery"}
          aria-controls="print-options"
        >
          <Layers3 size={14} /> Choose print{" "}
          <span className="gallery-count">4</span>
        </button>
        <button
          ref={layerTrigger}
          className={panel === "layers" ? "selected" : ""}
          onClick={() => setPanel(panel === "layers" ? null : "layers")}
          aria-expanded={panel === "layers"}
          aria-controls="print-options"
        >
          Walls & infill
        </button>
        <select
          aria-label="Print camera"
          value={state.printCamera}
          onChange={(e) => onCamera(e.target.value as PrintCamera)}
        >
          <option value="Overview">Printer overview</option>
          <option value="Nozzle">Follow nozzle</option>
          <option value="Object">Focus on object</option>
          <option value="Inspect">Inspect finished print</option>
        </select>
      </div>
      <div className="print-timeline-controls">
        <button onClick={() => onSeek(0, true)} aria-label="Restart print">
          <RotateCcw size={15} />
        </button>
        <input
          type="range"
          min="0"
          max="100"
          step="1"
          value={progress}
          aria-label="Print progress"
          onChange={(e) => onSeek(Number(e.target.value))}
        />
        <button className="print-finish" onClick={() => onSeek(100)}>
          Show finished print <ArrowRight size={13} />
        </button>
      </div>
      {panel && (
        <div
          id="print-options"
          ref={options}
          className="print-options"
          role="region"
          aria-label={
            panel === "gallery" ? "Print gallery" : "Print layer visibility"
          }
        >
          <div className="print-options-heading">
            <strong>
              {panel === "gallery"
                ? "Choose your next print"
                : "Look inside the print"}
            </strong>
            <button aria-label="Close print options" onClick={close}>
              <X size={16} />
            </button>
          </div>
          {panel === "gallery" ? (
            <>
              <div className="print-gallery">
                {printGallery.map((item) => (
                  <button
                    key={item.id}
                    aria-pressed={state.printModel === item.id}
                    aria-label={`Print ${item.name}`}
                    style={
                      { "--print-accent": item.accent } as React.CSSProperties
                    }
                    onClick={() => {
                      onModel(item.id);
                      close();
                    }}
                  >
                    <PrintThumbnail id={item.id} />
                    <strong>
                      {item.name}
                      {state.printModel === item.id && <Check size={12} />}
                    </strong>
                    <small>{item.lesson}</small>
                  </button>
                ))}
              </div>
              <p>
                Each study has its own layer paths. Choosing a model starts a
                new print.
              </p>
            </>
          ) : (
            <>
              <div className="print-layer-options">
                {printKinds.map((kind) => (
                  <label
                    key={kind}
                    style={
                      {
                        "--kind-color": printKindColors[kind],
                      } as React.CSSProperties
                    }
                  >
                    <input
                      type="checkbox"
                      checked={state.printLayers.includes(kind)}
                      onChange={(e) =>
                        onChange({
                          printLayers: e.target.checked
                            ? [...state.printLayers, kind]
                            : state.printLayers.filter((k) => k !== kind),
                        })
                      }
                    />
                    <i />
                    {
                      {
                        walls: "Outer walls",
                        infill: "Infill",
                        supports: "Supports",
                        travel: "Travel moves",
                      }[kind]
                    }
                  </label>
                ))}
              </div>
              <p>{info.description}</p>
              <p>
                Visibility controls do not change the toolpath. Magenta travel
                lines show completed moves on the current layer without
                extrusion.
              </p>
              {!state.printLayers.length && (
                <p className="empty-print-note">
                  All print layers are hidden. Enable a layer above to see the
                  object.
                </p>
              )}
            </>
          )}
        </div>
      )}
    </section>
  );
}
