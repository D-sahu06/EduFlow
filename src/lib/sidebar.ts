"use client";

import { useEffect, useState } from "react";

export function isSidebarCollapsed(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("eduflow-sidebar-collapsed") === "true";
}

export function toggleSidebar(): boolean {
  if (typeof window === "undefined") return false;
  const isMobile = window.innerWidth < 768;
  if (isMobile) {
    window.dispatchEvent(new CustomEvent("eduflow-sidebar-toggle-mobile"));
    return false;
  }
  const isCollapsed = isSidebarCollapsed();
  const nextCollapsed = !isCollapsed;
  localStorage.setItem("eduflow-sidebar-collapsed", String(nextCollapsed));
  if (nextCollapsed) {
    document.documentElement.classList.add("sidebar-collapsed");
    document.body.classList.add("sidebar-collapsed");
  } else {
    document.documentElement.classList.remove("sidebar-collapsed");
    document.body.classList.remove("sidebar-collapsed");
  }
  window.dispatchEvent(
    new CustomEvent("eduflow-sidebar-toggle", { detail: { collapsed: nextCollapsed } })
  );
  return !nextCollapsed;
}

export function useSidebar() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const sync = () => {
      setSidebarOpen(!isSidebarCollapsed());
    };
    sync();
    window.addEventListener("eduflow-sidebar-toggle", sync);
    return () => window.removeEventListener("eduflow-sidebar-toggle", sync);
  }, []);

  return {
    sidebarOpen,
    toggleSidebar,
  };
}
