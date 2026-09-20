import { useState } from "react";
import { ArrowUpRight, BookOpen, Check, Search } from "lucide-react";
import { specifications } from "../data/specifications";
import { sources, reviewed, accuracyNotice } from "../data/sources";
import { documentation } from "../data/documentation";
import { SourceLink } from "./SourceLink";
export function Library({
  page,
}: {
  page: "Specifications" | "Documentation" | "Sources & accuracy";
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  if (page === "Sources & accuracy")
    return (
      <main id="main-content" tabIndex={-1} className="library accuracy-page">
        <span className="eyebrow">OPEN BY DESIGN</span>
        <h1>Know what you’re looking at.</h1>
        <p className="lead">{accuracyNotice}</p>
        <div className="accuracy-grid">
          <article>
            <span className="accuracy-dot reference" />
            <h2>Reference-based geometry</h2>
            <p>
              The exterior proportions follow published dimensions and product
              imagery. Shapes, wall thicknesses and mounting features remain
              reconstructed.
            </p>
          </article>
          <article>
            <span className="accuracy-dot" />
            <h2>Approximate geometry</h2>
            <p>
              Internal boards, transmission routes, fans, ducts, sensors and
              mounts are teaching models. They are not suitable for fabrication
              or service measurements.
            </p>
          </article>
          <article>
            <Check size={21} />
            <h2>Verified specifications</h2>
            <p>
              Every numerical specification is stored with its official source.
              No component in this model is labeled verified factory geometry.
            </p>
          </article>
        </div>
        <h2>What the animations mean</h2>
        <p>
          XYZ motion, material feeding, nozzle switching and layer growth are
          simplified explanations. The left nozzle lift is documented; travel,
          timing and the internal linkage shown here are illustrative. Thermal
          zones are not measured thermal imaging. Airflow paths are not
          computational fluid dynamics.
        </p>
        <h2>Asset provenance</h2>
        <p>
          All displayed 3D geometry is original and generated within this
          project. Public model searches found community H2D references, but did
          not establish a complete openly licensed internal CAD assembly. No
          third-party CAD, product photography or proprietary assets are
          redistributed. The GLB export contains this same reconstruction.
        </p>
        <h2>Research scope</h2>
        <p>
          This guide covers the H2D’s 3D-printing architecture, with optional
          AMS 2 Pro context. Laser and cutting modules are not modeled.
          Unverified noise levels and material-specific settings are omitted.
          Electrical ratings are attributed to the official data sheet. Service
          guidance belongs to the official manual.
        </p>
        <p className="muted">
          Sources reviewed {reviewed}. Regional variants and documentation can
          change.
        </p>
        <div className="source-catalog">
          {Object.entries(sources).map(([id, s]) => (
            <a href={s.url} key={id} target="_blank" rel="noreferrer">
              <span>
                {s.title}
                <small>{s.kind}</small>
              </span>
              <ArrowUpRight size={18} />
            </a>
          ))}
        </div>
      </main>
    );
  if (page === "Documentation")
    return (
      <main id="main-content" tabIndex={-1} className="library">
        <span className="eyebrow">THE REFERENCE DESK</span>
        <h1>Keep the official guide close.</h1>
        <p className="lead">
          Go from an illustrated component to Bambu Lab’s instructions,
          maintenance guidance and technical references.
        </p>
        <div className="document-grid">
          {documentation.map((group) => (
            <section key={group.category}>
              <h2>{group.category}</h2>
              {group.items.map((id) => (
                <a
                  key={id}
                  href={sources[id].url}
                  target="_blank"
                  rel="noreferrer"
                >
                  <BookOpen size={19} />
                  <span>
                    {sources[id].title}
                    <small>{sources[id].kind}</small>
                  </span>
                  <ArrowUpRight size={16} />
                </a>
              ))}
            </section>
          ))}
        </div>
        <p className="fineprint">
          Links open the official website. Follow the current instructions for
          your exact printer configuration.
        </p>
      </main>
    );
  const rows = specifications.filter(
    (s) =>
      (category === "All" || s.category === category) &&
      `${s.label} ${s.value} ${s.note ?? ""}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  return (
    <main id="main-content" tabIndex={-1} className="library">
      <span className="eyebrow">FACTS, WITH FOOTNOTES</span>
      <h1>The numbers behind the machine.</h1>
      <p className="lead">
        Published limits and documented features. Each entry takes you directly
        to its source.
      </p>
      <div className="spec-search">
        <label className="search-box">
          <Search size={17} />
          <input
            aria-label="Search specifications"
            placeholder="Search dimensions, temperature, nozzle…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <select
          aria-label="Specification category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          {["All", ...new Set(specifications.map((s) => s.category))].map(
            (c) => (
              <option key={c}>{c}</option>
            ),
          )}
        </select>
        <span className="muted">{rows.length} facts</span>
      </div>
      <div
        className="spec-table"
        role="table"
        aria-label="H2D technical specifications"
      >
        <div className="spec-row table-head" role="row">
          <span>PARAMETER</span>
          <span>SPECIFICATION</span>
          <span>REFERENCE</span>
        </div>
        {rows.map((s) => (
          <div className="spec-row" role="row" key={s.id}>
            <div role="cell">
              <small>{s.category}</small>
              {s.label}
            </div>
            <div role="cell">
              {s.value}
              {s.note && <small className="spec-note">{s.note}</small>}
            </div>
            <div role="cell">
              <SourceLink id={s.source} short />
            </div>
          </div>
        ))}
      </div>
      {rows.length === 0 && (
        <p className="empty">No matching specifications. Try a broader term.</p>
      )}
      <p className="fineprint">
        Reviewed {reviewed}. Maximum ratings do not describe every material’s
        operating conditions.
      </p>
    </main>
  );
}
