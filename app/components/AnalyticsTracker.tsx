"use client";

import { useEffect } from "react";

export default function AnalyticsTracker() {
  useEffect(() => {
    void fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: "page_view", path: window.location.pathname }),
      keepalive: true,
    }).catch(() => undefined);
  }, []);

  return null;
}