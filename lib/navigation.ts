import { router } from "expo-router";

/**
 * Typed-route-safe navigation. `scripted routes` hasn't regenerated the route
 * union for every dynamic path yet, so these helpers cast the href safely.
 */
export function go(href: string): void {
  router.push(href as never);
}

export function goReplace(href: string): void {
  router.replace(href as never);
}