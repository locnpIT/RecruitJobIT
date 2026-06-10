"use client";

import { useMemo, useState } from "react";
import type { ProfileModalTab } from "../components/modals/ProfileModalTabs";

export function useProfileCrudState<T>(
  items: T[],
  searchFn: (item: T, normalizedQuery: string) => boolean
) {
  const [tab, setTab] = useState<ProfileModalTab>("create");
  const [query, setQuery] = useState("");

  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return items;
    return items.filter((item) => searchFn(item, normalized));
  }, [items, query, searchFn]);

  return { tab, setTab, query, setQuery, filteredItems };
}
