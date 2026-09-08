import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const checkerCss = readFileSync("app/styles/checker.css", "utf8");
const refinement = readFileSync("app/components/CheckRefinementForm.tsx", "utf8");

describe("mobile checker QA guards", () => {
  it("keeps a dedicated mobile QA override for phone widths", () => {
    expect(checkerCss).toContain("/* Mobile checker QA — 320px to tablet */");
    expect(checkerCss).toContain("@media(max-width:680px)");
    expect(checkerCss).toContain("@media(max-width:360px)");
  });

  it("uses touch-safe refinement and monitoring controls", () => {
    expect(checkerCss).toContain(".refine-toggle button{height:44px;min-height:44px");
    expect(checkerCss).toContain(".monitor-email-row input{height:48px;font-size:16px}");
    expect(checkerCss).toContain(".role-field select{width:100%;min-width:0;height:48px;font-size:16px}");
    expect(checkerCss).toContain(".check-refine-footer>button{width:100%;height:48px");
  });

  it("avoids dense five-column compare metrics on phones", () => {
    expect(checkerCss).toContain(
      ".market-metric-grid{grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}"
    );
    expect(checkerCss).toContain(
      ".market-compare-card>a,.market-current-cta{height:auto;min-height:48px"
    );
  });

  it("removes desktop card height pressure on mobile", () => {
    expect(checkerCss).toContain(
      ".risk-score-panel,.risk-drivers-panel,.risk-reducers-panel{min-height:0;padding:16px}"
    );
    expect(checkerCss).toContain(".evidence-panel{min-height:0;padding:16px}");
    expect(checkerCss).toContain(".action-plan-card{min-height:0;padding:16px}");
  });

  it("exposes refinement selection state to assistive technology", () => {
    expect(refinement).toContain('aria-pressed={selected === "yes"}');
    expect(refinement).toContain('aria-pressed={selected === "no"}');
    expect(refinement).toContain("aria-pressed={!selected}");
  });
});
