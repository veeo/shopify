"use client";

import { createContext, useContext, type ReactNode } from "react";

export type WorkspaceViewApi = {
  query: string;
  tab: string;
  sort: string;
  recordId: string;
  draft: Record<string, string>;
  setQuery: (query: string) => void;
  setTab: (tab: string) => void;
  setSort: (sort: string) => void;
  setRecord: (recordId: string) => void;
  setDraft: (patch: Record<string, string>) => void;
};

const WorkspaceViewContext = createContext<WorkspaceViewApi | null>(null);

export function WorkspaceViewProvider({ value, children }: { value: WorkspaceViewApi; children: ReactNode }) {
  return <WorkspaceViewContext.Provider value={value}>{children}</WorkspaceViewContext.Provider>;
}

export function useWorkspaceView() {
  return useContext(WorkspaceViewContext);
}

const sortCycle = ["newest", "name", "price", "oldest"] as const;

export function nextSort(current: string) {
  const index = sortCycle.indexOf(current as (typeof sortCycle)[number]);
  return sortCycle[(index + 1) % sortCycle.length];
}

export function sortLabel(sort: string) {
  if (sort === "name") return "Name";
  if (sort === "price") return "Amount";
  if (sort === "oldest") return "Oldest";
  return "Newest";
}
