import { ArrowUpRight } from "lucide-react";
import { sources, type SourceId } from "../data/sources";
export function SourceLink({
  id,
  short = false,
}: {
  id: SourceId;
  short?: boolean;
}) {
  const s = sources[id];
  return (
    <a
      href={s.url}
      target="_blank"
      rel="noreferrer"
      className="source-link"
      title={s.title}
      aria-label={short ? `Source: ${s.title}` : undefined}
    >
      {short ? "Source" : s.title}
      <ArrowUpRight size={13} />
    </a>
  );
}
