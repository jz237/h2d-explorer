import { ArrowLeft, ArrowRight, Check, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { printTour } from "../data/printTour";
import { SourceLink } from "./SourceLink";

export function PrintTour({
  step,
  onStep,
  onClose,
}: {
  step: number;
  onStep: (step: number) => void;
  onClose: () => void;
}) {
  const current = printTour[step];
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
  }, [step]);
  return (
    <section className="print-tour" aria-label="How a print happens">
      <div className="tour-heading-row">
        <span className="eyebrow">
          HOW A PRINT HAPPENS · {step + 1} / {printTour.length}
        </span>
        <button
          className="icon-button"
          aria-label="Close guided tour"
          onClick={onClose}
        >
          <X size={17} />
        </button>
      </div>
      <nav className="tour-steps" aria-label="Print tour steps">
        {printTour.map((item, index) => (
          <button
            key={item.label}
            aria-current={step === index ? "step" : undefined}
            onClick={() => onStep(index)}
          >
            <span>{String(index + 1).padStart(2, "0")}</span>
            {item.label}
          </button>
        ))}
      </nav>
      <div className="tour-copy" aria-live="polite" aria-atomic="true">
        <h2 ref={heading} tabIndex={-1}>
          {current.title}
        </h2>
        <p>{current.body}</p>
        <p className="tour-observe">{current.observe}</p>
      </div>
      <div className="tour-bottom-row">
        <div className="tour-sources">
          {current.sources.map((id) => (
            <SourceLink key={id} id={id} short />
          ))}
        </div>
        <div className="tour-navigation">
          <button
            className="secondary-button"
            disabled={step === 0}
            onClick={() => onStep(step - 1)}
          >
            <ArrowLeft size={15} /> Back
          </button>
          <button
            className="primary-button"
            onClick={() =>
              step === printTour.length - 1 ? onClose() : onStep(step + 1)
            }
          >
            {step === printTour.length - 1 ? (
              <>
                Finish tour <Check size={15} />
              </>
            ) : (
              <>
                Next <ArrowRight size={15} />
              </>
            )}
          </button>
        </div>
      </div>
    </section>
  );
}
