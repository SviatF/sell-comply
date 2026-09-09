import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  CORE_ACCESS_POLICY,
  requiresAccount,
  requiresEmail,
  type CoreAccessAction,
} from "../lib/access-policy";

const guestActions: CoreAccessAction[] = [
  "check",
  "refine",
  "compare",
  "save",
  "dashboard",
  "report",
];

const coreFlowFiles = [
  "app/page.tsx",
  "app/check/page.tsx",
  "app/components/CheckRefinementForm.tsx",
  "app/components/MarketComparisonGrid.tsx",
  "app/components/CheckActions.tsx",
  "app/dashboard/page.tsx",
  "app/dashboard/DashboardClient.tsx",
  "app/report/page.tsx",
  "app/report/ReportToolbar.tsx",
];

describe("guest-first core access policy", () => {
  it("never requires an account for the core funnel", () => {
    for (const action of Object.keys(CORE_ACCESS_POLICY) as CoreAccessAction[]) {
      expect(requiresAccount(action), action).toBe(false);
    }
  });

  it("requires email only when the user explicitly enables monitoring", () => {
    for (const action of guestActions) {
      expect(requiresEmail(action), action).toBe(false);
    }
    expect(requiresEmail("monitor")).toBe(true);
  });

  it("keeps the core funnel free of login, signup, register and auth redirects", () => {
    const forbiddenRoute =
      /["'`]\/(?:login|signup|sign-up|register|auth)(?:[/?#"'\`]|$)/i;

    for (const path of coreFlowFiles) {
      const source = readFileSync(path, "utf8");
      expect(source, path).not.toMatch(forbiddenRoute);
    }
  });

  it("uses an anonymous browser identity for dashboard persistence", () => {
    const dashboard = readFileSync("app/dashboard/DashboardClient.tsx", "utf8");
    expect(dashboard).toContain("getVisitorId()");
    expect(dashboard).toContain("/api/checks?visitor_id=");
    expect(dashboard).toContain("/api/monitors?visitor_id=");
  });

  it("does not require email to save a check", () => {
    const checksApi = readFileSync("app/api/checks/route.ts", "utf8");
    expect(checksApi).not.toMatch(/email\??:/i);
    expect(checksApi).toContain("visitorId?: string");
  });

  it("keeps email scoped to the monitoring alert flow", () => {
    const monitorsApi = readFileSync("app/api/monitors/route.ts", "utf8");
    const checkActions = readFileSync("app/components/CheckActions.tsx", "utf8");

    expect(monitorsApi).toContain("email?: string");
    expect(checkActions).toContain('type="email"');
    expect(checkActions).toContain('ACCESS_COPY.monitoring');
  });

  it("keeps shared reports directly accessible by URL", () => {
    const report = readFileSync("app/report/page.tsx", "utf8");
    const toolbar = readFileSync("app/report/ReportToolbar.tsx", "utf8");

    expect(report).not.toMatch(/\bredirect\s*\(/);
    expect(toolbar).toContain("ACCESS_COPY.report");
  });
});
