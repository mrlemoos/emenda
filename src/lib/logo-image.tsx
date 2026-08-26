import { ImageResponse } from "next/og";
import { brand, logoGlyphs } from "./brand";

export function logoImage(size: { width: number; height: number }) {
  const mark = Math.min(size.width, size.height);
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          background: brand.paper,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg width={mark} height={mark} viewBox="0 0 64 64">
          <g transform={logoGlyphs.transform}>
            <path fill={brand.ink} d={logoGlyphs.e} />
            <g transform={`translate(${logoGlyphs.eAdvance} 0)`}>
              <path fill={brand.red} d={logoGlyphs.dot} />
            </g>
          </g>
        </svg>
      </div>
    ),
    size,
  );
}
