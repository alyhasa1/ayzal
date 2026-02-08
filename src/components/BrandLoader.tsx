import type { CSSProperties } from "react";

const GRID_SIDE = 6;
const DOT_COUNT = GRID_SIDE * GRID_SIDE;
const DOT_TONES = [
  "brand-loader-dot--amber",
  "brand-loader-dot--gold",
  "brand-loader-dot--clay",
] as const;

type BrandLoaderProps = {
  label?: string;
  withNavOffset?: boolean;
  className?: string;
};

export default function BrandLoader({
  label = "Loading your experience...",
  withNavOffset = false,
  className = "",
}: BrandLoaderProps) {
  return (
    <div
      className={`brand-loader-screen ${withNavOffset ? "brand-loader-screen--offset" : ""} ${className}`}
      role="status"
      aria-live="polite"
    >
      <div className="brand-loader-wrap">
        <div className="brand-loader-grid" aria-hidden>
          {Array.from({ length: DOT_COUNT }).map((_, index) => {
            const delay = (index % GRID_SIDE) * 75 + Math.floor(index / GRID_SIDE) * 45;
            const toneClass = DOT_TONES[index % DOT_TONES.length];
            return (
              <span
                key={index}
                className={`brand-loader-dot ${toneClass}`}
                style={
                  {
                    "--dot-delay": `${delay}ms`,
                  } as CSSProperties
                }
              />
            );
          })}
        </div>
        <p className="brand-loader-label">{label}</p>
      </div>
    </div>
  );
}
