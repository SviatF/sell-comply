export type CoreAccessAction =
  | "check"
  | "refine"
  | "compare"
  | "save"
  | "dashboard"
  | "report"
  | "monitor";

export type CoreAccessRule = {
  accountRequired: boolean;
  emailRequired: boolean;
  persistence: "url" | "browser" | "browser-sync" | "email-watch";
};

export const CORE_ACCESS_POLICY: Record<CoreAccessAction, CoreAccessRule> = {
  check: {
    accountRequired: false,
    emailRequired: false,
    persistence: "url",
  },
  refine: {
    accountRequired: false,
    emailRequired: false,
    persistence: "url",
  },
  compare: {
    accountRequired: false,
    emailRequired: false,
    persistence: "url",
  },
  save: {
    accountRequired: false,
    emailRequired: false,
    persistence: "browser-sync",
  },
  dashboard: {
    accountRequired: false,
    emailRequired: false,
    persistence: "browser-sync",
  },
  report: {
    accountRequired: false,
    emailRequired: false,
    persistence: "url",
  },
  monitor: {
    accountRequired: false,
    emailRequired: true,
    persistence: "email-watch",
  },
};

export const ACCESS_COPY = {
  checker: "No account required",
  workspace: "Guest workspace · no signup required",
  monitoring: "Email is only required for alerts. It does not create an account.",
  report: "Anyone with this report link can open it. No account required.",
} as const;

export function requiresAccount(action: CoreAccessAction) {
  return CORE_ACCESS_POLICY[action].accountRequired;
}

export function requiresEmail(action: CoreAccessAction) {
  return CORE_ACCESS_POLICY[action].emailRequired;
}
