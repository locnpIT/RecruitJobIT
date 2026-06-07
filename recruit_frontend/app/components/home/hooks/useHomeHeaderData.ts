"use client";

import { useNotifications } from "./useNotifications";
import { useSessionUser } from "./useSessionUser";

// Orchestrator: kết hợp session user và notification data cho HomeHeader.
export function useHomeHeaderData() {
  const session = useSessionUser();
  const notifications = useNotifications(session.user);

  return {
    ...session,
    ...notifications,
  };
}
