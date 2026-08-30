export const githubRepoUrl = "https://github.com/mrlemoos/emenda";
export const githubProfileUrl = "https://github.com/mrlemoos";
export const buyMeACoffeeUrl = "https://buymeacoffee.com/leolemos";

export const brand = {
  paper: "#f3efe4",
  ink: "#181714",
  red: "#d93627",
} as const;

/** Newsreader Bold 700 latin glyphs, traced at 48pt. */
export const logoGlyphs = {
  e: "M12.55-22.08Q15.55-22.08 17.62-20.87Q19.68-19.66 20.82-17.33Q21.96-15 22.18-11.64L8.09-11.64Q8.18-9.41 8.98-7.87Q9.86-6.07 11.54-5.17Q13.22-4.27 15.58-4.27Q16.68-4.27 17.66-4.44Q18.65-4.61 19.58-4.98Q20.52-5.35 21.48-5.95L22.18-4.46Q20.69-2.93 19.14-1.78Q17.59-0.62 15.94 0Q14.28 0.62 12.46 0.62Q9.12 0.62 6.65-0.79Q4.18-2.21 2.83-4.68Q1.49-7.15 1.49-10.37Q1.49-13.63 2.77-16.30Q4.06-18.96 6.53-20.52Q9-22.08 12.55-22.08ZM8.11-14.02L15.48-14.35Q15.36-15.72 15.07-16.68Q14.66-18.05 13.91-18.72Q13.15-19.39 12.02-19.39Q10.85-19.39 9.96-18.74Q9.07-18.10 8.57-16.56Q8.23-15.55 8.11-14.02Z",
  dot: "M6.14-7.70Q7.99-7.70 9.17-6.53Q10.34-5.35 10.34-3.60Q10.34-1.85 9.17-0.67Q7.99 0.50 6.14 0.50Q4.30 0.50 3.12-0.67Q1.94-1.85 1.94-3.60Q1.94-5.35 3.12-6.53Q4.30-7.70 6.14-7.70Z",
  eAdvance: 23.64,
  transform: "translate(0.78 50.86) scale(1.76)",
} as const;

export function logoSvg(size = 64) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="${size}" height="${size}" role="img" aria-label="Emenda">
  <rect width="64" height="64" fill="${brand.paper}"/>
  <g transform="${logoGlyphs.transform}">
    <path fill="${brand.ink}" d="${logoGlyphs.e}"/>
    <g transform="translate(${logoGlyphs.eAdvance} 0)">
      <path fill="${brand.red}" d="${logoGlyphs.dot}"/>
    </g>
  </g>
</svg>
`;
}
