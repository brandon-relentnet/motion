export const DEPLOY_TAB_ID = "tab-1" as const;
export const CONTAINERS_TAB_ID = "tab-2" as const;
export const HISTORY_TAB_ID = "tab-3" as const;

export type TabId =
  | typeof DEPLOY_TAB_ID
  | typeof CONTAINERS_TAB_ID
  | typeof HISTORY_TAB_ID;

export const ALL_TAB_IDS: readonly TabId[] = [
  DEPLOY_TAB_ID,
  CONTAINERS_TAB_ID,
  HISTORY_TAB_ID,
];
