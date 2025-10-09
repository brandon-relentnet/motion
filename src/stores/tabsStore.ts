import { create } from "zustand";
import { DEPLOY_TAB_ID, type TabId } from "../constants/tabs";

type TabsState = {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
};

export const useTabsStore = create<TabsState>((set) => ({
  activeTab: DEPLOY_TAB_ID,
  setActiveTab: (tab) => set({ activeTab: tab }),
}));
