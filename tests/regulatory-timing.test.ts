import { describe, expect, it } from "vitest";
import {
  getRegulatoryLifecycle,
  isLifecycleApplicable,
  normalizeAsOfDate,
} from "../lib/regulatory-timing";
import { regulatoryRules } from "../lib/regulatory-rules";

function timing(id: string) {
  const rule = regulatoryRules.find((item) => item.id === id);
  if (!rule) throw new Error(`Missing rule fixture: ${id}`);
  return {
    effectiveFrom: rule.timing?.effectiveFrom ?? null,
    effectiveTo: rule.timing?.effectiveTo ?? null,
    transitionStart: rule.timing?.transitionStart ?? null,
    transitionEnd: rule.timing?.transitionEnd ?? null,
    note: rule.effectiveNote ?? null,
  };
}

describe("regulatory lifecycle dates", () => {
  it("treats GPSR as future before 13 December 2024 and active from that date", () => {
    expect(getRegulatoryLifecycle(timing("eu-gpsr"), "2024-12-12")).toBe("future");
    expect(getRegulatoryLifecycle(timing("eu-gpsr"), "2024-12-13")).toBe("active");
    expect(getRegulatoryLifecycle(timing("eu-gpsr"), "2026-09-07")).toBe("active");
  });

  it("keeps the current EU toy directive active before repeal", () => {
    expect(getRegulatoryLifecycle(timing("eu-toy-current"), "2030-07-31")).toBe("active");
  });

  it("moves the old EU toy framework through transition and then expiry", () => {
    expect(getRegulatoryLifecycle(timing("eu-toy-current"), "2030-08-01")).toBe("transitional");
    expect(getRegulatoryLifecycle(timing("eu-toy-current"), "2031-02-01")).toBe("transitional");
    expect(getRegulatoryLifecycle(timing("eu-toy-current"), "2031-02-02")).toBe("expired");
  });

  it("treats the new EU toy regulation as transitional before general application", () => {
    expect(getRegulatoryLifecycle(timing("eu-toy-future"), "2026-09-07")).toBe("transitional");
    expect(getRegulatoryLifecycle(timing("eu-toy-future"), "2030-07-31")).toBe("transitional");
    expect(getRegulatoryLifecycle(timing("eu-toy-future"), "2030-08-01")).toBe("active");
  });

  it("treats the EU batteries framework as transitional during its phased window", () => {
    expect(getRegulatoryLifecycle(timing("eu-batteries"), "2024-02-17")).toBe("future");
    expect(getRegulatoryLifecycle(timing("eu-batteries"), "2026-09-07")).toBe("transitional");
    expect(getRegulatoryLifecycle(timing("eu-batteries"), "2027-07-01")).toBe("active");
  });

  it("defaults rules without explicit timing to active", () => {
    expect(getRegulatoryLifecycle({}, "2026-09-07")).toBe("active");
  });

  it("only active and transitional lifecycles are currently applicable", () => {
    expect(isLifecycleApplicable("active")).toBe(true);
    expect(isLifecycleApplicable("transitional")).toBe(true);
    expect(isLifecycleApplicable("future")).toBe(false);
    expect(isLifecycleApplicable("expired")).toBe(false);
  });

  it("rejects malformed historical query dates", () => {
    expect(() => normalizeAsOfDate("07-09-2026")).toThrow("INVALID_AS_OF_DATE");
    expect(() => normalizeAsOfDate("2026/09/07")).toThrow("INVALID_AS_OF_DATE");
    expect(normalizeAsOfDate("2026-09-07")).toBe("2026-09-07");
  });
});
