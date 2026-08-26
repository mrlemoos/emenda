import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { githubRepoUrl, logoSvg } from "./brand";

describe("githubRepoUrl", () => {
  it("points at the public mrlemoos/emenda repository", () => {
    expect(githubRepoUrl).toBe("https://github.com/mrlemoos/emenda");
  });
});

function siteRed(): string {
  const css = readFileSync(resolve("src/app/globals.css"), "utf8");
  const match = css.match(/--red:\s*(#[0-9a-fA-F]{6})/);
  if (!match) throw new Error("site --red missing");
  return match[1].toLowerCase();
}

describe("logo mark", () => {
  it("usa o mesmo vermelho do ponto no wordmark do site", () => {
    expect(logoSvg().toLowerCase()).toContain(siteRed());
  });

  it("é o recorte e. do wordmark, não a palavra emenda inteira", () => {
    const svg = logoSvg();
    expect(svg.match(/<path/g)?.length).toBe(2);
    expect(svg).toContain(`fill="${siteRed()}"`);
    expect(svg).not.toMatch(/>emenda</i);
  });
});
